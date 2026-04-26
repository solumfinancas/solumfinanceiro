import React, { useState } from 'react';
import { 
  CreditCard, 
  Bell, 
  Check, 
  Star, 
  Zap, 
  ShieldCheck, 
  Gift,
  ArrowRight,
  Clock,
  Users,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { useAuth } from '../../../contexts/AuthContext';

type SettingsSection = 'plans' | 'notifications';
type BillingCycle = 'monthly' | 'annually';

export const SettingsTab: React.FC = () => {
  const { profile } = useAuth();
  const [activeSection, setActiveSection] = useState<SettingsSection>('plans');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      icon: Zap,
      monthlyPrice: 97,
      annualPrice: 77,
      description: 'Ideal para quem está começando na educação financeira.',
      features: [
        'Até 10 clientes ativos',
        'Gestão financeira básica',
        'Relatórios mensais',
        'Suporte via e-mail'
      ],
      color: 'blue',
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro',
      icon: Star,
      monthlyPrice: 197,
      annualPrice: 157,
      description: 'Perfeito para educadores em crescimento e expansão.',
      features: [
        'Até 25 clientes ativos',
        'Gestão financeira avançada',
        'Simuladores ilimitados',
        'Dashboard personalizado',
        'Suporte prioritário'
      ],
      color: 'primary',
      popular: true
    },
    {
      id: 'business',
      name: 'Business',
      icon: ShieldCheck,
      monthlyPrice: 357,
      annualPrice: 297,
      description: 'Para escritórios e equipes que precisam de escala.',
      features: [
        'Clientes ilimitados',
        'Múltiplos usuários admin',
        'API de integração',
        'Treinamento exclusivo',
        'Gerente de conta dedicado'
      ],
      color: 'emerald',
      popular: false
    }
  ];

  const calculateDaysRemaining = (dateString: string | null | undefined) => {
    if (!dateString) return 0;
    const expiry = new Date(dateString);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const daysRemaining = calculateDaysRemaining(profile?.plan_expires_at);
  const isTrial = profile?.plan === 'trial';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header & Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="text-primary" size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Configurações</span>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
            Gestão da Conta
          </h1>
        </div>

        <div className="flex bg-muted/50 backdrop-blur-xl border border-border p-1.5 rounded-2xl w-fit">
          <button
            onClick={() => setActiveSection('plans')}
            className={cn(
              "flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeSection === 'plans' 
                ? "bg-white dark:bg-slate-800 text-primary shadow-lg shadow-black/5" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CreditCard size={16} />
            Planos
          </button>
          <button
            onClick={() => setActiveSection('notifications')}
            className={cn(
              "flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeSection === 'notifications' 
                ? "bg-white dark:bg-slate-800 text-primary shadow-lg shadow-black/5" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Bell size={16} />
            Notificações
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeSection === 'plans' ? (
          <motion.div
            key="plans"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            {/* Trial Banner */}
            {isTrial && (
              <div className="relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent backdrop-blur-xl border border-primary/20 rounded-[2.5rem]" />
                <div className="relative p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-xl shadow-primary/20">
                      <Clock size={32} className="animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter mb-1">Período de Teste Grátis</h3>
                      <p className="text-sm font-medium text-muted-foreground max-w-md">
                        Você possui <span className="text-primary font-bold">{daysRemaining} dias</span> restantes de acesso completo com até 10 clientes.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                     <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-[10px] font-black text-primary uppercase tracking-widest">
                       Plano Atual: Teste Grátis
                     </div>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Toggle */}
            <div className="flex flex-col items-center justify-center gap-6">
              <div className="flex items-center gap-4">
                <span className={cn("text-xs font-black uppercase tracking-widest transition-colors", billingCycle === 'monthly' ? "text-foreground" : "text-muted-foreground")}>Mensal</span>
                <button 
                  onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'annually' : 'monthly')}
                  className="w-16 h-8 rounded-full bg-muted border border-border p-1 transition-all relative"
                >
                  <motion.div 
                    animate={{ x: billingCycle === 'monthly' ? 0 : 32 }}
                    className="w-6 h-6 rounded-full bg-primary shadow-lg shadow-primary/30"
                  />
                </button>
                <div className="flex items-center gap-3">
                  <span className={cn("text-xs font-black uppercase tracking-widest transition-colors", billingCycle === 'annually' ? "text-foreground" : "text-muted-foreground")}>Anual</span>
                  <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                    Economize até 20%
                  </div>
                </div>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {plans.map((plan) => {
                const currentPrice = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
                const isCurrentPlan = profile?.plan === plan.id;

                return (
                  <div 
                    key={plan.id}
                    className={cn(
                      "relative bg-card border border-border rounded-[3rem] p-10 flex flex-col transition-all group hover:border-primary/40 shadow-xl shadow-slate-200/50 dark:shadow-none",
                      plan.popular && "border-primary/50 shadow-primary/10",
                      isCurrentPlan && "border-primary ring-2 ring-primary/20"
                    )}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg shadow-primary/30">
                        Mais Popular
                      </div>
                    )}

                    <div className="mb-10">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border transition-all",
                        plan.color === 'blue' ? "bg-blue-500/10 border-blue-500/20 text-blue-500" :
                        plan.color === 'emerald' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                        "bg-primary/10 border-primary/20 text-primary"
                      )}>
                        <plan.icon size={28} />
                      </div>
                      <h3 className="text-3xl font-black text-foreground uppercase tracking-tighter mb-2">{plan.name}</h3>
                      <p className="text-sm font-medium text-muted-foreground leading-relaxed">{plan.description}</p>
                    </div>

                    <div className="mb-8">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-muted-foreground">R$</span>
                        <span className="text-5xl font-black text-foreground tracking-tighter">{currentPrice}</span>
                        <span className="text-muted-foreground font-bold text-sm">/mês</span>
                      </div>
                      
                      {billingCycle === 'annually' ? (
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-2">
                          Cobrado anualmente (Total R$ {currentPrice * 12})
                        </p>
                      ) : (
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">
                          No anual fica R$ {plan.annualPrice}/mês
                        </p>
                      )}
                    </div>

                    <div className="space-y-4 mb-10 flex-1">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-3 group/item">
                          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0 group-hover/item:bg-primary/20 transition-colors">
                            <Check size={12} className="text-muted-foreground group-hover/item:text-primary transition-colors" />
                          </div>
                          <span className="text-sm font-medium text-foreground/80">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <button 
                      disabled={isCurrentPlan}
                      className={cn(
                        "w-full h-16 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all",
                        isCurrentPlan
                          ? "bg-muted text-muted-foreground cursor-default"
                          : plan.popular 
                            ? "bg-primary text-white shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95" 
                            : "bg-muted text-muted-foreground hover:bg-primary hover:text-white"
                      )}
                    >
                      {isCurrentPlan ? 'Plano Atual' : 'Migrar Plano'}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <div className="bg-card border border-border rounded-[2.5rem] p-8 space-y-8">
              <div>
                <h3 className="text-xl font-black text-foreground uppercase tracking-tighter mb-2">Notificações do Sistema</h3>
                <p className="text-sm font-medium text-muted-foreground">Escolha como deseja ser avisado sobre as atividades de seus clientes.</p>
              </div>

              <div className="space-y-4">
                {[
                  { id: 'new_client', label: 'Novo Cliente Vinculado', desc: 'Sempre que um administrador vincular um novo cliente a você.', icon: Users },
                  { id: 'task_due', label: 'Prazos de Tarefas', icon: Clock, desc: 'Lembretes de tarefas que estão próximas do vencimento.' },
                  { id: 'weekly_report', label: 'Relatório Semanal', icon: Zap, desc: 'Resumo do progresso financeiro de sua carteira de clientes.' }
                ].map((notif) => (
                  <div key={notif.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border group hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                        <notif.icon size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-tight text-foreground">{notif.label}</p>
                        <p className="text-[10px] font-medium text-muted-foreground">{notif.desc}</p>
                      </div>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 shadow-xl shadow-primary/10">
                <Bell size={32} />
              </div>
              <h3 className="text-xl font-black text-foreground uppercase tracking-tighter mb-4">Central de Alertas</h3>
              <p className="text-sm font-medium text-muted-foreground max-w-xs mb-8">
                Configure seus canais de comunicação preferidos para nunca perder uma atualização importante da sua consultoria.
              </p>
              <div className="flex gap-4">
                <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase rounded-lg">WhatsApp Ativo</div>
                <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-black uppercase rounded-lg">E-mail Ativo</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
