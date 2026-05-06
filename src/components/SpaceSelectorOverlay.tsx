import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Building2, Rocket, ArrowRight, ShieldCheck, Gem, LayoutDashboard, LogOut } from 'lucide-react';
import { useFinance } from '../FinanceContext';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { SpaceActivationModal } from './SpaceActivationModal';

interface SpaceSelectorOverlayProps {
  isOpen: boolean;
  onSelect: (space: 'personal' | 'business') => void;
  onSelectManagement: () => void;
}

export const SpaceSelectorOverlay: React.FC<SpaceSelectorOverlayProps> = ({ isOpen, onSelect, onSelectManagement }) => {
  const { initializedSpaces } = useFinance();
  const { user, profile, signOut } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activationModal, setActivationModal] = React.useState<{ isOpen: boolean; space: 'personal' | 'business' | null }>({
    isOpen: false,
    space: null
  });
  
  useEffect(() => {
    if (isOpen && containerRef.current) {
      containerRef.current.scrollTop = 0;
      window.scrollTo(0, 0);
    }
  }, [isOpen]);

  if (!isOpen) return null;
  
  // Garantia de que temos o perfil carregado para decidir se mostramos o Portal de Gestão
  // Evita o salto visual de 2 para 3 colunas
  if (user && !profile) return null;

  const isStaff = profile && profile.role !== 'user';

  const handleChoice = (space: 'personal' | 'business') => {
    if (initializedSpaces.includes(space)) {
      onSelect(space);
    } else {
      setActivationModal({ isOpen: true, space });
    }
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[1000] bg-[#020617] overflow-y-auto custom-scrollbar"
    >
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="relative w-full max-w-6xl mx-auto px-6 py-16 md:py-12 min-h-full flex flex-col items-center justify-start md:justify-center text-center">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 space-y-4"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <img 
              src="/images/logo.png" 
              alt="Solum Logo" 
              className="w-16 h-16 object-contain drop-shadow-[0_0_20px_rgba(249,115,22,0.8)]" 
            />
            <div>
              <h1 className="text-4xl font-black tracking-tighter leading-none text-white">SOLUM</h1>
              <p className="text-[10px] font-black tracking-[0.4em] text-primary uppercase">Sua Gestão Blindada</p>
            </div>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight max-w-2xl">
            Olá, <span className="text-primary">{user?.user_metadata?.full_name?.split(' ')[0] || 'Bem-vindo'}</span>! 
            Por onde vamos começar hoje?
          </h2>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest leading-relaxed">
            Selecione o espaço que deseja gerenciar agora. <br />
            Você poderá alternar entre eles a qualquer momento.
          </p>
        </motion.div>

        {/* Space Cards */}
        <div className={cn(
          "grid gap-8 w-full",
          isStaff ? "grid-cols-1 md:grid-cols-3 max-w-5xl" : "grid-cols-1 md:grid-cols-2 max-w-3xl"
        )}>
          {/* Management Portal (ONLY FOR STAFF) */}
          {isStaff && (
            <motion.button
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              onClick={onSelectManagement}
              className="group relative p-8 rounded-[3rem] border transition-all duration-500 text-left overflow-hidden bg-amber-500/5 border-amber-500/20 hover:border-amber-500/50 hover:bg-amber-500/10"
            >
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-[1.8rem] bg-amber-500/10 text-amber-500 flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 shadow-lg shadow-amber-500/20">
                  <LayoutDashboard size={32} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Portal de Gestão</h3>
                    <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase tracking-widest border border-amber-500/20">Administrativo</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                    Acesso às ferramentas de controle, gestão de usuários e auditoria financeira.
                  </p>
                </div>

                <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-500 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                  Acessar Painel
                  <ArrowRight size={14} />
                </div>
              </div>
              
              <div className="absolute bottom-[-20px] right-[-20px] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
                 <LayoutDashboard size={150} className="text-white" />
              </div>
            </motion.button>
          )}

          {/* Personal Space */}
          <motion.button
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            onClick={() => handleChoice('personal')}
            className={cn(
              "group relative p-8 rounded-[3rem] border transition-all duration-500 text-left overflow-hidden",
              initializedSpaces.includes('personal') 
                ? "bg-white/5 border-white/10 hover:border-primary/50 hover:bg-primary/5" 
                : "bg-slate-900/50 border-white/5 hover:border-blue-500/30"
            )}
          >
            <div className="relative z-10">
              <div className={cn(
                "w-16 h-16 rounded-[1.8rem] flex items-center justify-center mb-6 transition-all duration-500",
                initializedSpaces.includes('personal') 
                  ? "bg-primary/10 text-primary group-hover:scale-110 shadow-lg shadow-primary/20" 
                  : "bg-slate-800 text-slate-500"
              )}>
                <User size={32} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Espaço Pessoal</h3>
                  {initializedSpaces.includes('personal') ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">Ativo</span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-500 text-[8px] font-black uppercase tracking-widest border border-white/5">Inativo</span>
                  )}
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                  Ideal para suas contas, cartões e objetivos individuais do dia a dia.
                </p>
              </div>

              <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                {initializedSpaces.includes('personal') ? 'Entrar Agora' : 'Ativar Perfil'}
                <ArrowRight size={14} />
              </div>
            </div>
            
            {/* Background Decoration */}
            <div className="absolute bottom-[-20px] right-[-20px] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
               <User size={150} className="text-white" />
            </div>
          </motion.button>

          {/* Business Space */}
          <motion.button
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            onClick={() => handleChoice('business')}
            className={cn(
              "group relative p-8 rounded-[3rem] border transition-all duration-500 text-left overflow-hidden",
              initializedSpaces.includes('business') 
                ? "bg-white/5 border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5" 
                : "bg-slate-900/50 border-white/5 hover:border-blue-500/30"
            )}
          >
            <div className="relative z-10">
              <div className={cn(
                "w-16 h-16 rounded-[1.8rem] flex items-center justify-center mb-6 transition-all duration-500",
                initializedSpaces.includes('business') 
                  ? "bg-blue-500/10 text-blue-500 group-hover:scale-110 shadow-lg shadow-blue-500/20" 
                  : "bg-slate-800 text-slate-500"
              )}>
                <Building2 size={32} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Espaço Empresarial</h3>
                  {initializedSpaces.includes('business') ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">Ativo</span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-500 text-[8px] font-black uppercase tracking-widest border border-white/5">Inativo</span>
                  )}
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                  Gestão profissional com CNPJ, fluxos de caixa e relatórios de negócio.
                </p>
              </div>

              <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                {initializedSpaces.includes('business') ? 'Entrar Agora' : 'Ativar Perfil'}
                <ArrowRight size={14} />
              </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute bottom-[-20px] right-[-20px] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
               <Building2 size={150} className="text-white" />
            </div>
          </motion.button>
        </div>

        {/* Footer info */}
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.5 }}
           className="mt-12 flex flex-wrap justify-center gap-8"
        >
          <div className="flex items-center gap-3 text-slate-500">
            <ShieldCheck size={18} className="text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">Segurança Bancária</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500">
            <Rocket size={18} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest">Acesso Instantâneo</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500">
            <Gem size={18} className="text-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">Conta Premium Ativa</span>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.6 }}
           className="mt-8"
        >
          <button
            onClick={signOut}
            className="group flex items-center gap-3 px-5 py-2.5 bg-white/5 hover:bg-destructive/10 border border-white/10 hover:border-destructive/20 rounded-xl transition-all duration-300"
          >
            <div className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center transition-transform group-hover:rotate-12">
              <LogOut size={16} />
            </div>
            <div className="text-left">
              <p className="text-[9px] font-black uppercase tracking-widest text-destructive leading-none mb-1">Encerrar Sessão</p>
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">Sair da conta</p>
            </div>
          </button>
        </motion.div>
      </div>

      {activationModal.isOpen && activationModal.space && (
        <SpaceActivationModal 
          isOpen={activationModal.isOpen}
          spaceType={activationModal.space}
          onClose={() => setActivationModal({ isOpen: false, space: null })}
          onConfirm={() => {
            if (activationModal.space) onSelect(activationModal.space);
            setActivationModal({ isOpen: false, space: null });
          }}
        />
      )}
    </div>
  );
};
