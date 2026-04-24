import React, { useState, useEffect, useMemo } from 'react';
import { useFinance } from '../FinanceContext';
import { useModal } from '../contexts/ModalContext';
import { WalletModal } from './WalletModal';
import { WalletActionsModal } from './WalletActionsModal';
import { CustomSelect } from './ui/CustomSelect';
import { IconRenderer } from './ui/IconRenderer';
import { formatCurrency, cn, getInvoicePeriod, getInvoiceAmount, getOpenInvoicePeriod, formatDate, getAvailableYears } from '../lib/utils';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { Wallet, Transaction, TransactionType } from '../types';
import { FloatingSearchFAB } from './Transactions';
import { TransactionModal } from './TransactionModal';
import { RefundEditModal } from './RefundEditModal';
import {
  Plus,
  CreditCard as CardIcon,
  Building2,
  Wallet as WalletIcon,
  ChevronRight,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  CalendarCheck,
  CalendarDays,
  ShieldCheck,
  X,
  Search,
  History as HistoryIcon,
  ArrowRightLeft,
  CalendarCheck2,
  PieChart,
  Tag,
  Trash2,
  PiggyBank,
  Edit3,
  ThumbsUp,
  ThumbsDown,
  Edit,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Check,
  Filter,
  LayoutGrid,
  List,
  CalendarClock,
  TrendingUp,
  TrendingDown,
  ArrowUpCircle,
  ArrowLeftRight,
  Clock,
  GripVertical
} from 'lucide-react';

