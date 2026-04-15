import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Wallet as WalletIcon, Building2, PiggyBank, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModal } from '../contexts/ModalContext';
import { useFinance } from '../FinanceContext';
import { Wallet } from '../types';
import { cn } from '../lib/utils';
import { CustomSelect } from './ui/CustomSelect';
import { IconRenderer } from './ui/IconRenderer';

interface WalletModalProps {
  type: 'bank' | 'credit_card';
  editingWallet?: Wallet | null;
}

const INSTITUTIONS = [
  { name: 'BMG', logo: '/bancos/BMG.jpg' },
  { name: 'BRB', logo: '/bancos/BRB.png' },
  { name: 'BTG', logo: '/bancos/BTG.png' },
  { name: 'BV', logo: '/bancos/BV.webp' },
  { name: 'Banco do Brasil', logo: '/bancos/Banco do Brasil.jpg' },
  { name: 'Bradesco', logo: '/bancos/Bradesco.png' },
  { name: 'C6 Bank', logo: '/bancos/C6 Bank.jpg' },
  { name: 'Caixa', logo: '/bancos/Caixa.png' },
  { name: 'HSBC', logo: '/bancos/HSBC.jpg' },
  { name: 'InfinitePay', logo: '/bancos/InfinitePay.webp' },
  { name: 'Inter', logo: '/bancos/Inter.jpg' },
  { name: 'Itaú', logo: '/bancos/Itaú.png' },
  { name: 'Mercado Pago', logo: '/bancos/Mercado Pago.jpg' },
  { name: 'Neon', logo: '/bancos/Neon.jpg' },
  { name: 'Next', logo: '/bancos/Next.png' },
  { name: 'Nubank', logo: '/bancos/Nubank.jpg' },
  { name: 'PagBank', logo: '/bancos/PagBank.png' },
  { name: 'Pan', logo: '/bancos/Pan.jpg' },
  { name: 'PicPay', logo: '/bancos/PicPay.png' },
  { name: 'Poupex', logo: '/bancos/Poupex.png' },
  { name: 'Recarga Pay', logo: '/bancos/Recarga Pay.jpeg' },
  { name: 'Safra', logo: '/bancos/Safra.png' },
  { name: 'Santander', logo: '/bancos/Santander.png' },
  { name: 'Sicoob', logo: '/bancos/Sicoob.png' },
  { name: 'Sicred', logo: '/bancos/Sicred.jpg' },
  { name: 'Sofisa', logo: '/bancos/Sofisa.png' },
  { name: 'Stone', logo: '/bancos/Stone.png' },
  { name: 'Sumup', logo: '/bancos/Sumup.png' },
  { name: 'Wise', logo: '/bancos/Wise.png' },
];

const GENERIC_ICONS = [
  { id: 'wallet', name: 'Carteira', icon: WalletIcon },
  { id: 'bank', name: 'Banco', icon: Building2 },
  { id: 'piggy', name: 'Cofrinho', icon: PiggyBank },
];

