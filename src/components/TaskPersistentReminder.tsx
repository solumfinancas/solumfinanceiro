import React from 'react';
import { useFinance } from '../FinanceContext';
import { CheckSquare, ArrowRight, AlertCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isPast, parseISO, isToday } from 'date-fns';

interface TaskPersistentReminderProps {
  onViewTasks: () => void;
}

export const TaskPersistentReminder: React.FC<TaskPersistentReminderProps> = ({ onViewTasks }) => {
  const { tasks } = useFinance();

  const pendingTasks = tasks.filter(t => !t.completed);
  
  if (pendingTasks.length === 0) return null;

  const hasOverdueTasks = pendingTasks.some(t => {
    if (!t.deadline) return false;
    const deadlineDate = parseISO(t.deadline);
    return isPast(deadlineDate) && !isToday(deadlineDate);
  });

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full"
      >
        <div className="relative group overflow-hidden">
          {/* Background dinâmico: vermelho se atrasado, âmbar/azul se apenas pendente */}
          <div className={`absolute inset-0 bg-gradient-to-r ${
            hasOverdueTasks 
              ? 'from-destructive/10 via-destructive/5 to-transparent border-destructive/20 group-hover:border-destructive/30' 
              : 'from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20 group-hover:border-amber-500/30'
          } backdrop-blur-xl border rounded-[2rem] transition-all`} />
          
          <div className="relative p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shadow-lg transition-all ${
                hasOverdueTasks 
                  ? 'bg-destructive/20 border-destructive/30 text-destructive shadow-destructive/10' 
                  : 'bg-amber-500/20 border-amber-500/30 text-amber-500 shadow-amber-500/10'
              }`}>
                {hasOverdueTasks ? <AlertCircle size={24} className="animate-pulse" /> : <Clock size={24} />}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-3 py-1 rounded-full text-white text-[8px] font-black uppercase tracking-widest shadow-lg ${
                    hasOverdueTasks ? 'bg-destructive shadow-destructive/20' : 'bg-amber-500 shadow-amber-500/20'
                  }`}>
                    Aviso de Tarefas
                  </span>
                  {hasOverdueTasks && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-destructive animate-pulse">
                      Existem Tarefas Atrasadas
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-black tracking-tighter text-foreground uppercase">
                  Você tem <span className={hasOverdueTasks ? 'text-destructive' : 'text-amber-500'}>
                    {pendingTasks.length} {pendingTasks.length === 1 ? 'tarefa pendente' : 'tarefas pendentes'}
                  </span>
                </h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {hasOverdueTasks 
                    ? 'Algumas tarefas já passaram do prazo. Conclua-as o quanto antes.'
                    : 'Mantenha suas obrigações em dia para uma melhor organização financeira.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
               <div className="px-6 py-3 bg-card border border-border rounded-xl hidden md:block">
                  <span className={`text-[9px] font-black uppercase tracking-widest ${hasOverdueTasks ? 'text-destructive' : 'text-amber-500'}`}>
                    {pendingTasks.filter(t => {
                      if (!t.deadline) return false;
                      const deadlineDate = parseISO(t.deadline);
                      return isPast(deadlineDate) && !isToday(deadlineDate);
                    }).length} Atrasadas
                  </span>
               </div>

               <button 
                onClick={onViewTasks}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-lg ${
                  hasOverdueTasks 
                    ? 'bg-destructive text-white shadow-destructive/20' 
                    : 'bg-amber-500 text-white shadow-amber-500/20'
                }`}
               >
                 Ver Tarefas
                 <ArrowRight size={16} />
               </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
