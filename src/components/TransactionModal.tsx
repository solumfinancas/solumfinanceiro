import React, { useState, useEffect, useMemo } from 'react';
import { useFinance } from '../FinanceContext';
import { useModal } from '../contexts/ModalContext';
import { 
  X, 
  ThumbsUp, 
  ThumbsDown, 
  Check, 
  AlertTriangle, 
  BellRing,
  Plus,
  AlertCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { formatCurrency, cn, checkBudgetThreshold, getCategorySpend, getInvoicePeriod } from '../lib/utils';
import { CustomSelect, SelectOption } from './ui/CustomSelect';
import { Transaction, TransactionType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Portal } from './ui/Portal';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTransaction?: Transaction | null;
  initialType?: TransactionType;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ 
  isOpen, 
  onClose, 
  editingTransaction,
  initialType = 'expense'
}) => {
  const { transactions, categories, wallets, addTransaction, addTransactions, updateTransaction } = useFinance();
  const { showAlert } = useModal();
  
  const [budgetAlert, setBudgetAlert] = useState<{
    categoryName: string;
    threshold: '75' | '100';
    percent: number;
    amount: number;
    limit: number;
  } | null>(null);

  const [hasRecurrence, setHasRecurrence] = useState(false);
  const [recurrenceContinuous, setRecurrenceContinuous] = useState(false);
  const [recurrenceMonths, setRecurrenceMonths] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newTx, setNewTx] = useState<Partial<Transaction>>({
    type: initialType,
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    description: '',
    isPaid: true,
  });
  
  const [triedSubmit, setTriedSubmit] = useState(false);

  const isInvoicePayment = !!newTx.description?.toLowerCase().includes('pagamento de fatura');

  useEffect(() => {
    if (editingTransaction) {
      setNewTx(editingTransaction);
      setHasRecurrence(!!editingTransaction.groupId);
    } else {
      setNewTx({
        type: initialType,
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        description: '',
        isPaid: true,
        necessity: undefined,
      });
      setHasRecurrence(false);
    }
  }, [editingTransaction, initialType, isOpen]);

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    const amount = Number(numericValue) / 100;
    setNewTx(prev => ({ ...prev, amount }));
  };

  const isFieldInvalid = (field: keyof Transaction | 'categoryId') => {
    if (!triedSubmit) return false;
    if (field === 'description') return !newTx.description;
    if (field === 'amount') return !newTx.amount || newTx.amount <= 0;
    if (field === 'walletId') return !newTx.walletId;
    if (field === 'categoryId') {
      if (isInvoicePayment) return false;
      return ['income', 'expense'].includes(newTx.type!) && !newTx.categoryId;
    }
    if (field === 'necessity') {
      return hasRecurrence && newTx.type === 'expense' && !newTx.necessity;
    }
    return false;
  };

  const resetForm = () => {
    setNewTx({
      type: initialType,
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      description: '',
      isPaid: true,
      necessity: undefined,
    });
    setHasRecurrence(false);
    setRecurrenceContinuous(false);
    setRecurrenceMonths('');
    setTriedSubmit(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setTriedSubmit(true);
    
    if (!newTx.description || !newTx.amount || !newTx.walletId) return;
    if (!isInvoicePayment && ['income', 'expense'].includes(newTx.type!) && !newTx.categoryId) return;
    if (hasRecurrence && newTx.type === 'expense' && !newTx.necessity) {
      showAlert('Classificação Obrigatória', 'Para lançamentos recorrentes, você deve informar se a despesa é Necessária ou Desnecessária.', 'warning');
      return;
    }
    
    if ((newTx.type === 'transfer' || newTx.type === 'provision') && (!newTx.toWalletId || newTx.walletId === newTx.toWalletId)) {
      showAlert('Campos Obrigatórios', 'A carteira de destino é obrigatória e deve ser diferente da origem.', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, { ...newTx as Transaction });
        onClose();
        resetForm();
        return;
      }

      const baseDate = new Date(newTx.date! + 'T12:00:00Z');
      const groupId = crypto.randomUUID?.() || Math.random().toString(36).substring(2, 11);
      
      let monthsToGenerate = 1;
      if (hasRecurrence) {
        if (recurrenceContinuous) {
          const month = baseDate.getUTCMonth();
          monthsToGenerate = 12 - month;
        } else {
          monthsToGenerate = Number(recurrenceMonths) || 1;
        }
      }

      const txList: Omit<Transaction, 'id'>[] = [];
      const wallet = wallets.find(w => w.id === newTx.walletId);
      const isCreditCard = wallet?.type === 'credit_card';

      for (let i = 0; i < monthsToGenerate; i++) {
          const currDate = new Date(baseDate);
          currDate.setUTCMonth(currDate.getUTCMonth() + i);
          
          const txToSave: any = {
            ...newTx as any,
            date: currDate.toISOString().split('T')[0],
          };

          delete txToSave.id;
          
          if (isCreditCard) {
            txToSave.isPaid = true;
            delete txToSave.paidDate;
            const initialPeriod = getInvoicePeriod(wallet.closingDay || 5, wallet.dueDay || 15, new Date(newTx.date! + 'T12:00:00Z'));
            const startMonth = newTx.invoiceMonth || (initialPeriod.due.getUTCMonth() + 1);
            const startYear = newTx.invoiceYear || initialPeriod.due.getUTCFullYear();
            const targetInvoiceDate = new Date(Date.UTC(startYear, (startMonth - 1) + i, 1));
            txToSave.invoiceMonth = targetInvoiceDate.getUTCMonth() + 1;
            txToSave.invoiceYear = targetInvoiceDate.getUTCFullYear();
          }

          if (hasRecurrence) {
            txToSave.groupId = groupId;
            if (recurrenceContinuous) {
              txToSave.isContinuous = true;
              if (i === monthsToGenerate - 1) txToSave.requiresRenewal = true;
            } else {
              txToSave.recurrenceNumber = { current: i + 1, total: monthsToGenerate };
            }
          }
          txList.push(txToSave);
      }

      await addTransactions(txList);

      if (newTx.type === 'expense' && newTx.categoryId) {
        const category = categories.find(c => c.id === newTx.categoryId);
        if (category && category.limit) {
          const d = new Date(newTx.date! + 'T12:00:00Z');
          const currentMonth = d.getUTCMonth() + 1;
          const currentYear = d.getUTCFullYear();
          const currentSpend = getCategorySpend(category.id, transactions, categories, currentMonth, currentYear);
          const newTotal = currentSpend + (newTx.amount || 0);
          const threshold = checkBudgetThreshold(newTotal, category.limit);
          
          if (threshold) {
            setBudgetAlert({
              categoryName: category.name,
              threshold,
              percent: Math.round((newTotal / category.limit) * 100),
              amount: newTotal,
              limit: category.limit
            });
            setTimeout(() => { setBudgetAlert(null); onClose(); resetForm(); }, 6000);
            return;
          }
        }
      }

      onClose();
      resetForm();

    } catch (error) {
      console.error('Erro ao salvar lançamento:', error);
      showAlert('Erro ao Salvar', 'Ocorreu um erro ao salvar o lançamento. Tente novamente.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEstorno = useMemo(() => newTx.description?.toLowerCase().startsWith('estorno'), [newTx.description]);

  const walletOptions = useMemo(() => {
    const isSpecialType = ['income', 'transfer', 'provision'].includes(newTx.type || '') || isInvoicePayment;
    
    const banks = wallets.filter(w => w.type !== 'credit_card' && ((w.isActive !== false && !w.isDeleted) || w.id === newTx.walletId));
    const cards = wallets.filter(w => w.type === 'credit_card' && (
      w.id === newTx.walletId || 
      (!isSpecialType || isEstorno) && w.isActive !== false && !w.isDeleted
    ));
    
    const result: SelectOption[] = [];
    if (cards.length > 0) {
      result.push({ id: 'header-cards', name: 'Cartões de Crédito', isHeader: true });
      cards.forEach(w => result.push({ 
        id: w.id, 
        name: `(CARTÃO) ${w.name}`, 
        logoUrl: w.logoUrl, 
        icon: w.icon || 'CreditCard',
        color: w.color,
        type: w.type 
      }));
    }
    if (banks.length > 0) {
      result.push({ id: 'header-banks', name: 'Bancos', isHeader: true });
      banks.forEach(w => result.push({ 
        id: w.id, 
        name: w.name, 
        logoUrl: w.logoUrl, 
        icon: w.icon || 'Wallet',
        color: w.color,
        type: w.type 
      }));
    }
    return result;
  }, [wallets, newTx.walletId, newTx.type, isEstorno]);

  const categoryOptions = useMemo(() => {
    const isIncome = newTx.type === 'income';
    const targetType = (newTx.type === 'provision' || newTx.type === 'planned') ? 'expense' : newTx.type;
    
    // Identificar categoria atual e seu pai para garantir que apareçam mesmo se excluídos
    const currentCategory = categories.find(c => c.id === newTx.categoryId);
    const parentIdOfSelected = currentCategory?.parentId;

    const filtered = categories.filter(c => 
      ((c.isActive !== false && !c.isDeleted) || c.id === newTx.categoryId || c.id === parentIdOfSelected) && 
      c.type === targetType
    );
    
    const result: SelectOption[] = [];
    const parents = filtered.filter(c => !c.parentId);
    
    parents.forEach(parent => {
      result.push({
        id: parent.id,
        name: parent.name,
        icon: parent.icon,
        color: parent.color
      });
      
      // Filhos do pai atual que estão ativos OU são o selecionado
      const children = categories.filter(c => 
        c.parentId === parent.id && 
        ((c.isActive !== false && !c.isDeleted) || c.id === newTx.categoryId)
      );
      
      children.forEach(child => {
        result.push({
          id: child.id,
          name: `${parent.name} > ${child.name}`,
          icon: child.icon,
          color: child.color,
          parentId: parent.id
        });
      });
    });
    
    return result;
  }, [categories, newTx.type, newTx.categoryId]);

  const targetWalletOptions = useMemo(() => 
    wallets
      .filter(w => w.id !== newTx.walletId && w.type !== 'credit_card' && ((w.isActive !== false && !w.isDeleted) || w.id === newTx.toWalletId))
      .sort((a, b) => (a.type === b.type ? 0 : a.type === 'credit_card' ? -1 : 1))
      .map(w => ({
        id: w.id,
        name: w.type === 'credit_card' ? `(CARTÃO) ${w.name}` : w.name,
        logoUrl: w.logoUrl,
        icon: w.icon || 'Wallet',
        color: w.color,
        type: w.type
      }))
  , [wallets, newTx.walletId, newTx.toWalletId]);

  useEffect(() => {
    if (!isOpen) return;
    const wallet = wallets.find(w => w.id === newTx.walletId);
    if (wallet?.type === 'credit_card' && newTx.date) {
      const d = new Date(newTx.date + 'T12:00:00Z');
      const period = getInvoicePeriod(wallet.closingDay || 5, wallet.dueDay || 15, d);
      const m = period.due.getUTCMonth() + 1;
      const y = period.due.getUTCFullYear();
      
      if (!newTx.invoiceMonth || !newTx.invoiceYear) {
        setNewTx(prev => ({ ...prev, invoiceMonth: m, invoiceYear: y }));
      }
    }
    
    if (newTx.walletId) {
      const isSpecialType = ['income', 'transfer', 'provision'].includes(newTx.type || '');
      if (isSpecialType && wallet?.type === 'credit_card') {
        setNewTx(prev => ({ ...prev, walletId: undefined }));
      }
    }
  }, [newTx.walletId, newTx.date, isOpen, wallets, newTx.type]);

  useEffect(() => {
    if (!hasRecurrence && newTx.necessity) {
      setNewTx(prev => ({ ...prev, necessity: undefined }));
    }
  }, [hasRecurrence, newTx.necessity]);

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if(!budgetAlert) onClose(); }}
              className="absolute inset-0 backdrop-premium"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-card w-full max-w-lg rounded-3xl shadow-2xl border p-5 sm:p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">{isInvoicePayment ? 'Editar Pagamento de Fatura' : (editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento')}</h2>
                  <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                    <X size={20} />
                  </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {isEstorno && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600">
                      <TrendingUp size={16} />
                    </div>
                    <div>
                      <span className="block text-[10px] font-black uppercase text-emerald-600 tracking-widest leading-none mb-1">LANÇAMENTO DE ESTORNO</span>
                      <span className="text-[9px] font-bold text-emerald-600/60 uppercase leading-tight block">Este lançamento libera limite no seu cartão e reduz o valor da fatura.</span>
                    </div>
                  </div>
                )}
                {!isInvoicePayment && (
                  <div className="flex flex-wrap gap-2 p-1 bg-muted/30 border border-border/50 rounded-xl">
                    {(['income', 'expense', 'transfer', 'provision', 'planned'] as const).map((type) => {
                      const wallet = wallets.find(w => w.id === newTx.walletId);
                      const isCreditCard = wallet?.type === 'credit_card';
                      const isDisabled = isCreditCard && (type === 'income' || type === 'transfer' || type === 'provision');

                      return (
                        <button
                          key={type}
                          type="button"
                          disabled={isDisabled || isEstorno}
                          onClick={() => setNewTx(prev => ({ ...prev, type, categoryId: undefined }))}
                          className={cn(
                            "flex-1 py-1.5 px-1 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all min-w-[30%]",
                            newTx.type === type 
                              ? type === 'income' ? "bg-emerald-500 text-white" : 
                                 type === 'expense' ? "bg-rose-500 text-white" : 
                                 type === 'transfer' ? "bg-blue-500 text-white" :
                                 type === 'provision' ? "bg-orange-500 text-white" :
                                 "bg-yellow-500 text-white shadow-sm"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                            isDisabled && "opacity-30 cursor-not-allowed"
                          )}
                        >
                          {type === 'income' ? 'Receita' : type === 'expense' ? 'Despesa' : type === 'transfer' ? 'Transf.' : type === 'provision' ? 'Provisão' : 'Planejado'}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Valor</label>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      required
                      value={newTx.amount ? (newTx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      className={cn(
                        "w-full px-4 py-2.5 bg-background border rounded-xl focus:ring-2 outline-none shadow-sm font-black text-lg transition-all",
                        isFieldInvalid('amount') ? "border-rose-500 ring-2 ring-rose-500/10" : "border-border focus:ring-primary/20"
                      )}
                      placeholder="0,00"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Data Competência</label>
                    <input 
                      type="date" 
                      required
                      value={newTx.date}
                      onChange={(e) => setNewTx(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none shadow-sm font-bold"
                    />
                  </div>
                </div>

                {newTx.isPaid && wallets.find(w => w.id === newTx.walletId)?.type !== 'credit_card' && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 ml-1 italic">Data do Pagamento / Recebimento</label>
                    <div className="relative">
                      <input 
                        type="date" 
                        required
                        value={newTx.paidDate || new Date().toISOString().split('T')[0]}
                        onChange={(e) => setNewTx(prev => ({ ...prev, paidDate: e.target.value }))}
                        className="w-full px-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none shadow-sm font-black text-emerald-600"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none opacity-40">
                         <Check size={14} className="text-emerald-500" />
                         <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Confirmado</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Descrição</label>
                  <input 
                    type="text" 
                    required
                    readOnly={isInvoicePayment || isEstorno}
                    value={newTx.description}
                    onChange={(e) => setNewTx(prev => ({ ...prev, description: e.target.value }))}
                    className={cn(
                      "w-full px-4 py-2.5 bg-background border rounded-xl focus:ring-2 outline-none shadow-sm font-medium transition-all",
                      isFieldInvalid('description') ? "border-rose-500 ring-2 ring-rose-500/10" : "border-border focus:ring-primary/20",
                      isInvoicePayment && "bg-muted/50 cursor-not-allowed text-muted-foreground font-black"
                    )}
                    placeholder="Ex: Aluguel, Supermercado..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      {(newTx.type === 'transfer' || newTx.type === 'provision') ? 'Origem' : 'Carteira'}
                    </label>
                    <CustomSelect 
                      options={walletOptions}
                      value={newTx.walletId || ''}
                      onChange={(val) => setNewTx(prev => ({ ...prev, walletId: val }))}
                      disabled={isEstorno}
                      placeholder="Selecionar Carteira"
                      error={isFieldInvalid('walletId')}
                    />
                  </div>

                  {!isInvoicePayment && ['income', 'expense'].includes(newTx.type || '') && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Categoria</label>
                      <CustomSelect 
                        options={categoryOptions}
                        value={newTx.categoryId || ''}
                        onChange={(val) => setNewTx(prev => ({ ...prev, categoryId: val }))}
                        placeholder="Selecione a Categoria..."
                        error={isFieldInvalid('categoryId')}
                      />
                    </div>
                  )}

                  {wallets.find(w => w.id === newTx.walletId)?.type === 'credit_card' && (
                    <div className="col-span-2 p-4 bg-primary/5 rounded-2xl border border-primary/20 mt-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Ciclo da Fatura</label>
                        <select 
                          required
                          value={`${newTx.invoiceMonth}-${newTx.invoiceYear}`}
                          onChange={(e) => {
                            const [m, y] = e.target.value.split('-').map(Number);
                            setNewTx(prev => ({ ...prev, invoiceMonth: m, invoiceYear: y }));
                          }}
                          className="w-full px-4 py-2.5 bg-background border border-primary/20 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-xs appearance-none"
                        >
                          {(() => {
                             const baseDate = new Date((newTx.date || new Date().toISOString().split('T')[0]) + 'T12:00:00Z');
                             const options = [];
                             for (let i = 0; i <= 4; i++) {
                               const d = new Date(baseDate);
                               d.setUTCMonth(baseDate.getUTCMonth() + i);
                               const m = d.getUTCMonth() + 1;
                               const y = d.getUTCFullYear();
                               const label = d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
                               options.push(<option key={`${m}-${y}`} value={`${m}-${y}`}>{label}</option>);
                             }
                             return options;
                          })()}
                        </select>
                      </div>
                    </div>
                  )}

                  {(newTx.type === 'transfer' || newTx.type === 'provision') && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Destino</label>
                      <CustomSelect 
                        options={targetWalletOptions}
                        value={newTx.toWalletId || ''}
                        onChange={(val) => setNewTx(prev => ({ ...prev, toWalletId: val }))}
                        placeholder="Selecionar Destino"
                      />
                    </div>
                  )}
                </div>


                {wallets.find(w => w.id === newTx.walletId)?.type !== 'credit_card' && (
                  <button
                    type="button"
                    onClick={() => setNewTx(prev => {
                      const nextPaid = !newTx.isPaid;
                      return { 
                        ...prev, 
                        isPaid: nextPaid,
                        paidDate: nextPaid && !prev.paidDate ? new Date().toISOString().split('T')[0] : 
                                  !nextPaid ? undefined : prev.paidDate
                      };
                    })}
                    className={cn(
                      "flex items-center gap-4 px-6 py-3 rounded-2xl transition-all border-2 w-full",
                      newTx.isPaid !== false 
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 shadow-sm" 
                        : "bg-amber-500/10 border-amber-500/30 text-amber-600 shadow-sm"
                    )}
                  >
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shadow-inner", newTx.isPaid !== false ? "bg-emerald-500 text-white" : "bg-amber-500 text-white")}>
                       <ThumbsUp size={16} className={cn(newTx.isPaid === false && "rotate-180")} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-left">
                      {newTx.isPaid !== false ? 'Confirmado / Liquidado' : 'Aguardando Pagamento/Recebimento'}
                    </span>
                  </button>
                )}

                {!isInvoicePayment && (
                  <div className="pt-4 border-t space-y-4">
                    <div 
                      className={cn(
                        "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer",
                        hasRecurrence ? "bg-primary/5 border-primary/30" : "bg-muted/10 border-border/50 hover:bg-muted/20"
                      )}
                      onClick={() => setHasRecurrence(!hasRecurrence)}
                    >
                       <div className="flex flex-col">
                         <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Lançamento Recorrente?</span>
                         <span className={cn("text-xs font-bold", hasRecurrence ? "text-primary" : "text-muted-foreground/60")}>
                            {hasRecurrence ? 'Ativado' : 'Não se repete'}
                         </span>
                       </div>
                       <div className={cn(
                         "w-12 h-6 rounded-full relative transition-all duration-300",
                         hasRecurrence ? "bg-primary" : "bg-muted-foreground/30"
                       )}>
                          <div className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm",
                            hasRecurrence ? "left-7" : "left-1"
                          )} />
                       </div>
                    </div>

                    <AnimatePresence>
                      {hasRecurrence && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0, y: -10 }}
                          animate={{ opacity: 1, height: 'auto', y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -10 }}
                          className="space-y-4 overflow-hidden"
                        >
                          <div className="space-y-2">
                            <label className={cn(
                              "text-[10px] font-black uppercase tracking-widest ml-1 transition-colors",
                              isFieldInvalid('necessity') ? "text-rose-500" : "text-muted-foreground"
                            )}>
                              Classificação {isFieldInvalid('necessity') && <span className="lowercase font-bold">(obrigatório)</span>}
                            </label>
                            <div className={cn(
                              "flex gap-4 p-1 bg-muted/40 rounded-2xl border transition-all",
                              isFieldInvalid('necessity') ? "border-rose-500 bg-rose-500/5 shadow-[0_0_10px_rgba(244,63,94,0.1)]" : "border-border/50"
                            )}>
                              <button
                                type="button"
                                onClick={() => setNewTx(prev => ({ ...prev, necessity: 'necessary' }))}
                                className={cn(
                                  "flex-1 flex flex-col items-center justify-center gap-1 py-4 rounded-xl transition-all",
                                  newTx.necessity === 'necessary' ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" : "text-muted-foreground hover:bg-muted"
                                )}
                              >
                                <div className="flex items-center gap-2">
                                    <Check size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Necessário</span>
                                </div>
                                <span className={cn(
                                  "text-[7px] font-bold uppercase opacity-60 leading-tight px-2 text-center",
                                  newTx.necessity === 'necessary' ? "text-white" : "text-muted-foreground"
                                )}>
                                    Essencial. Não pode ser guardado para comprar (Ex: Aluguel, Internet).
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setNewTx(prev => ({ ...prev, necessity: 'unnecessary' }))}
                                className={cn(
                                  "flex-1 flex flex-col items-center justify-center gap-1 py-4 rounded-xl transition-all",
                                  newTx.necessity === 'unnecessary' ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20 scale-[1.02]" : "text-muted-foreground hover:bg-muted"
                                )}
                              >
                                <div className="flex items-center gap-2">
                                    <AlertCircle size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Desnecessário</span>
                                </div>
                                <span className={cn(
                                  "text-[7px] font-bold uppercase opacity-60 leading-tight px-2 text-center",
                                  newTx.necessity === 'unnecessary' ? "text-white" : "text-muted-foreground"
                                )}>
                                    Variável. Poderia ter sido planejado antes de comprar.
                                </span>
                              </button>
                            </div>
                          </div>

                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Configurar repetição</p>
                          <div className="flex gap-2">
                            <button 
                              type="button"
                              onClick={() => setRecurrenceContinuous(true)}
                              className={cn(
                                "flex-1 p-3 rounded-2xl border transition-all flex flex-col items-center gap-1",
                                recurrenceContinuous ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" : "bg-card border-border hover:bg-accent/50 text-muted-foreground"
                              )}
                            >
                              <span className="text-[11px] font-black uppercase italic">DEZ DE {new Date().getFullYear()}</span>
                              <span className="text-[8px] font-bold opacity-60 uppercase">Até fim do ano</span>
                            </button>
                            
                            <div className={cn(
                              "flex-1 flex gap-2 items-center p-1 rounded-2xl border transition-all",
                              !recurrenceContinuous ? "bg-primary/5 border-primary/30" : "bg-card border-border opacity-50"
                            )}>
                              <button 
                                type="button"
                                onClick={() => setRecurrenceContinuous(false)}
                                className={cn(
                                  "flex-1 py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                  !recurrenceContinuous ? "bg-primary text-white" : "hover:text-foreground"
                                )}
                              >Meses</button>
                              {!recurrenceContinuous && (
                                <input 
                                  type="number"
                                  min="1"
                                  max="48"
                                  placeholder="0"
                                  value={recurrenceMonths}
                                  onChange={(e) => setRecurrenceMonths(Number(e.target.value))}
                                  className="w-16 bg-background border border-border/50 rounded-lg h-9 px-2 text-center font-black text-xs outline-none focus:ring-2 focus:ring-primary/20"
                                />
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t shrink-0">
                  <button 
                    type="button" 
                    onClick={onClose} 
                    className="w-full sm:flex-1 shrink-0 px-4 h-14 sm:h-12 rounded-xl font-black uppercase text-xs tracking-widest border border-border hover:bg-muted transition-all active:scale-95 shadow-sm flex items-center justify-center"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className={cn(
                      "w-full sm:flex-1 shrink-0 px-4 h-14 sm:h-12 rounded-xl font-black uppercase text-xs tracking-widest bg-primary text-white shadow-lg shadow-primary/20 transition-all flex items-center justify-center",
                      isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02] active:scale-[0.98]"
                    )}
                  >
                    {isSubmitting ? 'Processando...' : 'Salvar'}
                  </button>
                </div>
              </form>

              <AnimatePresence>
                {budgetAlert && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className={cn(
                      "absolute inset-x-0 bottom-0 m-4 p-6 rounded-[2rem] border-2 shadow-2xl backdrop-blur-xl z-[110] flex flex-col gap-4",
                      budgetAlert.threshold === '100' ? "bg-rose-50/10 border-rose-500/50 text-rose-600" : "bg-amber-500/10 border-amber-500/50 text-amber-600"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg", budgetAlert.threshold === '100' ? "bg-rose-500 text-white" : "bg-amber-500 text-white")}>
                         {budgetAlert.threshold === '100' ? <AlertTriangle size={24} /> : <BellRing size={24} />}
                      </div>
                      <button onClick={() => { setBudgetAlert(null); onClose(); resetForm(); }} className="p-2 hover:bg-black/5 rounded-xl transition-colors">
                         <X size={18} />
                      </button>
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest opacity-60">Alerta de Orçamento</h4>
                      <h2 className="text-lg font-black tracking-tight leading-tight">
                        {budgetAlert.threshold === '100' ? 'Limite Atingido!' : 'Atenção ao Limite'}
                      </h2>
                      <p className="text-xs font-bold opacity-80 mt-1">A categoria {budgetAlert.categoryName} atingiu {budgetAlert.percent}% do limite mensal.</p>
                    </div>
                    <button onClick={() => { setBudgetAlert(null); onClose(); resetForm(); }} className={cn("w-full py-3 rounded-xl font-black uppercase text-[10px] tracking-widest text-white shadow-lg transition-transform active:scale-95", budgetAlert.threshold === '100' ? "bg-rose-500 shadow-rose-500/20" : "bg-amber-500 shadow-amber-500/20")}>Entendido</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
};
