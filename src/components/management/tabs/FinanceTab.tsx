import React, { useState } from 'react';
import { 
  TrendingUp, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  DollarSign, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export const FinanceTab: React.FC = () => {
  const { profile } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);

  const fetchData = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const { data, error } = await supabase
        .from('student_payments')
        .select(`
          *,
          client:profiles!student_payments_client_id_fkey(full_name)
        `)
        .eq('educator_id', profile.id)
        .gte('due_date', startOfMonth.split('T')[0])
        .lte('due_date', endOfMonth.split('T')[0]);

      if (error) throw error;
      setPayments(data || []);
    } catch (err) {
      console.error('Erro ao buscar pagamentos:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [profile, currentDate]);

  const stats = React.useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const aReceber = payments
      .filter(p => p.status === 'pending' && new Date(p.due_date) >= today)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const emAtraso = payments
      .filter(p => p.status === 'pending' && new Date(p.due_date) < today)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const recebido = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const faturamento = payments.reduce((sum, p) => sum + Number(p.amount), 0);

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
        value: recebido, 
        icon: CheckCircle2, 
        color: 'text-emerald-500', 
        bg: 'bg-emerald-500/10',
        description: 'Confirmados' 
      },
      { 
        label: 'Faturamento', 
        value: faturamento, 
        icon: DollarSign, 
        color: 'text-primary', 
        bg: 'bg-primary/10',
        description: 'Total mensal' 
      },
    ];
  }, [payments]);

  const alerts = React.useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return payments
      .filter(p => p.status === 'pending' && new Date(p.due_date) < today)
      .map(p => {
        const dueDate = new Date(p.due_date);
        const diffTime = Math.abs(today.getTime() - dueDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
          student: p.client?.full_name || 'Estudante',
          status: `Vencido há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`,
          amount: Number(p.amount)
        };
      });
  }, [payments]);

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
          <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
            Meu Faturamento
          </h1>
        </div>

        <div className="flex items-center gap-4 bg-card border border-border p-2 rounded-2xl shadow-xl shadow-slate-200/10 dark:shadow-none">
          <button 
            onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-muted transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col items-center px-4 min-w-[140px]">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">{currentDate.getFullYear()}</span>
            <span className="text-sm font-black uppercase tracking-tighter">{months[currentDate.getMonth()]}</span>
          </div>
          <button 
            onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-muted transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "bg-card border border-border p-8 rounded-[2.5rem] relative overflow-hidden group shadow-xl shadow-slate-200/40 dark:shadow-none",
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
              <div className="absolute top-8 right-8 flex items-center gap-1 bg-rose-500 text-white text-[8px] font-black uppercase px-2 py-1 rounded-lg animate-bounce">
                Atenção
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Analysis Chart Placeholder */}
        <div className="xl:col-span-2 bg-card border border-border p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40 dark:shadow-none">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Calendar size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-foreground uppercase tracking-tighter">Análise Mensal</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Comparativo de Fluxo</p>
              </div>
            </div>
          </div>
          
          <div className="h-64 flex items-end justify-between gap-4 px-4">
             {/* Simple bar chart mock */}
             {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
               <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                  <div className="w-full relative">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: i * 0.1, duration: 1 }}
                      className="w-full rounded-t-xl bg-primary/20 border-t-2 border-primary group-hover:bg-primary/40 transition-all relative"
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded">
                        {h}%
                      </div>
                    </motion.div>
                  </div>
                  <span className="text-[9px] font-black text-muted-foreground uppercase">Sem {i + 1}</span>
               </div>
             ))}
          </div>
          
          <div className="mt-8 pt-8 border-t border-border flex items-center justify-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Recebido</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary/40 border border-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">A Receber</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Em Atraso</span>
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        <div className="bg-card border border-border p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40 dark:shadow-none">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
              <AlertCircle size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground uppercase tracking-tighter">Alertas de Pagamento</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">Ações Necessárias</p>
            </div>
          </div>

          <div className="space-y-4">
            {alerts.map((alert, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 rounded-2xl bg-muted/30 border border-border group hover:border-rose-500/40 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-black text-foreground tracking-tight">{alert.student}</span>
                  <span className="text-xs font-black text-rose-500">{formatCurrency(alert.amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-muted-foreground" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{alert.status}</span>
                  </div>
                  <button className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline">
                    Notificar
                  </button>
                </div>
              </motion.div>
            ))}

            <button className="w-full h-14 rounded-2xl border-2 border-dashed border-border text-muted-foreground text-[10px] font-black uppercase tracking-widest hover:border-primary/50 hover:text-primary transition-all mt-4">
              Ver Todos os Atrasos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