const OrganizeItem: React.FC<{
  id: string;
  wallet: Wallet;
}> = ({ id, wallet }) => {
  const controls = useDragControls();

  return (
    <Reorder.Item
      key={id}
      value={id}
      dragListener={false}
      dragControls={controls}
      className="bg-card border rounded-2xl p-4 flex items-center gap-4 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow select-none group"
      whileDrag={{ scale: 1.02, zIndex: 50, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
    >
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
        <IconRenderer icon={wallet.logoUrl || wallet.icon || 'wallet'} color={wallet.color} size={wallet.logoUrl ? 48 : 24} className="object-cover w-full h-full" />
      </div>
      <div className="flex-1 flex flex-col truncate">
        <span className="font-black uppercase tracking-tight leading-none truncate mb-1 text-sm">{wallet.name}</span>
        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
          {wallet.type === 'credit_card' ? 'Cartão' :
            (wallet.walletCategory || 'checking') === 'checking' ? 'Corrente' :
              (wallet.walletCategory || 'checking') === 'savings' ? 'Cofrinho' : 'Lista de Desejos'}
        </span>
      </div>
      <div
        onPointerDown={(e) => controls.start(e)}
        className="p-3 text-muted-foreground/40 group-hover:text-primary transition-colors cursor-grab active:cursor-grabbing bg-muted/30 rounded-lg touch-none"
      >
        <GripVertical size={20} />
      </div>
    </Reorder.Item>
  );
};

export const Wallets: React.FC = () => {
  const { wallets, transactions, categories, updateTransaction, deleteTransaction, toggleWalletActive, deleteWallet, orderedCards, orderedAccounts, saveWalletOrder } = useFinance();
  const { showConfirm, showAlert } = useModal();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [viewingTransactionsId, setViewingTransactionsId] = useState<string | null>(null);
  const [previousActioningWalletId, setPreviousActioningWalletId] = useState<string | null>(null);
  const [activeTxTypeFilter, setActiveTxTypeFilter] = React.useState<'all' | TransactionType>('all');
  const [selectedTxIds, setSelectedTxIds] = React.useState<string[]>([]);
  const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null);
  const [editingRefund, setEditingRefund] = React.useState<Transaction | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = React.useState(false);
  const [editingWallet, setEditingWallet] = React.useState<Wallet | null>(null);
  const [walletModalType, setWalletModalType] = React.useState<'bank' | 'credit_card'>('bank');

  // Wallet Action State
  const [selectedWalletForAction, setSelectedWalletForAction] = React.useState<Wallet | null>(null);
  const [isActionsModalOpen, setIsActionsModalOpen] = React.useState(false);
  const [paymentFilter, setPaymentFilter] = React.useState<'all' | 'paid' | 'pending'>('all');
  const [monthFilter, setMonthFilter] = React.useState<number>(new Date().getUTCMonth() + 1);
  const [yearFilter, setYearFilter] = React.useState<number>(new Date().getUTCFullYear());
  const [invoiceMonthFilter, setInvoiceMonthFilter] = React.useState<number>(new Date().getMonth() + 1);
  const [invoiceYearFilter, setInvoiceYearFilter] = React.useState<number>(new Date().getFullYear());
  const [showInactiveBanks, setShowInactiveBanks] = React.useState(false);
  const [showInactiveCards, setShowInactiveCards] = React.useState(false);
  const [isWalletsExpanded, setIsWalletsExpanded] = React.useState(false);
  const [isCardsExpanded, setIsCardsExpanded] = React.useState(false);
  const [isOrganizeModalOpen, setIsOrganizeModalOpen] = useState(false);
  const [organizeTab, setOrganizeTab] = useState<'credit_card' | 'checking' | 'savings' | 'wishlist'>('credit_card');
  const [tempOrderedCards, setTempOrderedCards] = useState<string[]>([]);
  const [tempOrderedAccounts, setTempOrderedAccounts] = useState<string[]>([]);
  const [showSearchFAB, setShowSearchFAB] = useState(false);

  useEffect(() => {
    const searchInput = document.getElementById('search-input-wallets');
    if (!searchInput) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowSearchFAB(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );

    observer.observe(searchInput);
    return () => observer.disconnect();
  }, [searchTerm]);

  useEffect(() => {
    if (isOrganizeModalOpen) {
      setTempOrderedCards(orderedCards);
      setTempOrderedAccounts(orderedAccounts);
    }
  }, [isOrganizeModalOpen, orderedCards, orderedAccounts]);

  const scrollToSearch = () => {
    const searchInput = document.getElementById('search-input-wallets');
    if (searchInput) {
      searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => searchInput.focus(), 500);
    }
  };


  // Initialize temp order when modal opens
  useEffect(() => {
    if (isOrganizeModalOpen) {
      setTempOrderedCards([...orderedCards]);
      setTempOrderedAccounts([...orderedAccounts]);
    }
  }, [isOrganizeModalOpen, orderedCards, orderedAccounts]);




  // --- SUMMARIES ---
  const totalCreditInvoices = useMemo(() => {
    const now = new Date();
    return wallets
      .filter(w => w.type === 'credit_card' && w.isActive !== false && !w.isDeleted)
      .reduce((sum, w) => {
        // Encontrar todos os meses/anos únicos nas transações deste cartão
        const relevantInvoices = new Set<string>();
        transactions.forEach(t => {
          if (t.walletId === w.id && t.invoiceMonth && t.invoiceYear) {
            relevantInvoices.add(`${t.invoiceMonth}-${t.invoiceYear}`);
          }
        });

        let cardPendingSum = 0;
        relevantInvoices.forEach(key => {
          const [month, year] = key.split('-').map(Number);
          const dueDate = new Date(Date.UTC(year, month - 1, w.dueDay || 15));

          // Calcular o fim do ciclo (fechamento) para esta fatura
          // Se vencimento < fechamento, fechou no mês anterior ao vencimento
          const closingMonthOffset = (w.dueDay || 15) < (w.closingDay || 5) ? -1 : 0;
          const closingDate = new Date(Date.UTC(year, month - 1 + closingMonthOffset, w.closingDay || 5, 23, 59, 59));

          // Se a fatura já fechou (hoje > fechamento)
          if (now > closingDate) {
            const info = getInvoiceAmount(transactions, w.id, { start: new Date(0), end: closingDate, due: dueDate });
            // Se ainda não foi totalmente paga
            if (!info.isLastPaid) {
              cardPendingSum += Math.max(0, info.amount - info.paidSum);
            }
          }
        });

        return sum + cardPendingSum;
      }, 0);
  }, [wallets, transactions]);

  const totalAccountsBalance = useMemo(() => {
    return wallets
      .filter(w => w.type !== 'credit_card' && w.isActive !== false && !w.isDeleted)
      .reduce((sum, w) => sum + (w.balance || 0), 0);
  }, [wallets]);

  const accountTypeTotals = useMemo(() => {
    const totals = {
      checking: 0,
      savings: 0,
      wishlist: 0
    };

    wallets.forEach(w => {
      if (w.type === 'credit_card' || w.isActive === false || w.isDeleted) return;
      const cat = w.walletCategory || 'checking';
      if (cat === 'checking') totals.checking += (w.balance || 0);
      else if (cat === 'savings') totals.savings += (w.balance || 0);
      else if (cat === 'wishlist') totals.wishlist += (w.balance || 0);
    });

    return [
      { id: 'checking', name: 'Conta Corrente', total: totals.checking, color: '#3b82f6', icon: 'Building2' },
      { id: 'savings', name: 'Cofrinhos', total: totals.savings, color: '#10b981', icon: 'PiggyBank' },
      { id: 'wishlist', name: 'Lista de Desejos', total: totals.wishlist, color: '#f59e0b', icon: 'Heart' }
    ];
  }, [wallets]);

  const goalStatistics = useMemo(() => {
    const stats = {
      savings: { totalSaved: 0, totalTarget: 0, count: 0 },
      wishlist: { totalSaved: 0, totalTarget: 0, count: 0 }
    };

    wallets.forEach(w => {
      if (w.type === 'credit_card' || w.isActive === false || w.isDeleted) return;
      if (!w.targetValue || w.targetValue <= 0) return;

      const cat = w.walletCategory || 'checking';
      if (cat === 'savings') {
        stats.savings.totalSaved += (w.balance || 0);
        stats.savings.totalTarget += w.targetValue;
        stats.savings.count++;
      } else if (cat === 'wishlist') {
        stats.wishlist.totalSaved += (w.balance || 0);
        stats.wishlist.totalTarget += w.targetValue;
        stats.wishlist.count++;
      }
    });

    return stats;
  }, [wallets]);
  // --- END SUMMARIES ---

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const years = React.useMemo(() => getAvailableYears(transactions), [transactions]);

  const allFilteredWallets = wallets.filter(w =>
    !w.isDeleted && w.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const bankWallets = allFilteredWallets.filter(w => w.type === 'bank' || w.type === 'cash');
  const creditCards = allFilteredWallets.filter(w => w.type === 'credit_card');

  const activeBanks = bankWallets.filter(w => w.isActive !== false);
  const inactiveBanks = bankWallets.filter(w => w.isActive === false);

  const activeCards = creditCards.filter(w => w.isActive !== false);
  const inactiveCards = creditCards.filter(w => w.isActive === false);

  const handleWalletClick = (wallet: Wallet) => {
    setSelectedWalletForAction(wallet);
    setIsActionsModalOpen(true);
  };

  const handleEditWallet = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setWalletModalType(wallet.type === 'credit_card' ? 'credit_card' : 'bank');
    setIsWalletModalOpen(true);
    setIsActionsModalOpen(false);
  };

  const handleViewTransactions = (wallet: Wallet, m?: number, y?: number) => {
    setPreviousActioningWalletId(wallet.id);

    // Set default filters for credit card
    if (wallet.type === 'credit_card') {
      if (m !== undefined && y !== undefined) {
        setInvoiceMonthFilter(m);
        setInvoiceYearFilter(y);
      } else {
        const openPeriod = getOpenInvoicePeriod(wallet.closingDay || 1, wallet.dueDay || 15);
        setInvoiceMonthFilter(openPeriod.due.getUTCMonth() + 1);
        setInvoiceYearFilter(openPeriod.due.getUTCFullYear());
      }
    } else {
      setMonthFilter(m !== undefined ? m : new Date().getUTCMonth() + 1);
      setYearFilter(y || new Date().getUTCFullYear());
    }

    setViewingTransactionsId(wallet.id);
    setIsActionsModalOpen(false);
    setSelectedWalletForAction(null);
  };

  const handleToggleActive = async (wallet: Wallet) => {
    // Se estiver inativando (atualmente está ativo)
    if (wallet.isActive !== false) {
      const now = new Date();
      const currentMonth = now.getUTCMonth() + 1;
      const currentYear = now.getUTCFullYear();

      // Verificar lançamentos pendentes ou faturas futuras
      const hasPending = transactions.some(t => {
        if (t.walletId !== wallet.id) return false;

        // Caso básico: isPaid é false (lembretes de bancos, agendamentos, pagamentos de fatura pendentes)
        if (t.isPaid === false) return true;

        // Caso específico de cartões: faturas em aberto (mês atual) ou futuras
        if (wallet.type === 'credit_card') {
          if (t.invoiceYear && t.invoiceMonth) {
            if (t.invoiceYear > currentYear) return true;
            if (t.invoiceYear === currentYear && t.invoiceMonth >= currentMonth) return true;
          }
        }

        return false;
      });

      // Adicionalmente para cartões, verificar se há saldo devedor (fatura em aberto ou compras acumuladas)
      const hasDebt = wallet.type === 'credit_card' && Math.abs(wallet.balance || 0) > 0.01;

      if (hasPending || hasDebt) {
        const isCard = wallet.type === 'credit_card';
        const confirmed = await showConfirm(
          isCard ? 'Inativar Cartão com Pendências' : 'Inativar Carteira com Pendências',
          `Este ${isCard ? 'cartão possui faturas (em aberto ou futuras)' : 'carteira possui lançamentos pendentes'}. Lembre-se que os lembretes de valor a pagar só aparecem para carteiras ativas. Tem certeza que deseja inativar?`,
          {
            variant: 'warning',
            confirmText: 'Inativar Mesmo Assim',
            cancelText: 'Voltar'
          }
        );

        if (!confirmed) return;
      }
    }

    try {
      await toggleWalletActive(wallet.id);
      setIsActionsModalOpen(false);
    } catch (error) {
      console.error('Erro ao alternar status da carteira:', error);
      await showAlert('Erro', `Ocorreu um erro ao alterar o status do ${wallet.type === 'credit_card' ? 'cartão' : 'da carteira'}.`, 'danger');
    }
  };

  const handleDeleteWallet = async (wallet: Wallet) => {
    const isCard = wallet.type === 'credit_card';
    const hasTransactions = transactions.some(t => t.walletId === wallet.id || t.toWalletId === wallet.id);
    
    const confirmed = await showConfirm(
      hasTransactions ? (isCard ? 'Arquivar Cartão' : 'Arquivar Carteira') : (isCard ? 'Excluir Cartão' : 'Excluir Carteira'),
      hasTransactions 
        ? `Este ${isCard ? 'cartão' : 'carteira'} possui lançamentos vinculados. ${isCard ? 'Ele' : 'Ela'} será ocultado da sua lista, mas os lançamentos históricos serão preservados para seus relatórios. Deseja continuar?`
        : `Deseja excluir permanentemente o ${isCard ? 'cartão' : 'a carteira'} "${wallet.name}"? Esta ação não pode ser desfeita.`,
      {
        variant: hasTransactions ? 'warning' : 'danger',
        confirmText: hasTransactions ? 'Arquivar e Ocultar' : 'Excluir Permanentemente',
        cancelText: 'Cancelar'
      }
    );

    if (confirmed) {
      try {
        await deleteWallet(wallet.id);
        setIsActionsModalOpen(false);
        showAlert('Sucesso', hasTransactions ? `${isCard ? 'Cartão arquivado' : 'Carteira arquivada'} com sucesso!` : `${isCard ? 'Cartão excluído' : 'Carteira excluída'} com sucesso!`, 'success');
      } catch (error) {
        console.error('Erro ao excluir carteira:', error);
        showAlert('Erro', `Ocorreu um erro ao excluir o ${isCard ? 'cartão' : 'a carteira'}.`, 'danger');
      }
    }
  };

  // Travar scroll do fundo quando modal de transações estiver aberto
  React.useEffect(() => {
    if (viewingTransactionsId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [viewingTransactionsId]);

  const viewingWallet = wallets.find(w => w.id === viewingTransactionsId);

  // Garantir que os filtros de mês/ano para contas bancárias sejam inicializados ao abrir as transações
  React.useEffect(() => {
    if (viewingTransactionsId && viewingWallet && viewingWallet.type !== 'credit_card') {
      const currentMonth = new Date().getUTCMonth() + 1;
      const currentYear = new Date().getUTCFullYear();

      if (!monthFilter || isNaN(monthFilter)) {
        setMonthFilter(currentMonth);
      }
      if (!yearFilter || isNaN(yearFilter)) {
        setYearFilter(currentYear);
      }
    }
  }, [viewingTransactionsId, viewingWallet?.id]);

  const handleBulkAction = async (action: 'delete' | 'paid' | 'pending') => {
    if (selectedTxIds.length === 0) return;
    if (action === 'delete') {
      const confirmed = await showConfirm(
        'Excluir Lançamentos',
        `Deseja excluir permanentemente os ${selectedTxIds.length} lançamentos selecionados?`,
        { variant: 'danger', confirmText: 'Excluir agora' }
      );
      if (confirmed) {
        selectedTxIds.forEach(id => deleteTransaction(id));
        setSelectedTxIds([]);
      }
    } else {
      selectedTxIds.forEach(id => {
        const tx = transactions.find(t => t.id === id);
        if (tx) updateTransaction(id, { ...tx, isPaid: action === 'paid' });
      });
      setSelectedTxIds([]);
    }
  };

  const handleEditTransaction = (tx: Transaction) => {
    const isRefund = tx.description?.toLowerCase().includes('estorno');
    if (isRefund) {
      setEditingRefund(tx);
    } else {
      setEditingTransaction(tx);
    }
  };

  const walletTransactions = useMemo(() => {
    if (!viewingWallet) return [];

    return transactions.filter(t => {
      const isRelated = t.walletId === viewingWallet.id || t.toWalletId === viewingWallet.id;
      if (!isRelated) return false;

      if (activeTxTypeFilter !== 'all') {
        if (activeTxTypeFilter === 'invoice_payment') {
          const isPayer = (t.description?.toLowerCase() || '').includes('pagamento de fatura');
          const isRefunder = t.type === 'income' && viewingWallet.type === 'credit_card';
          if (!isPayer && !isRefunder) return false;
        } else if (activeTxTypeFilter === 'refund') {
          const isRefunder = t.type === 'income' && viewingWallet.type === 'credit_card';
          if (!isRefunder) return false;
        } else if (t.type !== activeTxTypeFilter) {
          return false;
        }
      }

      if (paymentFilter === 'paid' && t.isPaid === false) return false;
      if (paymentFilter === 'pending' && t.isPaid !== false) return false;

      const txDate = new Date(t.date);
      if (viewingWallet.type === 'credit_card') {
        const tMonth = t.invoiceMonth;
        const tYear = t.invoiceYear;

        if (tMonth && tYear) {
          return tMonth === invoiceMonthFilter && tYear === invoiceYearFilter;
        }

        const period = getInvoicePeriod(
          viewingWallet.closingDay || 1,
          viewingWallet.dueDay || 15,
          new Date(invoiceYearFilter, invoiceMonthFilter - 1, 1)
        );
        return txDate >= period.start && txDate <= period.end;
      } else {
        const txMonth = txDate.getUTCMonth() + 1;
        const txYear = txDate.getUTCFullYear();

        const matchesYear = txYear === Number(yearFilter);
        const matchesMonth = monthFilter === 0 || txMonth === Number(monthFilter);

        return matchesYear && matchesMonth;
      }
    }).sort((a, b) => {
      // Ordenação por data (mais recente primeiro)
      const dateA = a.date || "";
      const dateB = b.date || "";
      const dateDiff = dateB.localeCompare(dateA);
      if (dateDiff !== 0) return dateDiff;

      // Se for a mesma data, usamos o created_at (DESC) para manter a ordem da planilha
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });
  }, [viewingWallet, transactions, activeTxTypeFilter, paymentFilter, monthFilter, yearFilter, invoiceMonthFilter, invoiceYearFilter]);

  const invoiceBalance = useMemo(() => {
    if (!viewingWallet || viewingWallet.type !== 'credit_card') return null;
    return walletTransactions.reduce((sum, t) => {
      const isPayment = (t.description?.toLowerCase() || '').includes('pagamento de fatura');
      if (isPayment || t.type === 'income') return sum + t.amount;
      return sum - t.amount;
    }, 0);
  }, [walletTransactions, viewingWallet]);

  const availableInvoices = useMemo(() => {
    if (!viewingWallet || viewingWallet.type !== 'credit_card') return [];

    const cardTxs = transactions.filter(t => t.walletId === viewingWallet.id);

    const seen = new Set<string>();
    const options: { id: string, name: string, month: number, year: number }[] = [];

    // Garantir que o período atual esteja sempre disponível
    const currentPeriod = getOpenInvoicePeriod(viewingWallet.closingDay || 5, viewingWallet.dueDay || 15);
    const currentKey = `${currentPeriod.due.getUTCMonth() + 1}-${currentPeriod.due.getUTCFullYear()}`;
    seen.add(currentKey);
    options.push({
      id: currentKey,
      name: `${months[currentPeriod.due.getUTCMonth()]} / ${currentPeriod.due.getUTCFullYear()}`,
      month: currentPeriod.due.getUTCMonth() + 1,
      year: currentPeriod.due.getUTCFullYear()
    });

    cardTxs.forEach(t => {
      if (t.invoiceMonth && t.invoiceYear) {
        const key = `${t.invoiceMonth}-${t.invoiceYear}`;
        if (!seen.has(key)) {
          seen.add(key);
          options.push({
            id: key,
            name: `${months[t.invoiceMonth - 1]} / ${t.invoiceYear}`,
            month: t.invoiceMonth,
            year: t.invoiceYear
          });
        }
      }
    });

    return options.sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month);
  }, [viewingWallet, transactions, months]);

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter">Minhas Carteiras</h1>
          <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-[0.2em] mt-1">Gerencie suas contas, dinheiro e cartões</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
            <input
              id="search-input-wallets"
              type="text"
              placeholder="Pesquisar carteira..."
              className="pl-12 pr-6 py-3 bg-muted/50 border-none rounded-2xl w-full sm:w-[300px] text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* SEÇÃO: CARTÕES DE CRÉDITO */}
      <section className="space-y-6">
        <div className="flex items-center gap-4 px-1">
          <div className="flex items-center gap-2 text-muted-foreground group">
            <CardIcon size={18} />
            <h2 className="font-black text-xs uppercase tracking-[0.2em] opacity-70">Meus Cartões</h2>
            <span className="text-[10px] font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
              Total de Faturas Fechadas à Pagar: {formatCurrency(totalCreditInvoices)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInactiveCards(!showInactiveCards)}
              className={cn(
                "text-[10px] font-black uppercase tracking-widest transition-all px-3 py-1.5 rounded-lg border",
                showInactiveCards ? "bg-orange-500/10 border-orange-500/30 text-orange-500" : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
              )}
            >
              {showInactiveCards ? "Ocultar Inativos" : "Gerenciar Inativos"}
            </button>

            {activeCards.length > 1 && (
              <button
                onClick={() => {
                  setTempOrderedCards([...orderedCards]);
                  setTempOrderedAccounts([...orderedAccounts]);
                  setOrganizeTab('credit_card');
                  setIsOrganizeModalOpen(true);
                }}
                className="text-[10px] font-black uppercase tracking-widest transition-all px-3 py-1.5 rounded-lg border bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 flex items-center gap-2"
              >
                Organizar Cartões <LayoutGrid size={14} />
              </button>
            )}

            <button
              onClick={() => { setWalletModalType('credit_card'); setIsWalletModalOpen(true); }}
              className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-500/60 transition-all bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 flex items-center gap-2"
            >
              <Plus size={14} /> Novo Cartão
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-8 mt-6">
          {(() => {
            const activeOrdered = orderedCards
              .map(id => wallets.find(w => w.id === id))
              .filter(w => w && w.isActive !== false && !w.isDeleted);

            const inactive = showInactiveCards
              ? wallets.filter(w => w.type === 'credit_card' && w.isActive === false && !w.isDeleted)
              : [];

            const allItems = [...activeOrdered, ...inactive];

            const visibleItems = isCardsExpanded ? allItems : allItems.slice(0, 2);

            return (
              <AnimatePresence mode="popLayout">
                {visibleItems.map((wallet, idx) => {
                  const w = wallet!;
                  if (searchTerm && !w.name.toLowerCase().includes(searchTerm.toLowerCase())) return null;
                  return (
                    <motion.div
                      key={w.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="w-full lg:w-[calc(50%-1rem)]"
                    >
                      <CreditCardItem
                        wallet={w}
                        index={idx}
                        onClick={() => handleWalletClick(w)}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            );
          })()}
        </div>

        {activeCards.length > 2 && !searchTerm && !isOrganizeModalOpen && (
          <div className="flex justify-center pt-4">
            <button
              onClick={() => setIsCardsExpanded(!isCardsExpanded)}
              className="flex items-center gap-2 px-6 py-2 bg-muted/30 hover:bg-muted/50 rounded-full text-[10px] font-black uppercase tracking-widest transition-all text-muted-foreground group"
            >
              {isCardsExpanded ? (
                <>Ocultar <ChevronUp size={14} className="group-hover:-translate-y-0.5 transition-transform" /></>
              ) : (
                <>Mostrar Todos ({activeCards.length}) <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" /></>
              )}
            </button>
          </div>
        )}
      </section>

      {/* SEÇÃO: CONTAS E CARTEIRAS */}
      <section className="space-y-6">
        <div className="flex items-center gap-4 px-1">
          <div className="flex items-center gap-2 text-muted-foreground group">
            <Building2 size={18} />
            <h2 className="font-black text-xs uppercase tracking-[0.2em] opacity-70">Minhas Contas</h2>
            <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Saldo Total: {formatCurrency(totalAccountsBalance)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInactiveBanks(!showInactiveBanks)}
              className={cn(
                "text-[10px] font-black uppercase tracking-widest transition-all px-3 py-1.5 rounded-lg border",
                showInactiveBanks ? "bg-orange-500/10 border-orange-500/30 text-orange-500" : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
              )}
            >
              {showInactiveBanks ? "Ocultar Inativos" : "Gerenciar Inativos"}
            </button>

            {activeBanks.length > 1 && (
              <button
                onClick={() => {
                  setTempOrderedCards([...orderedCards]);
                  setTempOrderedAccounts([...orderedAccounts]);
                  setOrganizeTab('checking');
                  setIsOrganizeModalOpen(true);
                }}
                className="text-[10px] font-black uppercase tracking-widest transition-all px-3 py-1.5 rounded-lg border bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 flex items-center gap-2"
              >
                Organizar Contas <LayoutGrid size={14} />
              </button>
            )}

            <button
              onClick={() => { setWalletModalType('bank'); setIsWalletModalOpen(true); }}
              className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-500/60 transition-all bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 flex items-center gap-2"
            >
              <Plus size={14} /> Nova Carteira
            </button>
          </div>
        </div>

        {/* NOVO: RESUMO POR TIPO DE CONTA */}
        {!searchTerm && (
          <div className="bg-muted/30 border border-border/40 rounded-[2.5rem] p-8 -mt-2">
            <div className="flex items-center gap-3 mb-6">
              <LayoutGrid size={16} className="text-muted-foreground" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Saldos por Tipo de Conta</span>
            </div>
            <div className="flex flex-wrap gap-4">
              {accountTypeTotals.map(item => {
                const goalStat = item.id === 'savings' ? goalStatistics.savings : item.id === 'wishlist' ? goalStatistics.wishlist : null;
                const hasGoals = goalStat && goalStat.count > 0;
                const goalProgress = hasGoals ? Math.min(100, Math.round((goalStat.totalSaved / goalStat.totalTarget) * 100)) : 0;

                return (
                  <div key={item.id} className="bg-card/50 border border-border/20 rounded-2xl p-6 flex flex-col gap-2 hover:border-primary/30 transition-all group min-w-[200px] flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">{item.name}</span>
                      </div>
                      <IconRenderer icon={item.icon} color={item.color} size={16} className="opacity-40" />
                    </div>
                    <span className="text-2xl font-black tracking-tighter text-foreground">{formatCurrency(item.total)}</span>

                    <div className="space-y-3 mt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Participação</span>
                        <span className="text-[10px] font-black">{totalAccountsBalance > 0 ? Math.round((item.total / totalAccountsBalance) * 100) : 0}%</span>
                      </div>
                      <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-1000 opacity-40"
                          style={{
                            backgroundColor: item.color,
                            width: `${totalAccountsBalance > 0 ? (item.total / totalAccountsBalance) * 100 : 0}%`
                          }}
                        />
                      </div>

                      {hasGoals && (
                        <div className="pt-2 border-t border-border/10 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-bold text-primary uppercase tracking-widest">Progresso Metas</span>
                            <span className="text-[10px] font-black text-primary">{goalProgress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full transition-all duration-1000 bg-primary"
                              style={{
                                width: `${goalProgress}%`
                              }}
                            />
                          </div>
                          <div className="flex justify-between items-center opacity-60">
                            <span className="text-[7px] font-black uppercase tracking-widest">Meta Total: {formatCurrency(goalStat.totalTarget)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-10">
          {/* Grouped by Category */}
          {(() => {
            let rowsCount = 0;
            const categories = ['checking', 'savings', 'wishlist'] as const;

            return categories.map((catId) => {
              const catNames: Record<string, string> = {
                checking: 'Conta Corrente',
                savings: 'Cofrinhos',
                wishlist: 'Lista de Desejos'
              };

              const activeInCategory = orderedAccounts.filter(id => {
                const w = wallets.find(wallet => wallet.id === id);
                if (!w) return false;
                if (w.type === 'credit_card') return false;
                if (searchTerm && !w.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;

                const wCat = w.walletCategory || 'checking';
                return wCat === catId && w.isActive !== false && !w.isDeleted;
              });

              const inactiveInCategory = showInactiveBanks
                ? wallets.filter(w => {
                  if (w.type === 'credit_card') return false;
                  if (w.isActive !== false) return false;
                  if (w.isDeleted) return false;
                  if (searchTerm && !w.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                  const wCat = w.walletCategory || 'checking';
                  return wCat === catId;
                })
                : [];

              const allIds = [...activeInCategory, ...inactiveInCategory.map(w => w.id)];

              if (allIds.length === 0) return null;

              const itemsToShow = isWalletsExpanded ? allIds : allIds.slice(0, Math.max(0, (2 - rowsCount) * 3));
              if (itemsToShow.length === 0 && !isWalletsExpanded) return null;
              const itemsInThisCatCount = itemsToShow.length;
              const rowsInThisCat = Math.ceil(itemsInThisCatCount / 3);

              if (itemsInThisCatCount === 0) return null;

              rowsCount += rowsInThisCat;

              return (
                <div key={catId} className="space-y-4 pt-4">
                  <div className="flex items-center gap-3 px-1 mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">{catNames[catId]}</span>
                      <span className="text-[10px] font-black text-muted-foreground/60 bg-muted/50 px-2 py-0.5 rounded-full border border-border/10">
                        {formatCurrency(accountTypeTotals.find(t => t.id === catId)?.total || 0)}
                      </span>

                      {(() => {
                        const goalStat = catId === 'savings' ? goalStatistics.savings : catId === 'wishlist' ? goalStatistics.wishlist : null;
                        if (goalStat && goalStat.count > 0) {
                          return (
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                                Já tem: {formatCurrency(goalStat.totalSaved)}
                              </span>
                              {goalStat.totalTarget > goalStat.totalSaved && (
                                <span className="text-[9px] font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 uppercase tracking-wider">
                                  Faltam: {formatCurrency(goalStat.totalTarget - goalStat.totalSaved)}
                                </span>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <div className="h-px bg-border/20 flex-1" />
                  </div>
                  <div className="flex flex-wrap gap-6">
                    <AnimatePresence mode="popLayout">
                      {itemsToShow.map((id, idx) => {
                        const wallet = wallets.find(w => w.id === id);
                        if (!wallet) return null;
                        return (
                          <motion.div
                            key={wallet.id}
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.33%-1rem)]"
                          >
                            <BankWalletItem
                              wallet={wallet}
                              index={idx}
                              onClick={() => handleWalletClick(wallet)}
                            />
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              );
            });
          })()}

          {activeBanks.length > 6 && !searchTerm && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setIsWalletsExpanded(!isWalletsExpanded)}
                className="flex items-center gap-2 px-6 py-2 bg-muted/30 hover:bg-muted/50 rounded-full text-[10px] font-black uppercase tracking-widest transition-all text-muted-foreground group"
              >
                {isWalletsExpanded ? (
                  <>Ocultar <ChevronUp size={14} className="group-hover:-translate-y-0.5 transition-transform" /></>
                ) : (
                  <>Mostrar Todas ({activeBanks.length}) <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" /></>
                )}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* MODAL: Transações da Carteira (Drill-down) */}
      <AnimatePresence>
        {viewingWallet && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setViewingTransactionsId(null); setActiveTxTypeFilter('all'); setPaymentFilter('all'); setSelectedTxIds([]); }}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-card border shadow-2xl rounded-[2.5rem] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-8 border-b bg-muted/30">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-6">
                    {previousActioningWalletId === viewingWallet.id && (
                      <button
                        onClick={() => {
                          setViewingTransactionsId(null);
                          setSelectedWalletForAction(viewingWallet);
                          setIsActionsModalOpen(true);
                        }}
                        className="w-12 h-12 rounded-2xl hover:bg-muted flex items-center justify-center transition-all bg-background border shadow-sm group"
                        title="Voltar ao menu anterior"
                      >
                        <ChevronLeft className="group-hover:-translate-x-1 transition-transform" />
                      </button>
                    )}

                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shadow-lg border border-primary/20 overflow-hidden shrink-0">
                      <IconRenderer
                        icon={viewingWallet.logoUrl || viewingWallet.icon || 'wallet'}
                        color={viewingWallet.color}
                        size={viewingWallet.logoUrl ? 64 : 32}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black tracking-tight leading-none">{viewingWallet.name}</h2>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{viewingWallet.type === 'credit_card' ? 'Cartão de Crédito' : 'Conta / Carteira'}</span>
                        {viewingWallet.observation && (
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-black uppercase rounded tracking-wider">
                            {viewingWallet.observation}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => { setViewingTransactionsId(null); setActiveTxTypeFilter('all'); setPaymentFilter('all'); setSelectedTxIds([]); }}
                    className="w-12 h-12 rounded-full hover:bg-muted flex items-center justify-center transition-colors group"
                  >
                    <X className="group-hover:rotate-90 transition-transform" />
                  </button>
                </div>

                {/* Summary Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Saldo Atual</span>
                    <p className={cn("text-2xl font-black", viewingWallet.balance < -0.01 && "text-rose-500")}>{formatCurrency(viewingWallet.balance)}</p>
                  </div>
                  {viewingWallet.type === 'credit_card' && (
                    <>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Limite Total</span>
                        <p className="text-2xl font-black">{formatCurrency(viewingWallet.limit || 0)}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Disponível</span>
                        <p className="text-2xl font-black text-emerald-500">{formatCurrency((viewingWallet.limit || 0) + (viewingWallet.balance))}</p>
                      </div>
                    </>
                  )}
                  {viewingWallet.type === 'credit_card' && invoiceBalance !== null && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary font-bold">Saldo da Fatura</span>
                      <p className={cn(
                        "text-2xl font-black tracking-tighter",
                        invoiceBalance >= 0 ? "text-emerald-500" : "text-rose-500"
                      )}>
                        {formatCurrency(invoiceBalance)}
                      </p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Lançamentos</span>
                    <p className="text-2xl font-black">{walletTransactions.length}</p>
                  </div>
                </div>
              </div>

              {/* Filters Row */}
              <div className="px-8 py-5 border-b bg-muted/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-6 flex-1">
                  <div className="w-full md:w-auto min-w-[200px]">
                    <CustomSelect
                      label="Tipo de Lançamento"
                      value={activeTxTypeFilter}
                      onChange={(val: any) => setActiveTxTypeFilter(val)}
                      options={viewingWallet.type === 'credit_card' ? [
                        { id: 'all', name: 'Todos', icon: 'Layers', color: '#94a3b8' },
                        { id: 'expense', name: 'Despesas', icon: 'TrendingDown', color: '#f43f5e' },
                        { id: 'planned', name: 'Planejados', icon: 'CalendarClock', color: '#8b5cf6' },
                        { id: 'invoice_payment', name: 'Pagamento de Fatura', icon: 'ArrowUpCircle', color: '#ec4899' },
                        { id: 'refund', name: 'Estorno', icon: 'RefreshCw', color: '#10b981' }
                      ] : [
                        { id: 'all', name: 'Todos', icon: 'Layers', color: '#94a3b8' },
                        { id: 'income', name: 'Receitas', icon: 'TrendingUp', color: '#10b981' },
                        { id: 'expense', name: 'Despesas', icon: 'TrendingDown', color: '#f43f5e' },
                        { id: 'transfer', name: 'Transferências', icon: 'ArrowLeftRight', color: '#3b82f6' },
                        { id: 'provision', name: 'Provisões', icon: 'Clock', color: '#6366f1' },
                        { id: 'planned', name: 'Planejados', icon: 'CalendarClock', color: '#8b5cf6' }
                      ]}
                      className="w-full"
                    />
                  </div>

                  {viewingWallet.type !== 'credit_card' && (
                    <div className="w-full md:w-auto min-w-[180px]">
                      <CustomSelect
                        label="Status do Pagamento"
                        value={paymentFilter}
                        onChange={(val: any) => setPaymentFilter(val)}
                        options={[
                          { id: 'all', name: 'Todos', icon: 'CheckCircle2', color: '#94a3b8' },
                          { id: 'paid', name: 'Liquidados', icon: 'ThumbsUp', color: '#10b981' },
                          { id: 'pending', name: 'Pendentes', icon: 'ThumbsDown', color: '#fbbf24' }
                        ]}
                        className="w-full"
                      />
                    </div>
                  )}

                  {viewingWallet.type === 'credit_card' ? (
                    <div className="w-full md:w-auto min-w-[240px]">
                      {availableInvoices.length > 0 ? (
                        <CustomSelect
                          label="Período da Fatura"
                          value={`${invoiceMonthFilter}-${invoiceYearFilter}`}
                          onChange={(val: string) => {
                            const [m, y] = val.split('-').map(Number);
                            setInvoiceMonthFilter(m);
                            setInvoiceYearFilter(y);
                          }}
                          options={availableInvoices}
                          className="w-full"
                        />
                      ) : (
                        <div className="px-4 py-8 bg-muted/20 border border-dashed border-border/40 rounded-2xl flex items-center justify-center">
                          <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest italic">Nenhuma fatura encontrada</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <div className="w-1/3 md:w-[120px]">
                        <CustomSelect
                          label="Ano"
                          value={String(yearFilter)}
                          onChange={(val: any) => setYearFilter(Number(val))}
                          options={getAvailableYears(transactions).map(y => ({ id: String(y), name: String(y) }))}
                          className="w-full"
                        />
                      </div>
                      <div className="flex-1 md:w-[180px]">
                        <CustomSelect
                          label="Mês de Referência"
                          value={String(monthFilter)}
                          onChange={(val: any) => setMonthFilter(Number(val))}
                          options={[{ id: '0', name: 'ANO TODO' }, ...months.map((m, i) => ({ id: String(i + 1), name: m }))]}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {selectedTxIds.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 bg-primary/10 p-2 px-4 rounded-2xl border border-primary/20 shadow-lg shadow-primary/5"
                  >
                    <span className="text-[10px] font-black uppercase text-primary whitespace-nowrap">{selectedTxIds.length} Itens</span>
                    <div className="h-4 w-px bg-primary/20 mx-1" />
                    <div className="flex gap-1">
                      {(() => {
                        const selectedTxs = transactions.filter(t => selectedTxIds.includes(t.id));
                        const allPayments = selectedTxs.length > 0 && selectedTxs.every(t => t.description.toLowerCase().includes('pagamento de fatura'));

                        if (viewingWallet?.type !== 'credit_card' || allPayments) {
                          return (
                            <>
                              <button onClick={() => handleBulkAction('paid')} className="p-2 hover:bg-emerald-500/20 text-emerald-500 rounded-xl transition-colors" title="Liquidar"><ThumbsUp size={16} /></button>
                              <button onClick={() => handleBulkAction('pending')} className="p-2 hover:bg-amber-500/20 text-amber-500 rounded-xl transition-colors" title="Pendente"><ThumbsDown size={16} /></button>
                            </>
                          );
                        }
                        return null;
                      })()}
                      <button onClick={() => handleBulkAction('delete')} className="p-2 hover:bg-rose-500/20 text-rose-500 rounded-xl transition-colors" title="Excluir"><Trash2 size={16} /></button>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {walletTransactions.length > 0 ? (
                  <div className="space-y-8">
                    {/* Grouping by Date */}
                    {Array.from(new Set(walletTransactions.map(t => t.date))).map(date => {
                      const dateTxs = walletTransactions.filter(t => t.date === date);
                      return (
                        <div key={date} className="space-y-4">
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">{formatDate(date as string)}</span>
                            <div className="h-px bg-border/40 flex-1" />
                          </div>

                          <div className="grid grid-cols-1 gap-2">
                            {dateTxs.map(t => {
                              const category = categories.find(c => c.id === t.categoryId);
                              return (
                                <div
                                  key={t.id}
                                  onClick={() => setSelectedTxIds(prev =>
                                    prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id]
                                  )}
                                  className={cn(
                                    "group flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer",
                                    selectedTxIds.includes(t.id) ? "bg-primary/5 border-primary shadow-sm" : "bg-card border-border/40 hover:bg-muted/30"
                                  )}
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                                      {(() => {
                                        const parentCategory = category?.parentId ? (typeof category.parentId === 'object' ? category.parentId : categories.find(p => p.id === category.parentId)) : null;
                                        const icon = parentCategory?.icon || category?.icon || 'wallet';
                                        return <IconRenderer icon={icon} color={category?.color} size={20} />;
                                      })()}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <h4 className="text-xs font-bold uppercase tracking-tight">{t.description}</h4>
                                        {/* Type Badge */}
                                        {(() => {
                                          const isPayment = (t.description?.toLowerCase() || '').includes('pagamento de fatura');
                                          const isRefund = t.type === 'income' && viewingWallet?.type === 'credit_card';

                                          if (isRefund) {
                                            return <span className="text-[7px] font-black bg-pink-500/10 text-pink-500 px-1.5 py-0.5 rounded tracking-widest border border-pink-500/20 uppercase">FATURA</span>;
                                          }
                                          if (isPayment) return <span className="text-[7px] font-black bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded tracking-widest border border-emerald-500/20 uppercase">Pagamento</span>;
                                          if (t.type === 'planned') return <span className="text-[7px] font-black bg-violet-500/10 text-violet-500 px-1.5 py-0.5 rounded tracking-widest border border-violet-500/20 uppercase">Planejado</span>;
                                          if (t.type === 'expense') return <span className="text-[7px] font-black bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded tracking-widest border border-rose-500/20 uppercase">Despesa</span>;
                                          if (t.type === 'provision') return <span className="text-[7px] font-black bg-orange-500/10 text-orange-500 px-1.5 py-0.5 rounded tracking-widest border border-orange-500/20 uppercase">Provisão</span>;
                                          if (t.type === 'income') return <span className="text-[7px] font-black bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded tracking-widest border border-emerald-500/20 uppercase">Receita</span>;
                                          if (t.type === 'transfer') return <span className="text-[7px] font-black bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded tracking-widest border border-blue-500/20 uppercase">Transf.</span>;
                                          return null;
                                        })()}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">{category?.name}</span>
                                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                        <span className="text-[10px] text-muted-foreground/60 font-bold uppercase">{formatDate(t.date)}</span>
                                        {t.recurrenceNumber && (
                                          <div className="flex items-center gap-1">
                                            <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/30" />
                                            <span className="text-[9px] text-primary font-black uppercase tracking-tight">
                                              {t.recurrenceNumber.current}/{t.recurrenceNumber.total}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-4">
                                    {/* Selection Checkbox */}
                                    <div className={cn(
                                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                      selectedTxIds.includes(t.id) ? "bg-primary border-primary text-white" : "border-muted-foreground/20"
                                    )}>
                                      {selectedTxIds.includes(t.id) && <Check size={14} strokeWidth={4} />}
                                    </div>

                                    <div className="text-right min-w-[100px]">
                                      <span className={cn(
                                        "text-sm font-black tracking-tight block leading-tight",
                                        (viewingWallet?.type === 'credit_card' && (t.description?.toLowerCase() || '').includes('pagamento de fatura'))
                                          ? 'text-emerald-500 font-black'
                                          : (t.type === 'income' ? 'text-emerald-500' : 'text-rose-500 font-medium')
                                      )}>
                                        {(viewingWallet?.type === 'credit_card' && (t.description?.toLowerCase() || '').includes('pagamento de fatura'))
                                          ? `+ ${formatCurrency(t.amount)}`
                                          : (t.type === 'income' ? `+ ${formatCurrency(t.amount)}` : `- ${formatCurrency(t.amount)}`)}
                                      </span>
                                      {t.isPaid === false && <span className="text-[8px] font-black uppercase text-amber-500 tracking-wider">Pendente</span>}
                                    </div>

                                    <div className="flex items-center gap-1 transition-all">
                                      {(viewingWallet?.type !== 'credit_card' || (t.description?.toLowerCase() || '').includes('pagamento de fatura')) && (
                                        <div className="flex gap-1 mr-2 border-r pr-2 border-border/40">
                                          <button
                                            onClick={(e) => { e.stopPropagation(); updateTransaction(t.id, { ...t, isPaid: true, date: new Date().toISOString().split('T')[0] }); }}
                                            className={cn(
                                              "p-1.5 rounded-lg transition-colors",
                                              t.isPaid !== false ? "bg-emerald-500/20 text-emerald-500" : "hover:bg-emerald-500/10 text-muted-foreground/40 hover:text-emerald-500"
                                            )}
                                            title="Marcar como Liquidado"
                                          >
                                            <ThumbsUp size={14} />
                                          </button>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); updateTransaction(t.id, { ...t, isPaid: false }); }}
                                            className={cn(
                                              "p-1.5 rounded-lg transition-colors",
                                              t.isPaid === false ? "bg-amber-500/20 text-amber-500" : "hover:bg-amber-500/10 text-muted-foreground/40 hover:text-amber-500"
                                            )}
                                            title="Marcar como Pendente"
                                          >
                                            <ThumbsDown size={14} />
                                          </button>
                                        </div>
                                      )}

                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleEditTransaction(t); }}
                                        className="p-1.5 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                                        title="Editar Lançamento"
                                      >
                                        <Edit size={14} />
                                      </button>
                                      <button
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          const confirmed = await showConfirm(
                                            'Excluir Lançamento',
                                            'Tem certeza que deseja excluir este lançamento? Esta ação não poderá ser desfeita e afetará o saldo desta conta.',
                                            { variant: 'danger', confirmText: 'Excluir Agora' }
                                          );
                                          if (confirmed) deleteTransaction(t.id);
                                        }}
                                        className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors"
                                        title="Excluir Lançamento"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                      <Search className="text-muted-foreground opacity-20" size={40} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-black uppercase tracking-tight">Nenhum lançamento</h3>
                      <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">Não encontramos resultados para os filtros selecionados.</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Organize Modal */}
      <AnimatePresence>
        {isOrganizeModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsOrganizeModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-card w-full max-w-lg rounded-[2.5rem] shadow-2xl border flex flex-col overflow-hidden max-h-[85vh]"
            >
              <div className="p-6 border-b flex justify-between items-center bg-muted/5 shrink-0">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                    <LayoutGrid size={24} className="text-primary" /> Organizar
                  </h2>
                  <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase opacity-60">Arraste para definir a ordem principal</p>
                </div>
                <button onClick={() => setIsOrganizeModalOpen(false)} className="p-3 hover:bg-muted rounded-2xl transition-colors"><X size={24} /></button>
              </div>

              <div className="flex gap-2 p-6 bg-muted/5 overflow-x-auto shrink-0 border-b border-border/50 hidden-scrollbar">
                <button onClick={() => setOrganizeTab('credit_card')} className={cn("px-5 py-2.5 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all flex items-center gap-2 shadow-sm border", organizeTab === 'credit_card' ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted")}>Cartões</button>
                <button onClick={() => setOrganizeTab('checking')} className={cn("px-5 py-2.5 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all flex items-center gap-2 shadow-sm border", organizeTab === 'checking' ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted")}>Conta Corrente</button>
                <button onClick={() => setOrganizeTab('savings')} className={cn("px-5 py-2.5 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all flex items-center gap-2 shadow-sm border", organizeTab === 'savings' ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted")}>Cofrinho</button>
                <button onClick={() => setOrganizeTab('wishlist')} className={cn("px-5 py-2.5 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all flex items-center gap-2 shadow-sm border", organizeTab === 'wishlist' ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted")}>Lista de Desejos</button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-muted/5">
                {(() => {
                  let itemsToOrder: string[] = [];
                  if (organizeTab === 'credit_card') {
                    itemsToOrder = tempOrderedCards.filter(id => wallets.some(w => w.id === id && w.type === 'credit_card'));
                  } else {
                    itemsToOrder = tempOrderedAccounts.filter(id => {
                      const w = wallets.find(ww => ww.id === id);
                      if (!w) return false;
                      const wCat = w.walletCategory || 'checking';
                      if (organizeTab === 'checking' && (wCat === 'checking' || w.type === 'cash')) return true;
                      if (organizeTab === 'savings' && wCat === 'savings') return true;
                      if (organizeTab === 'wishlist' && wCat === 'wishlist') return true;
                      return false;
                    });
                  }

                  if (itemsToOrder.length === 0) {
                    return (
                      <div className="py-12 text-center text-muted-foreground flex flex-col items-center">
                        <WalletIcon size={32} className="opacity-20 mb-4" />
                        <span className="text-[10px] uppercase font-black tracking-widest opacity-60">Nenhuma carteira nesta categoria</span>
                      </div>
                    );
                  }

                  return (
                    <Reorder.Group
                      axis="y"
                      values={itemsToOrder}
                      onReorder={(newOrder) => {
                        if (organizeTab === 'credit_card') {
                          setTempOrderedCards(newOrder);
                        } else {
                          // Merge the new sorted subset back into the master array
                          let subIdx = 0;
                          const mergedOrder = tempOrderedAccounts.map(id => {
                            if (itemsToOrder.includes(id)) {
                              const val = newOrder[subIdx];
                              subIdx++;
                              return val;
                            }
                            return id;
                          });
                          setTempOrderedAccounts(mergedOrder);
                        }
                      }}
                      className="space-y-3"
                    >
                      {itemsToOrder.map((id) => {
                        const w = wallets.find(ww => ww.id === id);
                        if (!w) return null;
                        return (
                          <OrganizeItem key={w.id} id={w.id} wallet={w} />
                        );
                      })}
                    </Reorder.Group>
                  );
                })()}
              </div>

              <div className="p-6 border-t bg-card shrink-0">
                <button onClick={() => {
                  saveWalletOrder(tempOrderedCards, tempOrderedAccounts);

                  setIsOrganizeModalOpen(false);
                }} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 rounded-2xl font-black uppercase text-xs tracking-widest transition-all">
                  Finalizar Organização <Check size={16} className="inline ml-2 mb-0.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => { setIsWalletModalOpen(false); setEditingWallet(null); }}
        type={walletModalType}
        editingWallet={editingWallet}
      />

      <WalletActionsModal
        isOpen={isActionsModalOpen}
        onClose={() => { setIsActionsModalOpen(false); setSelectedWalletForAction(null); }}
        wallet={selectedWalletForAction!}
        onViewTransactions={(m, y) => selectedWalletForAction && handleViewTransactions(selectedWalletForAction, m, y)}
        onEdit={() => selectedWalletForAction && handleEditWallet(selectedWalletForAction)}
        onToggleActive={() => selectedWalletForAction && handleToggleActive(selectedWalletForAction)}
        onDelete={() => selectedWalletForAction && handleDeleteWallet(selectedWalletForAction)}
        onEditTransaction={(tx) => handleEditTransaction(tx)}
      />

      {editingTransaction && (
        <TransactionModal
          isOpen={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
          editingTransaction={editingTransaction}
        />
      )}

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

const BankWalletItem: React.FC<{
  wallet: Wallet,
  index: number,
  onClick: () => void
}> = ({ wallet, index, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-card border rounded-3xl p-6 shadow-sm cursor-pointer group hover:bg-accent/5 transition-all relative overflow-hidden flex flex-col justify-between h-full min-h-[160px]",
        wallet.isActive === false && "bg-rose-500/[0.03] border-rose-500/20 opacity-80"
      )}
    >
      <div className="flex flex-col gap-6 relative z-10 h-full justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center group-hover:bg-primary/10 transition-colors shadow-inner border border-border/40 overflow-hidden shrink-0">
              <IconRenderer icon={wallet.logoUrl || wallet.icon || 'wallet'} color={wallet.color} size={48} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight leading-none" title={wallet.name}>{wallet.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">
                  {wallet.walletCategory === 'savings' ? 'Cofrinho' : wallet.walletCategory === 'wishlist' ? 'Desejo' : 'Corrente'}
                </span>
                {wallet.isActive === false && (
                  <span className="text-[8px] font-black bg-rose-500 text-white px-2 py-0.5 rounded shadow-sm uppercase tracking-wider">INATIVO</span>
                )}
              </div>
              {wallet.observation && (
                <div className="mt-2">
                  <span className="inline-block px-2 py-0.5 bg-muted/50 text-[7px] font-black uppercase text-muted-foreground rounded tracking-wider whitespace-normal leading-relaxed break-words" title={wallet.observation}>
                    {wallet.observation}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-end justify-between gap-4">
            <div className="space-y-0.5" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
              <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-[0.2em]">Saldo Disponível</span>
              <p className={cn("text-2xl font-black tracking-tighter truncate", wallet.balance < -0.01 && "text-rose-500")}>{formatCurrency(wallet.balance)}</p>
            </div>

            <div className="flex flex-col items-end gap-1 font-black opacity-0 group-hover:opacity-40 transition-opacity shrink-0">
              <ChevronRight size={18} />
            </div>
          </div>
        </div>

        {/* Target Progress Section */}
        {wallet.targetValue && wallet.targetValue > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-end justify-between">
              <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest">Faltam</span>
                <span className="text-[11px] font-black text-rose-500/80">{formatCurrency(Math.max(0, wallet.targetValue - (wallet.balance || 0)))}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-primary">{Math.min(100, Math.round(((wallet.balance || 0) / wallet.targetValue) * 100))}%</span>
              </div>
            </div>

            <div className="relative h-2 bg-muted rounded-full overflow-hidden border border-border/20">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, ((wallet.balance || 0) / wallet.targetValue) * 100)}%` }}
                className={cn(
                  "absolute inset-y-0 left-0 transition-all duration-1000 rounded-full",
                  ((wallet.balance || 0) / wallet.targetValue) >= 1
                    ? "bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                    : "bg-gradient-to-r from-primary to-primary/60 shadow-[0_0_10px_rgba(217,119,6,0.2)]"
                )}
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest">Meta: {formatCurrency(wallet.targetValue)}</span>
              {wallet.balance >= wallet.targetValue && (
                <div className="flex items-center gap-1 text-[8px] font-black text-emerald-500 uppercase tracking-widest">
                  <Check size={10} strokeWidth={4} /> Concluído
                </div>
              )}
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

const CreditCardItem: React.FC<{
  wallet: Wallet,
  index: number,
  onClick: () => void,
  isOrganizing?: boolean,
  dragControls?: any
}> = ({ wallet, index, onClick, isOrganizing, dragControls }) => {
  const { transactions, toggleWalletActive } = useFinance();

  const openPeriod = useMemo(() => getOpenInvoicePeriod(wallet.closingDay || 1, wallet.dueDay || 15, new Date()), [wallet.closingDay, wallet.dueDay]);

  const { openInvoiceAmount, availableLimit, usagePercentage, totalLimit, invoiceStatus, daysToDue, usedAmount } = useMemo(() => {
    const invoice = openPeriod ? getInvoiceAmount(transactions, wallet.id, openPeriod) : { amount: 0, status: 'open', isLastPaid: true };
    const amount = invoice.amount;
    const limit = wallet.limit || 0;
    const usage = limit > 0 ? (amount / limit) * 100 : 0;

    // Status Logic
    const lastClosedPeriod = getInvoicePeriod(wallet.closingDay || 1, wallet.dueDay || 15, new Date());
    // Move back one month for "last closed"
    lastClosedPeriod.start.setUTCMonth(lastClosedPeriod.start.getUTCMonth() - 1);
    lastClosedPeriod.end.setUTCMonth(lastClosedPeriod.end.getUTCMonth() - 1);
    lastClosedPeriod.due.setUTCMonth(lastClosedPeriod.due.getUTCMonth() - 1);

    const lastClosedInvoice = getInvoiceAmount(transactions, wallet.id, lastClosedPeriod);

    // Check multiple pending invoices
    const allPendingInvoices = transactions.filter(t =>
      t.walletId === wallet.id &&
      t.description.toLowerCase().includes('pagamento de fatura') &&
      t.isPaid === false
    );

    const dueD = wallet.dueDay || 1;
    let dToDue: number | null = null;
    if (wallet.dueDay) {
      const today = new Date();
      const due = new Date(today.getFullYear(), today.getMonth(), wallet.dueDay);
      if (due < today) due.setMonth(due.getMonth() + 1);
      dToDue = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }

    return {
      openInvoiceAmount: amount,
      availableLimit: limit + (wallet.balance || 0),
      usagePercentage: limit > 0 ? (Math.abs(wallet.balance || 0) / limit) * 100 : 0,
      totalLimit: limit,
      daysToDue: dToDue,
      invoiceStatus: {
        isLastClosedPending: lastClosedInvoice.status === 'closed' && !lastClosedInvoice.isLastPaid,
        pendingCount: allPendingInvoices.length,
        isEverythingPaid: lastClosedInvoice.isLastPaid || lastClosedInvoice.amount === 0
      },
      usedAmount: Math.abs(wallet.balance || 0)
    };
  }, [wallet, transactions, openPeriod]);

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative min-h-[300px] h-full rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden group cursor-pointer border",
        wallet.isActive === false
          ? "bg-rose-950/20 border-rose-500/30 grayscale-[0.3] opacity-80"
          : "border-white/20"
      )}
      style={{
        background: wallet.isActive === false
          ? `linear-gradient(135deg, ${wallet.cardColor || wallet.color}dd 0%, #451a1a 100%)`
          : `linear-gradient(135deg, ${wallet.cardColor || wallet.color} 0%, ${wallet.cardColor || wallet.color}cc 100%)`,
      }}
    >
      {/* Glossy Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />

      <div className="h-full flex flex-col p-10 justify-between relative z-10">
        {/* Top Section */}
        <div className="flex items-start justify-between">
          <div className="space-y-4 flex-1 mr-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-7 bg-white/20 rounded-md backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0">
                <div className="w-6 h-4 bg-yellow-500/80 rounded-[2px]" />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-black text-lg uppercase italic tracking-tighter opacity-90" title={wallet.name}>{wallet.name}</span>
                {wallet.isActive === false && (
                  <div className="flex mt-0.5">
                    <span className="text-[7px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider">INATIVO</span>
                  </div>
                )}
              </div>
            </div>

            {wallet.observation && (
              <div className="flex">
                <span className="inline-block px-2 py-0.5 bg-white/10 rounded text-[7.5px] font-black uppercase tracking-wider text-white/60 whitespace-normal leading-relaxed break-words" title={wallet.observation}>
                  {wallet.observation}
                </span>
              </div>
            )}

            {!invoiceStatus.isEverythingPaid && (
              <div className="flex">
                <span className="inline-block px-2 py-0.5 bg-rose-500 text-white text-[7.5px] font-black uppercase tracking-wider rounded animate-pulse">
                  Última Fatura Pendente
                </span>
              </div>
            )}

            <div className="space-y-0.5" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
              <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">Fatura Atual</span>
              <h4 className="text-white text-3xl font-black tracking-tight">{formatCurrency(openInvoiceAmount)}</h4>
            </div>
          </div>

          <div className="text-right flex flex-col items-center gap-1.5 shrink-0">
            <div className="relative group-hover:scale-110 transition-transform rounded-full overflow-hidden w-12 h-12 bg-white flex items-center justify-center shadow-lg border border-white/20 shrink-0">
              <IconRenderer
                icon={wallet.logoUrl || wallet.icon || 'credit_card'}
                color={wallet.color}
                size={48}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <div className="flex gap-10 text-white">
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-black uppercase flex items-center gap-1.5 opacity-60 tracking-wider">
                  <CalendarCheck size={13} className="text-white/80" /> Fechamento
                </span>
                <span className="text-2xl font-black leading-none">{wallet.closingDay || '--'}</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-black uppercase flex items-center gap-1.5 opacity-60 tracking-wider">
                  <CalendarDays size={13} className="text-rose-300" /> Vencimento
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-rose-300 leading-none">{wallet.dueDay || '--'}</span>
                  {daysToDue !== null && daysToDue >= 0 && (
                    <span className="text-[9px] font-black uppercase bg-white/10 px-2 py-1 rounded text-white/90 whitespace-nowrap">
                      vence em {daysToDue} d
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right space-y-1.5" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[9px] font-black uppercase text-white/50 leading-none">Utilizado</span>
                <span className="font-black text-white/80 text-lg leading-none">{formatCurrency(usedAmount)}</span>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[11px] font-black uppercase text-white/50 block leading-none">Disponível</span>
                <span className="font-black text-white text-3xl leading-none">{formatCurrency(availableLimit)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {/* Limit Bar */}
            <div className="relative h-1.5 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${usagePercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={cn(
                  "absolute inset-y-0 left-0 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]",
                  usagePercentage > 90 ? "bg-rose-400" : usagePercentage > 70 ? "bg-amber-400" : "bg-white"
                )}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-[8px] font-bold text-white/40 uppercase">Limite: {formatCurrency(totalLimit)}</span>
              <span className="text-[8px] font-bold text-white/40 uppercase">{Math.round(usagePercentage)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReorderableCardItem: React.FC<{
  wallet: Wallet;
  index: number;
  isOrganizing: boolean;
  onWalletClick: (w: Wallet) => void;
}> = ({ wallet, index, isOrganizing, onWalletClick }) => {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={wallet.id}
      dragListener={false}
      dragControls={controls}
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileDrag={{ scale: 1.02, zIndex: 100, boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}
      className={cn(
        "relative select-none touch-none",
        isOrganizing && "organizing-shake",
        "w-full lg:w-[calc(50%-1rem)]"
      )}
    >
      <CreditCardItem
        wallet={wallet}
        index={index}
        isOrganizing={isOrganizing}
        dragControls={controls}
        onClick={() => !isOrganizing && onWalletClick(wallet)}
      />
    </Reorder.Item>
  );
};

const ReorderableBankItem: React.FC<{
  wallet: Wallet;
  index: number;
  isOrganizing: boolean;
  onWalletClick: (w: Wallet) => void;
}> = ({ wallet, index, isOrganizing, onWalletClick }) => {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={wallet.id}
      dragListener={false}
      dragControls={controls}
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileDrag={{ scale: 1.05, zIndex: 100, boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}
      className={cn(
        "relative select-none touch-none",
        isOrganizing && "organizing-shake",
        "w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.33%-1rem)]"
      )}
    >
      <BankWalletItem
        wallet={wallet}
        index={index}
        isOrganizing={isOrganizing}
        dragControls={controls}
        onClick={() => !isOrganizing && onWalletClick(wallet)}
      />
    </Reorder.Item>
  );
};

