import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Building2, Rocket, ArrowRight, X } from 'lucide-react';
import { cn, formatCNPJ, validateCNPJ } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useFinance } from '../FinanceContext';

interface SpaceActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  spaceType: 'personal' | 'business';
  onConfirm: () => void;
}

export const SpaceActivationModal: React.FC<SpaceActivationModalProps> = ({ 
  isOpen, 
  onClose, 
  spaceType,
  onConfirm 
}) => {
  const { user } = useAuth();
  const { seedCategories } = useFinance();
  const [isActivating, setIsActivating] = useState(false);
  const [cnpj, setCnpj] = useState('');
  const [seedOption, setSeedOption] = useState<'yes' | 'no'>(spaceType === 'personal' ? 'yes' : 'no');

  const handleActivate = async () => {
    if (!user) return;

    if (spaceType === 'business' && cnpj && !validateCNPJ(cnpj)) {
      alert('CNPJ Inválido. Por favor, verifique ou deixe em branco.');
      return;
    }

    setIsActivating(true);
    try {
      // 1. Semear categorias se solicitado
      if (seedOption === 'yes') {
        await seedCategories(spaceType);
      }

      // 2. Marcar espaço como inicializado no metadata do usuário
      const currentInitialized = user.user_metadata?.initialized_spaces || [];
      if (!currentInitialized.includes(spaceType)) {
        const { error } = await supabase.auth.updateUser({
          data: {
            ...user.user_metadata,
            initialized_spaces: [...currentInitialized, spaceType],
            business_cnpj: spaceType === 'business' ? cnpj : user.user_metadata?.business_cnpj,
            last_activation: new Date().toISOString()
          }
        });
        if (error) throw error;
      }
      onConfirm();
    } catch (err) {
      console.error('Erro ao ativar espaço:', err);
    } finally {
      setIsActivating(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  const isBusiness = spaceType === 'business';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-sm bg-card border border-border/50 rounded-[2.5rem] shadow-2xl overflow-hidden p-8"
        >
          <button 
            onClick={onClose}
            className="absolute right-6 top-6 p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground"
          >
            <X size={20} />
          </button>

          <div className="text-center mb-8">
            <div className={cn(
              "w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border-2 shadow-xl",
              isBusiness ? "bg-primary/10 border-primary/20 text-primary" : "bg-blue-500/10 border-blue-500/20 text-blue-500"
            )}>
              {isBusiness ? <Building2 size={40} /> : <User size={40} />}
            </div>
            
            <h2 className="text-xl font-black uppercase tracking-tighter leading-tight">
              Ativar Novo Espaço {isBusiness ? 'Empresarial' : 'Pessoal'}
            </h2>
            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 tracking-widest mt-2 px-4 leading-relaxed">
              {isBusiness 
                ? "Prepare-se para uma gestão profissional. Este espaço virá limpo para você configurar suas próprias categorias."
                : "Seu espaço pessoal pode vir pré-configurado para facilitar seu início rápido."}
            </p>
          </div>

          {!isBusiness && (
            <div className="mb-6 space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block text-center">
                Deseja categorias pré-preenchidas?
              </label>
              <div className="flex gap-3 p-1 bg-muted rounded-2xl border border-border/50">
                <button
                  type="button"
                  onClick={() => setSeedOption('yes')}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    seedOption === 'yes' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-card"
                  )}
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => setSeedOption('no')}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    seedOption === 'no' ? "bg-rose-500 text-white shadow-lg shadow-rose-500/10" : "text-muted-foreground hover:bg-card"
                  )}
                >
                  Não
                </button>
              </div>

              <AnimatePresence>
                {seedOption === 'yes' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, scale: 0.95 }}
                    animate={{ height: 'auto', opacity: 1, scale: 1 }}
                    exit={{ height: 0, opacity: 0, scale: 0.95 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-wrap justify-center gap-1.5 p-3 bg-muted/40 rounded-2xl border border-border/30 mt-1">
                      {[
                        { name: 'Salário', color: '#10b981' },
                        { name: 'Alimentação', color: '#f43f5e' },
                        { name: 'Moradia', color: '#3b82f6' },
                        { name: 'Saúde', color: '#ef4444' },
                        { name: 'Lazer', color: '#84cc16' },
                        { name: 'Mercado', color: '#10b981' }
                      ].map(cat => (
                        <span 
                          key={cat.name}
                          style={{ borderColor: cat.color + '40', color: cat.color }}
                          className="text-[7px] font-black uppercase tracking-tighter px-2 py-1 rounded-lg border bg-background/50"
                        >
                          {cat.name}
                        </span>
                      ))}
                      <span className="text-[7px] font-black uppercase tracking-tighter px-2 py-1 rounded-lg border border-border/50 text-muted-foreground bg-background/50">
                        +21 Categorias
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="space-y-3 mb-8">
             <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-2xl border border-border/50">
                <Rocket className="text-primary" size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground/80">
                   Configuração Instantânea
                </span>
             </div>
             {isBusiness && (
                <div className="flex items-center gap-3 p-3 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 text-emerald-600">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-widest">
                      Categorias 100% Manuais
                   </span>
                </div>
             )}
          </div>

          {isBusiness && (
            <div className="mb-6 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block text-center">
                CNPJ da Empresa (Opcional)
              </label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={16} />
                <input 
                  type="text" 
                  placeholder="00.000.000/0000-00"
                  value={cnpj}
                  onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                  className="w-full pl-12 pr-4 py-4 bg-muted border border-border/50 rounded-2xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
           )}

          <button 
            onClick={handleActivate}
            disabled={isActivating}
            className={cn(
               "w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 disabled:opacity-50",
               isBusiness ? "bg-primary text-white shadow-primary/20" : "bg-blue-500 text-white shadow-blue-500/20"
            )}
          >
            {isActivating ? 'Ativando...' : 'Ativar Agora'}
            <ArrowRight size={18} />
          </button>

          <button 
            onClick={onClose}
            className="w-full mt-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            Talvez depois
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
