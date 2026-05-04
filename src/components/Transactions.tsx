import React, { useState, useEffect, useMemo } from 'react';
import { useFinance } from '../FinanceContext';
import { useModal } from '../contexts/ModalContext';
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowLeftRight,
  Trash2,
  Calendar,
  CreditCard,
  Tag,
  Edit,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  LayoutGrid,
  List,
  AlertTriangle, 
  Layers,
  CheckCircle2,
  AlertCircle,
  BellRing, 
  Info, 
  XCircle,
  X,
  ArrowRight
} from 'lucide-react';
import { TransactionModal } from './TransactionModal';
import { RefundEditModal } from './RefundEditModal';
import { formatCurrency, formatDate, cn, checkBudgetThreshold, getCategorySpend, getInvoicePeriod, getAvailableYears } from '../lib/utils';
import { Transaction, TransactionType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomSelect } from './ui/CustomSelect';
import { IconRenderer } from './ui/IconRenderer';
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface TransactionsProps {
  initialFilter?: 'all' | 'pending' | 'paid';
  setInitialFilter?: (f: 'all' | 'pending' | 'paid') => void;
  initialTypeFilter?: 'all' | 'income' | 'expense';
  setInitialTypeFilter?: (f: 'all' | 'income' | 'expense') => void;
}

