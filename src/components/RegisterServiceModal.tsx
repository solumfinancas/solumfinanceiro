import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, 
  X, 
  Calendar, 
  DollarSign,
  Info,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import { formatCurrency, cn } from '../lib/utils';
import { addMonths, format } from 'date-fns';

interface RegisterServiceModalProps {
  isOpen: boolean;
  onClose: (reason?: 'success' | 'cancel') => void;
  clientId: string;
  spaceType: 'personal' | 'business';
  onSuccess?: () => void;
  // If editing an existing contract
  editingContractId?: string | null;
  initialData?: {
    type: 'Consultoria' | 'Mentoria' | 'Acompanhamento' | 'Uso do Aplicativo';
    name: string;
    totalValue: string;
    paymentMethod: 'vista' | 'parcelado';
    installments: string;
    firstPaymentDate: string;
  };
}

export const RegisterServiceModal: React.FC<RegisterServiceModalProps> = ({
  isOpen,
  onClose,
  clientId,
  spaceType,
  onSuccess,
  editingContractId,
  initialData
}) => {
  const { user } = useAuth();
  const { showAlert } = useModal();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [type, setType] = useState<'Consultoria' | 'Mentoria' | 'Acompanhamento' | 'Uso do Aplicativo'>('Consultoria');
  const [name, setName] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'vista' | 'parcelado'>('vista');
  const [installments, setInstallments] = useState('1');
  const [firstPaymentDate, setFirstPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setType(initialData.type);
        setName(initialData.name);
        const parsedInitialValue = parseFloat(initialData.totalValue);
        if (!isNaN(parsedInitialValue)) {
          setTotalValue(parsedInitialValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        } else {
          setTotalValue(initialData.totalValue);
        }
        setPaymentMethod(initialData.paymentMethod);
        setInstallments(initialData.installments);
        setFirstPaymentDate(initialData.firstPaymentDate);
      } else {
        resetForm();
      }
    }
  }, [isOpen, initialData]);

  const resetForm = () => {
    setType('Consultoria');
    setName('');
    setTotalValue('');
    setPaymentMethod('vista');
    setInstallments('1');
    setFirstPaymentDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const parseCurrency = (val: string) => {
    if (!val) return 0;
    const num = parseFloat(val.replace(/\./g, '').replace(',', '.'));
    return isNaN(num) ? 0 : num;
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let digits = e.target.value.replace(/\D/g, '');
    if (!digits) {
      setTotalValue('');
      return;
    }
    const value = parseInt(digits, 10) / 100;
    const formatted = value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    setTotalValue(formatted);
  };

  const handleSubmitService = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!totalValue || parseCurrency(totalValue) <= 0) {
      showAlert('Atenção', 'Informe um valor válido.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const value = parseCurrency(totalValue);
      const numInstallments = paymentMethod === 'vista' ? 1 : parseInt(installments);
      const monthlyAmount = value / numInstallments;
      const contractId = editingContractId || crypto.randomUUID();
      const startDate = new Date(firstPaymentDate + 'T12:00:00Z');

      // If editing, delete old installments first
      if (editingContractId) {
        const { error: deleteError } = await supabase
          .from('contracted_services')
          .delete()
          .eq('contract_id', editingContractId);
        
        if (deleteError) throw deleteError;
      }

      const records = [];
      for (let i = 0; i < numInstallments; i++) {
        const dueDate = addMonths(startDate, i);
        records.push({
          client_id: clientId,
          educator_id: user?.id,
          contract_id: contractId,
          type,
          name: name.trim() || null,
          amount: monthlyAmount,
          due_date: format(dueDate, 'yyyy-MM-dd'),
          status: 'pending',
          space_type: spaceType,
          installment_number: i + 1,
          total_installments: numInstallments
        });
      }

      const { error } = await supabase.from('contracted_services').insert(records);
      if (error) throw error;

      showAlert('Sucesso', editingContractId ? 'Serviço atualizado com sucesso.' : 'Serviço registrado com sucesso.', 'success');
      resetForm();
      onClose('success');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Erro ao salvar serviço:', err);
      showAlert('Erro', 'Falha ao salvar o serviço: ' + err.message, 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => onClose('cancel')} className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg bg-card border border-border rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-3xl rounded-full" />
        
        <div className="relative z-10 space-y-8">
          <div className="flex items-center justify-between">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Briefcase size={28} />
            </div>
            <button onClick={() => onClose('cancel')} className="text-muted-foreground hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>

          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">
              {editingContractId ? 'Editar Serviço' : 'Registrar Serviço'}
            </h2>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              {editingContractId ? 'Altere os dados do contrato atual.' : 'Defina o tipo e os valores do contrato.'}
            </p>
          </div>

          <form onSubmit={handleSubmitService} className="space-y-6">
            {/* Tipo de Serviço */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Tipo de Serviço</label>
              <div className="grid grid-cols-2 gap-3">
                {['Consultoria', 'Mentoria', 'Acompanhamento', 'Uso do Aplicativo'].map((t) => (
                  <button 
                    key={t}
                    type="button"
                    onClick={() => setType(t as any)}
                    className={cn(
                      "py-4 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all",
                      type === t ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-muted/20 border-border/50 text-muted-foreground hover:bg-muted/40"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Nome (Opcional) */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Nome do Projeto/Serviço (Opcional)</label>
              <div className="relative">
                <Info className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-14 pr-8 py-5 bg-muted/20 border border-border/50 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                  placeholder="Ex: Consultoria Financeira 2024"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Valor */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Valor Total</label>
                <div className="relative">
                  <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
                  <input 
                    type="text" 
                    value={totalValue}
                    onChange={handleValueChange}
                    className="w-full pl-14 pr-8 py-5 bg-muted/20 border border-border/50 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                    placeholder="0,00"
                    required
                  />
                </div>
              </div>

              {/* Data de Pagamento */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Data do {paymentMethod === 'vista' ? 'Pagamento' : '1º Pagamento'}</label>
                <div className="relative">
                  <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
                  <input 
                    type="date" 
                    value={firstPaymentDate}
                    onChange={(e) => setFirstPaymentDate(e.target.value)}
                    className="w-full pl-14 pr-8 py-5 bg-muted/20 border border-border/50 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Forma de Pagamento */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Forma de Pagamento</label>
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setPaymentMethod('vista')}
                  className={cn(
                    "flex-1 py-4 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all",
                    paymentMethod === 'vista' ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20" : "bg-muted/20 border-border/50 text-muted-foreground hover:bg-muted/40"
                  )}
                >
                  À Vista
                </button>
                <button 
                  type="button"
                  onClick={() => setPaymentMethod('parcelado')}
                  className={cn(
                    "flex-1 py-4 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all",
                    paymentMethod === 'parcelado' ? "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20" : "bg-muted/20 border-border/50 text-muted-foreground hover:bg-muted/40"
                  )}
                >
                  Parcelado
                </button>
              </div>
            </div>

            {paymentMethod === 'parcelado' && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Quantidade de Parcelas</label>
                <div className="relative">
                  <ChevronRight className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
                  <input 
                    type="number" 
                    min="2"
                    max="60"
                    value={installments}
                    onChange={(e) => setInstallments(e.target.value)}
                    className="w-full pl-14 pr-8 py-5 bg-muted/20 border border-border/50 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                  />
                </div>
                {totalValue && installments && parseInt(installments) > 0 && (
                  <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest ml-4">
                    Valor mensal: {formatCurrency(parseCurrency(totalValue) / parseInt(installments))}
                  </p>
                )}
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-5 bg-primary text-white rounded-[1.8rem] text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (editingContractId ? 'Atualizando...' : 'Registrando...') : (editingContractId ? 'Confirmar Alterações' : 'Confirmar Registro')}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
