import React, { useState, useMemo, useEffect } from 'react';
import { useFinance } from '../FinanceContext';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, getAvailableYears, cn } from '../lib/utils';
import {
  Building2,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Settings,
  HelpCircle,
  Check,
  Calculator,
  Percent,
  AlertTriangle,
  Sparkles,
  Info,
  ShieldAlert
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

export const BusinessAnalysis: React.FC = () => {
  const { transactions, categories, loading: financeLoading } = useFinance();
  const { user, viewingUserId } = useAuth();
  
  const effectiveUserId = viewingUserId || user?.id;

  // Estados dos filtros
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | 'consolidated'>('consolidated');
  const [activeSubTab, setActiveSubTab] = useState<'study' | 'operational'>('study');
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Anos disponíveis para filtro
  const availableYears = useMemo(() => {
    return getAvailableYears(transactions);
  }, [transactions]);

  // Carrega / Salva as categorias selecionadas para análise
  const [selectedIncomeCats, setSelectedIncomeCats] = useState<string[]>([]);
  const [selectedExpenseCats, setSelectedExpenseCats] = useState<string[]>([]);

  // Inicializa as seleções de categorias do localStorage
  useEffect(() => {
    if (!effectiveUserId || categories.length === 0) return;

    const savedIncome = localStorage.getItem(`solum_bus_inc_cats_${effectiveUserId}`);
    const savedExpense = localStorage.getItem(`solum_bus_exp_cats_${effectiveUserId}`);

    const incomeCategoriesList = categories.filter(c => c.type === 'income' && !c.parentId && !c.isDeleted && c.isActive !== false);
    const expenseCategoriesList = categories.filter(c => c.type === 'expense' && !c.parentId && !c.isDeleted && c.isActive !== false);

    // 1. Receitas: padrão = manual (vazio)
    if (savedIncome) {
      setSelectedIncomeCats(JSON.parse(savedIncome));
    } else {
      setSelectedIncomeCats([]); // Manual por padrão (vazio)
    }

    // 2. Despesas: padrão = todas selecionadas
    if (savedExpense) {
      setSelectedExpenseCats(JSON.parse(savedExpense));
    } else {
      setSelectedExpenseCats(expenseCategoriesList.map(c => c.id)); // Todas selecionadas por padrão
    }
  }, [effectiveUserId, categories]);

  // Salva a configuração de categorias
  const handleSaveConfig = () => {
    if (!effectiveUserId) return;
    localStorage.setItem(`solum_bus_inc_cats_${effectiveUserId}`, JSON.stringify(selectedIncomeCats));
    localStorage.setItem(`solum_bus_exp_cats_${effectiveUserId}`, JSON.stringify(selectedExpenseCats));
    setIsConfigOpen(false);
  };

  // Selecionar / Deselecionar tudo em Configurações
  const handleToggleAllIncome = (checked: boolean) => {
    const list = categories.filter(c => c.type === 'income' && !c.parentId && !c.isDeleted && c.isActive !== false).map(c => c.id);
    setSelectedIncomeCats(checked ? list : []);
  };

  const handleToggleAllExpense = (checked: boolean) => {
    const list = categories.filter(c => c.type === 'expense' && !c.parentId && !c.isDeleted && c.isActive !== false).map(c => c.id);
    setSelectedExpenseCats(checked ? list : []);
  };

  // IDs expandidos para incluir subcategorias vinculadas
  const allIncomeCatIds = useMemo(() => {
    const ids = new Set<string>();
    selectedIncomeCats.forEach(id => {
      ids.add(id);
      categories.forEach(c => {
        if (c.parentId === id) ids.add(c.id);
      });
    });
    return ids;
  }, [selectedIncomeCats, categories]);

  const allExpenseCatIds = useMemo(() => {
    const ids = new Set<string>();
    selectedExpenseCats.forEach(id => {
      ids.add(id);
      categories.forEach(c => {
        if (c.parentId === id) ids.add(c.id);
      });
    });
    return ids;
  }, [selectedExpenseCats, categories]);

  // Transações filtradas do espaço empresarial no ano selecionado
  const businessTransactions = useMemo(() => {
    return transactions.filter(t => t.space === 'business' && !t.isDeleted);
  }, [transactions]);

  const yearTransactions = useMemo(() => {
    return businessTransactions.filter(t => {
      const d = new Date(t.date + 'T12:00:00Z');
      return d.getUTCFullYear() === selectedYear;
    });
  }, [businessTransactions, selectedYear]);

  // Dados mensais para o gráfico de evolução
  const monthlyChartData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      const monthTxs = yearTransactions.filter(t => {
        const d = new Date(t.date + 'T12:00:00Z');
        return (d.getUTCMonth() + 1) === monthNum;
      });

      const faturamento = monthTxs
        .filter(t => t.type === 'income' && allIncomeCatIds.has(t.categoryId))
        .reduce((sum, t) => sum + t.amount, 0);

      const saidas = monthTxs
        .filter(t => (t.type === 'expense' || t.type === 'provision' || t.type === 'planned') && allExpenseCatIds.has(t.categoryId))
        .reduce((sum, t) => sum + t.amount, 0);

      const sobra = faturamento - saidas;

      return {
        month: monthNum,
        name: new Date(0, i).toLocaleString('pt-BR', { month: 'short' }).toUpperCase(),
        Faturamento: Number(faturamento.toFixed(2)),
        Saídas: Number(saidas.toFixed(2)),
        Sobra: Number(sobra.toFixed(2)),
      };
    });
  }, [yearTransactions, allIncomeCatIds, allExpenseCatIds]);

  // Transações do período atual (mês selecionado ou consolidado)
  const currentPeriodTxs = useMemo(() => {
    if (selectedMonth === 'consolidated') {
      return yearTransactions;
    } else {
      return yearTransactions.filter(t => {
        const d = new Date(t.date + 'T12:00:00Z');
        return (d.getUTCMonth() + 1) === selectedMonth;
      });
    }
  }, [yearTransactions, selectedMonth]);

  // Estatísticas consolidadas do período
  const periodStats = useMemo(() => {
    const faturamento = currentPeriodTxs
      .filter(t => t.type === 'income' && allIncomeCatIds.has(t.categoryId))
      .reduce((sum, t) => sum + t.amount, 0);

    const saidas = currentPeriodTxs
      .filter(t => (t.type === 'expense' || t.type === 'provision' || t.type === 'planned') && allExpenseCatIds.has(t.categoryId))
      .reduce((sum, t) => sum + t.amount, 0);

    const sobra = faturamento - saidas;

    return {
      faturamento,
      saidas,
      sobra,
      lucroPercentual: faturamento > 0 ? (sobra / faturamento) * 100 : 0
    };
  }, [currentPeriodTxs, allIncomeCatIds, allExpenseCatIds]);

  // Divisão de despesas por categoria em relação às vendas/faturamento
  const expensesByCategory = useMemo(() => {
    const faturamentoTotal = periodStats.faturamento;
    
    const list = selectedExpenseCats.map(catId => {
      const cat = categories.find(c => c.id === catId);
      if (!cat) return null;

      const catIds = new Set<string>([catId]);
      categories.forEach(c => {
        if (c.parentId === catId) catIds.add(c.id);
      });

      const totalSpent = currentPeriodTxs
        .filter(t => (t.type === 'expense' || t.type === 'provision' || t.type === 'planned') && catIds.has(t.categoryId))
        .reduce((sum, t) => sum + t.amount, 0);

      const percentage = faturamentoTotal > 0 ? (totalSpent / faturamentoTotal) * 100 : 0;

      return {
        id: catId,
        name: cat.name,
        color: cat.color,
        total: totalSpent,
        percentage
      };
    })
    .filter(Boolean) as { id: string; name: string; color: string; total: number; percentage: number }[];

    // Retorna ordenado por total gasto
    return list.sort((a, b) => b.total - a.total);
  }, [periodStats.faturamento, selectedExpenseCats, categories, currentPeriodTxs]);

  // Lógica de Lucro Operacional a cada R$ 100,00 vendidos
  const operationalDistribution = useMemo(() => {
    const faturamento = periodStats.faturamento;
    if (faturamento <= 0) return { items: [], profit: 100 };

    const items = expensesByCategory
      .filter(item => item.total > 0)
      .map(item => {
        const valueIn100 = (item.total / faturamento) * 100;
        return {
          ...item,
          valueIn100
        };
      });

    const totalExpensePercent = items.reduce((sum, item) => sum + item.valueIn100, 0);
    const profit = Math.max(-100, 100 - totalExpensePercent);

    return {
      items,
      profit
    };
  }, [periodStats.faturamento, expensesByCategory]);

  // Dados da Análise Operacional (Margem e Ponto de Equilíbrio)
  const operationalAnalysis = useMemo(() => {
    const periodTxs = currentPeriodTxs;
    
    const receitas = periodTxs
      .filter(t => t.type === 'income' && allIncomeCatIds.has(t.categoryId))
      .reduce((sum, t) => sum + t.amount, 0);

    // Custos Variáveis: despesas selecionadas que não possuem isContinuous === true (ciclo)
    const custosVariaveis = periodTxs
      .filter(t => (t.type === 'expense' || t.type === 'provision' || t.type === 'planned') && allExpenseCatIds.has(t.categoryId) && t.isContinuous !== true)
      .reduce((sum, t) => sum + t.amount, 0);

    // Custos Fixos: despesas selecionadas que possuem isContinuous === true (ciclo)
    const custosFixos = periodTxs
      .filter(t => (t.type === 'expense' || t.type === 'provision' || t.type === 'planned') && allExpenseCatIds.has(t.categoryId) && t.isContinuous === true)
      .reduce((sum, t) => sum + t.amount, 0);

    const margemValor = receitas - custosVariaveis;
    const margemPercentual = receitas > 0 ? (margemValor / receitas) * 100 : 0;

    const margemDecimal = margemPercentual / 100;
    const pontoEquilibrio = margemDecimal > 0 ? custosFixos / margemDecimal : 0;

    const saldoEquilibrio = receitas - pontoEquilibrio;
    const atingiuEquilibrio = receitas >= pontoEquilibrio;

    return {
      receitas,
      custosVariáveis: custosVariaveis,
      custosFixos,
      margemValor,
      margemPercentual,
      pontoEquilibrio,
      saldoEquilibrio,
      atingiuEquilibrio
    };
  }, [currentPeriodTxs, allIncomeCatIds, allExpenseCatIds]);

  const incomeCategoriesList = categories.filter(c => c.type === 'income' && !c.parentId && !c.isDeleted && c.isActive !== false);
  const expenseCategoriesList = categories.filter(c => c.type === 'expense' && !c.parentId && !c.isDeleted && c.isActive !== false);

  const formatPercent = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(val) + '%';
  };

  const getMonthName = (m: number) => {
    return new Date(0, m - 1).toLocaleString('pt-BR', { month: 'long' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-[2rem] border border-border shadow-sm">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground flex items-center gap-3">
            <Building2 className="text-primary" size={30} />
            Análise Empresarial
          </h1>
          <p className="text-muted-foreground text-sm font-medium leading-none mt-1">
            Estudo de progresso, lucratividade, margem de contribuição e ponto de equilíbrio.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Seletor de Ano */}
          <div className="flex items-center gap-2 bg-muted/40 p-1 border border-border/30 rounded-xl">
            <button
              onClick={() => setSelectedYear(prev => prev - 1)}
              className="p-1.5 hover:bg-background rounded-lg transition-all text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-black uppercase tracking-widest px-2">{selectedYear}</span>
            <button
              onClick={() => setSelectedYear(prev => prev + 1)}
              className="p-1.5 hover:bg-background rounded-lg transition-all text-muted-foreground hover:text-foreground"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Botão de Configuração de Categorias */}
          <button
            onClick={() => setIsConfigOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/60 bg-muted/20 text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all shadow-sm"
          >
            <Settings size={14} />
            Configurar Categorias
          </button>
        </div>
      </div>

      {/* Alerta de Categoria de Receita não configurada */}
      {selectedIncomeCats.length === 0 && !financeLoading && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-4 text-center md:text-left justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <ShieldAlert size={26} />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-tight text-amber-700 dark:text-amber-400">
                Nenhuma Categoria de Receita Selecionada
              </h4>
              <p className="text-xs font-bold text-amber-600/80 dark:text-amber-500/60 uppercase mt-0.5">
                Para iniciar a apuração do faturamento, selecione manualmente as categorias que fazem parte da receita da empresa.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsConfigOpen(true)}
            className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 active:scale-95"
          >
            Configurar Agora
          </button>
        </div>
      )}

      {/* Abas e Filtro de Meses */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Abas Principais (Estudo vs Operacional) */}
        <div className="flex p-1 bg-muted/40 rounded-2xl border border-border/30 w-fit">
          <button
            onClick={() => setActiveSubTab('study')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeSubTab === 'study' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            Estudo do Empreendimento
          </button>
          <button
            onClick={() => setActiveSubTab('operational')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeSubTab === 'operational' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            Análise Operacional
          </button>
        </div>

        {/* Seletor do Mês do Exercício */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-hide max-w-full bg-muted/20 border border-border/20 p-1 rounded-2xl">
          <button
            onClick={() => setSelectedMonth('consolidated')}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${
              selectedMonth === 'consolidated' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            Consolidado
          </button>
          {Array.from({ length: 12 }, (_, i) => {
            const m = i + 1;
            return (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${
                  selectedMonth === m ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-muted-foreground hover:bg-muted/50'
                }`}
              >
                {new Date(0, i).toLocaleString('pt-BR', { month: 'short' }).slice(0, 3)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo com base na aba ativa */}
      <AnimatePresence mode="wait">
        {activeSubTab === 'study' ? (
          <motion.div
            key="study-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            
            {/* Cards de Métricas Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Faturamento */}
              <div className="bg-card p-6 rounded-3xl border border-border shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-500 group-hover:scale-110 transition-transform">
                  <TrendingUp size={48} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 block mb-1">
                  Faturamento (Receitas)
                </span>
                <h2 className="text-3xl font-black tracking-tighter text-foreground">
                  {formatCurrency(periodStats.faturamento)}
                </h2>
                <p className="text-[9px] font-bold text-muted-foreground uppercase mt-2">
                  Soma das receitas nas categorias selecionadas
                </p>
              </div>

              {/* Saídas */}
              <div className="bg-card p-6 rounded-3xl border border-border shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-rose-500 group-hover:scale-110 transition-transform">
                  <TrendingDown size={48} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 block mb-1">
                  Saídas (Despesas)
                </span>
                <h2 className="text-3xl font-black tracking-tighter text-foreground">
                  {formatCurrency(periodStats.saidas)}
                </h2>
                <p className="text-[9px] font-bold text-muted-foreground uppercase mt-2">
                  Soma das despesas nas categorias selecionadas
                </p>
              </div>

              {/* Lucro / Sobra */}
              <div className="bg-card p-6 rounded-3xl border border-border shadow-sm relative overflow-hidden group">
                <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform ${
                  periodStats.sobra >= 0 ? 'text-primary' : 'text-rose-500'
                }`}>
                  <Sparkles size={48} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary block mb-1">
                  Sobra (Lucro Líquido)
                </span>
                <div className="flex items-baseline gap-2">
                  <h2 className={`text-3xl font-black tracking-tighter ${
                    periodStats.sobra >= 0 ? 'text-foreground' : 'text-rose-500'
                  }`}>
                    {formatCurrency(periodStats.sobra)}
                  </h2>
                  {periodStats.faturamento > 0 && (
                    <span className={`text-xs font-black px-1.5 py-0.5 rounded ${
                      periodStats.sobra >= 0 ? 'bg-primary/10 text-primary' : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      {formatPercent(periodStats.lucroPercentual)}
                    </span>
                  )}
                </div>
                <p className="text-[9px] font-bold text-muted-foreground uppercase mt-2">
                  Diferença entre Faturamento e Saídas
                </p>
              </div>

            </div>

            {/* Gráfico de Evolução de Janeiro a Dezembro */}
            <div className="bg-card p-6 rounded-[2.5rem] border border-border shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tighter">
                    Evolução Mensal ({selectedYear})
                  </h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">
                    Demonstrativo de progresso mensal de receitas, despesas e saldo.
                  </p>
                </div>
              </div>

              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyChartData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#888888', fontSize: 10, fontWeight: 'bold' }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#888888', fontSize: 10, fontWeight: 'bold' }}
                      tickFormatter={(value) => `R$ ${value >= 1000 ? (value / 1000) + 'k' : value}`}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                      contentStyle={{
                        backgroundColor: 'rgba(24, 24, 27, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '1.5rem',
                        padding: '12px'
                      }}
                      labelStyle={{ color: '#ffffff', fontWeight: 'bold', fontSize: '12px', marginBottom: '6px' }}
                      itemStyle={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}
                      formatter={(value: any) => [formatCurrency(value), '']}
                    />
                    <Legend
                      verticalAlign="top"
                      height={40}
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                    />
                    <Bar dataKey="Faturamento" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={30} />
                    <Bar dataKey="Saídas" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={30} />
                    <Bar dataKey="Sobra" fill="#f97316" radius={[6, 6, 0, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Painel do Lucro Operacional (Moedas & Distribuição) */}
            <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-50 pointer-events-none" />

              <div className="relative mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest border border-primary/20">
                    Métrica Dinâmica
                  </span>
                </div>
                <h3 className="text-xl font-black uppercase tracking-tighter">
                  Análise do Lucro Operacional (A cada R$ 100,00)
                </h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">
                  Como cada R$ 100,00 faturados pela sua empresa são distribuídos entre as despesas e o lucro operacional.
                </p>
              </div>

              {periodStats.faturamento <= 0 ? (
                <div className="py-12 text-center text-muted-foreground/60 text-[11px] font-black uppercase tracking-widest border border-dashed rounded-3xl">
                  Aguardando faturamento no período para gerar distribuição operacional...
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Texto de Análise em Tópicos */}
                  <div className="bg-muted/30 p-6 rounded-3xl border border-border/50 space-y-4">
                    <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                      A cada <span className="text-emerald-500 font-bold">R$ 100,00 vendidos</span> pelo seu empreendimento:
                    </p>
                    
                    <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {operationalDistribution.items.length === 0 ? (
                        <li className="text-xs text-muted-foreground uppercase italic col-span-full">
                          Não houve despesas registradas no período.
                        </li>
                      ) : (
                        operationalDistribution.items.map((item) => (
                          <li key={item.id} className="flex items-center gap-2 text-xs font-bold text-foreground">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                            <span className="text-rose-500 font-black whitespace-nowrap">{formatCurrency(item.valueIn100)}</span>
                            <span className="text-muted-foreground uppercase tracking-tight text-[11px] truncate">vai para {item.name}</span>
                          </li>
                        ))
                      )}
                    </ul>

                    {/* Destaque do Lucro Operacional */}
                    <div className={cn(
                      "p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all",
                      operationalDistribution.profit >= 0
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400 shadow-sm"
                        : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400 shadow-sm"
                    )}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {operationalDistribution.profit >= 0 ? '✔' : '✘'}
                        </span>
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider">
                            {operationalDistribution.profit >= 0 ? 'Lucro Operacional' : 'Prejuízo Operacional'}
                          </p>
                          <p className="text-[10px] font-medium opacity-80">
                            {operationalDistribution.profit >= 0 
                              ? 'O que sobra dos R$ 100,00 faturados após cobrir as despesas.' 
                              : 'O saldo que fica negativo a cada R$ 100,00 faturados.'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black whitespace-nowrap">
                          {operationalDistribution.profit >= 0 ? 'Sobram ' : ''}
                          {formatCurrency(operationalDistribution.profit)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Representação Gráfica em Barra de Distribuição */}
                  <div className="space-y-4">
                    <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/60 block">
                      Barra de Distribuição do Faturamento
                    </span>
                    
                    <div className="h-8 w-full bg-muted rounded-full overflow-hidden flex shadow-inner border border-border/20">
                      {operationalDistribution.items.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            width: `${Math.max(2, item.valueIn100)}%`,
                            backgroundColor: item.color || '#3b82f6'
                          }}
                          className="h-full first:rounded-l-full relative group transition-all hover:brightness-110 cursor-pointer"
                          title={`${item.name}: ${formatPercent(item.valueIn100)}`}
                        />
                      ))}
                      {operationalDistribution.profit > 0 && (
                        <div
                          style={{ width: `${operationalDistribution.profit}%` }}
                          className="h-full bg-primary rounded-r-full relative group transition-all hover:brightness-110 cursor-pointer shadow-[inset_0_2px_8px_rgba(255,255,255,0.2)]"
                          title={`Lucro Operacional: ${formatPercent(operationalDistribution.profit)}`}
                        />
                      )}
                    </div>

                    {/* Legenda Dinâmica da Distribuição */}
                    <div className="flex flex-wrap gap-4 pt-2">
                      {operationalDistribution.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 bg-muted/20 px-3 py-1.5 rounded-2xl border border-border/40 text-[9px] font-black uppercase">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: item.color || '#3b82f6' }}
                          />
                          <span className="text-muted-foreground">{item.name}:</span>
                          <span className="text-foreground">{formatCurrency(item.valueIn100)}</span>
                        </div>
                      ))}
                      {operationalDistribution.profit > 0 && (
                        <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-2xl border border-primary/20 text-[9px] font-black uppercase text-primary">
                          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                          <span>Lucro Operacional:</span>
                          <span>{formatCurrency(operationalDistribution.profit)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tabela de Notação de Porcentagem por Categoria */}
            <div className="bg-card p-6 rounded-[2.5rem] border border-border shadow-sm">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tighter mb-1">
                  Despesas em Relação às Vendas
                </h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 mb-6">
                  Porcentagem que cada categoria de despesa consome das vendas totais (faturamento).
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/30 text-muted-foreground text-[10px] font-black uppercase tracking-widest border-b border-border/50">
                      <th className="px-6 py-4">Categoria</th>
                      <th className="px-6 py-4 text-right">Valor Gasto</th>
                      <th className="px-6 py-4 text-right">% das Vendas</th>
                      <th className="px-6 py-4">Progresso Visual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {expensesByCategory.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: item.color || '#f43f5e' }}
                            />
                            <span className="text-xs font-bold uppercase tracking-tight">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-black text-right">
                          {formatCurrency(item.total)}
                        </td>
                        <td className="px-6 py-4 text-xs font-black text-right text-rose-500">
                          {formatPercent(item.percentage)}
                        </td>
                        <td className="px-6 py-4 w-1/3">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${Math.min(item.percentage, 100)}%`,
                                  backgroundColor: item.color || '#f43f5e'
                                }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {expensesByCategory.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground text-[11px] font-black uppercase tracking-widest">
                          Nenhuma categoria de despesa com gastos no período.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </motion.div>
        ) : (
          <motion.div
            key="operational-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Aviso sobre Mês Selecionado vs Consolidado */}
            {selectedMonth === 'consolidated' && (
              <div className="bg-primary/10 border border-primary/20 rounded-3xl p-4 flex items-center gap-3">
                <Info className="text-primary shrink-0" size={18} />
                <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                  Nota: Você está visualizando os indicadores de Margem de Contribuição e Ponto de Equilíbrio baseados no consolidado anual total. Para maior precisão operacional, selecione um mês específico.
                </span>
              </div>
            )}

            {/* Grade de Margem e Ponto de Equilíbrio */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Card de Margem de Contribuição */}
              <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-black uppercase tracking-tighter flex items-center gap-2">
                      <Percent className="text-primary" size={20} />
                      Margem de Contribuição
                    </h3>
                    <span className="text-[9px] font-black bg-muted px-3 py-1 rounded-full uppercase text-muted-foreground border">
                      Fórmula: Receita - C. Variáveis
                    </span>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-8">
                    Revela o quanto sobra das receitas após a dedução dos custos e despesas diretamente ligados às vendas (Custos Variáveis). Este valor é o que contribui para pagar as despesas fixas e gerar lucro.
                  </p>

                  <div className="space-y-6 bg-muted/20 p-6 rounded-3xl border border-border/40">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-muted-foreground uppercase">Faturamento (A)</span>
                      <span className="text-sm font-black">{formatCurrency(operationalAnalysis.receitas)}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-border/10 pb-4">
                      <span className="text-[10px] font-black text-rose-500 uppercase flex items-center gap-1">
                        (-) Custos Variáveis (B)
                      </span>
                      <span className="text-sm font-black text-rose-500">{formatCurrency(operationalAnalysis.custosVariáveis)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs font-black uppercase text-foreground">Margem de Contribuição (R$)</span>
                      <span className="text-lg font-black text-foreground">{formatCurrency(operationalAnalysis.margemValor)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border/50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-0.5">
                      Margem de Contribuição (%)
                    </span>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase leading-none">
                      Representação percentual sobre a receita
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-primary">
                      {formatPercent(operationalAnalysis.margemPercentual)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card do Ponto de Equilíbrio */}
              <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-black uppercase tracking-tighter flex items-center gap-2">
                      <Calculator className="text-primary" size={20} />
                      Ponto de Equilíbrio
                    </h3>
                    <span className="text-[9px] font-black bg-muted px-3 py-1 rounded-full uppercase text-muted-foreground border">
                      Fórmula: C. Fixos / Margem %
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground mb-8">
                    Determina o faturamento mínimo em reais (R$) necessário no período para cobrir integralmente todas as despesas fixas (Despesas Ciclo) e variáveis. Abaixo deste valor, a empresa opera em prejuízo.
                  </p>

                  {operationalAnalysis.margemPercentual < 0 ? (
                    <div className="space-y-4 bg-rose-500/10 p-6 rounded-3xl border border-rose-500/20 text-rose-700 dark:text-rose-400">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="shrink-0 mt-0.5" size={16} />
                        <div className="space-y-2">
                          <p className="text-xs font-black uppercase tracking-tight">
                            Ponto de Equilíbrio Indeterminado
                          </p>
                          <ul className="list-disc pl-4 space-y-2 text-[10px] font-bold uppercase leading-normal">
                            <li>
                              Os custos variáveis estão consumindo 100% ou mais da receita. A empresa gera prejuízo em cada venda realizada.
                            </li>
                            {operationalAnalysis.receitas > 0 && (
                              <li>
                                Para atingir margem de contribuição zero, é necessário reduzir <span className="font-black underline">{formatCurrency(operationalAnalysis.custosVariáveis - operationalAnalysis.receitas)}</span> dos custos variáveis ou aumentar a receita em pelo menos <span className="font-black underline">{formatPercent(((operationalAnalysis.custosVariáveis - operationalAnalysis.receitas) / operationalAnalysis.receitas) * 100)}</span>.
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6 bg-muted/20 p-6 rounded-3xl border border-border/40">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1">
                          Custos Fixos (C)
                        </span>
                        <span className="text-sm font-black text-foreground">{formatCurrency(operationalAnalysis.custosFixos)}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-border/10 pb-4">
                        <span className="text-[10px] font-black text-muted-foreground uppercase">
                          Margem Contribuição (%)
                        </span>
                        <span className="text-sm font-black text-primary">{formatPercent(operationalAnalysis.margemPercentual)}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs font-black uppercase text-foreground">Ponto de Equilíbrio (R$)</span>
                        <span className="text-lg font-black text-foreground">{formatCurrency(operationalAnalysis.pontoEquilibrio)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-border/50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-0.5">
                      Faturamento Mínimo Requerido
                    </span>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase leading-none">
                      Meta financeira para não ter prejuízo
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "text-3xl font-black",
                      operationalAnalysis.margemPercentual < 0 ? "text-rose-500" : "text-foreground"
                    )}>
                      {operationalAnalysis.margemPercentual < 0 ? 'PREJUÍZO REAL' : formatCurrency(operationalAnalysis.pontoEquilibrio)}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Diagnóstico da Saúde Operacional */}
            <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-50 pointer-events-none" />

              <div className="relative mb-6">
                <h3 className="text-xl font-black uppercase tracking-tighter">
                  Diagnóstico Operacional {selectedMonth !== 'consolidated' ? `de ${getMonthName(selectedMonth)}` : `do Exercício`}
                </h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">
                  Análise comparativa da receita real do período com o ponto de equilíbrio calculado.
                </p>
              </div>

              {operationalAnalysis.receitas === 0 ? (
                <div className="py-12 text-center text-muted-foreground/60 text-[11px] font-black uppercase tracking-widest border border-dashed rounded-3xl">
                  Aguardando faturamento no período para gerar diagnóstico operacional...
                </div>
              ) : operationalAnalysis.margemPercentual < 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-in fade-in duration-300">
                  
                  {/* Status Visual com Margem Negativa */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg bg-rose-500 shadow-rose-500/20 animate-pulse">
                        <TrendingDown size={24} />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider block text-rose-500">
                          Prejuízo Crítico
                        </span>
                        <h4 className="text-xl font-black uppercase tracking-tight leading-tight">
                          Margem Negativa Detectada
                        </h4>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Sua operação empresarial está em estado de alerta crítico. A receita gerada não cobre sequer os custos variáveis associados às vendas. Isso significa que **quanto mais a empresa vende, mais prejuízo ela acumula**.
                    </p>
                  </div>

                  {/* Detalhes de Ação corretiva em Tópicos */}
                  <div className="space-y-4 bg-rose-500/5 p-6 rounded-3xl border border-rose-500/10">
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-500 block">
                      Ações Recomendadas (Metas Mínimas):
                    </span>
                    <ul className="list-disc pl-4 space-y-2 text-[10px] font-bold text-muted-foreground uppercase leading-normal">
                      <li>
                        Reduzir pelo menos <span className="text-foreground font-black">{formatCurrency(operationalAnalysis.custosVariáveis - operationalAnalysis.receitas)}</span> em despesas variáveis.
                      </li>
                      {operationalAnalysis.receitas > 0 && (
                        <li>
                          Ou reajustar preços e aumentar o faturamento em pelo menos <span className="text-foreground font-black">{formatPercent(((operationalAnalysis.custosVariáveis - operationalAnalysis.receitas) / operationalAnalysis.receitas) * 100)}</span> mantendo a mesma estrutura de despesas.
                        </li>
                      )}
                      <li>
                        Revisar a viabilidade econômica do mix de produtos/serviços ofertados.
                      </li>
                    </ul>
                  </div>

                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  
                  {/* Status Visual */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                        operationalAnalysis.atingiuEquilibrio 
                          ? 'bg-emerald-500 shadow-emerald-500/20' 
                          : 'bg-rose-500 shadow-rose-500/20'
                      }`}>
                        {operationalAnalysis.atingiuEquilibrio ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                      </div>
                      <div>
                        <span className={`text-[10px] font-black uppercase tracking-wider block ${
                          operationalAnalysis.atingiuEquilibrio ? 'text-emerald-500' : 'text-rose-500'
                        }`}>
                          {operationalAnalysis.atingiuEquilibrio ? 'Zona de Lucro Operacional' : 'Zona de Déficit Operacional'}
                        </span>
                        <h4 className="text-xl font-black uppercase tracking-tight leading-tight">
                          {operationalAnalysis.atingiuEquilibrio ? 'Equilíbrio Superado' : 'Equilíbrio Não Atingido'}
                        </h4>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {operationalAnalysis.atingiuEquilibrio ? (
                        <span>
                          Sua receita superou o ponto de equilíbrio em{' '}
                          <span className="font-bold text-emerald-500">{formatCurrency(operationalAnalysis.saldoEquilibrio)}</span>.{' '}
                          Isso indica que todas as despesas fixas e variáveis do período foram cobertas e a empresa operou em regime de lucro saudável.
                        </span>
                      ) : (
                        <span>
                          Sua receita ficou{' '}
                          <span className="font-bold text-rose-500">{formatCurrency(Math.abs(operationalAnalysis.saldoEquilibrio))}</span>{' '}
                          abaixo do mínimo necessário para cobrir os custos fixos. É recomendado buscar um incremento nas vendas ou revisar custos operacionais.
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Comparativo de Barras */}
                  <div className="space-y-4 bg-muted/20 p-6 rounded-3xl border border-border/40">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground">
                        <span>Faturamento Real</span>
                        <span className="text-foreground">{formatCurrency(operationalAnalysis.receitas)}</span>
                      </div>
                      <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{
                            width: `${Math.min(
                              (operationalAnalysis.receitas / Math.max(1, operationalAnalysis.pontoEquilibrio)) * 100,
                              100
                            )}%`
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground">
                        <span>Ponto de Equilíbrio</span>
                        <span className="text-foreground">{formatCurrency(operationalAnalysis.pontoEquilibrio)}</span>
                      </div>
                      <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full animate-pulse"
                          style={{
                            width: `${Math.min(
                              (operationalAnalysis.pontoEquilibrio / Math.max(1, operationalAnalysis.receitas)) * 100,
                              100
                            )}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Configurações de Categoria */}
      <AnimatePresence>
        {isConfigOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConfigOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border-2 border-border rounded-[2.5rem] w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl relative z-10"
            >
              {/* Header Modal */}
              <div className="p-6 border-b border-border/40 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">
                    Categorias da Análise
                  </h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 mt-0.5">
                    Selecione quais categorias fazem parte da análise de receitas e despesas.
                  </p>
                </div>
                <button
                  onClick={() => setIsConfigOpen(false)}
                  className="p-2 hover:bg-muted rounded-xl transition-all"
                >
                  Fechar
                </button>
              </div>

              {/* Conteúdo Modal */}
              <div className="p-6 overflow-y-auto space-y-8 flex-1 custom-scrollbar">
                
                {/* Seção Receitas */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border/10 pb-2">
                    <span className="text-xs font-black uppercase text-emerald-500 tracking-wider">
                      Apuração de Receitas (Vendas)
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleAllIncome(true)}
                        className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline"
                      >
                        Marcar todas
                      </button>
                      <span className="text-muted-foreground/30">|</span>
                      <button
                        onClick={() => handleToggleAllIncome(false)}
                        className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:underline"
                      >
                        Desmarcar todas
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase leading-tight">
                    *Por padrão, nenhuma categoria de receita vem pré-selecionada. Selecione-as manualmente abaixo.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {incomeCategoriesList.map((cat) => {
                      const isSelected = selectedIncomeCats.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setSelectedIncomeCats(prev =>
                              isSelected ? prev.filter(id => id !== cat.id) : [...prev, cat.id]
                            );
                          }}
                          className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                            isSelected 
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                              : 'bg-muted/10 border-border/40 hover:bg-muted/30 text-foreground'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                              isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-muted-foreground/30'
                            }`}
                          >
                            {isSelected && <Check size={10} strokeWidth={3} />}
                          </div>
                          <span className="text-xs font-bold uppercase tracking-tight truncate">{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Seção Despesas */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border/10 pb-2">
                    <span className="text-xs font-black uppercase text-rose-500 tracking-wider">
                      Apuração de Despesas
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleAllExpense(true)}
                        className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline"
                      >
                        Marcar todas
                      </button>
                      <span className="text-muted-foreground/30">|</span>
                      <button
                        onClick={() => handleToggleAllExpense(false)}
                        className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:underline"
                      >
                        Desmarcar todas
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase leading-tight">
                    *Por padrão, todas as categorias de despesas vêm selecionadas. Desmarque as que deseja excluir.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {expenseCategoriesList.map((cat) => {
                      const isSelected = selectedExpenseCats.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setSelectedExpenseCats(prev =>
                              isSelected ? prev.filter(id => id !== cat.id) : [...prev, cat.id]
                            );
                          }}
                          className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                            isSelected 
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400' 
                              : 'bg-muted/10 border-border/40 hover:bg-muted/30 text-foreground'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                              isSelected ? 'bg-rose-500 border-rose-500 text-white' : 'border-muted-foreground/30'
                            }`}
                          >
                            {isSelected && <Check size={10} strokeWidth={3} />}
                          </div>
                          <span className="text-xs font-bold uppercase tracking-tight truncate">{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Footer Modal */}
              <div className="p-6 border-t border-border/40 flex items-center justify-end gap-3 bg-muted/20">
                <button
                  onClick={() => setIsConfigOpen(false)}
                  className="px-6 py-3 border border-border/80 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveConfig}
                  className="px-6 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Salvar Alterações
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
