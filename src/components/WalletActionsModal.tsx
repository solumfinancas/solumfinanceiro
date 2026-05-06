import React, { useState, useEffect, useMemo } from 'react';
import { X, History as HistoryIcon, Edit3, Power, PowerOff, ChevronRight, Wallet as WalletIcon, Building2, PiggyBank, CreditCard as CardIcon, CalendarCheck, CalendarDays, CheckCircle2, ChevronLeft, CalendarClock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModal } from '../contexts/ModalContext';
import { Wallet, Transaction } from '../types';
import { cn, formatCurrency, getInvoicePeriod, getInvoiceAmount, getInvoicePayments, formatDate, getOpenInvoicePeriod } from '../lib/utils';
import { useFinance } from '../FinanceContext';
import { Trash2, AlertTriangle, ArrowRight, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { CustomSelect } from './ui/CustomSelect';
import { IconRenderer } from './ui/IconRenderer';

interface WalletActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: Wallet | null;
  onViewTransactions: (month?: number, year?: number) => void;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  onEditTransaction: (tx: Transaction) => void;
}

export const WalletActionsModal: React.FC<WalletActionsModalProps> = ({ 
  isOpen, 
  onClose, 
  wallet, 
  onViewTransactions, 
  onEdit, 
  onToggleActive,
  onDelete,
  onEditTransaction
}) => {
  const { 
    addTransaction, updateTransaction, deleteTransaction, 
    wallets = [], transactions = [], categories = [],
    orderedAccounts 
  } = useFinance();
  const { showConfirm, showAlert } = useModal();
  const [view, setView] = React.useState<'actions' | 'history' | 'history-detail' | 'future-history'>('actions');
  const [viewingDetailPeriod, setViewingDetailPeriod] = React.useState<{ start: Date, end: Date, due: Date } | null>(null);
  const [errorInfo, setErrorInfo] = React.useState<string | null>(null);
  
  // State for manual invoice adjustment
  const [isAdjusting, setIsAdjusting] = React.useState<{ start: Date, end: Date, due: Date } | null>(null);
  const [adjustValue, setAdjustValue] = React.useState<string>('');

  // State for payment confirmation modal
  const [isPaying, setIsPaying] = React.useState<{ period: { start: Date, end: Date, due: Date }, totalAmount: number } | null>(null);
  const [payAmount, setPayAmount] = React.useState<string>('');
  const [payWalletId, setPayWalletId] = React.useState<string>('');
  const [payPaidDate, setPayPaidDate] = React.useState<string>(new Date().toISOString().split('T')[0]);

  // State for refund confirmation
  const [isRefunding, setIsRefunding] = React.useState<{ period: { start: Date, end: Date, due: Date } } | null>(null);
  const [refundAmount, setRefundAmount] = React.useState<string>('');
  const [refundDate, setRefundDate] = React.useState<string>(new Date().toISOString().split('T')[0]);
  
  // State for invoice detail filtering
  const [historyFilter, setHistoryFilter] = React.useState<'all' | 'expense' | 'payment' | 'income'>('all');
  
  // Reset view when modal closes/opens
  React.useEffect(() => {
    if (!isOpen) {
      setView('actions');
      setErrorInfo(null);
    }
  }, [isOpen]);

  // Essential Hooks must be at the TOP
  const isCreditCard = wallet?.type === 'credit_card';

  // Helper to get invoice data internal
  const getInvoiceDataInternal = React.useCallback((date: Date) => {
    if (!wallet || !wallet.closingDay || !wallet.dueDay) return null;
    const p = getInvoicePeriod(wallet.closingDay!, wallet.dueDay!, date);
    if (!p) return null;
    const invoice = getInvoiceAmount(transactions, wallet.id, p);
    const amt = invoice.amount;
    const paidSum = invoice.paidSum;
    const payments = getInvoicePayments(wallet.id, transactions, p.due.getUTCMonth() + 1, p.due.getUTCFullYear());
    
    const unpaidEntries = transactions.filter(t => {
      if (t.walletId !== wallet.id) return false;
      if (t.type !== 'expense' && t.type !== 'planned') return false;
      if (t.isPaid !== false) return false;
      if (t.invoiceMonth && t.invoiceYear) {
        return t.invoiceMonth === (p.due.getUTCMonth() + 1) && 
               t.invoiceYear === p.due.getUTCFullYear();
      }
      const d = new Date(t.date);
      return d >= p.start && d <= p.end;
    });

    const pendingPayments = payments.filter(t => t.isPaid === false);
    const hasPendingConciliation = pendingPayments.length > 0;
    const now = new Date();
    
    // Status Logic
    const isFullyPaid = amt > 0 && paidSum >= (amt - 0.01);
    const isPartial = paidSum > 0 && paidSum < (amt - 0.01);
    const isFuture = p.start > now;
    const isClosed = p.end < now;
    const isOverdue = !isFullyPaid && amt > 0 && p.due < now;
    const isPaid = isFullyPaid && !hasPendingConciliation;

    return { 
      period: p, 
      amount: amt, 
      paidSum,
      isPaid, 
      isPartial: isPartial || (isFullyPaid && hasPendingConciliation),
      isFuture,
      isClosed,
      isOverdue,
      hasPendingConciliation,
      unpaidCount: unpaidEntries.length 
    };
  }, [wallet, transactions]);

  const formatCurrencyInput = (value: string) => {
    // Remove tudo que não for dígito
    const digits = value.replace(/\D/g, '');
    
    // Converte para número e divide por 100 para ter as casas decimais
    const amount = parseInt(digits || '0') / 100;
    
    // Retorna formatado no padrão pt-BR
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const invoiceHistory = React.useMemo(() => {
    if (!isOpen || !wallet || !isCreditCard || !wallet.closingDay || !wallet.dueDay) return [];
    try {
      const history: any[] = [];
      const now = new Date();
      
      // Get the currently OPEN invoice period first
      const openPeriod = getOpenInvoicePeriod(wallet.closingDay!, wallet.dueDay!);
      const openData = getInvoiceDataInternal(openPeriod.start);
      if (openData) history.push(openData);

      for (let i = 1; i <= 12; i++) {
        const d = new Date(now);
        // Só retrocede no tempo
        d.setUTCMonth(d.getUTCMonth() - i);
        const data = getInvoiceDataInternal(d);
        
        // Avoid adding the open invoice twice
        if (data) {
          const isSameAsOpen = openPeriod && 
                             data.period.due.getUTCMonth() === openPeriod.due.getUTCMonth() && 
                             data.period.due.getUTCFullYear() === openPeriod.due.getUTCFullYear();
          
          if (!isSameAsOpen && (data.amount > 0 || data.isPaid)) {
            history.push(data);
          }
        }
      }
      return history;
    } catch (err) {
      console.error("Error in invoiceHistory memo:", err);
      return [];
    }
  }, [isOpen, wallet, isCreditCard, getInvoiceDataInternal]);

  const futureInvoiceHistory = React.useMemo(() => {
    if (!isOpen || !wallet || !isCreditCard || !wallet.closingDay || !wallet.dueDay) return [];
    try {
      const history: any[] = [];
      const now = new Date();
      
      const openPeriod = getOpenInvoicePeriod(wallet.closingDay!, wallet.dueDay!);

      for (let i = 1; i <= 12; i++) {
        const d = new Date(now);
        // Avança no tempo
        d.setUTCMonth(d.getUTCMonth() + i);
        const data = getInvoiceDataInternal(d);
        
        if (data) {
          const isSameAsOpen = openPeriod && 
                             data.period.due.getUTCMonth() === openPeriod.due.getUTCMonth() && 
                             data.period.due.getUTCFullYear() === openPeriod.due.getUTCFullYear();
          
          if (!isSameAsOpen) {
            history.push(data);
          }
        }
      }
      return history;
    } catch (err) {
      console.error("Error in futureInvoiceHistory memo:", err);
      return [];
    }
  }, [isOpen, wallet, isCreditCard, getInvoiceDataInternal]);

  // Find all pending closed invoices to show count and warning
  const pendingInvoices = React.useMemo(() => {
    if (!invoiceHistory.length) return [];
    const now = new Date();
    return invoiceHistory.filter(inv => {
      const isClosed = inv.period?.end && now > inv.period.end;
      return isClosed && !inv.isPaid && inv.amount > 0;
    }).sort((a, b) => {
      const timeA = a.period?.end?.getTime() || 0;
      const timeB = b.period?.end?.getTime() || 0;
      return timeB - timeA;
    });
  }, [invoiceHistory]);

  const latestClosedPending = pendingInvoices[0] || null;
  const otherPendingCount = Math.max(0, pendingInvoices.length - 1);

  if (!isOpen || !wallet) return null;

  const handlePayInvoice = async () => {
    if (!isPaying || !wallet) return;
    const amountToPay = parseFloat(payAmount.replace(/\./g, '').replace(',', '.'));
    const sourceWalletId = payWalletId;

    if (isNaN(amountToPay) || amountToPay <= 0) {
       showAlert('Valor Inválido', 'Por favor, informe um valor válido para o pagamento.', 'warning');
       return;
    }
    if (!sourceWalletId) {
      showAlert('Conta de Origem', 'Selecione uma conta de origem para realizar o pagamento.', 'warning');
      return;
    }

    try {
      const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      const refMonth = months[isPaying.period.due.getUTCMonth()];
      const refYear = isPaying.period.due.getUTCFullYear();

      // 1. Criar o lançamento de pagamento (Despesa no Banco)
      await addTransaction({
        description: `Pagamento de Fatura: ${wallet.name} - ${refMonth} / ${refYear}`,
        amount: amountToPay,
        date: payPaidDate,
        paidDate: payPaidDate,
        walletId: sourceWalletId,
        toWalletId: wallet.id,
        type: 'expense',
        categoryId: null as any,
        isPaid: true, // Pagamento direto conforme solicitado
        invoiceMonth: isPaying.period.due.getUTCMonth() + 1,
        invoiceYear: isPaying.period.due.getUTCFullYear()
      });

      // 2. Liquidar os lançamentos deste período (independentemente do valor ser parcial ou total, 
      // marcamos como pagos para organização individual, mas o status da FATURA depende do montante total pago)
      const txsToUpdate = transactions.filter(t => {
        if (t.walletId !== wallet.id) return false;
        if (t.type !== 'expense') return false;
        if (t.isPaid !== false) return false;

        if (t.invoiceMonth && t.invoiceYear) {
          return t.invoiceMonth === (isPaying.period.due.getUTCMonth() + 1) && 
                 t.invoiceYear === isPaying.period.due.getUTCFullYear();
        }

        const d = new Date(t.date);
        return d >= isPaying.period.start && d <= isPaying.period.end;
      });

      for (const tx of txsToUpdate) {
        await updateTransaction(tx.id, { isPaid: true, paidDate: payPaidDate });
      }

      const isIntegral = amountToPay >= isPaying.totalAmount;
      showAlert(
        isIntegral ? 'Fatura Liquidada' : 'Pagamento Registrado',
        isIntegral ? 'A fatura foi liquidada com sucesso!' : 'O pagamento parcial foi registrado com sucesso!',
        'success'
      );
      setIsPaying(null);
      if (view === 'actions' && isIntegral) onClose();
    } catch (error) {
      console.error('Erro ao pagar fatura:', error);
      showAlert('Erro no Pagamento', 'Ocorreu um erro ao processar o pagamento da fatura.', 'danger');
    }
  };

  const handleManualAdjustment = async () => {
    if (!isAdjusting || !adjustValue || !wallet) return;
    const value = parseFloat(adjustValue.replace(/\./g, '').replace(',', '.'));
    if (isNaN(value) || value === 0) return;

    // Find "Outros" category or any expense category to avoid UUID error
    const otherCategory = categories.find(c => c.name.toLowerCase() === 'outros' && c.type === 'expense') 
                       || categories.find(c => c.type === 'expense');

    try {
      await addTransaction({
        description: `Ajuste Manual de Fatura (${isAdjusting.end.getUTCMonth() + 1}/${isAdjusting.end.getUTCFullYear()})`,
        amount: Math.abs(value),
        date: new Date().toISOString().split('T')[0], // Usar data atual conforme solicitado
        walletId: wallet.id,
        type: 'expense',
        categoryId: otherCategory?.id || '', 
        isPaid: true // Ajustes de fatura são considerados liquidados na fatura
      });
      setIsAdjusting(null);
      setAdjustValue('');
      showAlert('Ajuste Realizado', 'O ajuste de valor foi adicionado à fatura com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao salvar ajuste:', error);
      showAlert('Erro no Ajuste', 'Não foi possível salvar o ajuste de valor.', 'danger');
    }
  };

  const handleRefund = async () => {
    if (!isRefunding || !refundAmount || !wallet) return;
    const value = parseFloat(refundAmount.replace(/\./g, '').replace(',', '.'));
    if (isNaN(value) || value === 0) return;

    // Find "Outras receitas" category
    const incomeCategory = categories.find(c => c.name.toLowerCase().includes('outras receitas') && c.type === 'income')
                        || categories.find(c => c.type === 'income');

    try {
      await addTransaction({
        description: `Estorno de Lançamento (${isRefunding.period.due.getUTCMonth() + 1}/${isRefunding.period.due.getUTCFullYear()})`,
        amount: Math.abs(value),
        date: refundDate,
        paidDate: refundDate,
        walletId: wallet.id,
        type: 'income',
        categoryId: incomeCategory?.id || '',
        isPaid: true,
        invoiceMonth: isRefunding.period.due.getUTCMonth() + 1,
        invoiceYear: isRefunding.period.due.getUTCFullYear()
      });
      setIsRefunding(null);
      setRefundAmount('');
      showAlert('Estorno Realizado', 'O estorno foi adicionado à fatura com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao salvar estorno:', error);
      showAlert('Erro no Estorno', 'Não foi possível salvar o estorno.', 'danger');
    }
  };

  const actions = [
    ...(isCreditCard && wallet.isActive !== false ? [
      {
        id: 'history',
        label: 'Histórico de Faturas',
        description: 'Ver faturas passadas e pendentes',
        icon: HistoryIcon,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        onClick: () => setView('history')
      }
    ] : []),
    {
      id: 'view',
      label: 'Ver Lançamentos',
      description: 'Histórico detalhado de movimentações',
      icon: HistoryIcon,
      color: 'text-primary',
      bg: 'bg-primary/10',
      onClick: onViewTransactions
    },
    {
      id: 'edit',
      label: isCreditCard ? 'Editar Cartão' : 'Editar Carteira',
      description: 'Alterar nome, cor ou configurações',
      icon: Edit3,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      onClick: onEdit
    },
    {
      id: 'toggle',
      label: wallet.isActive !== false 
        ? (isCreditCard ? 'Inativar Cartão' : 'Inativar Carteira') 
        : (isCreditCard ? 'Reativar Cartão' : 'Reativar Carteira'),
      description: wallet.isActive !== false ? 'Ocultar das opções de novos lançamentos' : 'Tornar visível novamente',
      icon: wallet.isActive !== false ? PowerOff : Power,
      color: wallet.isActive !== false ? 'text-amber-500' : 'text-emerald-500',
      bg: wallet.isActive !== false ? 'bg-amber-500/10' : 'bg-emerald-500/10',
      onClick: onToggleActive
    },
    ...(!isCreditCard && wallet.isActive === false ? [
      {
        id: 'delete',
        label: 'Excluir Carteira',
        description: 'Remover permanentemente ou arquivar',
        icon: Trash2,
        color: 'text-rose-500',
        bg: 'bg-rose-500/10',
        onClick: onDelete
      }
    ] : [])
  ];

  if (errorInfo) {
    return (
      <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/80">
        <div className="bg-card p-8 rounded-3xl border border-rose-500/30 text-center">
          <p className="text-rose-500 font-bold mb-4">Ocorreu um erro ao carregar as ações: {errorInfo}</p>
          <button onClick={onClose} className="bg-primary text-white px-6 py-2 rounded-xl">Fechar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
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
        className="relative bg-card w-full max-w-md rounded-[2.5rem] shadow-2xl border border-border/50 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-border/40 flex items-center justify-between bg-muted/5 relative overflow-hidden shrink-0">
          <div className="flex items-center gap-4 relative">
             {(view === 'history' || view === 'history-detail' || view === 'future-history') && (
               <button onClick={() => setView(view === 'history-detail' ? (viewingDetailPeriod?.start && viewingDetailPeriod.start > new Date() ? 'future-history' : 'history') : 'actions')} className="p-2 hover:bg-muted rounded-xl transition-all mr-2">
                 <ChevronLeft size={20} />
               </button>
             )}
              <IconRenderer 
                icon={wallet.logoUrl || wallet.icon} 
                color={wallet.color} 
                size={56} 
                className="shadow-lg border-2 border-background" 
              />
             <div>
                <h2 className="text-xl font-black uppercase tracking-tight">
                  {view === 'history' ? 'Histórico' : view === 'future-history' ? 'Próximas Faturas' : wallet.name}
                </h2>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
                  {view === 'history' ? 'Ciclos de fatura anteriores' : view === 'future-history' ? 'Comprometimento Futuro' : 'O que deseja fazer?'}
                </p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-muted rounded-2xl transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {view === 'actions' ? (
              <motion.div 
                key="actions"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-4"
              >
                {/* Latest Closed Pending Summary */}
                {isCreditCard && latestClosedPending ? (
                  <div className="mb-6 space-y-3">
                    <div className="p-6 bg-amber-500/10 border border-amber-500/30 rounded-3xl space-y-4">
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 italic">Fatura Fechada</span>
                         <div className="flex items-center gap-1.5 bg-amber-500 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase animate-pulse">
                            <CalendarCheck size={10} />
                             Vencimento: {formatDate(latestClosedPending.period.due)}
                         </div>
                      </div>
                      
                      <div className="flex items-end justify-between pt-2">
                         <div>
                           <span className="text-[10px] font-bold text-muted-foreground uppercase">
                             {latestClosedPending.isPartial ? 'Saldo Restante' : 'Valor a Pagar'}
                           </span>
                           <h4 className="text-2xl font-black tracking-tight">
                             {formatCurrency(latestClosedPending.amount - latestClosedPending.paidSum)}
                           </h4>
                         </div>
                         <div className="flex gap-2">
                           <button 
                             onClick={() => { setIsAdjusting(latestClosedPending.period); setAdjustValue(''); }}
                             className="p-2.5 bg-white/10 hover:bg-white/20 text-amber-500 rounded-2xl transition-all"
                             title="Ajustar Valor"
                           >
                             <Edit3 size={18} />
                           </button>
                           <button 
                             onClick={() => {
                               const remaining = latestClosedPending.amount - latestClosedPending.paidSum;
                               setIsPaying({ period: latestClosedPending.period, totalAmount: latestClosedPending.amount });
                               setPayAmount(remaining.toFixed(2).replace('.', ','));
                               setPayWalletId(wallet.defaultPaymentWalletId || '');
                             }}
                             className="px-6 py-2.5 bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 hover:scale-105 transition-transform"
                           >
                             Pagar {latestClosedPending.isPartial ? 'Restante' : 'Agora'}
                           </button>
                         </div>
                      </div>
                      
                      <p className="text-[9px] font-medium text-muted-foreground/60 italic text-center pt-2 border-t border-amber-500/10">
                         Referente ao período de {formatDate(latestClosedPending.period.start)} a {formatDate(latestClosedPending.period.end)}
                      </p>
                    </div>

                    {otherPendingCount > 0 && (
                      <div className="px-6 py-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500">
                          <HistoryIcon size={12} />
                        </div>
                        <span className="text-[9px] font-black uppercase text-rose-500/80 tracking-wide">
                          Atenção: Você possui outras {otherPendingCount} {otherPendingCount === 1 ? 'fatura' : 'faturas'} pendentes em atraso.
                        </span>
                      </div>
                    )}
                  </div>
                ) : isCreditCard && (
                  <div className="mb-6 p-8 border-2 border-dashed border-border/40 rounded-3xl text-center">
                    <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2 opacity-50" />
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-relaxed">
                      Não há faturas fechadas<br/>pendentes de pagamento.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  {actions.map((action) => (
                    <button
                      key={action.id}
                      onClick={action.onClick}
                      className="w-full group flex items-center justify-between p-4 rounded-3xl hover:bg-muted/50 transition-all border border-transparent hover:border-border/40 text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", action.bg, action.color)}>
                          <action.icon size={22} />
                        </div>
                        <div>
                          <span className="block font-black text-sm uppercase tracking-tight">{action.label}</span>
                          <span className="text-[10px] text-muted-foreground font-medium">{action.description}</span>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-muted-foreground opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : view === 'history' ? (
              <motion.div 
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 space-y-3"
              >
                {/* Button for Future Invoices */}
                <button
                  onClick={() => setView('future-history')}
                  className="w-full p-4 mb-2 bg-orange-500/10 border border-orange-500/20 rounded-3xl flex items-center justify-between group hover:bg-orange-500/20 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center">
                      <CalendarDays size={20} />
                    </div>
                    <div className="text-left">
                      <span className="block text-[11px] font-black uppercase text-orange-600">Ver Faturas Futuras</span>
                      <span className="text-[9px] font-bold text-orange-600/60 uppercase">Projeção dos próximos 12 meses</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-orange-500 group-hover:translate-x-1 transition-transform" />
                </button>

                {invoiceHistory.length === 0 ? (
                  <div className="text-center py-12 opacity-50">
                    <HistoryIcon size={48} className="mx-auto mb-4" />
                    <p className="text-xs font-bold uppercase">Nenhum histórico disponível</p>
                  </div>
                ) : invoiceHistory.map((item, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => { setViewingDetailPeriod(item.period); setView('history-detail'); }}
                    className="p-4 bg-muted/20 border border-border/40 rounded-3xl flex items-center justify-between group hover:bg-muted/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          item.isPaid ? "bg-emerald-500/10 text-emerald-500" : 
                          item.isOverdue ? "bg-rose-500/10 text-rose-500" :
                          item.isClosed ? "bg-amber-500/10 text-amber-500" :
                          "bg-blue-500/10 text-blue-500" // Aberta
                        )}>
                          {item.isPaid ? <CheckCircle2 size={18} /> : 
                           item.isOverdue ? <AlertTriangle size={18} /> :
                           item.isClosed ? <CalendarCheck size={18} /> :
                           <CalendarDays size={18} />}
                        </div>
                        <div className="flex flex-col">
                           <span className="block text-xs font-black uppercase leading-none mb-1">
                             {item.period.end.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}
                           </span>
                           <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">
                                 {item.period.due > new Date() ? 'Vence em:' : 'Venceu em:'} {formatDate(item.period.due)}
                              </span>
                              <span className={cn(
                                "text-[9px] font-black uppercase",
                                item.isPaid ? "text-emerald-500/60" :
                                item.isOverdue ? "text-rose-500/60" :
                                item.isClosed ? "text-amber-500/60" :
                                "text-blue-500/60"
                              )}>
                                 Fecha em: {formatDate(item.period.end)}
                              </span>
                           </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                       <div className="text-right">
                          <span className={cn(
                            "block text-sm font-black tracking-tight",
                            item.isPaid ? "text-emerald-500" :
                            item.isOverdue ? "text-rose-500" :
                            item.isClosed ? "text-amber-500" :
                            "text-blue-500"
                          )}>
                            {formatCurrency(item.amount)}
                          </span>
                             <div className="flex items-center gap-2">
                                 <span className={cn(
                                   "text-[8px] font-black uppercase px-1.5 py-0.5 rounded",
                                   item.isPaid ? "bg-emerald-500/10 text-emerald-500" : 
                                   item.isOverdue ? "bg-rose-500/10 text-rose-500" :
                                   item.isClosed ? "bg-amber-500/10 text-amber-500" :
                                   "bg-blue-500/10 text-blue-500"
                                 )}>
                                   {item.isPaid ? 'Paga' : 
                                    item.isOverdue ? 'Atrasada' : 
                                    item.isClosed ? 'Fechada' : 
                                    'Aberta'}
                                 </span>
                               {item.hasPendingConciliation && (
                                 <span className="text-[8px] font-black bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm animate-pulse">
                                   <AlertTriangle size={8} />
                                   CONCILIAÇÃO
                                 </span>
                               )}
                             </div>
                       </div>
                       <ChevronRight size={16} className="text-muted-foreground/30 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : view === 'future-history' ? (
              <motion.div 
                key="future-history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 space-y-3"
              >
                {futureInvoiceHistory.map((item, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => { setViewingDetailPeriod(item.period); setView('history-detail'); }}
                    className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-3xl flex items-center justify-between group hover:bg-orange-500/10 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-500 flex items-center justify-center">
                           <CalendarDays size={18} />
                        </div>
                        <div className="flex flex-col">
                           <span className="block text-xs font-black uppercase leading-none mb-1 text-orange-600">
                             {item.period.end.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}
                           </span>
                           <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">
                                 Vence em: {formatDate(item.period.due)}
                              </span>
                              <span className="text-[9px] font-black uppercase text-orange-500/60">
                                 Fecha em: {formatDate(item.period.end)}
                              </span>
                           </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                       <div className="text-right">
                          <span className="block text-sm font-black tracking-tight text-orange-600">
                            {formatCurrency(item.amount)}
                          </span>
                          <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-orange-500 text-white shadow-sm">
                            FUTURA
                          </span>
                       </div>
                       <ChevronRight size={16} className="text-orange-500/30 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (view === 'history-detail' && viewingDetailPeriod) ? (
              <motion.div 
                key="history-detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 space-y-6"
              >
                {/* Detail Summary Card */}
                {(() => {
                  if (!viewingDetailPeriod || !viewingDetailPeriod.due) return null;
                  const month = viewingDetailPeriod.due.getUTCMonth() + 1;
                  const year = viewingDetailPeriod.due.getUTCFullYear();
                  const invoice = getInvoiceAmount(transactions, wallet.id, viewingDetailPeriod);
                  const amt = invoice.amount;
                  const paidSum = invoice.paidSum;
                  const remaining = Math.max(0, amt - paidSum);
                  const status = invoice.isLastPaid ? 'paid' : paidSum > 0 ? 'partial' : 'pending';
                  
                  const payments = getInvoicePayments(wallet.id, transactions, month, year)
                    .sort((a, b) => {
                      const dateA = a.date || "";
                      const dateB = b.date || "";
                      const dateDiff = dateB.localeCompare(dateA);
                      if (dateDiff !== 0) return dateDiff;
                      
                      const aKey = String(a.created_at || a.id || "");
                      const bKey = String(b.created_at || b.id || "");
                      return aKey.localeCompare(bKey);
                    });

                  const expenses = transactions.filter(t => {
                    if (t.walletId !== wallet.id) return false;
                    if (t.type !== 'expense' && t.type !== 'planned') return false;
                    
                    if (t.invoiceMonth && t.invoiceYear) {
                      return t.invoiceMonth === month && t.invoiceYear === year;
                    }
                    const d = new Date(t.date);
                    return d >= viewingDetailPeriod.start && d <= viewingDetailPeriod.end;
                  }).sort((a, b) => {
                    const dateA = a.date || "";
                    const dateB = b.date || "";
                    const dateDiff = dateB.localeCompare(dateA);
                    if (dateDiff !== 0) return dateDiff;
                    
                    const aKey = String(a.created_at || a.id || "");
                    const bKey = String(b.created_at || b.id || "");
                    return aKey.localeCompare(bKey);
                  });

                  const incomes = transactions.filter(t => {
                    if (t.walletId !== wallet.id) return false;
                    if (t.type !== 'income') return false;
                    
                    if (t.invoiceMonth && t.invoiceYear) {
                      return t.invoiceMonth === month && t.invoiceYear === year;
                    }
                    const d = new Date(t.date);
                    return d >= viewingDetailPeriod.start && d <= viewingDetailPeriod.end;
                  }).sort((a, b) => {
                    const dateA = a.date || "";
                    const dateB = b.date || "";
                    const dateDiff = dateB.localeCompare(dateA);
                    if (dateDiff !== 0) return dateDiff;
                    
                    const aKey = String(a.created_at || a.id || "");
                    const bKey = String(b.created_at || b.id || "");
                    return aKey.localeCompare(bKey);
                  });

                  return (
                    <>
                      <div className="bg-card p-6 rounded-[2rem] border border-border/50 shadow-sm space-y-4">
                         <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase tracking-tight">Status da Fatura</h3>
                            <span className={cn(
                              "text-[9px] font-black uppercase px-3 py-1 rounded-full",
                              status === 'paid' ? "bg-emerald-500/10 text-emerald-500" : 
                              status === 'partial' ? "bg-amber-500/10 text-amber-500" : 
                              "bg-rose-500/10 text-rose-500"
                            )}>
                              {status === 'paid' ? 'Totalmente Paga' : status === 'partial' ? 'Pagamento Parcial' : 'Aguardando Pagamento'}
                            </span>
                         </div>

                         <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-muted/20 rounded-2xl border border-border/20">
                               <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">Valor Total</span>
                               <p className="text-lg font-black tracking-tight">{formatCurrency(amt)}</p>
                            </div>
                            <div className="p-4 bg-muted/20 rounded-2xl border border-border/20">
                               <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">Total Pago</span>
                               <p className="text-lg font-black tracking-tight text-emerald-500">{formatCurrency(paidSum)}</p>
                            </div>
                         </div>

                         {status !== 'paid' && remaining > 0 && (
                           <div className="p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10 flex items-center justify-between">
                              <div>
                                 <span className="text-[9px] font-bold text-rose-500 uppercase opacity-60">Saldo em Aberto</span>
                                 <p className="text-xl font-black tracking-tight text-rose-500">{formatCurrency(remaining)}</p>
                              </div>
                              <button 
                                onClick={() => {
                                  setIsPaying({ period: viewingDetailPeriod, totalAmount: Number(remaining.toFixed(2)) });
                                  setPayAmount(remaining.toFixed(2).replace('.', ','));
                                  setPayWalletId(wallet.defaultPaymentWalletId || '');
                                }}
                                className="px-4 py-2 bg-rose-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-rose-500/20"
                              >
                                Pagar Restante
                              </button>
                           </div>
                         )}

                         <div className="flex gap-2 pt-2">
                           <button 
                             onClick={() => { setIsAdjusting(viewingDetailPeriod); setAdjustValue(''); }}
                             className="flex-1 py-3 bg-muted/30 hover:bg-muted/50 rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-2 border border-border/20 transition-all"
                           >
                             <Edit3 size={14} /> Ajustar Valor (Extra)
                           </button>
                           <button 
                             onClick={() => { setIsRefunding({ period: viewingDetailPeriod }); setRefundAmount(''); setRefundDate(new Date().toISOString().split('T')[0]); }}
                             className="flex-1 py-3 bg-sky-500/10 hover:bg-sky-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-sky-500 flex items-center justify-center gap-2 border border-sky-500/20 transition-all"
                           >
                             <ArrowUpCircle size={14} /> Cadastrar Estorno
                           </button>
                         </div>
                      </div>

                      {/* Filter Bar */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none px-2">
                         {[
                           { id: 'all', label: 'Todos', count: payments.length + expenses.length + incomes.length },
                           { id: 'expense', label: 'Compras', count: expenses.length },
                           { id: 'payment', label: 'Pagamentos', count: payments.length },
                           { id: 'income', label: 'Estornos', count: incomes.length }
                         ].map(f => (
                           <button
                             key={f.id}
                             onClick={() => setHistoryFilter(f.id as any)}
                             className={cn(
                               "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                               historyFilter === f.id 
                               ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                               : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/50"
                             )}
                           >
                             {f.label} ({f.count})
                           </button>
                         ))}
                      </div>

                      {/* Transactions List */}
                      <div className="space-y-4">
                         {/* Pagamentos Section */}
                         {(historyFilter === 'all' || historyFilter === 'payment') && payments.length > 0 && (
                           <div className="space-y-3">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-2 px-2">
                                 <ArrowRight size={12} /> Pagamentos Realizados ({payments.length})
                              </h4>
                              <div className="space-y-2">
                                 {payments.map(p => (
                                   <div key={p.id} className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center justify-between group">
                                      <div className="flex items-center gap-3">
                                         <div className={cn(
                                           "w-8 h-8 rounded-lg text-white flex items-center justify-center transition-colors shadow-sm",
                                           p.isPaid === false ? "bg-amber-500 shadow-lg shadow-amber-500/20" : "bg-emerald-500"
                                         )}>
                                            {p.isPaid === false ? <AlertTriangle size={16} className="animate-pulse" /> : <ArrowUpCircle size={16} />}
                                         </div>
                                         <div>
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="block text-[11px] font-black uppercase leading-tight break-words">
                                                {wallets.find(w => w.id === p.walletId)?.name || 'Banco'}
                                              </span>
                                              {p.isPaid === false && (
                                                <span className="text-[8px] font-black bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded-full uppercase tracking-widest animate-pulse border border-amber-500/20">Pendente</span>
                                              )}
                                            </div>
                                            <div className="flex flex-col gap-0.5 mt-1">
                                              <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">
                                                Vencimento: {new Date(p.date).toLocaleDateString('pt-BR')}
                                              </span>
                                              {p.isPaid && p.paidDate && (
                                                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest leading-none mt-1">
                                                  Liquidado em: {new Date(p.paidDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                                </span>
                                              )}
                                            </div>
                                         </div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                         <div className="text-right">
                                           <span className={cn("font-black text-sm tracking-tight", p.isPaid === false ? "text-amber-500" : "text-emerald-500")}>
                                             {formatCurrency(p.amount)}
                                           </span>
                                         </div>
                                         <button 
                                            onClick={(e) => { e.stopPropagation(); onEditTransaction(p); }}
                                            className="p-2 text-muted-foreground hover:text-primary transition-colors"
                                            title="Editar Pagamento"
                                          >
                                             <Edit3 size={16} />
                                          </button>
                                          <button 
                                             onClick={async () => { 
                                               const confirmed = await showConfirm(
                                                 'Excluir Pagamento',
                                                 'Tem certeza que deseja excluir permanentemente este pagamento? Isso afetará o saldo da fatura.',
                                                 { variant: 'danger', confirmText: 'Excluir agora' }
                                               );
                                               if (confirmed) deleteTransaction(p.id); 
                                             }}
                                             className="p-2 text-muted-foreground hover:text-rose-500 transition-colors"
                                             title="Excluir Pagamento"
                                           >
                                              <Trash2 size={16} />
                                           </button>
                                      </div>
                                   </div>
                                 ))}
                              </div>
                           </div>
                         )}

                         {/* Estornos Section */}
                         {(historyFilter === 'all' || historyFilter === 'income') && incomes.length > 0 && (
                           <div className="space-y-3">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-500 flex items-center gap-2 px-2">
                                 <ArrowRight size={12} /> Estornos e Créditos ({incomes.length})
                              </h4>
                              <div className="space-y-2">
                                 {incomes.map(inc => {
                                   const category = categories.find(c => c.id === inc.categoryId);
                                   const parentCategory = category?.parentId ? (typeof category.parentId === 'object' ? category.parentId : categories.find(p => p.id === category.parentId)) : null;
                                   const icon = parentCategory?.icon || category?.icon || 'ArrowUpCircle';
                                   
                                   return (
                                     <div key={inc.id} className="p-4 bg-sky-500/5 border border-sky-500/10 rounded-2xl flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                           <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center shadow-sm">
                                              <IconRenderer icon={icon} size={16} color={category?.color || '#0ea5e9'} />
                                           </div>
                                           <div>
                                              <div className="flex items-center gap-2 mb-1">
                                                <span className="block text-[11px] font-black uppercase leading-tight break-words">{inc.description}</span>
                                                <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-500 border border-pink-500/20 shadow-sm tracking-widest">FATURA</span>
                                              </div>
                                              <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">
                                                {new Date(inc.date).toLocaleDateString('pt-BR')}
                                              </span>
                                           </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                           <div className="text-right">
                                             <span className="font-black text-sm tracking-tight text-sky-500">
                                               + {formatCurrency(inc.amount)}
                                             </span>
                                           </div>
                                           <button 
                                              onClick={(e) => { e.stopPropagation(); onEditTransaction(inc); }}
                                              className="p-2 text-muted-foreground hover:text-primary transition-colors"
                                              title="Editar Estorno"
                                            >
                                               <Edit3 size={16} />
                                            </button>
                                            <button 
                                               onClick={async () => { 
                                                 const confirmed = await showConfirm(
                                                   'Excluir Estorno',
                                                   'Tem certeza que deseja excluir este estorno?',
                                                   { variant: 'danger', confirmText: 'Excluir' }
                                                 );
                                                 if (confirmed) deleteTransaction(inc.id); 
                                               }}
                                               className="p-2 text-muted-foreground hover:text-rose-500 transition-colors"
                                               title="Excluir Estorno"
                                             >
                                                <Trash2 size={16} />
                                             </button>
                                        </div>
                                     </div>
                                   );
                                 })}
                              </div>
                           </div>
                         )}

                         {/* Gastos Section */}
                         {(historyFilter === 'all' || historyFilter === 'expense') && expenses.length > 0 && (
                           <div className="space-y-3">
                              <div className="flex items-center justify-between px-2">
                                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                    <ArrowRight size={12} /> Compras no Período ({expenses.length})
                                 </h4>
                                 <button 
                                   onClick={() => onViewTransactions(month, year)}
                                   className="text-[9px] font-black uppercase text-primary bg-primary/10 px-3 py-1.5 rounded-xl hover:bg-primary/20 transition-all flex items-center gap-1.5"
                                 >
                                   Ver Extrato <ChevronRight size={10} />
                                 </button>
                              </div>
                              <div className="space-y-2">
                                 {expenses.map(exp => {
                                   const category = categories.find(c => c.id === exp.categoryId);
                                   const parentCategory = category?.parentId ? (typeof category.parentId === 'object' ? category.parentId : categories.find(p => p.id === category.parentId)) : null;
                                   const icon = parentCategory?.icon || category?.icon || (exp.type === 'planned' ? 'CalendarClock' : 'ArrowDownCircle');

                                   return (
                                     <div key={exp.id} className="p-4 bg-muted/20 border border-border/40 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-3 min-w-0">
                                           <div className={cn(
                                             "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                                             exp.type === 'planned' ? "bg-violet-500/10 text-violet-500" : "bg-rose-500/10 text-rose-500"
                                           )}>
                                              <IconRenderer icon={icon} size={16} color={category?.color} />
                                           </div>
                                           <div className="flex-1 min-w-0">
                                              <div className="flex items-start gap-2 mb-1 flex-wrap">
                                                 <span className="text-[11px] font-black uppercase leading-tight break-words">{exp.description}</span>
                                                 <span className={cn(
                                                   "text-[7px] font-black uppercase px-1 py-0.5 rounded",
                                                   exp.type === 'planned' ? "bg-violet-500/10 text-violet-500 border border-violet-500/10" : "bg-rose-500/10 text-rose-500 border border-rose-500/10"
                                                 )}>
                                                   {exp.type === 'planned' ? 'Planejado' : 'Despesa'}
                                                 </span>
                                              </div>
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">
                                                  {new Date(exp.date).toLocaleDateString('pt-BR')}
                                                </span>
                                                {category && (
                                                  <>
                                                    <span className="text-[8px] text-muted-foreground opacity-30">•</span>
                                                    <span className="text-[8px] font-black uppercase text-muted-foreground/50 tracking-tighter">
                                                      {category.name}
                                                    </span>
                                                  </>
                                                )}
                                              </div>
                                           </div>
                                        </div>
                                         <div className="flex items-center gap-4">
                                            <div className="text-right whitespace-nowrap">
                                              <span className="font-black text-sm tracking-tight">{formatCurrency(exp.amount)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <button 
                                                onClick={(e) => { e.stopPropagation(); onEditTransaction(exp); }}
                                                className="p-2 text-muted-foreground hover:text-primary transition-colors"
                                                title="Editar Lançamento"
                                              >
                                                 <Edit3 size={16} />
                                              </button>
                                              <button 
                                                onClick={async () => { 
                                                  const confirmed = await showConfirm(
                                                    'Excluir Lançamento',
                                                    'Tem certeza que deseja excluir este lançamento?',
                                                    { variant: 'danger', confirmText: 'Excluir' }
                                                  );
                                                  if (confirmed) deleteTransaction(exp.id); 
                                                }}
                                                className="p-2 text-muted-foreground hover:text-rose-500 transition-colors"
                                                title="Excluir Lançamento"
                                              >
                                                 <Trash2 size={16} />
                                              </button>
                                            </div>
                                         </div>
                                     </div>
                                   );
                                 })}
                              </div>
                           </div>
                         )}
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Refund Overlay */}
        <AnimatePresence>
          {isRefunding && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[160] bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
            >
              <div className="w-full space-y-6">
                <div className="text-center space-y-2 relative">
                  <button 
                    onClick={() => setIsRefunding(null)} 
                    className="absolute left-0 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-xl transition-all text-white/50 hover:text-white"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <h3 className="text-xl font-black uppercase tracking-tight text-white line-clamp-1">Cadastrar Estorno</h3>
                  <p className="text-[10px] font-black uppercase text-white/50 tracking-widest italic">
                    Liberar limite do cartão
                  </p>
                </div>

                <div className="space-y-4 bg-white/5 p-6 rounded-[2rem] border border-white/10">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-white/40 ml-2">Valor do Estorno (R$)</label>
                      <input 
                        autoFocus
                        type="text"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(formatCurrencyInput(e.target.value))}
                        placeholder="0,00"
                        className="w-full bg-white/10 border border-white/10 rounded-2xl px-6 py-4 text-white font-black text-2xl tracking-tight outline-none focus:ring-2 focus:ring-sky-500/50 transition-all text-center"
                      />
                   </div>
                   
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-white/40 ml-2">Data do Estorno</label>
                      <input 
                        type="date"
                        value={refundDate}
                        onChange={(e) => setRefundDate(e.target.value)}
                        className="w-full bg-white/10 border border-white/10 rounded-2xl px-6 py-3 text-white font-bold outline-none focus:ring-2 focus:ring-sky-500/50 transition-all text-center"
                      />
                   </div>

                   <div className="p-4 bg-sky-500/10 rounded-2xl border border-sky-500/20">
                      <p className="text-[9px] font-bold text-sky-400 uppercase text-center leading-relaxed">
                        Este estorno será registrado como uma **receita** dentro do cartão, aumentando o limite disponível e reduzindo o valor da fatura selecionada.
                      </p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <button 
                     onClick={() => setIsRefunding(null)}
                     className="py-4 rounded-2xl bg-white/5 text-white/60 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                   >
                     Cancelar
                   </button>
                   <button 
                     onClick={handleRefund}
                     className="py-4 rounded-2xl bg-sky-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-sky-500/20 hover:scale-[1.02] active:scale-95 transition-all text-center"
                   >
                     Confirmar Estorno
                   </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Manual Adjustment Overlay */}
        <AnimatePresence>
          {isAdjusting && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[160] bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
            >
              <div className="w-full space-y-6">
                <div className="text-center space-y-2 relative">
                  <button 
                    onClick={() => setIsAdjusting(null)} 
                    className="absolute left-0 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-xl transition-all text-white/50 hover:text-white"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <h3 className="text-xl font-black uppercase tracking-tight text-white line-clamp-1">Ajustar Valor</h3>
                  <p className="text-[10px] font-black uppercase text-white/50 tracking-widest italic">
                    Referente ao vencimento em {formatDate(isAdjusting.due)}
                  </p>
                </div>

                <div className="space-y-4 bg-white/5 p-6 rounded-[2rem] border border-white/10">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-white/40 ml-2">Valor do Ajuste (R$)</label>
                      <input 
                        autoFocus
                        type="text"
                        value={adjustValue}
                        onChange={(e) => setAdjustValue(formatCurrencyInput(e.target.value))}
                        placeholder="0,00"
                        className="w-full bg-white/10 border border-white/10 rounded-2xl px-6 py-4 text-white font-black text-2xl tracking-tight outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-center"
                      />
                   </div>
                   <div className="p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20 space-y-2">
                      <p className="text-[9px] font-bold text-orange-400 uppercase text-center leading-relaxed">
                        Este ajuste criará um **lançamento extra**. Se desejar alterar ou excluir futuramente, deve fazer diretamente no extrato de lançamentos.
                      </p>
                      <p className="text-[9px] font-bold text-orange-400 uppercase text-center leading-relaxed opacity-60">
                        O valor será adicionado ao saldo já existente da fatura.
                      </p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <button 
                     onClick={() => setIsAdjusting(null)}
                     className="py-4 rounded-2xl bg-white/5 text-white/60 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                   >
                     Cancelar
                   </button>
                   <button 
                     onClick={handleManualAdjustment}
                     className="py-4 rounded-2xl bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all text-center"
                   >
                     Confirmar Ajuste
                   </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Payment Confirmation Overlay */}
        <AnimatePresence>
          {isPaying && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[160] bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
            >
              <div className="w-full space-y-6">
                <div className="text-center space-y-2 relative">
                  <button 
                    onClick={() => setIsPaying(null)} 
                    className="absolute left-0 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-xl transition-all text-white/50 hover:text-white"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <h3 className="text-xl font-black uppercase tracking-tight text-white line-clamp-1">Confirmar Pagamento</h3>
                  <p className="text-[10px] font-black uppercase text-white/50 tracking-widest italic">
                    Fatura de {isPaying.period.due.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </p>
                </div>

                <div className="space-y-4 bg-white/5 p-6 rounded-[2rem] border border-white/10">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-white/40 ml-2">Valor do Pagamento (R$)</label>
                      <input 
                        type="text"
                        value={payAmount}
                        onChange={(e) => setPayAmount(formatCurrencyInput(e.target.value))}
                        placeholder="0,00"
                        className="w-full bg-white/10 border border-white/10 rounded-2xl px-6 py-4 text-white font-black text-2xl tracking-tight outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-center"
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-white/40 ml-2">Conta de Origem</label>
                      <CustomSelect 
                        options={(() => {
                          const filtered = wallets.filter(w => w.type !== 'credit_card' && w.isActive !== false);
                          return [...filtered].sort((a, b) => {
                            const indexA = (orderedAccounts || []).indexOf(a.id);
                            const indexB = (orderedAccounts || []).indexOf(b.id);
                            if (indexA === -1 && indexB === -1) return 0;
                            if (indexA === -1) return 1;
                            if (indexB === -1) return -1;
                            return indexA - indexB;
                          }).map(w => ({ id: w.id, name: w.name, logoUrl: w.logoUrl, type: w.type }));
                        })()}
                        value={payWalletId}
                        onChange={(val) => setPayWalletId(val)}
                        placeholder="Selecionar conta"
                        className="bg-white/10 text-white border-white/10"
                      />
                   </div>

                   <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="text-[10px] font-black uppercase text-emerald-400/60 ml-2">Data do Pagamento</label>
                      <input 
                        type="date"
                        required
                        value={payPaidDate}
                        onChange={(e) => setPayPaidDate(e.target.value)}
                        className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-6 py-3 text-emerald-400 font-bold outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-center"
                      />
                   </div>

                   <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                      <p className="text-[9px] font-bold text-emerald-400 uppercase text-center leading-relaxed">
                        Este lançamento será registrado como uma despesa na conta de origem.<br/>
                        <span className="opacity-60">O limite do cartão será restaurado no valor pago.</span>
                      </p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <button 
                     onClick={() => setIsPaying(null)}
                     className="py-4 rounded-2xl bg-white/5 text-white/60 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                   >
                     Cancelar
                   </button>
                   <button 
                     onClick={handlePayInvoice}
                     className="py-4 rounded-2xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all text-center"
                   >
                     Confirmar Pagamento
                   </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-6 bg-muted/5 border-t border-border/40 shrink-0">
           <button 
             onClick={onClose}
             className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-all"
           >
             Fechar Menu
           </button>
        </div>
      </motion.div>
    </div>
  );
};
