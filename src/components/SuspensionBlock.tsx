import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, LogOut, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

interface SuspensionBlockProps {
  reason?: string;
}

export const SuspensionBlock: React.FC<SuspensionBlockProps> = ({ reason }) => {
  const { signOut } = useAuth();

  return (
    <div className="fixed inset-0 z-[999] bg-slate-950 flex items-center justify-center p-4">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-rose-500/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-rose-500/5 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-lg bg-card border border-rose-500/20 rounded-[3rem] p-8 md:p-12 shadow-2xl text-center overflow-hidden"
      >
        {/* Glow effect */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />
        
        <div className="relative space-y-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-[2rem] bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shadow-lg shadow-rose-500/20 animate-pulse">
              <ShieldAlert size={40} />
            </div>
            <div className="space-y-2">
              <span className="px-4 py-1.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-lg shadow-rose-500/20">
                Acesso Suspenso
              </span>
              <h1 className="text-3xl font-black text-foreground uppercase tracking-tighter">
                Conta Temporariamente Indisponível
              </h1>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-muted/50 border border-border space-y-4">
            <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-500">
              <AlertCircle size={14} />
              Motivo da Suspensão
            </div>
            <p className="text-sm font-medium text-muted-foreground leading-relaxed italic">
              "{reason || 'Nenhum motivo específico informado. Entre em contato com seu educador financeiro para mais detalhes.'}"
            </p>
          </div>

          <div className="space-y-6">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] leading-relaxed">
              Para retomar o acesso aos seus espaços financeiros,<br />
              por favor regularize sua situação junto à administração.
            </p>

            <button 
              onClick={() => signOut()}
              className="w-full h-16 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 shadow-xl group"
            >
              <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
              Sair da Conta
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
