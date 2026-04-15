import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModal } from '../contexts/ModalContext';
import { User, Phone, Building2, Check, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn, formatCNPJ, validateCNPJ } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useFinance } from '../FinanceContext';

interface ProfileSetupModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({ isOpen, onComplete }) => {
  const { user } = useAuth();
  const { setActiveSpace, seedCategories } = useFinance();
  const { showAlert } = useModal();
  const [step, setStep] = useState<'info' | 'space'>('info');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [space, setSpace] = useState<'personal' | 'business'>('personal');
  const [cnpj, setCnpj] = useState('');
  const [seedOption, setSeedOption] = useState<'yes' | 'no'>('yes');
  const [isSaving, setIsSaving] = useState(false);

  // Auto-fill if metadata exists
  useEffect(() => {
    if (user?.user_metadata) {
      if (user.user_metadata.full_name) setName(user.user_metadata.full_name);
      if (user.user_metadata.phone) setPhone(user.user_metadata.phone);
      if (user.user_metadata.gender) setGender(user.user_metadata.gender);
      if (user.user_metadata.business_cnpj) setCnpj(user.user_metadata.business_cnpj);
    }
  }, [user, isOpen]);

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '');
    if (digits.length <= 11) {
      return digits
        .replace(/^(\d{2})(\d)/g, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
    }
    return val;
  };

  const handleSave = async () => {
    if (!name || !phone) {
      showAlert('Campos Obrigatórios', 'Por favor, preencha seu nome e telefone para continuar.', 'warning');
      return;
    }

    if (step === 'info') {
      setStep('space');
      return;
    }

    if (space === 'business' && cnpj && !validateCNPJ(cnpj)) {
      showAlert('CNPJ Inválido', 'O CNPJ informado não é válido. Por favor, verifique ou deixe em branco.', 'warning');
      return;
    }

     setIsSaving(true);
     try {
       // 1. Semear categorias se pessoal e solicitado
       if (space === 'personal' && seedOption === 'yes') {
         await seedCategories('personal');
       }

       const spaceNameKey = space === 'personal' ? 'personal_name' : 'business_name';
       
       const { error } = await supabase.auth.updateUser({
         data: {
           full_name: name,
           [spaceNameKey]: name,
           phone: phone,
           gender: gender,
           primary_space: space,
           business_cnpj: space === 'business' ? cnpj : user?.user_metadata?.business_cnpj,
           initialized_spaces: [space],
           setup_completed: true,
           last_update: new Date().toISOString()
         }
       });

       if (error) throw error;
       setActiveSpace(space);
       onComplete();
     } catch (err: any) {
       showAlert('Erro ao Salvar', 'Não foi possível salvar seu perfil: ' + err.message, 'danger');
     } finally {
       setIsSaving(false);
     }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-md bg-card border border-border/50 rounded-[3rem] shadow-2xl overflow-hidden p-8"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
            <User className="text-primary" size={32} />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">Configurar seu Perfil</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase opacity-60 tracking-widest mt-2">Personalize sua experiência no Solum</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'info' ? (
            <motion.div 
              key="info"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Como devemos te chamar?</label>
                <div className="relative">
                  <User className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input 
                    type="text" 
                    placeholder="Seu Nome Completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-14 pr-8 py-5 bg-muted/30 border border-border/50 rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Telefone de Contato</label>
                  <div className="relative">
                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input 
                      type="text" 
                      placeholder="(00) 00000-0000"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      className="w-full pl-14 pr-8 py-5 bg-muted/30 border border-border/50 rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Gênero</label>
                  <div className="flex gap-4 p-1 bg-muted/30 rounded-[2rem] border border-border/50">
                    <button
                      type="button"
                      onClick={() => setGender('male')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all",
                        gender === 'male' ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      Masculino
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('female')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all",
                        gender === 'female' ? "bg-pink-500 text-white shadow-lg shadow-pink-500/20" : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      Feminino
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="space"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              className="space-y-6"
            >
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4 text-center block w-full">Escolha seu Espaço de Trabalho</label>
              
              <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={() => setSpace('personal')}
                  className={cn(
                    "relative p-6 rounded-[2.5rem] border-2 transition-all flex items-center gap-4 text-left",
                    space === 'personal' ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"
                  )}
                >
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", space === 'personal' ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                    <User size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black uppercase tracking-widest">Espaço Pessoal</p>
                    <p className="text-[10px] text-muted-foreground font-bold leading-tight">Gestão individual de suas contas, gastos e cartões ativos.</p>
                  </div>
                  {space === 'personal' && <Check className="text-primary" size={20} />}
                </button>

                <button 
                  onClick={() => setSpace('business')}
                  className={cn(
                    "relative p-6 rounded-[2.5rem] border-2 transition-all flex items-center gap-4 text-left",
                    space === 'business' ? "border-primary bg-primary/5 shadow-lg shadow-primary/5 scale-[1.01]" : "border-border/50 hover:border-primary/30"
                  )}
                >
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", space === 'business' ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                    <Building2 size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black uppercase tracking-widest">Espaço Empresarial</p>
                    <p className="text-[10px] text-muted-foreground font-bold leading-tight">Gestão completa do seu negócio com categorias 100% personalizáveis.</p>
                  </div>
                  {space === 'business' && <Check className="text-primary" size={20} />}
                </button>
              </div>

              {/* Opção de Categorias para Pessoal */}
              <AnimatePresence>
                {space === 'personal' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4 block text-center">
                        Deseja categorias pré-preenchidas?
                      </label>
                      <div className="flex gap-3 p-1 bg-muted/30 rounded-2xl border border-border/50">
                        <button
                          type="button"
                          onClick={() => setSeedOption('yes')}
                          className={cn(
                            "flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            seedOption === 'yes' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-muted"
                          )}
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => setSeedOption('no')}
                          className={cn(
                            "flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            seedOption === 'no' ? "bg-rose-500 text-white shadow-lg shadow-rose-500/10" : "text-muted-foreground hover:bg-muted"
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
                            <div className="flex flex-wrap justify-center gap-1.5 p-3 bg-muted/40 rounded-2xl border border-border/30 mt-2">
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
                  </motion.div>
                )}

                {space === 'business' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4 block text-center">
                        Identificação da Empresa (Opcional)
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input 
                          type="text" 
                          placeholder="00.000.000/0000-00"
                          value={cnpj}
                          onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                          className="w-full pl-14 pr-8 py-5 bg-muted/30 border border-border/50 rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full mt-10 py-6 bg-primary text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isSaving ? 'Salvando...' : (step === 'info' ? 'Avançar' : 'Confirmar e Iniciar')}
          <ArrowRight size={16} />
        </button>
      </motion.div>
    </div>
  );
};
