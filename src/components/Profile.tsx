import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useModal } from '../contexts/ModalContext';
import { 
  User, 
  Phone, 
  Building2, 
  Check, 
  Save,
  ShieldCheck,
  Smartphone,
  CreditCard,
  MapPin,
  Bell,
  Palette,
  Briefcase,
  AlertTriangle,
  Info,
  Mail,
  Lock,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn, formatCNPJ, validateCNPJ } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useFinance } from '../FinanceContext';
import { SpaceActivationModal } from './SpaceActivationModal';
import { ChangePasswordModal } from './ChangePasswordModal';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const { activeSpace } = useFinance();
  const { showAlert } = useModal();
  
  // Estados separados por espaço
  const [personalName, setPersonalName] = useState('');
  const [personalPhone, setPersonalPhone] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  
  const [businessName, setBusinessName] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [cnpj, setCnpj] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  const [activationModal, setActivationModal] = useState<{ isOpen: boolean; space: 'personal' | 'business' | null }>({
    isOpen: false,
    space: null
  });

  useEffect(() => {
    if (user?.user_metadata) {
      // Carregar dados pessoais
      setPersonalName(user.user_metadata.personal_name || user.user_metadata.full_name || '');
      setPersonalPhone(user.user_metadata.personal_phone || user.user_metadata.phone || '');
      setGender(user.user_metadata.gender || 'male');
      
      // Carregar dados empresariais
      setBusinessName(user.user_metadata.business_name || '');
      setBusinessPhone(user.user_metadata.business_phone || '');
      setCnpj(user.user_metadata.business_cnpj || '');
    }
  }, [user]);

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

  // Cores dinâmicas baseadas no espaço e gênero
  const isBusiness = activeSpace === 'business';
  const accentColor = isBusiness 
    ? 'bg-black' 
    : (gender === 'female' ? 'bg-pink-500' : 'bg-blue-500');
  
  const accentText = isBusiness 
    ? 'text-black' 
    : (gender === 'female' ? 'text-pink-500' : 'text-blue-500');

  const accentShadow = isBusiness 
    ? 'shadow-black/20' 
    : (gender === 'female' ? 'shadow-pink-500/20' : 'shadow-blue-500/20');

  const handleSave = async () => {
    const name = isBusiness ? businessName : personalName;
    const phone = isBusiness ? businessPhone : personalPhone;

    if (!name || !phone) {
      showAlert('Campos Obrigatórios', 'Por favor, preencha nome e telefone para continuar.', 'warning');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const metadata = { ...user?.user_metadata };
      
      if (isBusiness) {
        if (cnpj && !validateCNPJ(cnpj)) {
          showAlert('CNPJ Inválido', 'O CNPJ informado não é válido.', 'warning');
          setIsSaving(false);
          return;
        }
        metadata.business_name = businessName;
        metadata.business_phone = businessPhone;
        metadata.business_cnpj = cnpj;
      } else {
        metadata.personal_name = personalName;
        metadata.personal_phone = personalPhone;
        metadata.full_name = personalName; // Nome principal da conta
        metadata.phone = personalPhone; // Legado
        metadata.gender = gender;
      }

      // Verificar se houve mudança real comparando com user_metadata atual
      const hasChanged = JSON.stringify(metadata) !== JSON.stringify(user?.user_metadata);

      if (!hasChanged) {
        showAlert('Informação', 'Nenhuma alteração foi detectada nas suas informações.', 'info');
        setIsSaving(false);
        return;
      }
      
      const { error } = await supabase.auth.updateUser({
        data: {
          ...metadata,
          last_update: new Date().toISOString()
        }
      });

      if (error) {
        if (error.message.includes('rate limit')) {
          throw new Error('Muitas solicitações seguidas. Por favor, aguarde 30 segundos e tente novamente.');
        }
        throw error;
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      showAlert('Erro ao Salvar', err.message, 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header Section */}
      <div className="relative bg-card rounded-[3rem] p-8 border border-border shadow-sm overflow-hidden min-h-[220px] flex flex-col justify-end">
        <div className={cn(
          "absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-20 transition-colors duration-700",
          accentColor
        )} />
        
        <div className="relative flex flex-col md:flex-row items-center gap-8">
          <div className={cn(
            "w-32 h-32 rounded-[2.5rem] flex items-center justify-center border-4 border-background shadow-2xl transition-all duration-500 relative group",
            accentColor,
            "text-white"
          )}>
            {isBusiness ? <Building2 size={64} className="group-hover:scale-110 transition-transform" /> : <User size={64} className="group-hover:scale-110 transition-transform" />}
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-8 h-8 rounded-full border-4 border-card flex items-center justify-center">
              <ShieldCheck size={14} className="text-white" />
            </div>
          </div>
          
          <div className="text-center md:text-left space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">
              {isBusiness ? 'Perfil Empresarial' : 'Meu Perfil Pessoal'}
            </p>
            <h1 className="text-4xl font-black tracking-tighter uppercase">
              {(isBusiness ? businessName : personalName) || 'Seu Nome'}
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
              <span className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase bg-muted/50 px-3 py-1.5 rounded-full border border-border/50">
                <Smartphone size={12} className={accentText} /> {(isBusiness ? businessPhone : personalPhone) || '(00) 00000-0000'}
              </span>
              <span className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase bg-muted/50 px-3 py-1.5 rounded-full border border-border/50">
                <ShieldCheck size={12} className="text-emerald-500" /> Verificado
              </span>
              {isBusiness && cnpj && (
                <span className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase bg-muted/50 px-3 py-1.5 rounded-full border border-border/50">
                  <Building2 size={12} className={accentText} /> CNPJ: {cnpj}
                </span>
              )}
            </div>
          </div>

          <div className="md:ml-auto">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className={cn(
                "px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50 shadow-lg",
                saveSuccess ? "bg-emerald-500 text-white shadow-emerald-500/20" : cn(accentColor, "text-white", accentShadow, "hover:scale-105")
              )}
            >
              {isSaving ? 'Salvando...' : saveSuccess ? (
                <><Check size={16} /> Salvo!</>
              ) : (
                <><Save size={16} /> Salvar Alterações</>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-[2.5rem] p-8 border border-border shadow-sm space-y-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 border-b border-border/50 pb-4">
              <Palette size={14} className={accentText} /> {isBusiness ? 'Identidade Empresarial' : 'Informações Pessoais'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email - Read Only */}
              <div className="col-span-1 md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">E-mail da Conta (Não alterável)</label>
                <div className="relative group/mail">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/30" size={18} />
                  <input 
                    type="text" 
                    value={user?.email || ''}
                    readOnly
                    className="w-full pl-14 pr-8 py-5 bg-muted/10 border border-border/30 rounded-[1.8rem] text-sm font-bold text-muted-foreground/50 cursor-not-allowed outline-none"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover/mail:opacity-100 transition-opacity">
                    <Lock size={14} className="text-muted-foreground/20" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">
                  {isBusiness ? 'Nome da Empresa' : 'Como devemos te chamar?'}
                </label>
                <div className="relative">
                  {isBusiness ? <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} /> : <User className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />}
                  <input 
                    type="text" 
                    value={isBusiness ? businessName : personalName}
                    onChange={(e) => isBusiness ? setBusinessName(e.target.value) : setPersonalName(e.target.value)}
                    className="w-full pl-14 pr-8 py-5 bg-muted/20 border border-border/50 rounded-[1.8rem] text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                    placeholder={isBusiness ? "Nome Empresarial" : "Seu nome"}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Telefone de Contato</label>
                <div className="relative">
                  <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
                  <input 
                    type="text" 
                    value={isBusiness ? businessPhone : personalPhone}
                    onChange={(e) => isBusiness ? setBusinessPhone(formatPhone(e.target.value)) : setPersonalPhone(formatPhone(e.target.value))}
                    className="w-full pl-14 pr-8 py-5 bg-muted/20 border border-border/50 rounded-[1.8rem] text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              {!isBusiness ? (
                <div className="col-span-1 md:col-span-2 space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Gênero</label>
                  <div className="flex gap-4 p-1 bg-muted/20 rounded-[2rem] border border-border/50">
                    <button
                      onClick={() => setGender('male')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.6rem] text-[10px] font-black uppercase tracking-widest transition-all",
                        gender === 'male' ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      Masculino
                    </button>
                    <button
                      onClick={() => setGender('female')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.6rem] text-[10px] font-black uppercase tracking-widest transition-all",
                        gender === 'female' ? "bg-pink-500 text-white shadow-lg shadow-pink-500/20" : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      Feminino
                    </button>
                  </div>
                </div>
              ) : (
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">CNPJ da Empresa (Opcional)</label>
                  <div className="relative">
                    <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
                    <input 
                      type="text" 
                      value={cnpj}
                      onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                      className="w-full pl-14 pr-8 py-5 bg-muted/20 border border-border/50 rounded-[1.8rem] text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <div className="flex items-start gap-2 ml-4 mt-2">
                    <Info size={12} className="text-muted-foreground mt-0.5" />
                    <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">
                      O CNPJ ajuda na organização das obrigações fiscais da sua empresa.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card rounded-[2.5rem] p-8 border border-border shadow-sm space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 border-b border-border/50 pb-4">
              <Briefcase size={14} className={accentText} /> Espaço de Trabalho
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 'personal', name: 'Espaço Pessoal', desc: 'Suas finanças individuais', icon: User },
                { id: 'business', name: 'Espaço Empresarial', desc: 'Sua gestão profissional', icon: Building2 }
              ].map((sp) => {
                const initializedSpaces = user?.user_metadata?.initialized_spaces || [];
                const isInitialized = initializedSpaces.includes(sp.id);

                return (
                  <div 
                    key={sp.id}
                    className={cn(
                      "p-6 rounded-[2rem] border-2 flex items-center gap-4 relative transition-all group",
                      isInitialized 
                        ? "border-primary/20 bg-primary/5 shadow-sm" 
                        : "border-border/30 bg-muted/20 cursor-pointer hover:border-amber-500/30 hover:bg-amber-500/5"
                    )}
                    onClick={() => {
                      if (!isInitialized) {
                        setActivationModal({ isOpen: true, space: sp.id as any });
                      }
                    }}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                      isInitialized 
                        ? "bg-primary text-white shadow-lg shadow-primary/20" 
                        : "bg-muted text-muted-foreground group-hover:bg-amber-500/10 group-hover:text-amber-600"
                    )}>
                      <sp.icon size={24} />
                    </div>
                    
                    <div className="flex-1">
                      <p className={cn(
                        "text-[11px] font-black uppercase tracking-wider",
                        !isInitialized && "text-muted-foreground/60"
                      )}>{sp.name}</p>
                      
                      <div className="flex items-center gap-1.5 mt-1">
                        {isInitialized ? (
                          <div className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-500 tracking-widest">
                            <Check size={10} strokeWidth={4} />
                            Ativo
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[9px] font-black uppercase text-amber-500 tracking-widest">
                            <AlertTriangle size={10} strokeWidth={4} />
                            Inativo
                          </div>
                        )}
                      </div>
                    </div>

                    {!isInitialized && (
                      <div className="absolute top-4 right-4 text-[8px] font-black uppercase tracking-widest text-amber-500/50 group-hover:text-amber-500">
                        Ativar
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Cards & Features */}
        <div className="space-y-6">
          <div className="bg-[#820ad1] text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
            <h4 className="text-xs font-black uppercase tracking-widest opacity-60 mb-2">Conta Premium</h4>
            <div className="text-3xl font-black tracking-tighter uppercase mb-4 leading-none">Nível Gold Personal</div>
            <p className="text-[10px] font-bold opacity-80 leading-relaxed uppercase">Você tem acesso a todos os recursos de inteligência e projeções mensais.</p>
            <button className="mt-8 w-full py-4 bg-white/20 hover:bg-white/30 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Ver Vantagens</button>
          </div>

          <div className="bg-card rounded-[2.5rem] p-8 border border-border shadow-sm space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Segurança & Senha</h3>
            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase leading-relaxed">Mantenha sua conta protegida alterando sua senha regularmente.</p>
            <button 
              onClick={() => setIsPasswordModalOpen(true)}
              className="w-full py-4 bg-muted/50 hover:bg-muted text-[10px] font-black uppercase tracking-widest rounded-2xl border border-border/50 transition-all flex items-center justify-center gap-2"
            >
              <Lock size={14} className="text-amber-500" /> Alterar Senha
            </button>
          </div>

          <div className="bg-card rounded-[2.5rem] p-8 border border-border shadow-sm space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Preferências</h3>
            <div className="space-y-2">
              {[
                { icon: MapPin, label: 'Moeda Local', value: 'BRL (R$)' },
                { icon: Bell, label: 'Notificações', value: 'Ativado' },
                { icon: CreditCard, label: 'Vencimentos', value: 'Alertar D-3' },
              ].map((pref, i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/30 rounded-[1.5rem] transition-all cursor-pointer border border-transparent hover:border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <pref.icon size={14} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{pref.label}</span>
                  </div>
                  <span className="text-[10px] font-black uppercase text-primary">{pref.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {activationModal.space && (
        <SpaceActivationModal 
          isOpen={activationModal.isOpen}
          onClose={() => setActivationModal({ ...activationModal, isOpen: false })}
          spaceType={activationModal.space}
          onConfirm={() => {
            // Recarregar os dados ou apenas fechar
          }}
        />
      )}

      <ChangePasswordModal 
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        userEmail={user?.email || ''}
      />
    </div>
  );
};
