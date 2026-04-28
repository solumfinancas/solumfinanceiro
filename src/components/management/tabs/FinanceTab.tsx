import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  DollarSign, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Loader2,
  ExternalLink,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { cn, formatCurrency } from '../../../lib/utils';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { useFinance } from '../../../FinanceContext';

interface FinanceTabProps {
  onNavigateToClients?: (search: string) => void;
}

export const FinanceTab: React.FC<FinanceTabProps> = ({ onNavigateToClients }) => {
  const { profile, impersonateUser } = useAuth();
  const { setActiveSpace } = useFinance();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);

  const fetchData = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      // Buscamos todos os serviços contratados vinculados a este educador
      const { data, error } = await supabase
        .from('contracted_services')
        .select(`
          *,
          client:profiles!client_id(full_name, user_metadata)
        `)
        .eq('educator_id', profile.id);

      if (error) throw error;
      setPayments(data || []);
    } catch (err) {
      console.error('Erro ao buscar pagamentos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const isOverdue = (inst: any) => {
    if (inst.status === 'paid') return false;
    const dueDate = new Date(inst.due_date + 'T12:00:00Z');
    return dueDate < today;
  };

  const stats = useMemo(() => {
    const selectedMonth = currentDate.getMonth();
    const selectedYear = currentDate.getFullYear();

    const aReceber = payments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const emAtraso = payments
      .filter(p => isOverdue(p))
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const recebidoNoMes = payments
      .filter(p => {
        const dueDate = new Date(p.due_date + 'T12:00:00Z');
        return p.status === 'paid' && 
               dueDate.getMonth() === selectedMonth && 
               dueDate.getFullYear() === selectedYear;
      })
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const faturamentoTotal = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return [
      { 
        label: 'A Receber', 
        value: aReceber, 
        icon: Clock, 
        color: 'text-amber-500', 
        bg: 'bg-amber-500/10',
        description: 'Mensalidades previstas' 
      },
      { 
        label: 'Em Atraso', 
        value: emAtraso, 
        icon: AlertCircle, 
        color: 'text-rose-500', 
        bg: 'bg-rose-500/10',
        description: 'Pagamentos vencidos',
        alert: emAtraso > 0 
      },
      { 
        label: 'Recebido no Mês', 
        value: recebidoNoMes, 
        icon: CheckCircle2, 
        color: 'text-emerald-500', 
        bg: 'bg-emerald-500/10',
        description: 'Confirmados' 
      },
      { 
        label: 'Faturamento', 
        value: faturamentoTotal, 
        icon: DollarSign, 
        color: 'text-blue-500', 
        bg: 'bg-blue-500/10',
        description: 'Total acumulado' 
      },
    ];
  }, [payments, currentDate, today]);

  const alerts = useMemo(() => {
    return payments
      .filter(p => isOverdue(p))
      .map(p => {
        const dueDate = new Date(p.due_date + 'T12:00:00Z');
        const diffTime = Math.abs(today.getTime() - dueDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Dívida crítica se o vencimento for em mês anterior ao atual
        const isCritical = dueDate < new Date(today.getFullYear(), today.getMonth(), 1);
        
        return {
          id: p.id,
          clientId: p.client_id,
          student: p.client?.full_name || 'Cliente',
          status: `Vencido há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`,
          amount: Number(p.amount),
          date: p.due_date,
          type: p.type, // Consultoria, Mentoria, etc
          spaceType: p.space_type, // personal, business
          gender: p.client?.user_metadata?.gender,
          isCritical,
          installmentInfo: p.total_installments > 1 
            ? `Parcela ${p.installment_number}/${p.total_installments}`
            : 'Parcela Única'
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [payments, today]);

  const chartData = useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = d.getMonth();
      const year = d.getFullYear();
      
      const monthPayments = payments.filter(p => {
        const dueDate = new Date(p.due_date + 'T12:00:00Z');
        return dueDate.getMonth() === month && dueDate.getFullYear() === year;
      });
      
      const recebido = monthPayments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount), 0);
        
      const aReceber = monthPayments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + Number(p.amount), 0);
        
      months.push({
        name: d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '') + '/' + d.getFullYear().toString().slice(-2),
        recebido,
        aReceber,
        fullMonth: d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      });
    }
    return months;
  }, [payments]);

  const currentMonthStats = useMemo(() => {
    const selectedMonth = currentDate.getMonth();
    const selectedYear = currentDate.getFullYear();
    
    const mPayments = payments.filter(p => {
      const d = new Date(p.due_date + 'T12:00:00Z');
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    const total = mPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const received = mPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0);
    const percent = total > 0 ? (received / total) * 100 : 0;
    
    return { total, received, percent };
  }, [payments, currentDate]);

  const [confirmingPayment, setConfirmingPayment] = useState<any>(null);

  const handleConfirmPayment = async () => {
    if (!confirmingPayment) return;
    
    try {
      const { error } = await supabase
        .from('contracted_services')
        .update({ status: 'paid' })
        .eq('id', confirmingPayment.id);

      if (error) throw error;
      
      // Update local state
      setPayments(prev => prev.map(p => 
        p.id === confirmingPayment.id ? { ...p, status: 'paid' } : p
      ));
      setConfirmingPayment(null);
    } catch (err) {
      console.error('Erro ao confirmar pagamento:', err);
    }
  };

  const totalOverdue = alerts.reduce((sum, a) => sum + a.amount, 0);

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      {loading && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-[100] flex items-center justify-center">
          <Loader2 className="text-primary animate-spin" size={48} />
        </div>
      )}
      
      {/* Header & Month Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-primary" size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Resumo Financeiro</span>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground">
            Meu Faturamento
          </h1>
        </div>

        <div className="flex items-center gap-4 bg-card border border-border p-2 rounded-2xl shadow-sm">
          <button 
            onClick={handlePrevMonth}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-muted transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col items-center px-4 min-w-[140px]">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">{currentDate.getFullYear()}</span>
            <span className="text-sm font-black uppercase tracking-tighter">{months[currentDate.getMonth()]}</span>
          </div>
          <button 
            onClick={handleNextMonth}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-muted transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Alertas de Pagamento - Wider and on Top */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "bg-card border border-border p-8 rounded-[2.5rem] shadow-sm transition-all",
            totalOverdue > 0 ? "border-rose-500/20 shadow-xl shadow-rose-500/[0.02]" : "opacity-60"
          )}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                <AlertCircle size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-foreground uppercase tracking-tighter">Alertas de Pagamento</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">Ações Necessárias</p>
              </div>
            </div>

            {totalOverdue > 0 && (
              <div className="px-6 py-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex flex-col items-end">
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 opacity-60">Total em Atraso</p>
                <p className="text-xl font-black text-rose-500 tracking-tighter">{formatCurrency(totalOverdue)}</p>
              </div>
            )}
          </div>

          {alerts.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-border rounded-[2rem] bg-muted/5">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Nenhum pagamento em atraso no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {alerts.map((alert, i) => (
                  <motion.div 
                    key={alert.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="p-5 rounded-2xl bg-muted/20 border border-border group hover:border-rose-500/40 hover:bg-rose-500/[0.02] transition-all relative overflow-hidden flex flex-col justify-between min-h-[160px]"
                  >
                    {/* Ícone de Fundo - Movido para o meio/direita para não tampar o texto */}
                    <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-[0.04] group-hover:opacity-[0.12] transition-all -rotate-12 group-hover:rotate-0 group-hover:scale-110 pointer-events-none">
                      <Receipt size={80} />
                    </div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-foreground tracking-tight truncate max-w-[150px]">{alert.student}</span>
                            <button 
                              onClick={() => {
                                // Redireciona para o perfil dentro do espaço do cliente
                                localStorage.setItem('active_tab_redirect', 'profile');
                                setActiveSpace(alert.spaceType);
                                impersonateUser(alert.clientId);
                              }}
                              className="p-1.5 rounded-lg bg-muted border border-border text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                              title="Ver perfil do cliente"
                            >
                              <ExternalLink size={12} />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-[8px] font-black uppercase px-2 py-0.5 rounded-full",
                              alert.spaceType === 'business' 
                                ? "bg-slate-900 text-white" 
                                : alert.gender === 'female' 
                                  ? "bg-pink-500 text-white" 
                                  : "bg-blue-500 text-white"
                            )}>
                              {alert.spaceType === 'business' ? 'Empresarial' : 'Pessoal'}
                            </span>
                            <span className="text-[8px] font-bold text-muted-foreground uppercase">{alert.type}</span>
                          </div>
                          {alert.isCritical && (
                            <div className="flex">
                              <span className="text-[7px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-md animate-pulse">
                                DÍVIDA CRÍTICA (MESES ANTERIORES)
                              </span>
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-black text-rose-500 shrink-0">{formatCurrency(alert.amount)}</span>
                      </div>

                      <div className="flex flex-col gap-1 mt-3">
                        <div className="flex items-center gap-2">
                          <Clock size={10} className="text-muted-foreground" />
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">{alert.status}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-muted-foreground/60 uppercase">
                            {alert.installmentInfo}
                          </span>
                          <span className="text-[9px] font-black text-muted-foreground/40 uppercase">
                            • Venceu em {new Date(alert.date + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="relative z-10 mt-4">
                      <button 
                        onClick={() => setConfirmingPayment(alert)}
                        className="w-full py-2.5 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/10"
                      >
                        Confirmar Pagamento
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "bg-card border border-border p-8 rounded-[2.5rem] relative overflow-hidden group shadow-sm",
                stat.alert && "border-rose-500/20"
              )}
            >
              <div className={cn("absolute -top-12 -right-12 w-32 h-32 blur-3xl opacity-20 transition-all group-hover:scale-150", stat.color.replace('text', 'bg'))} />
              
              <div className="relative z-10 flex flex-col gap-6">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border border-current transition-all group-hover:scale-110 group-hover:rotate-3", stat.color, stat.bg)}>
                  <stat.icon size={28} />
                </div>
                
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">{stat.label}</p>
                  <h3 className="text-3xl font-black tracking-tighter text-foreground">{formatCurrency(stat.value)}</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">{stat.description}</p>
                </div>
              </div>

              {stat.alert && (
                <div className="absolute top-8 right-8 flex items-center gap-1 bg-rose-500 text-white text-[8px] font-black uppercase px-2 py-1 rounded-lg animate-bounce shadow-lg shadow-rose-500/20">
                  Atenção
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>


        {/* Card de Progresso Mensal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden mt-8"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Target size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground uppercase tracking-tighter">Progresso de Recebimento</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Meta do mês: {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-foreground tracking-tighter">
                      {formatCurrency(currentMonthStats.received)}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground uppercase">
                      de {formatCurrency(currentMonthStats.total)}
                    </span>
                  </div>
                  <span className="text-lg font-black text-primary">
                    {Math.round(currentMonthStats.percent)}%
                  </span>
                </div>
                
                <div className="h-6 bg-muted/50 rounded-full border border-border p-1 shadow-inner overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${currentMonthStats.percent}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-primary to-orange-400 shadow-lg shadow-primary/20 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  </motion.div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:w-80">
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                <p className="text-[8px] font-black uppercase tracking-widest text-emerald-600 mb-1">Recebido</p>
                <p className="text-lg font-black text-emerald-600 tracking-tight">{formatCurrency(currentMonthStats.received)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                <p className="text-[8px] font-black uppercase tracking-widest text-amber-600 mb-1">Pendente</p>
                <p className="text-lg font-black text-amber-600 tracking-tight">{formatCurrency(currentMonthStats.total - currentMonthStats.received)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Análise Mensal Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border p-8 rounded-[2.5rem] shadow-sm mt-8"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <TrendingUp size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-foreground uppercase tracking-tighter">Análise dos Últimos 12 Meses</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Comparativo de Faturamento</p>
              </div>
            </div>
          </div>
          
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorRecebido" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAReceber" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 900, fill: 'hsl(var(--muted-foreground))' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <Tooltip 
                  cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-card/80 border border-border p-4 rounded-2xl shadow-2xl backdrop-blur-md">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">{payload[0].payload.fullMonth}</p>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-8">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-bold text-foreground uppercase">Recebido</span>
                              </div>
                              <span className="text-[10px] font-black text-emerald-500">{formatCurrency(payload[0].value as number)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-8">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                <span className="text-[10px] font-bold text-foreground uppercase">A Receber</span>
                              </div>
                              <span className="text-[10px] font-black text-primary">{formatCurrency(payload[1].value as number)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="recebido" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRecebido)" 
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="aReceber" 
                  stroke="#f97316" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorAReceber)" 
                  dot={{ r: 4, fill: '#f97316', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-8 pt-8 border-t border-border flex items-center justify-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Recebido</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">A Receber</span>
            </div>
          </div>
        </motion.div>


      {/* Modal de Confirmação de Pagamento */}
      <AnimatePresence>
        {confirmingPayment && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border border-border w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground uppercase tracking-tighter">Confirmar Pagamento</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Ação Irreversível</p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-muted/30 border border-border mb-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Cliente</span>
                  <span className="text-sm font-black text-foreground">{confirmingPayment.student}</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Serviço</span>
                  <span className="text-sm font-black text-foreground">{confirmingPayment.type}</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Parcela</span>
                  <span className="text-sm font-black text-foreground">{confirmingPayment.installmentInfo}</span>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Valor</span>
                  <span className="text-lg font-black text-emerald-500">{formatCurrency(confirmingPayment.amount)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setConfirmingPayment(null)}
                  className="h-14 rounded-2xl border border-border text-xs font-black uppercase tracking-widest hover:bg-muted transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmPayment}
                  className="h-14 rounded-2xl bg-emerald-500 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
