import React from 'react';
import { useFinance } from '../FinanceContext';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OverduePersistentReminder: React.FC = () => {
  const { overdueServices, hasAcknowledgedOverdue } = useFinance();

  // Só mostra o lembrete se houver atraso e o usuário já deu ciência (ou se quisermos que apareça sempre)
  // O usuário pediu: "após dar ciência, quero que no perfil do usuário fique um lembrete em todas as abas"
  if (overdueServices.length === 0 || !hasAcknowledgedOverdue) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full"
      >
        <div className="relative group overflow-hidden">
          {/* Background com efeito glassmorphism e gradiente de alerta */}
          <div className="absolute inset-0 bg-gradient-to-r from-destructive/10 via-destructive/5 to-transparent backdrop-blur-xl border border-destructive/20 rounded-[2rem] transition-all group-hover:border-destructive/30" />
          
          <div className="relative p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-destructive/20 border border-destructive/30 flex items-center justify-center text-destructive shadow-lg shadow-destructive/10">
                <AlertCircle size={24} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-3 py-1 rounded-full bg-destructive text-white text-[8px] font-black uppercase tracking-widest shadow-lg shadow-destructive/20">
                    Aviso de Pendência
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-destructive animate-pulse">
                    Regularização Necessária
                  </span>
                </div>
                <h3 className="text-lg font-black tracking-tighter text-foreground uppercase">
                  Seu pagamento está <span className="text-destructive">atrasado</span>
                </h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Entre em contato com seu educador financeiro para confirmar o pagamento.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
               <div className="text-right hidden md:block">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Pendente</p>
                  <p className="text-xl font-black text-foreground tabular-nums">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      overdueServices.reduce((acc, curr) => acc + curr.amount, 0)
                    )}
                  </p>
               </div>
               <div className="h-10 w-[1px] bg-border/50 hidden md:block mx-2" />
               <div className="px-6 py-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                  <span className="text-[9px] font-black uppercase tracking-widest text-destructive">
                    {overdueServices.length} {overdueServices.length === 1 ? 'Fatura Vencida' : 'Faturas Vencidas'}
                  </span>
               </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