export const Transactions: React.FC<TransactionsProps> = ({ 
  initialFilter, setInitialFilter, 
  initialTypeFilter, setInitialTypeFilter 
}) => {
  const { transactions, categories, wallets, addTransaction, addTransactions, deleteTransaction, updateTransaction } = useFinance();
  const { showConfirm, showAlert } = useModal();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<TransactionType | 'all'>('all');
  const [filterMonth, setFilterMonth] = useState<number | 'all'>(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [viewModeContas, setViewModeContas] = useState<'contas' | 'cartoes'>('contas');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('all');
  const [isFilteringPastPending, setIsFilteringPastPending] = useState(false);
  const [necessityFilter, setNecessityFilter] = useState<'all' | 'necessary' | 'unnecessary' | 'other' | 'planned' | 'invoice'>('all');
  const [showSearchFAB, setShowSearchFAB] = useState(false);

  useEffect(() => {
    const searchInput = document.getElementById('search-input-transactions');
    if (!searchInput) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Mostra o FAB apenas se o campo de busca sumir pelo TOPO da tela
        setShowSearchFAB(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );

    observer.observe(searchInput);
    return () => observer.disconnect();
  }, [searchTerm]); // Re-bind se o input renderizar novamente

  const scrollToSearch = () => {
    const searchInput = document.getElementById('search-input-transactions');
    if (searchInput) {
      searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => searchInput.focus(), 500);
    }
  };


  const pastPendingCount = useMemo(() => {
    const now = new Date();
    const currentM = now.getUTCMonth() + 1;
    const currentY = now.getUTCFullYear();

    return transactions.filter(t => {
      if (t.isPaid !== false) return false;
      const [y, m] = t.date.split('-').map(Number);
      return y < currentY || (y === currentY && m < currentM);
    }).length;
  }, [transactions]);

  // Table Grouping & Bulk Actions State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showPaid, setShowPaid] = useState(true);
  const [showPending, setShowPending] = useState(true);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [viewMode, setViewMode] = useState<'separated' | 'combined'>('separated');

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRefund, setEditingRefund] = useState<Transaction | null>(null);
  const [isRenewing, setIsRenewing] = useState(false);

  // Initial Filter Listener
  useEffect(() => {
    if (initialFilter && initialFilter !== 'all') {
      setShowPaid(initialFilter === 'paid');
      setShowPending(initialFilter === 'pending');
      // Apply type filter if provided
      if (initialTypeFilter && initialTypeFilter !== 'all') {
        setFilter(initialTypeFilter);
        if (setInitialTypeFilter) setInitialTypeFilter('all');
      }
      // Clear the trigger once applied
      if (setInitialFilter) setInitialFilter('all');
    }
  }, [initialFilter, setInitialFilter, initialTypeFilter, setInitialTypeFilter]);

  // Reset selection when filters change to prevent ghosting/stale selections
  useEffect(() => {
    setSelectedIds([]);
    setIsSelectionMode(false);
  }, [filterYear, filterMonth, filter, selectedWalletId, viewModeContas, isFilteringPastPending, necessityFilter, searchTerm]);

  const availableYears = useMemo(() => getAvailableYears(transactions), [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const isPayable = t.type === 'expense' || t.type === 'provision' || t.type === 'planned';
      const matchesFilter = filter === 'all' || 
                           (filter === 'expense' ? isPayable : t.type === filter);

      const category = categories.find(c => c.id === t.categoryId);
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (category?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const [ty_str, tm_str] = t.date.split('-');
      const wallet = wallets.find(w => w.id === t.walletId);
      const isInvoicePayment = t.description.toLowerCase().includes('pagamento de fatura');

      // Lógica para filtro de pendências passadas
      if (isFilteringPastPending) {
          if (t.isPaid !== false) return false;
          if (!matchesFilter) return false;
          
          const now = new Date();
          const curM = now.getUTCMonth() + 1;
          const curY = now.getUTCFullYear();
          const ty = Number(ty_str);
          const tm = Number(tm_str);
          return ty < curY || (ty === curY && tm < curM);
      }

      // Se for Cartões, o filtro de mês/ano é pela fatura (competência)
      // Se for Contas, o filtro é pela data do lançamento (competência)
      let effectiveMonth: number | 'all' = 0;
      let effectiveYear = 0;

      const isCardTx = wallet?.type === 'credit_card' && !isInvoicePayment;

      if (isCardTx && wallet?.closingDay && wallet?.dueDay) {
        // Para cartões, usamos a competência da fatura (invoiceMonth/Year se houver, ou calculamos)
        if (t.invoiceMonth && t.invoiceYear) {
          effectiveMonth = t.invoiceMonth;
          effectiveYear = t.invoiceYear;
        } else {
          const period = getInvoicePeriod(wallet.closingDay, wallet.dueDay, new Date(t.date + 'T12:00:00'));
          effectiveMonth = period.due.getUTCMonth() + 1;
          effectiveYear = period.due.getUTCFullYear();
        }
      } else {
        // Para contas normais, usamos a data do lançamento
        effectiveMonth = Number(tm_str);
        effectiveYear = Number(ty_str);
      }
      
      const matchesYear = effectiveYear === filterYear;
      const matchesMonth = filterMonth === 'all' || effectiveMonth === filterMonth;
      const matchesStatus = (showPaid && t.isPaid) || (showPending && !t.isPaid);
      
      const isBankTx = wallet?.type !== 'credit_card' || isInvoicePayment;

      const matchesWallet = selectedWalletId === 'all' || t.walletId === selectedWalletId || (t.toWalletId && t.toWalletId === selectedWalletId);

      const isRefund = t.type === 'income' && wallet?.type === 'credit_card';

      const matchesNecessity = necessityFilter === 'all' || 
                               (necessityFilter === 'necessary' && !isInvoicePayment && !isRefund && t.type !== 'planned' && t.necessity === 'necessary' && !!t.groupId) ||
                               (necessityFilter === 'unnecessary' && !isInvoicePayment && !isRefund && t.type !== 'planned' && t.necessity === 'unnecessary' && !!t.groupId) ||
                               (necessityFilter === 'other' && !isInvoicePayment && !isRefund && t.type !== 'planned' && !t.groupId) ||
                               (necessityFilter === 'planned' && t.type === 'planned') ||
                               (necessityFilter === 'invoice' && (isInvoicePayment || isRefund));

      if (viewModeContas === 'contas') {
        return matchesFilter && matchesSearch && matchesYear && matchesMonth && matchesStatus && isBankTx && matchesWallet && matchesNecessity;
      } else {
        return matchesFilter && matchesSearch && matchesYear && matchesMonth && matchesStatus && isCardTx && matchesWallet && matchesNecessity;
      }
    }).sort((a, b) => {
      // Primeiro por data (DESC)
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      
      // Se for a mesma data, usamos o created_at (DESC) para manter a ordem da planilha
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });
  }, [transactions, categories, wallets, filter, searchTerm, filterYear, filterMonth, showPaid, showPending, viewModeContas, selectedWalletId, isFilteringPastPending, necessityFilter]);

  const periodStats = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      const isPaid = t.isPaid !== false;
      let amountToAdd = t.amount;
      
      if (filter === 'all') {
        if (t.type === 'transfer') amountToAdd = 0;
        else amountToAdd = (t.type === 'income' ? t.amount : -t.amount);
      }
      
      if (isPaid) {
        acc.paid += amountToAdd;
      } else {
        acc.pending += amountToAdd;
      }
      acc.total += amountToAdd;
      
      return acc;
    }, { paid: 0, pending: 0, total: 0 });
  }, [filteredTransactions, filter]);

  const pendingTransactions = useMemo(() => filteredTransactions.filter(t => t.isPaid === false), [filteredTransactions]);
  const paidTransactions = useMemo(() => filteredTransactions.filter(t => t.isPaid !== false), [filteredTransactions]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = (targetList: Transaction[]) => {
    const allSelected = targetList.length > 0 && targetList.every(t => selectedIds.includes(t.id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !targetList.find(t => t.id === id)));
    } else {
      const newIds = targetList.map(t => t.id).filter(id => !selectedIds.includes(id));
      setSelectedIds(prev => [...prev, ...newIds]);
    }
  };

  const handleBulkDelete = async () => {
    const confirmed = await showConfirm(
      'Excluir Lançamentos',
      `Deseja excluir permanentemente os ${selectedIds.length} lançamentos selecionados?`,
      { variant: 'danger', confirmText: 'Excluir agora' }
    );
    if (confirmed) {
      selectedIds.forEach(id => deleteTransaction(id));
      setSelectedIds([]);
    }
  };

  const handleBulkStatus = async (status: 'paid' | 'pending') => {
    const confirmed = await showConfirm(
      'Alterar Status',
      `Deseja marcar ${selectedIds.length} lançamentos como ${status === 'paid' ? 'pagos' : 'pendentes'}?`,
      { variant: 'info', confirmText: 'Alterar agora' }
    );
    if (confirmed) {
      selectedIds.forEach(id => {
        const tx = transactions.find(t => t.id === id);
        if (tx) updateTransaction(id, { ...tx, isPaid: status === 'paid' });
      });
      setSelectedIds([]);
    }
  };

  const handleToggleSelectionMode = () => {
    if (isSelectionMode) setSelectedIds([]);
    setIsSelectionMode(!isSelectionMode);
  };

  const handleRenewUntilDecember = async (tx: Transaction) => {
    if (isRenewing) return;

    const [y, , d] = tx.date.split('-').map(Number);
    const targetYear = y + 1;

    const confirmed = await showConfirm(
      'Renovar Lançamento',
      `Deseja renovar este lançamento mensal para TODO O ANO de ${targetYear} (Janeiro a Dezembro)?`,
      { variant: 'info', confirmText: 'Renovar Ciclo' }
    );
    
    if (confirmed) {
      setIsRenewing(true);
      try {
        const toAdd: any[] = [];
        
        // Sempre gera 12 meses para o ano seguinte
        for (let m = 1; m <= 12; m++) {
          const monthStr = String(m).padStart(2, '0');
          const monthKey = `${targetYear}-${monthStr}`;
          
          // Verificação de segurança robusta
          const alreadyExists = transactions.some(other => 
            other.description === tx.description && 
            other.walletId === tx.walletId &&
            Math.abs(other.amount - tx.amount) < 0.01 && // Compare numbers precisely
            other.date.startsWith(monthKey) &&
            !other.isDeleted
          );

          if (!alreadyExists) {
            const lastDay = new Date(targetYear, m, 0).getDate();
            const day = Math.min(d, lastDay);
            const newDate = `${targetYear}-${monthStr}-${String(day).padStart(2, '0')}`;
            
            const isLast = (m === 12);
            
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, created_at, category, wallet, ...txData } = tx as any;
            toAdd.push({
              ...txData,
              date: newDate,
              isPaid: false,
              paidDate: null,
              requiresRenewal: isLast,
              isContinuous: true // Mark as continuous if it's a cycle
            });
          }
        }
        
        if (toAdd.length > 0) {
          await addTransactions(toAdd);
          showAlert('Sucesso', `${toAdd.length} lançamentos criados com sucesso para o ano de ${targetYear}.`, 'success');
          // Desativar o botão de renovação no item original para evitar cliques extras
          await updateTransaction(tx.id, { ...tx, requiresRenewal: false });
        } else {
          showAlert('Aviso', `Os lançamentos para o ano de ${targetYear} já existem.`, 'info');
          await updateTransaction(tx.id, { ...tx, requiresRenewal: false });
        }
      } catch (err: any) {
        console.error('Erro detalhado na renovação:', err);
        showAlert('Erro', `Erro ao processar renovação: ${err.message || 'Erro desconhecido'}. Tente novamente.`, 'danger');
      } finally {
        setIsRenewing(false);
      }
    }
  };

  const handleRenewContinuous = async (tx: Transaction) => {
    const confirmed = await showConfirm(
      'Renovar Lançamento Contínuo',
      'Deseja renovar este lançamento contínuo para mais 12 meses (ano seguinte)?',
      { variant: 'info', confirmText: 'Renovar Agora' }
    );
    
    if (confirmed) {
      const baseDate = new Date(tx.date + 'T12:00:00');
      const toAdd: any[] = [];

      for(let i = 1; i <= 12; i++) {
          const currDate = new Date(baseDate);
          currDate.setUTCMonth(currDate.getUTCMonth() + i);
          
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, created_at, category, wallet, ...txData } = tx as any;
          toAdd.push({
            ...txData,
            date: currDate.toISOString().split('T')[0],
            isPaid: false,
            paidDate: null,
            requiresRenewal: i === 12
          });
      }

      try {
        await addTransactions(toAdd);
        await updateTransaction(tx.id, { ...tx, requiresRenewal: false });
        showAlert('Sucesso', 'Lançamento contínuo renovado com sucesso.', 'success');
      } catch (err) {
        console.error('Erro ao renovar lançamento contínuo:', err);
        showAlert('Erro', 'Erro ao renovar. Tente novamente.', 'danger');
      }
    }
  };
  
  const handleEditTransaction = (tx: Transaction) => {
    const isRefund = tx.description?.toLowerCase().includes('estorno');
    if (isRefund) {
      setEditingRefund(tx);
    } else {
      setEditingId(tx.id);
      setIsModalOpen(true);
    }
  };

  const renderTable = (list: Transaction[], isPendingTable: boolean, showStatusBadge: boolean) => (
    <div className="bg-card border rounded-2xl shadow-sm overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider">
              {isSelectionMode && (
                <th className="px-2 sm:px-6 py-3 font-semibold w-10 sm:w-12 text-center">
                  <div className="flex items-center justify-center">
                    <input 
                      title="Selecionar todos"
                      type="checkbox"
                      className="w-4 h-4 rounded-md border-muted text-primary focus:ring-primary cursor-pointer transition-all appearance-none bg-background checked:bg-primary checked:border-primary border-2 relative after:content-['✓'] after:absolute after:inset-0 after:flex after:items-center after:justify-center after:text-white after:text-[10px] after:hidden checked:after:flex"
                      checked={list.length > 0 && list.every(t => selectedIds.includes(t.id))}
                      onChange={() => handleSelectAll(list)}
                    />
                  </div>
                </th>
              )}
              <th className="px-2 sm:px-6 py-3 font-semibold w-12 sm:w-auto"><span className="md:inline hidden">Data</span><span className="md:hidden">Dt.</span></th>
              <th className="px-2 sm:px-6 py-3 font-semibold">Descrição</th>
              <th className="px-6 py-3 font-semibold hidden md:table-cell">Categoria</th>
              <th className="px-6 py-3 font-semibold hidden lg:table-cell">Carteira</th>
              <th className="px-2 sm:px-6 py-3 font-semibold text-right">Valor</th>
              <th className="px-2 sm:px-6 py-3 font-semibold text-center w-20 sm:w-auto">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {list.map((t) => {
              const isInvoicePayment = (t.description?.toLowerCase() || '').includes('pagamento de fatura');
              const wallet = wallets.find(w => w.id === t.walletId);
              const isRefund = t.type === 'income' && wallet?.type === 'credit_card';
              
              return (
                <tr 
                  key={t.id} 
                  className={cn(
                    "hover:bg-accent/50 transition-colors group",
                    selectedIds.includes(t.id) ? "bg-primary/5" : "",
                    (() => {
                      if (selectedIds.includes(t.id)) return "";
                      if (isInvoicePayment) return "";
                      
                      if (t.type === 'income') return 'bg-green-500/10';
                      if (t.type === 'expense') return 'bg-red-500/10';
                      if (t.type === 'transfer') return 'bg-blue-500/10';
                      if (t.type === 'provision') return 'bg-orange-500/10';
                      if (t.type === 'planned') return 'bg-yellow-500/10';
                      return "";
                    })()
                  )}
                >
                {isSelectionMode && (
                  <td className="px-2 sm:px-6 py-2 sm:py-4 text-center">
                    <div className="flex items-center justify-center">
                      <input 
                        type="checkbox"
                        className="w-4 h-4 rounded-md border-muted text-primary focus:ring-primary cursor-pointer transition-all appearance-none bg-background checked:bg-primary checked:border-primary border-2 relative after:content-['✓'] after:absolute after:inset-0 after:flex after:items-center after:justify-center after:text-white after:text-[10px] after:hidden checked:after:flex"
                        checked={selectedIds.includes(t.id)}
                        onChange={() => toggleSelection(t.id)}
                      />
                    </div>
                  </td>
                )}
                <td className="px-2 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm whitespace-nowrap">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Calendar size={12} className="text-muted-foreground shrink-0 hidden sm:block" />
                      <span className="font-bold sm:font-normal text-[10px] sm:text-sm">{formatDate(t.date)}</span>
                    </div>
                    <div className="hidden sm:flex flex-col gap-0.5">
                      {t.isPaid && t.paidDate && wallets.find(w => w.id === t.walletId)?.type !== 'credit_card' && (
                        <span className="text-[8px] sm:text-[9px] font-black text-emerald-500 uppercase tracking-widest ml-4 sm:ml-5">
                          Pago: {new Date(t.paidDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-2 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm font-medium">
                  <div className="flex flex-col">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="leading-tight sm:leading-normal">{t.description}</span>
                      {(isInvoicePayment || isRefund) && (
                        <span className="text-[8px] bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded-md uppercase font-black border border-rose-500/20 shrink-0">Fatura</span>
                      )}
                      {t.type === 'planned' && (
                        <span className="text-[8px] bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded-md uppercase font-black border border-yellow-500/20 shrink-0">Planejada</span>
                      )}
                    </div>
                    
                    {/* Mobile consolidated info */}
                    <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1 md:hidden">
                       {(() => {
                          const category = categories.find(c => c.id === t.categoryId);
                          
                          return (
                            <>
                              {category && (
                                <div className="flex items-center gap-1 bg-muted/50 px-1 py-0.5 rounded border border-border/20">
                                  <IconRenderer 
                                    icon={category.parentId ? (typeof category.parentId === 'object' ? (category.parentId as any).icon : categories.find(p => p.id === category.parentId)?.icon) || category.icon : category.icon} 
                                    color={category.color} 
                                    size={10} 
                                    className="shrink-0"
                                  />
                                  <span className="text-[8px] font-black uppercase text-muted-foreground/80">{category.name}</span>
                                </div>
                              )}
                              {(() => {
                                 const showDouble = isInvoicePayment || t.type === 'transfer' || t.type === 'provision';
                                 if (!showDouble) {
                                   const w = wallets.find(item => item.id === t.walletId);
                                   if (!w) return null;
                                   return (
                                     <div className="flex flex-col">
                                       <div className="flex items-center gap-1 bg-muted/50 px-1 py-0.5 rounded border border-border/20">
                                         <IconRenderer icon={w.logoUrl || w.icon || 'wallet'} color={w.color} size={10} className="shrink-0" />
                                         <span className="text-[8px] font-black uppercase text-primary/80">{w.name}</span>
                                       </div>
                                       {w.type === 'credit_card' && t.invoiceMonth && t.invoiceYear && (
                                         <span className="text-[7px] font-bold text-orange-500 uppercase tracking-tighter mt-0.5 ml-1">
                                           Fatura {MONTH_NAMES[t.invoiceMonth - 1].substring(0, 3)}/{t.invoiceYear.toString().slice(-2)}
                                         </span>
                                       )}
                                     </div>
                                   );
                                 }

                                 const sourceW = wallets.find(item => item.id === t.walletId);
                                 const destW = wallets.find(item => item.id === t.toWalletId);

                                 return (
                                   <div className="flex items-center gap-1 flex-wrap">
                                       {sourceW && (
                                         <div className="flex flex-col">
                                           <div className="flex items-center gap-1 bg-muted/50 px-1 py-0.5 rounded border border-border/20">
                                             <IconRenderer icon={sourceW.logoUrl || sourceW.icon || 'wallet'} color={sourceW.color} size={10} className="shrink-0" />
                                             <span className="text-[8px] font-black uppercase text-primary/80">{sourceW.name}</span>
                                           </div>
                                           {sourceW.type === 'credit_card' && t.invoiceMonth && t.invoiceYear && (
                                             <span className="text-[7px] font-bold text-orange-500 uppercase tracking-tighter mt-0.5 ml-1">
                                               Fatura {MONTH_NAMES[t.invoiceMonth - 1].substring(0, 3)}/{t.invoiceYear.toString().slice(-2)}
                                             </span>
                                           )}
                                         </div>
                                       )}
                                      {(sourceW && destW) && <ArrowRight size={8} className="text-muted-foreground" />}
                                      {destW && (
                                        <div className="flex items-center gap-1 bg-muted/50 px-1 py-0.5 rounded border border-border/20">
                                          <IconRenderer icon={destW.logoUrl || destW.icon || 'wallet'} color={destW.color} size={10} className="shrink-0" />
                                          <span className="text-[8px] font-black uppercase text-primary/80">{destW.name}</span>
                                        </div>
                                      )}
                                   </div>
                                 );
                               })()}
                            </>
                          );
                       })()}
                    </div>

                    <div className="flex flex-wrap gap-1 mt-1">
                      {filter === 'all' && (
                        <>
                          {t.type === 'income' && <span className="text-[8px] sm:text-[9px] bg-green-500/10 text-green-500 px-1 py-0.5 rounded uppercase font-black border border-green-500/20">Rec.</span>}
                          {t.type === 'expense' && <span className="text-[8px] sm:text-[9px] bg-red-500/10 text-red-500 px-1 py-0.5 rounded uppercase font-black border border-red-500/20">Desp.</span>}
                          {t.type === 'transfer' && <span className="text-[8px] sm:text-[9px] bg-blue-500/10 text-blue-500 px-1 py-0.5 rounded uppercase font-black border border-blue-500/20">Transf.</span>}
                        </>
                      )}
                      {t.requiresRenewal && <span className="text-[8px] sm:text-[9px] bg-rose-500/10 text-rose-500 px-1 py-0.5 rounded uppercase font-black border border-rose-500/20">Anual</span>}
                      {t.groupId && t.type === 'expense' && !isInvoicePayment && (
                        <span className={cn(
                          "text-[8px] sm:text-[9px] px-1 py-0.5 rounded uppercase font-black border",
                          t.necessity === 'necessary' 
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                            : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        )}>
                          {t.necessity === 'necessary' ? 'Nec.' : 'Desnec.'}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm hidden md:table-cell">
                  {!['transfer', 'provision'].includes(t.type) && !isInvoicePayment ? (
                    <div className="flex items-center gap-2">
                      {(() => {
                        const category = categories.find(c => c.id === t.categoryId);
                        if (!category) return <span className="text-muted-foreground italic text-[10px] opacity-40">Sem categoria</span>;
                        const parentCategory = category.parentId ? (typeof category.parentId === 'object' ? category.parentId : categories.find(p => p.id === category.parentId)) : null;
                        const icon = parentCategory?.icon || category.icon;
                        return (
                          <div className="flex items-center gap-2">
                             <IconRenderer icon={icon} color={category.color} size={20} className="rounded-lg shadow-sm border border-border/30" />
                             <div className="flex flex-col">
                               <span className="text-xs font-black uppercase tracking-tighter opacity-80">{category.name}</span>
                             </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic text-[11px] opacity-60">Automático</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm hidden lg:table-cell">
                  <div className="flex flex-col gap-1">
                    {(() => {
                      const showDouble = isInvoicePayment || t.type === 'transfer' || t.type === 'provision';
                      if (!showDouble) {
                        const w = wallets.find(item => item.id === t.walletId);
                        if (!w) return <span className="text-muted-foreground italic text-xs">Carteira Excluída</span>;
                         return (
                           <div className="flex flex-col">
                             <div className="flex items-center gap-2">
                               <IconRenderer icon={w.logoUrl || w.icon || 'wallet'} color={w.color} size={20} className="shrink-0 border border-border/10 shadow-sm rounded-md" />
                               <span className="font-bold text-xs uppercase tracking-tight">{w.name}</span>
                             </div>
                             {w.type === 'credit_card' && t.invoiceMonth && t.invoiceYear && (
                               <span className="text-[9px] font-bold text-orange-500 uppercase tracking-tighter mt-1">
                                 Fatura {MONTH_NAMES[t.invoiceMonth - 1].substring(0, 3)}/{t.invoiceYear.toString().slice(-2)}
                               </span>
                             )}
                           </div>
                         );
                      }

                      const sourceW = wallets.find(item => item.id === t.walletId);
                      const destW = wallets.find(item => item.id === t.toWalletId);

                      return (
                        <div className="flex flex-col gap-1.5">
                          {sourceW && (
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <IconRenderer icon={sourceW.logoUrl || sourceW.icon || 'wallet'} color={sourceW.color} size={16} className="shrink-0 border border-border/10 rounded-md" />
                                <span className="font-bold text-[10px] uppercase tracking-tight opacity-80">{sourceW.name}</span>
                              </div>
                              {sourceW.type === 'credit_card' && t.invoiceMonth && t.invoiceYear && (
                                <span className="text-[8px] font-bold text-orange-500 uppercase tracking-tighter mt-0.5">
                                  Fatura {MONTH_NAMES[t.invoiceMonth - 1].substring(0, 3)}/{t.invoiceYear.toString().slice(-2)}
                                </span>
                              )}
                            </div>
                          )}
                          {(sourceW && destW) && <ArrowRight size={10} className="text-muted-foreground ml-1" />}
                          {destW && (
                            <div className="flex items-center gap-2">
                              <IconRenderer icon={destW.logoUrl || destW.icon || 'wallet'} color={destW.color} size={16} className="shrink-0 border border-border/10 rounded-md" />
                              <span className="font-bold text-[10px] uppercase tracking-tight opacity-80">{destW.name}</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </td>
                <td className={cn(
                  "px-2 sm:px-6 py-2 sm:py-4 text-[11px] sm:text-sm font-black text-right whitespace-nowrap",
                  isInvoicePayment ? "text-red-500" :
                  (t.type === 'income' || (t.toWalletId && wallets.find(w => w.id === t.toWalletId)?.type === 'credit_card')) ? "text-green-500" : 
                  t.type === 'expense' ? "text-red-500" : 
                  t.type === 'transfer' ? "text-blue-500" :
                  t.type === 'provision' ? "text-orange-500" :
                  "text-yellow-500"
                )}>
                  <div className="flex flex-col items-end leading-tight">
                    <span>
                      {isInvoicePayment ? '-' : (t.type === 'income' || (t.toWalletId && wallets.find(w => w.id === t.toWalletId)?.type === 'credit_card')) ? '+' : ["expense", "provision", "planned"].includes(t.type) ? '-' : ''}
                      {formatCurrency(t.amount)}
                    </span>
                    {t.type === 'planned' && (
                      <span className="text-[8px] sm:text-[9px] font-bold text-yellow-500 uppercase tracking-tighter">
                        Planejada
                      </span>
                    )}
                    {t.recurrenceNumber && (
                      <span className="text-[8px] sm:text-[9px] font-bold text-orange-500 uppercase tracking-tighter">
                        {t.recurrenceNumber.current} de {t.recurrenceNumber.total}
                      </span>
                    )}
                    {t.isContinuous && (
                      <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-tighter flex items-center gap-1">
                        <RefreshCw size={8} /> Ciclo
                      </span>
                    )}
                    {t.isPaid === false && <span className="text-[7px] font-black uppercase text-amber-500 md:hidden tracking-tighter">Pendente</span>}
                  </div>
                </td>
                <td className="px-2 sm:px-6 py-2 sm:py-4 text-center">
                  <div className="flex justify-center gap-1 sm:gap-2">
                    {(() => {
                        const wallet = wallets.find(w => w.id === t.walletId);
                        if (wallet?.type === 'credit_card') return null;
                        return (
                          <button
                            onClick={() => updateTransaction(t.id, { ...t, isPaid: t.isPaid === false ? true : false })}
                            className={cn(
                              "p-1.5 sm:p-2 rounded-lg transition-all",
                              t.isPaid === false ? "text-amber-500 hover:bg-amber-500/10" : "text-green-500 hover:bg-green-500/10"
                            )}
                          >
                            {t.isPaid === false ? <ThumbsDown size={14} className="sm:w-[18px] sm:h-[18px]" /> : <ThumbsUp size={14} className="sm:w-[18px] sm:h-[18px]" />}
                          </button>
                        );
                    })()}
                    {(() => {
                      const isDecember = t.date.split('-')[1] === '12';
                      
                      // O botão aparece apenas em lançamentos de Dezembro que fazem parte de um ciclo
                      if (t.isContinuous && isDecember) {
                        return (
                          <button 
                            onClick={() => handleRenewUntilDecember(t)}
                            className="p-1.5 sm:p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Renovar Ciclo (Próximo Ano)"
                          >
                            <RefreshCw size={14} className="sm:w-[18px] sm:h-[18px]" />
                          </button>
                        );
                      }
                      return null;
                    })()}
                    <button 
                      onClick={() => handleEditTransaction(t)}
                      className="p-1.5 sm:p-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
                    >
                      <Edit size={14} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                    <button 
                      onClick={async () => {
                        const confirmed = await showConfirm(
                          'Excluir Lançamento',
                          'Tem certeza que deseja excluir este lançamento?',
                          { variant: 'danger', confirmText: 'Excluir' }
                        );
                        if (confirmed) deleteTransaction(t.id);
                      }}
                      className="p-1.5 sm:p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                    >
                      <Trash2 size={14} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
            {list.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                  Nenhum lançamento encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );


  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-[2rem] border border-border shadow-sm animate-in slide-in-from-top-4 duration-700">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground flex items-center gap-3">
            Lançamentos
          </h1>
          <p className="text-muted-foreground text-sm font-medium leading-none mt-1">Gerencie suas receitas, despesas e transferências financeiros</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center p-1 bg-muted/50 rounded-2xl border border-border/30 h-14 shadow-inner w-full sm:w-auto">
            <button
               onClick={() => { setViewModeContas('contas'); setViewMode('separated'); }}
               className={cn(
                 "flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-6 h-full rounded-xl transition-all text-[10px] font-black uppercase tracking-widest whitespace-nowrap",
                 viewModeContas === 'contas' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:bg-muted"
               )}
            >
               <LayoutGrid size={14} /> Geral
            </button>
            <button
               onClick={() => { setViewModeContas('cartoes'); setViewMode('combined'); }}
               className={cn(
                 "flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-6 h-full rounded-xl transition-all text-[10px] font-black uppercase tracking-widest whitespace-nowrap",
                 viewModeContas === 'cartoes' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:bg-muted"
               )}
            >
               <CreditCard size={14} /> Cartões
            </button>
          </div>
          <button 
            onClick={() => {
              setEditingId(null);
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 sm:px-8 h-14 rounded-2xl bg-primary text-white hover:scale-105 transition-all shadow-lg shadow-primary/25 text-xs font-black uppercase tracking-widest active:scale-95 whitespace-nowrap"
          >
            <Plus size={18} />
            Novo Lançamento
          </button>
        </div>
      </div>

      <AnimatePresence>
        {pastPendingCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-tight text-amber-700 dark:text-amber-400">Atenção: Pendências de Meses Anteriores</h4>
                  <p className="text-[10px] font-bold text-amber-600/80 dark:text-amber-500/60 uppercase">
                    Você possui {pastPendingCount} {pastPendingCount === 1 ? 'lançamento pendente' : 'lançamentos pendentes'} de meses passados que ainda não foram liquidados.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsFilteringPastPending(true);
                  setFilterMonth('all');
                }}
                className="px-4 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
              >
                Visualizar Tudo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFilteringPastPending && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between bg-primary/10 border border-primary/20 p-3 rounded-2xl"
          >
            <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
              <Filter size={14} />
              <span>Filtro Ativo: Pendências de meses anteriores</span>
            </div>
            <button 
              onClick={() => {
                setIsFilteringPastPending(false);
                setFilterMonth(new Date().getMonth() + 1);
                setFilterYear(new Date().getFullYear());
              }}
              className="text-[10px] font-black text-primary bg-primary/20 hover:bg-primary/30 px-3 py-1 rounded-lg uppercase transition-all"
            >
              Limpar Filtro
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-card/30 p-4 rounded-3xl border border-border/40 backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground opacity-40" size={18} />
          <input 
            id="search-input-transactions"
            type="text" 
            placeholder="Buscar lançamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-muted/20 border border-border/30 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium"
          />
        </div>
        <div className="flex items-center w-full md:w-auto">
          <div className="flex gap-1 bg-muted/40 p-1 border border-border/30 rounded-2xl overflow-x-auto w-full md:max-w-full shadow-inner scrollbar-hide">
            {(['all', 'income', 'expense', 'transfer', 'provision', 'planned'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  filter === f 
                    ? f === 'all' ? "bg-background text-primary shadow-sm"
                    : f === 'income' ? "bg-green-500 text-white shadow-sm"
                    : f === 'expense' ? "bg-red-500 text-white shadow-sm"
                    : f === 'transfer' ? "bg-blue-500 text-white shadow-sm"
                    : f === 'provision' ? "bg-orange-500 text-white shadow-sm"
                    : "bg-yellow-500 text-white shadow-sm"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {f === 'all' ? 'Todos' : f === 'income' ? 'Receitas' : f === 'expense' ? 'Despesas' : f === 'transfer' ? 'Transf.' : f === 'provision' ? 'Provisões' : 'Planejadas'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-card border rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {viewModeContas === 'contas' && (
            <div className="flex bg-muted/50 border rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('separated')}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  viewMode === 'separated' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
                title="Visão Separada"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('combined')}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  viewMode === 'combined' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
                title="Lista Única"
              >
                <List size={18} />
              </button>
            </div>
          )}
          <div className="flex-1 sm:flex-none min-w-[140px] sm:min-w-[200px]">
            <CustomSelect 
              options={[
                { id: 'all', name: viewModeContas === 'cartoes' ? 'Todos os Cartões' : 'Geral (Contas)', icon: 'Layers' },
                ...wallets
                  .filter(w => (viewModeContas === 'cartoes' ? w.type === 'credit_card' : w.type !== 'credit_card') && w.isActive !== false)
                  .map(w => ({
                    id: w.id,
                    name: w.name,
                    icon: w.logoUrl || w.icon || (w.type === 'credit_card' ? 'CreditCard' : 'Wallet'),
                    color: w.color
                  }))
              ]}
              value={selectedWalletId}
              onChange={(val) => setSelectedWalletId(val)}
              placeholder={viewModeContas === 'cartoes' ? "Selecionar Cartão" : "Selecionar Conta"}
            />
          </div>
          <div className="flex-1 sm:flex-none min-w-[80px] sm:min-w-[120px]">
            <CustomSelect 
              options={availableYears.map(year => ({ id: year.toString(), name: year.toString() }))}
              value={filterYear.toString()}
              onChange={(val) => setFilterYear(Number(val))}
              placeholder="Ano"
            />
          </div>
          <div className="flex-1 sm:flex-none min-w-[100px] sm:min-w-[150px]">
            <CustomSelect 
              options={[
                { id: 'all', name: 'Ano Todo' },
                ...Array.from({length: 12}, (_, i) => ({
                  id: (i + 1).toString(),
                  name: new Date(0, i).toLocaleString('pt-BR', { month: 'long' })
                }))
              ]}
              value={filterMonth.toString()}
              onChange={(val) => setFilterMonth(val === 'all' ? 'all' : Number(val))}
              placeholder="Mês"
            />
          </div>
          <div className="flex-1 sm:flex-none min-w-[140px] sm:min-w-[180px]">
            <CustomSelect 
              options={[
                { id: 'all', name: 'Todas Classificações', icon: 'Layers' },
                { id: 'necessary', name: 'Nec. Recorrente', color: '#10b981', icon: 'CheckCircle2' },
                { id: 'unnecessary', name: 'Desnec. Recorrente', color: '#f59e0b', icon: 'AlertCircle' },
                { id: 'other', name: 'Variáveis / Outros', color: '#666', icon: 'Tag' },
                { id: 'invoice', name: 'Faturas', color: '#ec4899', icon: 'CreditCard' },
                { id: 'planned', name: 'Compras Planejadas', color: '#eab308', icon: 'CalendarDays' }
              ]}
              value={necessityFilter}
              onChange={(val) => setNecessityFilter(val as any)}
              placeholder="Classificação"
            />
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-1">
          {filter !== 'all' && viewModeContas === 'contas' ? (
            <>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Liquidado</span>
                <span className={cn("text-sm font-black", 
                  filter === 'income' ? "text-emerald-500" : 
                  filter === 'expense' ? "text-rose-500" :
                  filter === 'transfer' ? "text-blue-500" :
                  filter === 'provision' ? "text-orange-500" :
                  "text-primary"
                )}>
                  {formatCurrency(periodStats.paid)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Pendente</span>
                <span className="text-sm font-black text-amber-500">
                  {formatCurrency(periodStats.pending)}
                </span>
              </div>
              <div className="border-t border-border/50 pt-1 mt-1 flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Total do Período</span>
                <span className={cn("text-lg font-black", 
                  filter === 'income' ? "text-emerald-600" : 
                  filter === 'expense' ? "text-rose-600" :
                  filter === 'transfer' ? "text-blue-600" :
                  filter === 'provision' ? "text-orange-600" :
                  "text-foreground"
                )}>
                  {formatCurrency(periodStats.total)}
                </span>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Total do Período</p>
              <p className={cn("text-xl font-black", 
                filter === 'all' ? (periodStats.total >= 0 ? "text-green-500" : "text-red-500") :
                filter === 'income' ? "text-green-500" :
                filter === 'expense' ? "text-red-500" :
                filter === 'transfer' ? "text-blue-500" :
                filter === 'provision' ? "text-orange-500" :
                "text-yellow-500"
              )}>
                {formatCurrency(periodStats.total)}
              </p>
            </>
          )}
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-primary/5 border-primary/20 border p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 shadow-sm animate-in fade-in zoom-in-95 duration-200">
          <span className="font-bold text-primary flex items-center gap-2">
            <span className="bg-primary text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">{selectedIds.length}</span>
            Selecionados
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => handleBulkStatus('paid')} className="text-xs font-bold uppercase bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition shadow-sm">Marcar como Pago/Recebido</button>
            <button onClick={() => handleBulkStatus('pending')} className="text-xs font-bold uppercase bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition shadow-sm">Marcar Aguardando</button>
            <button onClick={handleBulkDelete} className="text-xs font-bold uppercase bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition shadow-sm">Excluir</button>
          </div>
        </div>
      )}

      {/* Transactions Lists - Key forces re-mount on filter change to prevent DOM ghosting */}
      <div 
        key={`${filterYear}-${filterMonth}-${viewModeContas}-${selectedWalletId}-${isFilteringPastPending}-${necessityFilter}`}
        className="space-y-4"
      >
        {viewMode === 'separated' ? (
          <>
            <div>
              <div 
                className="flex flex-wrap items-center justify-between cursor-pointer group bg-muted/30 p-3 rounded-xl border border-transparent hover:border-border transition-all"
                onClick={() => setShowPending(!showPending)}
              >
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    Aguardando ({pendingTransactions.length})
                  </h2>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleToggleSelectionMode(); }}
                    className={cn(
                      "text-xs font-bold px-3 py-1 rounded-lg border transition-all",
                      isSelectionMode ? "bg-primary/20 border-primary text-primary" : "bg-card text-muted-foreground border-border hover:text-foreground"
                    )}
                  >
                    {isSelectionMode ? 'Sair da Seleção' : 'Selecionar'}
                  </button>
                </div>
                <button className="text-sm font-bold text-primary px-4 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
                  {showPending ? 'Ocultar lançamentos' : 'Ver lançamentos'}
                </button>
              </div>
              {showPending && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  {renderTable(pendingTransactions, true, false)}
                </div>
              )}
            </div>

            <div>
              <div 
                className="flex flex-wrap items-center justify-between cursor-pointer group bg-muted/30 p-3 rounded-xl border border-transparent hover:border-border transition-all"
                onClick={() => setShowPaid(!showPaid)}
              >
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-bold flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                    <span className="w-3 h-3 rounded-full bg-green-500" />
                    Liquidados: Pagos e Recebidos ({paidTransactions.length})
                  </h2>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleToggleSelectionMode(); }}
                    className={cn(
                      "text-xs font-bold px-3 py-1 rounded-lg border transition-all",
                      isSelectionMode ? "bg-primary/20 border-primary text-primary" : "bg-card text-muted-foreground border-border hover:text-foreground"
                    )}
                  >
                    {isSelectionMode ? 'Sair da Seleção' : 'Selecionar'}
                  </button>
                </div>
                <button className="text-sm font-bold text-primary px-4 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
                  {showPaid ? 'Ocultar lançamentos' : 'Ver lançamentos'}
                </button>
              </div>
              {showPaid && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  {renderTable(paidTransactions, false, false)}
                </div>
              )}
            </div>
          </>
        ) : (
          <div>
            <div className="flex flex-wrap items-center justify-between bg-muted/30 p-3 rounded-xl border border-transparent mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                <span className="w-3 h-3 rounded-full bg-primary" />
                Todos os Lançamentos ({filteredTransactions.length})
              </h2>
              <button 
                onClick={() => handleToggleSelectionMode()}
                className={cn(
                  "text-xs font-bold px-3 py-1 rounded-lg border transition-all",
                  isSelectionMode ? "bg-primary/20 border-primary text-primary" : "bg-card text-muted-foreground border-border hover:text-foreground"
                )}
              >
                {isSelectionMode ? 'Sair da Seleção' : 'Selecionar'}
              </button>
            </div>
            {renderTable(filteredTransactions, false, true)}
          </div>
        )}
      </div>

      <TransactionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingTransaction={editingId ? transactions.find(t => t.id === editingId) : null}
      />
      {editingRefund && (
        <RefundEditModal
          isOpen={!!editingRefund}
          onClose={() => setEditingRefund(null)}
          transaction={editingRefund}
          onSave={updateTransaction}
          wallets={wallets}
          categories={categories}
        />
      )}

      <FloatingSearchFAB show={showSearchFAB} onAction={scrollToSearch} />
    </div>
  );
};

export const FloatingSearchFAB = ({ show, onAction }: { show: boolean, onAction: () => void }) => (
  <AnimatePresence>
    {show && (
      <motion.button
        initial={{ opacity: 0, scale: 0.5, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.5, y: -20 }}
        onClick={onAction}
        className="fixed top-24 right-6 lg:top-8 lg:right-8 z-[110] w-12 h-12 bg-primary text-white rounded-full shadow-lg shadow-primary/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
        title="Buscar"
      >
        <Search size={20} />
      </motion.button>
    )}
  </AnimatePresence>
);
