import React from 'react';
import { useFinance } from '../FinanceContext';
import { AlertTriangle, Clock, ArrowRight, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OverdueAlertModal: React.FC = () => {
  const { overdueServices, hasAcknowledgedOverdue, acknowledgeOverdue } = useFinance();

  if (overdueServices.length === 0 || hasAcknowledgedOverdue) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop com desfoque pesado */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/80 backdrop-blur-2xl"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-card border shadow-2xl rounded-[2.5rem] overflow-hidden"
        >
          {/* Header Decorativo */}
          <div className="h-2 bg-destructive" />
          
          <div className="p-8 md:p-12">
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Ícone de Alerta Animado */}
              <div className="relative">
                <div className="absolute inset-0 bg-destructive/20 blur-2xl rounded-full animate-pulse" />
                <div className="relative w-20 h-20 bg-destructive/10 border border-destructive/20 rounded-3xl flex items-center justify-center text-destructive">
                  <ShieldAlert size={40} />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-black tracking-tighter uppercase">
                  Pagamento em <span className="text-destructive">Atraso</span>
                </h2>
                <p className="text-muted-foreground font-medium">
                  Identificamos pendências financeiras em seu plano de serviço.
                </p>
              </div>

              {/* Lista de Serviços em Atraso */}
              <div className="w-full space-y-3">
                {overdueServices.map((svc) => (
                  <div 
                    key={svc.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-destructive/10 rounded-lg text-destructive">
                        <Clock size={18} />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-black uppercase tracking-wider leading-none mb-1">
                          {svc.type || svc.name || 'Serviço Financeiro'}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          Vencido em: {new Date(svc.due_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-foreground">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(svc.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Aviso de Continuidade */}
              <div className="w-full p-4 bg-destructive/5 border border-destructive/10 rounded-2xl flex gap-3 text-left">
                <AlertTriangle className="text-destructive shrink-0" size={20} />
                <p className="text-[11px] font-bold text-destructive/80 uppercase tracking-tight leading-relaxed">
                  Atenção: A continuidade do acesso integral ao sistema Solum depende da regularização destes valores junto ao seu educador financeiro.
                </p>
              </div>

              {/* Botão de Ciência */}
              <button
                onClick={acknowledgeOverdue}
                className="w-full flex items-center justify-center gap-3 py-5 bg-foreground text-background rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-foreground/10 group"
              >
                Estou Ciente e Desejo Prosseguir
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                O acesso será normalizado após a confirmação do educador.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
