<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Solum Financeiro - Dashboard de Alta Performance

Solum Financeiro é uma plataforma robusta de gestão financeira pessoal e empresarial que combina design "Glassmorphism" com controle rigoroso de orçamentos e cartões.

## ✨ Funcionalidades Principais

### 🏦 Gestão de Carteiras & Cartões
- **Minhas Contas**: Visualização circular com logos reais das instituições. Resumo de **"Entradas no Mês"** para controle de fluxo de caixa.
- **Cartões de Crédito (Premium)**: 
  - Ciclo de faturas preciso em todos os módulos (**Fechamento + 1**).
  - **Filtro por Competência**: Na aba de lançamentos, selecione o mês e veja tudo o que pertence àquela fatura, mesmo que a compra tenha ocorrido no final do mês anterior.
  - **Seletor Consolidado**: Visualize todos os cartões simultaneamente ou filtre por um específico para bater valores com o app do banco.
  - **Saldo Real da Fatura**: Indicador dinâmico no histórico que mostra (Gastos - Créditos) do período selecionado.
  - **Ajuste Manual**: Possibilidade de editar o valor total da fatura para correções de saldo de implantação.
- **Identidade Visual**: Logos circulares (`object-cover`) que preenchem 100% da área, com fallback elegante baseado na cor da instituição.


### 📊 Sistema de Orçamentos & Alertas (Dashboard)
- **Navegação Inteligente**: Controles de meses ampliados com botão **"HOJE"** para retorno instantâneo ao período atual.
- **Classificação de Necessidade**: Descrições auxiliares para gastos "Necessários" (essenciais) vs "Desnecessários" (planejáveis), guiando o preenchimento.
- **Modo Limites (Padrão)**: Foco total no controle de despesas por categoria.
- **Alertas Inteligentes**: Notificações automáticas ao atingir 75% e 100% do orçamento definido.
- **Barra Mestre Global**: Resumo consolidado de todos os orçamentos no topo da página.
- **Gatilhos Visuais**: Barras de progresso com 4 estágios de cor para identificar excessos rapidamente.


### 🏷️ Categorias & Seleção Premium
- **Estrutura Hierárquica**: Categorias Pai & Filha com ícones personalizados.
- **Identificação Visual por Banco**: No histórico de categorias, o ícone principal passa a ser o logo do banco/carteira, permitindo saber a origem do gasto instantaneamente.
- **Histórico Drill-down**: Visualização de lançamentos dentro de cada categoria com a mesma interface completa da aba principal.
- **Seleção em Massa Persistente**: Sistema de `StyledCheckbox` (animado) que mantém a seleção após ações de status.


### 📝 Lançamentos & Interatividade
- **Lista Única**: Visão combinada de todas as transações por padrão.
- **Máscara Inteligente**: Entrada de valores facilitada (preenchimento da direita para a esquerda).
- **Novo Seletor "Jóia" (Toggle ThumbsUp)**: Interface interativa para alternar entre "Pago/Recebido" e "Aguardando" com feedback visual imediato e cores dinâmicas.
- **Alertas de Pendências Críticas**: Banner de aviso inteligente que identifica automaticamente esquecimentos de meses anteriores.
- **Filtro de Atrasos Isolado**: Funcionalidade "Visualizar Tudo" que foca exclusivamente em pendências passadas, ignorando lançamentos do mês atual e futuros para limpeza rápida de fluxo.
- **Status & Ações**: Controle visual de itens "Pagos" e "Pendentes" com ações em massa.

## 🚀 Como Executar Localmente

**Pré-requisitos:** Node.js v18+

1.  **Instalar dependências:**
    `npm install`
2.  **Configurar Variáveis (Opcional):**
    Adicione sua `GEMINI_API_KEY` em `.env.local` se for utilizar funcionalidades de IA.
3.  **Iniciar Servidor de Desenvolvimento:**
    `npm run dev`

---

Este projeto utiliza **Vite**, **React**, **Tailwind CSS** e **Framer Motion** para animações fluidas e design premium.
