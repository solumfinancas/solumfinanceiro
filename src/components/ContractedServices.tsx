import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  X, 
  Calendar, 
  DollarSign,
  Info,
  Receipt,
  AlertCircle,
  Edit2,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useFinance } from '../FinanceContext';
import { useModal } from '../contexts/ModalContext';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { addMonths, format } from 'date-fns';

interface ContractedService {
  id: string;
  client_id: string;
  educator_id: string;
  contract_id: string;
  type: 'Consultoria' | 'Mentoria' | 'Acompanhamento';
  name: string | null;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid';
  space_type: 'personal' | 'business';
  installment_number: number;
  total_installments: number;
  created_at: string;
}

export const ContractedServices: React.FC = () => {
  const { user, profile, viewingUserId } = useAuth();
  const { activeSpace } = useFinance();
  const { showAlert } = useModal();
  
  const [services, setServices] = useState<ContractedService[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [type, setType] = useState<'Consultoria' | 'Mentoria' | 'Acompanhamento'>('Consultoria');
  const [name, setName] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'vista' | 'parcelado'>('vista');
  const [installments, setInstallments] = useState('1');
  const [firstPaymentDate, setFirstPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // Edit Installment state
  const [editingInstallment, setEditingInstallment] = useState<ContractedService | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  
  // Edit Contract state
  const [editingContractId, setEditingContractId] = useState<string | null>(null);

  const isEducator = profile?.role === 'educator' || profile?.role === 'admin' || profile?.role === 'master_admin';
  const isImpersonating = !!viewingUserId;
  const targetId = viewingUserId || user?.id;

  const fetchServices = async () => {
    if (!targetId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contracted_services')
        .select('*')
        .eq('client_id', targetId)
        .eq('space_type', activeSpace)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar serviços:', err);
      showAlert('Erro', 'Não foi possível carregar os serviços contratados.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [targetId, activeSpace]);

  const handleSubmitService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isImpersonating || !isEducator) return;

    if (!totalValue || parseFloat(totalValue) <= 0) {
      showAlert('Atenção', 'Informe um valor válido.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const value = parseFloat(totalValue);
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
          client_id: targetId,
          educator_id: user?.id,
          contract_id: contractId,
          type,
          name: name.trim() || null,
          amount: monthlyAmount,
          due_date: format(dueDate, 'yyyy-MM-dd'),
          status: 'pending',
          space_type: activeSpace,
          installment_number: i + 1,
          total_installments: numInstallments
        });
      }

      const { error } = await supabase.from('contracted_services').insert(records);
      if (error) throw error;

      showAlert('Sucesso', editingContractId ? 'Serviço atualizado com sucesso.' : 'Serviço adicionado com sucesso.', 'success');
      setIsModalOpen(false);
      resetForm();
      fetchServices();
    } catch (err: any) {
      console.error('Erro ao salvar serviço:', err);
      showAlert('Erro', 'Falha ao salvar o serviço: ' + err.message, 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setType('Consultoria');
    setName('');
    setTotalValue('');
    setPaymentMethod('vista');
    setInstallments('1');
    setFirstPaymentDate(format(new Date(), 'yyyy-MM-dd'));
    setEditingContractId(null);
  };

  const toggleStatus = async (service: ContractedService) => {
    if (!isImpersonating || !isEducator) return;

    const newStatus = service.status === 'pending' ? 'paid' : 'pending';
    try {
      const { error } = await supabase
        .from('contracted_services')
        .update({ status: newStatus })
        .eq('id', service.id);

      if (error) throw error;
      
      setServices(services.map(s => s.id === service.id ? { ...s, status: newStatus } : s));
    } catch (err: any) {
      showAlert('Erro', 'Não foi possível atualizar o status.', 'danger');
    }
  };

  const handleDeleteContract = async (contractId: string) => {
    if (!isImpersonating || !isEducator) return;

    if (!window.confirm('Deseja excluir este contrato completo e todas as suas parcelas?')) return;

    try {
      const { error } = await supabase
        .from('contracted_services')
        .delete()
        .eq('contract_id', contractId);

      if (error) throw error;
      
      showAlert('Sucesso', 'Contrato removido com sucesso.', 'success');
      fetchServices();
    } catch (err: any) {
      showAlert('Erro', 'Não foi possível excluir o contrato.', 'danger');
    }
  };

  const handleDeleteInstallment = async (id: string) => {
    if (!isImpersonating || !isEducator) return;

    if (!window.confirm('Deseja excluir esta parcela individualmente?')) return;

    try {
      const { error } = await supabase
        .from('contracted_services')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      showAlert('Sucesso', 'Parcela removida com sucesso.', 'success');
      setServices(services.filter(s => s.id !== id));
    } catch (err: any) {
      showAlert('Erro', 'Não foi possível excluir a parcela.', 'danger');
    }
  };

  const handleUpdateInstallment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInstallment || !isImpersonating || !isEducator) return;

    try {
      const { error } = await supabase
        .from('contracted_services')
        .update({
          amount: parseFloat(editAmount),
          due_date: editDate
        })
        .eq('id', editingInstallment.id);

      if (error) throw error;

      showAlert('Sucesso', 'Parcela atualizada com sucesso.', 'success');
      setServices(services.map(s => s.id === editingInstallment.id ? { 
        ...s, 
        amount: parseFloat(editAmount), 
        due_date: editDate 
      } : s));
      setEditingInstallment(null);
    } catch (err: any) {
      showAlert('Erro', 'Não foi possível atualizar a parcela.', 'danger');
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isOverdue = (inst: ContractedService) => {
    if (inst.status === 'paid') return false;
    const dueDate = new Date(inst.due_date + 'T12:00:00Z');
    return dueDate < today;
  };

  const totalPaid = services.filter(s => s.status === 'paid').reduce((sum, s) => sum + s.amount, 0);
  const totalOverdue = services.filter(s => isOverdue(s)).reduce((sum, s) => sum + s.amount, 0);
  const totalToReceive = services.filter(s => s.status === 'pending').reduce((sum, s) => sum + s.amount, 0);

  // Agrupar por contrato para visualização
  const contracts = services.reduce((acc: any, service) => {
    if (!acc[service.contract_id]) {
      acc[service.contract_id] = {
        id: service.contract_id,
        type: service.type,
        name: service.name,
        installments: [],
        totalValue: 0
      };
    }
    acc[service.contract_id].installments.push(service);
    acc[service.contract_id].totalValue += service.amount;
    return acc;
  }, {});

  const contractList = Object.values(contracts).sort((a: any, b: any) => {
    const dateA = new Date(a.installments[0].due_date).getTime();
    const dateB = new Date(b.installments[0].due_date).getTime();
    return dateB - dateA;
  });

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-[2rem] p-6 border border-border shadow-sm flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Recebido</p>
            <p className="text-xl font-black tracking-tighter text-emerald-500">{formatCurrency(totalPaid)}</p>
          </div>
        </div>

        <div className="bg-card rounded-[2rem] p-6 border border-border shadow-sm flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">A Receber</p>
            <p className="text-xl font-black tracking-tighter text-primary">{formatCurrency(totalToReceive)}</p>
          </div>
        </div>

        <div className="bg-card rounded-[2rem] p-6 border border-border shadow-sm flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors" />
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Atrasado</p>
            <p className="text-xl font-black tracking-tighter text-rose-500">{formatCurrency(totalOverdue)}</p>
          </div>
        </div>
      </div>

      {/* Header & Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Briefcase size={14} className="text-primary" /> Serviços Contratados
        </h3>
        {isImpersonating && isEducator && (
          <button 
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={14} /> Adicionar Serviço
          </button>
        )}
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Carregando serviços...</p>
          </div>
        ) : contractList.length === 0 ? (
          <div className="py-20 bg-muted/20 border-2 border-dashed border-border/50 rounded-[2.5rem] text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground/30">
              <Briefcase size={32} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Nenhum serviço registrado</p>
              <p className="text-[10px] font-bold text-muted-foreground/50 uppercase">Os serviços contratados pelo cliente aparecerão aqui.</p>
            </div>
          </div>
        ) : (
          contractList.map((contract: any) => (
            <div key={contract.id} className="bg-card rounded-[2rem] border border-border overflow-hidden shadow-sm">
              <div className="p-6 bg-muted/20 flex items-center justify-between border-b border-border/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Receipt size={20} />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-wider">{contract.type} {contract.name && `- ${contract.name}`}</h4>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">Total: {formatCurrency(contract.totalValue)} • {contract.installments.length} {contract.installments.length > 1 ? 'parcelas' : 'parcela'}</p>
                  </div>
                </div>
                {isImpersonating && isEducator && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        const firstInst = contract.installments[0];
                        setType(contract.type);
                        setName(contract.name || '');
                        setTotalValue(contract.totalValue.toString());
                        setPaymentMethod(contract.installments.length > 1 ? 'parcelado' : 'vista');
                        setInstallments(contract.installments.length.toString());
                        setFirstPaymentDate(firstInst.due_date);
                        setEditingContractId(contract.id);
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Editar Contrato Completo"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteContract(contract.id)}
                      className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Excluir Contrato Completo"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              <div className="divide-y divide-border/50">
                {contract.installments.map((inst: ContractedService) => (
                  <div key={inst.id} className="p-4 px-6 flex items-center justify-between hover:bg-muted/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="text-[9px] font-black text-muted-foreground/40 w-8">
                        #{inst.installment_number}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
                        <Calendar size={12} className="opacity-40" />
                        {formatDate(inst.due_date)}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className={cn(
                        "text-[11px] font-black tracking-tight",
                        isOverdue(inst) && "text-rose-500"
                      )}>
                        {formatCurrency(inst.amount)}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isImpersonating && isEducator && (
                          <>
                            <button 
                              onClick={() => {
                                setEditingInstallment(inst);
                                setEditAmount(inst.amount.toString());
                                setEditDate(inst.due_date);
                              }}
                              className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              title="Editar Parcela"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeleteInstallment(inst.id)}
                              className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Excluir Parcela"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                        <button 
                          disabled={!isImpersonating || !isEducator}
                          onClick={() => toggleStatus(inst)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all",
                            inst.status === 'paid' 
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                              : isOverdue(inst)
                                ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                : "bg-amber-500/10 text-amber-500 border border-amber-500/20",
                            isImpersonating && isEducator && "hover:scale-105 active:scale-95"
                          )}
                        >
                          {inst.status === 'paid' ? (
                            <><CheckCircle2 size={10} strokeWidth={4} /> Pago</>
                          ) : isOverdue(inst) ? (
                            <><AlertCircle size={10} strokeWidth={4} /> Atrasado</>
                          ) : (
                            <><Clock size={10} strokeWidth={4} /> Pendente</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Add Service */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" />
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
                  <button onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }} className="text-muted-foreground hover:text-white transition-colors">
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
                    <div className="grid grid-cols-3 gap-3">
                      {['Consultoria', 'Mentoria', 'Acompanhamento'].map((t) => (
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
                          type="number" 
                          step="0.01"
                          value={totalValue}
                          onChange={(e) => setTotalValue(e.target.value)}
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
                          Valor mensal: {formatCurrency(parseFloat(totalValue) / parseInt(installments))}
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
        )}
      </AnimatePresence>
      {/* Modal Edit Installment */}
      <AnimatePresence>
        {editingInstallment && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingInstallment(null)} className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-card border border-border rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-3xl rounded-full" />
              
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black uppercase tracking-tighter">Editar Parcela</h2>
                  <button onClick={() => setEditingInstallment(null)} className="text-muted-foreground hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleUpdateInstallment} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Valor da Parcela</label>
                    <div className="relative">
                      <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
                      <input 
                        type="number" 
                        step="0.01"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="w-full pl-14 pr-8 py-5 bg-muted/20 border border-border/50 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Data de Vencimento</label>
                    <div className="relative">
                      <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
                      <input 
                        type="date" 
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-full pl-14 pr-8 py-5 bg-muted/20 border border-border/50 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-5 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Salvar Alterações
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
