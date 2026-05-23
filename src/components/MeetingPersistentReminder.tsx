import React from 'react';
import { CalendarDays, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MeetingPersistentReminderProps {
  onViewMeetings: () => void;
  isMeetingsTab?: boolean;
  count: number;
}

export const MeetingPersistentReminder: React.FC<MeetingPersistentReminderProps> = ({ onViewMeetings, isMeetingsTab, count }) => {
  if (count === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full"
      >
        <div className="relative group overflow-hidden">
          {/* Background dinâmico: âmbar/laranja refinado */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20 group-hover:border-amber-500/30 backdrop-blur-xl border rounded-[2rem] transition-all" />

          <div className="relative p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl border flex items-center justify-center shadow-lg transition-all bg-amber-500/20 border-amber-500/30 text-amber-600 dark:text-amber-400 shadow-amber-500/10">
                <CalendarDays size={24} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-3 py-1 rounded-full text-white text-[8px] font-black uppercase tracking-widest shadow-lg bg-amber-500 shadow-amber-500/20">
                    Aviso de Agendamentos
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                    Reuniões do Mês
                  </span>
                </div>
                <h3 className="text-lg font-black tracking-tighter text-foreground uppercase">
                  Você tem <span className="text-amber-500">
                    {count} {count === 1 ? 'cliente pendente' : 'clientes pendentes'}
                  </span> de agendamento
                </h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Lembre-se de realizar o agendamento ou a dispensa das reuniões mensais de seus clientes ativos.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {!isMeetingsTab && (
                <button
                  onClick={onViewMeetings}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-lg bg-amber-500 text-white shadow-amber-500/20"
                >
                  Gerenciar Reuniões
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