const COLORS = [
  '#fbbf24', '#820ad1', '#10b981', '#3b82f6', '#f43f5e', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#1a1a1a', 
  '#ef4444', '#f97316', '#eab308', '#84cc16', '#06b6d4', '#4f46e5', '#a855f7', '#d946ef', '#64748b', '#475569', '#334155'
];

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, type, editingWallet }) => {
  const { addWallet, updateWallet, wallets } = useFinance();
  const { showAlert } = useModal();
  const [step, setStep] = React.useState<'selection' | 'details'>('selection');
  const [selectionType, setSelectionType] = React.useState<'institution' | 'generic'>('institution');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedInst, setSelectedInst] = React.useState<typeof INSTITUTIONS[0] | null>(null);
  const [selectedIcon, setSelectedIcon] = React.useState<typeof GENERIC_ICONS[0] | null>(null);
  const [selectedIconColor, setSelectedIconColor] = React.useState(COLORS[0]);
  const [selectedCardColor, setSelectedCardColor] = React.useState(COLORS[0]);
  const [isSaving, setIsSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<string[]>([]);
  const colorPickerId = React.useId();
  
  // Função para formatar o valor como moeda (0,00) conforme o usuário digita
  const formatBalance = (val: string) => {
    // Remove tudo que não for dígito
    const digits = val.replace(/\D/g, '');
    if (!digits) return '0,00';
    
    // Converte para número e divide por 100 para pegar as casas decimais
    const amount = parseInt(digits) / 100;
    
    // Formata no padrão brasileiro (vírgula como decimal)
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };
  const [formData, setFormData] = React.useState({
    name: '',
    balance: '',
    limit: '',
    closingDay: '',
    dueDay: '',
    defaultPaymentWalletId: '',
    walletCategory: 'checking' as 'checking' | 'savings' | 'wishlist',
    observation: ''
  });
  const [cardStyleType, setCardStyleType] = React.useState<'black' | 'platinum' | 'custom'>('custom');
  const [customCardLevel, setCustomCardLevel] = React.useState('');

  React.useEffect(() => {
    if (isOpen && editingWallet) {
      setStep('details');
      setFormData({
        name: editingWallet.name,
        balance: formatBalance(((editingWallet.initialBalance ?? editingWallet.balance) * 100).toFixed(0)),
        limit: editingWallet.limit ? formatBalance((editingWallet.limit * 100).toFixed(0)) : '',
        closingDay: editingWallet.closingDay?.toString() || '',
        dueDay: editingWallet.dueDay?.toString() || '',
        defaultPaymentWalletId: editingWallet.defaultPaymentWalletId || '',
        walletCategory: editingWallet.walletCategory || 'checking',
        observation: editingWallet.observation || ''
      });
      setSelectedIconColor(editingWallet.color);
      setSelectedCardColor(editingWallet.cardColor || editingWallet.color);
      
      if (editingWallet.logoUrl) {
        setSelectionType('institution');
        const inst = INSTITUTIONS.find(i => i.logo === editingWallet.logoUrl);
        setSelectedInst(inst || null);
      } else if (editingWallet.icon) {
        setSelectionType('generic');
        const icon = GENERIC_ICONS.find(i => i.id === editingWallet.icon);
        setSelectedIcon(icon || null);
      }

      if (editingWallet.cardLevel === 'BLACK') setCardStyleType('black');
      else if (editingWallet.cardLevel === 'PLATINUM') setCardStyleType('platinum');
      else {
        setCardStyleType('custom');
        setCustomCardLevel(editingWallet.cardLevel || '');
      }
    } else if (isOpen) {
      resetForm();
    }
  }, [isOpen, editingWallet]);

  const resetForm = () => {
    setStep('selection');
    setSelectionType('institution');
    setSearchTerm('');
    setSelectedInst(null);
    setSelectedIcon(null);
    setSelectedIconColor(COLORS[0]);
    setSelectedCardColor(COLORS[0]);
    setFormData({
      name: '',
      balance: '',
      limit: '',
      closingDay: '',
      dueDay: '',
      defaultPaymentWalletId: '',
      walletCategory: 'checking',
      observation: ''
    });
    setCardStyleType('custom');
    setCustomCardLevel('');
  };

  React.useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const filteredInstitutions = INSTITUTIONS.filter(inst => 
    inst.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async () => {
    const newErrors: string[] = [];
    
    if (!formData.name) newErrors.push('name');
    
    if (type === 'credit_card') {
      const rawLimit = formData.limit.replace(/\D/g, '');
      if (!rawLimit || parseInt(rawLimit) === 0) newErrors.push('limit');
      
      const cDay = parseInt(formData.closingDay);
      if (!formData.closingDay || isNaN(cDay) || cDay < 1 || cDay > 31) newErrors.push('closingDay');
      
      const dDay = parseInt(formData.dueDay);
      if (!formData.dueDay || isNaN(dDay) || dDay < 1 || dDay > 31) newErrors.push('dueDay');

      if (!formData.defaultPaymentWalletId) newErrors.push('defaultPaymentWalletId');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      showAlert('Campos Pendentes', 'Por favor, preencha todos os campos obrigatórios para salvar.', 'warning');
      return;
    }

    setErrors([]);
    setIsSaving(true);

    try {
      // Converter o valor formatado (ex: "1.234,56") de volta para número puro
      const rawValue = formData.balance.replace(/\./g, '').replace(',', '.');
      const numericBalance = parseFloat(rawValue) || 0;

      // Converter limit também se for cartão
      const rawLimit = formData.limit.replace(/\./g, '').replace(',', '.');
      const numericLimit = parseFloat(rawLimit) || 0;

      const walletData: any = {
        name: formData.name || (selectedInst?.name || selectedIcon?.name || ''),
        type: type,
        initialBalance: numericBalance,
        balance: numericBalance, // Inicia igual ao inicial, será reconciliado
        color: selectedIconColor,
        cardColor: type === 'credit_card' ? selectedCardColor : undefined,
        logoUrl: selectedInst?.logo,
        icon: selectedIcon?.id as any,
        limit: type === 'credit_card' ? numericLimit : undefined,
        closingDay: type === 'credit_card' ? parseInt(formData.closingDay) : undefined,
        dueDay: type === 'credit_card' ? parseInt(formData.dueDay) : undefined,
        cardLevel: type === 'credit_card' 
          ? (cardStyleType === 'black' ? 'BLACK' : cardStyleType === 'platinum' ? 'PLATINUM' : customCardLevel.toUpperCase())
          : undefined,
        defaultPaymentWalletId: type === 'credit_card' ? formData.defaultPaymentWalletId : undefined,
        walletCategory: type === 'bank' ? formData.walletCategory : undefined,
        observation: formData.observation || '',
        isActive: editingWallet ? editingWallet.isActive : true
      };

      if (editingWallet) {
        await updateWallet(editingWallet.id, { ...walletData, id: editingWallet.id });
      } else {
        await addWallet(walletData);
      }
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar carteira:', error);
      showAlert('Erro ao Salvar', 'Ocorreu um erro ao salvar: ' + (error.message || 'Erro desconhecido'), 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative bg-card w-full max-w-2xl max-h-[90vh] rounded-[2.5rem] shadow-2xl border border-border/50 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-8 border-b border-border/40 flex items-center justify-between shrink-0 bg-muted/10">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight">
              {step === 'selection' ? 'Selecione a Instituição' : 'Configurações Finais'}
            </h2>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-60">
              {editingWallet ? 'EDITAR CONTA / CARTÃO' : (type === 'bank' ? 'NOVA CONTA / CARTEIRA' : 'NOVO CARTÃO DE CRÉDITO')}
            </p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-muted rounded-2xl transition-all">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {step === 'selection' ? (
            <>
              {/* Toggle Selection Type */}
              <div className="flex p-1.5 bg-muted/50 rounded-2xl border border-border/40 shrink-0">
                <button 
                  onClick={() => setSelectionType('institution')}
                  className={cn(
                    "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                    selectionType === 'institution' ? "bg-card text-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Instituições Financeiras
                </button>
                <button 
                  onClick={() => setSelectionType('generic')}
                  className={cn(
                    "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                    selectionType === 'generic' ? "bg-card text-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Ícones Genéricos
                </button>
              </div>

              {selectionType === 'institution' ? (
                <div className="space-y-6">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground opacity-50" size={18} />
                    <input 
                      type="text" 
                      placeholder="BUSCAR BANCO..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-11 pr-4 py-4 bg-muted/10 border border-border/40 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {filteredInstitutions.map((inst) => (
                      <button
                        key={inst.name}
                        onClick={() => { 
                          setSelectedInst(inst); 
                          setSelectedIcon(null); 
                          setFormData(prev => ({ ...prev, name: inst.name.toUpperCase() }));
                          setStep('details'); 
                        }}
                        className="group flex flex-col items-center gap-3 p-4 rounded-[2rem] hover:bg-muted/50 transition-all border border-transparent hover:border-border/40"
                      >
                        <div className="w-16 h-16 rounded-full bg-white overflow-hidden shadow-sm group-hover:scale-105 transition-transform flex items-center justify-center p-0">
                          <img src={inst.logo} alt={inst.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-tighter text-center leading-tight truncate w-full">{inst.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-12 py-4">
                  <div className="flex justify-center gap-12">
                    {GENERIC_ICONS.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedIcon(item)}
                        className={cn(
                          "group flex flex-col items-center gap-4 transition-all",
                          selectedIcon?.id === item.id ? "scale-110" : "opacity-50 hover:opacity-100"
                        )}
                      >
                        <div 
                          className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all border-4"
                          style={{ 
                            backgroundColor: selectedIcon?.id === item.id ? selectedIconColor : 'rgba(255,255,255,0.05)',
                            borderColor: selectedIcon?.id === item.id ? 'rgba(255,255,255,0.2)' : 'transparent'
                          }}
                        >
                          <item.icon size={40} className={cn(selectedIcon?.id === item.id ? "text-white" : "text-muted-foreground")} />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest">{item.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-center block mb-4">Escolha a Cor</span>
                    <div className="flex flex-wrap justify-center gap-3 px-8">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedIconColor(color)}
                          className={cn(
                            "w-10 h-10 rounded-full transition-all relative group",
                            selectedIconColor === color ? "scale-125 z-10" : "hover:scale-110"
                          )}
                          style={{ backgroundColor: color }}
                        >
                           {selectedIconColor === color && (
                             <motion.div 
                               layoutId="activeColor"
                               className="absolute -inset-1.5 rounded-full border-4 border-white shadow-lg" 
                             />
                           )}
                        </button>
                      ))}
                      <div className="relative">
                        <label
                          htmlFor={colorPickerId}
                          className={cn(
                            "w-10 h-10 rounded-full transition-all overflow-hidden flex items-center justify-center cursor-pointer relative",
                            !COLORS.includes(selectedIconColor) ? "scale-125 z-10" : "hover:scale-110"
                          )}
                          style={{ 
                            background: 'conic-gradient(from 0deg, #ff0000, #ff7300, #fffb00, #48ff00, #00ffd5, #002bff, #7a00ff, #ff00c8, #ff0000)' 
                          }}
                        >
                          <div className={cn(
                            "w-4 h-4 rounded-full bg-white/20 backdrop-blur-md border border-white/40",
                            !COLORS.includes(selectedIconColor) ? "bg-white/40 scale-110" : ""
                          )} />

                          {!COLORS.includes(selectedIconColor) && (
                             <motion.div 
                               layoutId="activeColor"
                               className="absolute -inset-1.5 rounded-full border-4 border-white shadow-lg" 
                             />
                           )}
                        </label>
                        <input 
                          id={colorPickerId}
                          type="color"
                          value={selectedIconColor}
                          onChange={(e) => setSelectedIconColor(e.target.value)}
                          className="sr-only"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={!selectedIcon}
                    onClick={() => { 
                      setSelectedInst(null); 
                      // Não preencher nome para ícone genérico automaticamente para forçar o usuário a preencher algo personalizado, 
                      // mas garantir que vamos para os detalhes
                      setStep('details'); 
                    }}
                    className="w-full py-6 bg-foreground text-background rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-30 disabled:pointer-events-none"
                  >
                    Continuar
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-8 py-2">
              <div className="flex items-center gap-8 p-8 bg-muted/10 rounded-[2.5rem] border border-border/40">
                <IconRenderer 
                  icon={selectedInst?.logo || selectedIcon?.id || 'wallet'} 
                  color={selectedIconColor} 
                  size={80} 
                  className="shadow-xl" 
                />
                <div>
                   <h3 className="text-2xl font-black uppercase tracking-tight">{selectedInst?.name || selectedIcon?.name}</h3>
                   <span className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">{type === 'bank' ? 'Carteira Selecionada' : 'Cartão Selecionado'}</span>
                </div>
                <button 
                  onClick={() => setStep('selection')} 
                  className="ml-auto px-4 py-2 hover:bg-muted rounded-xl transition-all text-primary font-black text-[10px] uppercase tracking-widest bg-primary/10 border border-primary/20"
                >
                  Alterar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">Nome exibido</label>
                  <input 
                    type="text" 
                    placeholder="EX: INTER PESSOAL"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, name: e.target.value.toUpperCase() }));
                      if (e.target.value && errors.includes('name')) {
                        setErrors(prev => prev.filter(err => err !== 'name'));
                      }
                    }}
                    className={cn(
                      "w-full px-8 py-5 bg-muted/10 border rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:opacity-20",
                      errors.includes('name') ? "border-rose-500 bg-rose-500/5 ring-4 ring-rose-500/10" : "border-border/40"
                    )}
                  />
                </div>

                {type === 'bank' && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4 italic">Classificação da Conta</label>
                    <CustomSelect 
                      options={[
                        { id: 'checking', name: 'CONTA CORRENTE' },
                        { id: 'savings', name: 'COFRINHOS' },
                        { id: 'wishlist', name: 'LISTA DE DESEJOS' }
                      ]}
                      value={formData.walletCategory}
                      onChange={(val) => setFormData(prev => ({ ...prev, walletCategory: val as any }))}
                      placeholder="SELECIONE A CATEGORIA..."
                      className="h-[60px] px-6"
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4 italic">Observação (Opcional)</label>
                  <textarea 
                    className="w-full h-20 bg-background border border-border/40 rounded-[1.5rem] px-6 py-4 text-xs font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:opacity-20 resize-none"
                    placeholder="Detalhe o porquê você usa esta carteira..."
                    value={formData.observation}
                    onChange={(e) => setFormData(prev => ({ ...prev, observation: e.target.value }))}
                  />
                </div>

                {type === 'bank' && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">Saldo Inicial</label>
                    <div className="relative">
                      <span className="absolute left-8 top-1/2 -translate-y-1/2 font-black text-muted-foreground opacity-40">R$</span>
                      <input 
                        type="text" 
                        placeholder="0,00"
                        value={formData.balance}
                        onChange={(e) => setFormData(prev => ({ ...prev, balance: formatBalance(e.target.value) }))}
                        className="w-full pl-16 pr-8 py-5 bg-muted/10 border border-border/40 rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:opacity-20"
                      />
                    </div>
                  </div>
                )}
              </div>

              {type === 'credit_card' && (
                <div className="space-y-8 pt-4">
                  {/* Seletor de Estilo do Cartão */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">Estilo do Cartão</label>
                    <div className="flex gap-4">
                      {[
                        { id: 'black', label: 'BLACK', color: '#1a1a1a' },
                        { id: 'platinum', label: 'PLATINUM', color: '#94a3b8' },
                        { id: 'custom', label: 'OUTRO', color: 'bg-primary/10' }
                      ].map(style => (
                        <button
                          key={style.id}
                          onClick={() => {
                            setCardStyleType(style.id as any);
                            if (style.id === 'black') setSelectedCardColor('#1a1a1a');
                            if (style.id === 'platinum') setSelectedCardColor('#94a3b8');
                          }}
                          className={cn(
                            "flex-1 py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1",
                            cardStyleType === style.id 
                              ? "border-primary bg-primary/5 shadow-md" 
                              : "border-border/40 hover:border-primary/20"
                          )}
                        >
                          <div 
                            className={cn("w-6 h-4 rounded-[2px] transition-colors shadow-sm")} 
                            style={{ backgroundColor: style.id === 'custom' ? selectedCardColor : style.color }} 
                          />
                          <span className="text-[9px] font-black uppercase tracking-widest">{style.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {cardStyleType === 'custom' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-8"
                    >
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">Cor do Cartão</label>
                        <div className="flex flex-wrap gap-3">
                          {COLORS.map((color) => (
                            <button
                              key={color}
                              onClick={() => setSelectedCardColor(color)}
                              className={cn(
                                "w-8 h-8 rounded-full transition-all relative group",
                                selectedCardColor === color ? "scale-125 z-10" : "hover:scale-110"
                              )}
                              style={{ backgroundColor: color }}
                            >
                               {selectedCardColor === color && (
                                 <motion.div 
                                   layoutId="activeColorCredit"
                                   className="absolute -inset-1 rounded-full border-[3px] border-white shadow-md" 
                                 />
                               )}
                            </button>
                          ))}
                          <div className="relative">
                            <label
                              htmlFor={colorPickerId + "-credit"}
                              className={cn(
                                "w-8 h-8 rounded-full transition-all overflow-hidden flex items-center justify-center cursor-pointer relative",
                                !COLORS.includes(selectedCardColor) ? "scale-125 z-10" : "hover:scale-110"
                              )}
                              style={{ 
                                background: 'conic-gradient(from 0deg, #ff0000, #ff7300, #fffb00, #48ff00, #00ffd5, #002bff, #7a00ff, #ff00c8, #ff0000)' 
                              }}
                            >
                              <div className="w-3 h-3 rounded-full bg-white/20 border border-white/40" />
                              {!COLORS.includes(selectedCardColor) && (
                                 <motion.div 
                                   layoutId="activeColorCredit"
                                   className="absolute -inset-1 rounded-full border-[3px] border-white shadow-md" 
                                 />
                               )}
                            </label>
                            <input 
                              id={colorPickerId + "-credit"}
                              type="color"
                              value={selectedCardColor}
                              onChange={(e) => setSelectedCardColor(e.target.value)}
                              className="sr-only"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">Tipo (Ex: GOLD, INFINITE)</label>
                        <input 
                          type="text" 
                          placeholder="EX: GOLD"
                          value={customCardLevel}
                          onChange={(e) => setCustomCardLevel(e.target.value.toUpperCase())}
                          className="w-full px-6 py-4 bg-muted/10 border border-border/40 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        />
                      </div>
                    </motion.div>
                  )}

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">Limite Total do Cartão</label>
                    <div className="relative">
                      <span className="absolute left-8 top-1/2 -translate-y-1/2 font-black text-muted-foreground opacity-40">R$</span>
                      <input 
                        type="text" 
                        placeholder="0,00"
                        value={formData.limit}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, limit: formatBalance(e.target.value) }));
                          if (e.target.value && errors.includes('limit')) {
                            setErrors(prev => prev.filter(err => err !== 'limit'));
                          }
                        }}
                        className={cn(
                          "w-full pl-16 pr-8 py-5 bg-muted/10 border rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:opacity-20",
                          errors.includes('limit') ? "border-rose-500 bg-rose-500/5 ring-4 ring-rose-500/10" : "border-border/40"
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">Dia do Fechamento</label>
                      <input 
                        type="number" 
                        placeholder="Ex: 5"
                        min="1" max="31"
                        value={formData.closingDay}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 31)) {
                            setFormData(prev => ({ ...prev, closingDay: val }));
                            if (val && errors.includes('closingDay')) {
                              setErrors(prev => prev.filter(err => err !== 'closingDay'));
                            }
                          }
                        }}
                        className={cn(
                          "w-full px-8 py-5 bg-muted/10 border rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all text-center",
                          errors.includes('closingDay') ? "border-rose-500 bg-rose-500/5 ring-4 ring-rose-500/10" : "border-border/40"
                        )}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">Dia do Vencimento</label>
                      <input 
                        type="number" 
                        placeholder="Ex: 12"
                        min="1" max="31"
                        value={formData.dueDay}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 31)) {
                            setFormData(prev => ({ ...prev, dueDay: val }));
                            if (val && errors.includes('dueDay')) {
                              setErrors(prev => prev.filter(err => err !== 'dueDay'));
                            }
                          }
                        }}
                        className={cn(
                          "w-full px-8 py-5 bg-muted/10 border rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all text-center",
                          errors.includes('dueDay') ? "border-rose-500 bg-rose-500/5 ring-4 ring-rose-500/10" : "border-border/40"
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4 italic">Conta para Pagamento da Fatura</label>
                    <CustomSelect 
                      options={wallets
                        .filter(w => w.type !== 'credit_card' && w.isActive !== false)
                        .map(w => ({ 
                          id: w.id, 
                          name: w.name,
                          icon: w.logoUrl || w.icon || 'wallet',
                          color: w.color
                        }))
                      }
                      value={formData.defaultPaymentWalletId}
                      onChange={(val) => {
                        setFormData(prev => ({ ...prev, defaultPaymentWalletId: val }));
                        if (val && errors.includes('defaultPaymentWalletId')) {
                          setErrors(prev => prev.filter(err => err !== 'defaultPaymentWalletId'));
                        }
                      }}
                      placeholder="SELECIONE A CONTA..."
                      className={cn(
                        "h-[60px] px-6",
                        errors.includes('defaultPaymentWalletId') ? "border-rose-500 ring-4 ring-rose-500/10" : ""
                      )}
                    />
                    <p className="text-[9px] text-muted-foreground ml-4 opacity-50">* Esta conta será utilizada para debitar o valor quando você pagar a fatura.</p>
                  </div>
                </div>
              )}

              <div className="pt-8 flex gap-4">
                <button
                  onClick={() => setStep('selection')}
                  className="flex-1 py-6 bg-muted/30 text-foreground rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-muted/50 transition-all"
                >
                  Voltar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={cn(
                    "flex-[2] py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs transition-all shadow-[0_15px_40px_rgba(217,119,6,0.3)] flex items-center justify-center gap-3",
                    isSaving ? "bg-primary/70 text-white/50 cursor-not-allowed" : "bg-primary text-white hover:scale-[1.02] active:scale-95"
                  )}
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>{editingWallet ? 'Salvar Alterações' : 'Finalizar Cadastro'}</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
