# Guia de Mapeamento do Repositório: Solum Financeiro

Este documento serve como referência técnica para futuros agentes ou desenvolvedores que precisarem manter ou expandir as funcionalidades do sistema de categorias, carteiras e orçamentos.

## 1. Arquitetura de Categorias & Subcategorias

### Modelo de Dados (`src/types.ts`)
- **Hierarquia**: Implementada através do campo `parentId?: string`. Se `parentId` for nulo, a categoria é considerada uma **Categoria Pai**.
- **Limite de Gastos**: O campo `limit?: number` nas categorias principais define o teto mensal para o modo "Orçamentos".
- **Estado de Ativação**: O campo `isActive: boolean` controla se a categoria aparece nos seletores. Nunca exclua categorias fisicamente para não quebrar a integridade dos `transactions`.

### Gerenciamento de Estado (`src/FinanceContext.tsx`)
- **Inativação**: A função `toggleCategoryActive` deve ser usada em vez de `deleteCategory`.
- **Persistência**: Todo o estado de `categories`, `wallets` e `transactions` é salvo no `localStorage`.

---

## 2. Carteiras & Cartões de Crédito (`src/components/Wallets.tsx`)

### Tipagem e Visualização
- **Tipagem**: Diferencia contas correntes de cartões usando o campo `type: 'bank' | 'credit'`.
- **Campos Específicos (Cartão)**: `limit`, `closingDay`, `dueDay` e `logoUrl`.
- **Design Premium**: Utilização de glassmorphism e gradientes dinâmicos para simular cartões físicos.
- **Logos**: Logos de bancos renderizados em formato circular (`rounded-full`) com `object-cover` para ocupação total da área. Removido o ícone genérico `CreditCard` das listas de lançamentos para priorizar a identidade visual da instituição financeira.

### 2.1 Gestão Avançada de Faturas
- **Lógica de Ciclo (`getInvoicePeriod`)**: 
  - Regra de corte: **Dia de Fechamento + 1** até o próximo **Dia de Fechamento**.
  - No código: Se `day > closingDay`, o ciclo inicia no `closingDay + 1` do mês atual. Caso contrário, inicia no `closingDay + 1` do mês anterior.
- **Ajuste Manual de Valor**:
  - Implementado via formulário overlay no `WalletActionsModal`.
  - **Mecanismo**: Cria uma transação do tipo `expense`, com data no dia de fechamento do ciclo alvo.
  - **Identidade Visual**: Para evitar erros de UUID ('invalid syntax'), o ajuste é automaticamente associado à categoria **"Outros"** (ID recuperado dinamicamente).

---

## 3. Lógica de Orçamentos & Visões (`src/components/Categories.tsx` e `src/lib/utils.ts`)

### Modos de Visão (`viewMode`)
1.  **Orçamentos (Budget)**: Foca em despesas vs. limites. Oculta receitas para maior clareza.
2.  **Balanço (Balance)**: Foca no fluxo de caixa real (Receitas vs. Despesas) e conciliação.

### Lógica Centralizada (`src/lib/utils.ts`)
- **`getCategorySpend` & `getCategoryBalance`**: Funções puras que calculam o consumo e saldo de categorias de forma recursiva.
- **Alertas de Orçamento (`checkBudgetThreshold`)**: Lógica que define os gatilhos de 75% e 100% para notificações em tempo real.

### Gatilhos Visuais (Progress Bars)
As cores das barras de progresso e saldos seguem gatilhos semânticos:
- **Até 75%**: Verde (`emerald-500`).
- **75% a 99%**: Amarelo/Âmbar (`amber-500`).
- **100%**: Vermelho (`rose-500`).
- **Acima de 100%**: Vinho (`red-800`).

---

## 3.1 Tratamento de Erros e Renderização (Hooks & Ícones)
- **Regras de Hooks**: O `WalletActionsModal` foi refatorado para garantir que todos os `useMemo` e `useCallback` estejam no nível superior, evitando o erro de quebra das regras de hooks após retornos antecipados (`early returns`).
- **Conflitos de Ícones**: O ícone `History` do `lucide-react` foi renomeado para `HistoryIcon` para evitar colisão com o objeto `window.history` do navegador, eliminando bugs de navegação em modais.

---

## 4. Componentes Chave & Interações

### Gestão Premium de Lançamentos
- **Seleção Persistente**: Uso de `selectedTxIds` com tratamento para manter o estado após ações de atualização de status.
- **Checkbox Customizado**: Componente `StyledCheckbox` usando `motion` para feedback visual imediato.
- **Detalhamento Drill-down**: Modal avançado que espelha a lógica da tela de lançamentos principal, permitindo edição e exclusão direta.

### Notificações de Alerta (`BudgetToast`)
- Implementado em `src/components/Transactions.tsx`.
- Gatilho disparado no `handleSubmit` após salvar o lançamento, verificando o novo total contra o limite da categoria.

---

## 5. Arquivos Principais para Manutenção
1.  `src/components/Categories.tsx`: Orçamentos, hierarquia e resumo global.
2.  `src/lib/utils.ts`: Motor de cálculos financeiros e regras de alertas.
3.  `src/components/Wallets.tsx`: Gestão de contas e cartões de crédito premium.
4.  `src/components/Transactions.tsx`: Tabela única de lançamentos consolidada e sistema de alertas.
5.  `src/FinanceContext.tsx`: Núcleo de manipulação de dados e persistência.
6.  `src/types.ts`: Definições globais de interfaces.

---

## 6. Refinamentos Recentes de UX/UI

### 6.1 Navegação de Orçamento
- **Controle de Mês**: No `Dashboard.tsx`, o sistema de troca de meses do orçamento utiliza um estado de `budgetOffset`. 
- **Botão HOJE**: Implementado para resetar o `budgetOffset` para 0, permitindo que o usuário retorne à visão do mês atual com um único clique.

### 6.2 Filtros Inteligentes (Aba Lançamentos)
- **Seleção de Competência**: Refatorado o `useMemo` de `filteredTransactions` em `Transactions.tsx` para alternar a lógica de data:
  - Se visualizando **Contas**: Filtra pelo campo `date`.
  - Se visualizando **Cartões**: Filtra pelos campos `invoiceMonth` e `invoiceYear`.
- **Filtro de Carteira Específica**: Adicionado seletor granular para filtrar múltiplos cartões ou um específico, exibindo o somatório (Total do Período) dinamicamente.

### 6.3 Diferenciação Visual por Categoria
- **Substituição de Ícones**: No histórico de categorias (`Categories.tsx`), o ícone de seta de fluxo foi substituído pelo **Logo Circular da Carteira**. 
- **Racional**: Facilitar a identificação de qual fonte de recurso foi utilizada para aquele gasto específico em uma categoria (ex: qual cartão pagou o Aluguel).

---

## 7. Persistência & Supabase
- **Isolamento de Dados**: Utiliza o `user_id` do Supabase Auth em todas as queries.
- **Campos de Fatura**: Lançamentos em cartões de crédito possuem campos de metadados de fatura persistidos, garantindo que a filtragem por competência seja consistente e resiliente a recarregamentos.
