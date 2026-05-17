import React, { useState, useEffect, useMemo } from 'react';
import {
  Tag, Plus, Edit, Trash2, ChevronDown, ChevronRight, ArrowUpCircle,
  ArrowDownCircle, Search, Eye, EyeOff, LayoutDashboard, Clock,
  CheckCircle2, X, History as HistoryIcon, Layers, Calendar, CreditCard, ThumbsUp, ThumbsDown,
  TrendingUp, Check, ChevronLeft, Target, RefreshCw, PieChart as PieIcon, ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';
import { useFinance } from '../FinanceContext';
import { useModal } from '../contexts/ModalContext';
import { cn, formatCurrency, formatDate, getAvailableYears } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Category, Transaction, Wallet } from '../types';
import { CategoryModal } from './CategoryModal';
import { TransactionModal } from './TransactionModal';
import { RefundEditModal } from './RefundEditModal';
import { FloatingSearchFAB } from './Transactions';
import { CustomSelect } from './ui/CustomSelect';
import { IconRenderer } from './ui/IconRenderer';

type PaymentFilter = 'all' | 'paid' | 'pending';

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#f43f5e', '#06b6d4', '#ec4899', '#84cc16'];



export const StyledCheckbox = ({ checked, onChange, title }: { checked: boolean, onChange: () => void, title?: string }) => (
  <button
    type="button"
    title={title}
    onClick={onChange}
    className={cn(
      "w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center shrink-0",
      checked
        ? "bg-primary border-primary shadow-lg shadow-primary/20 scale-110"
        : "bg-card border-border hover:border-primary/50"
    )}
  >
    <AnimatePresence>
      {checked && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
        >
          <Check size={12} className="text-white" strokeWidth={4} />
        </motion.div>
      )}
    </AnimatePresence>
  </button>
);

export const Categories: React.FC = () => {
  const {
    categories, updateCategory, transactions,
    updateTransaction, deleteTransaction, wallets,
    addCategory, toggleCategoryActive, deleteCategory,
    includeCategoryLimits, setIncludeCategoryLimits
  } = useFinance();
  const { showConfirm, showAlert } = useModal();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [parentIdForNew, setParentIdForNew] = useState<string | undefined>(undefined);
  const [expandedCats, setExpandedCats] = useState<string[]>([]);
  const [filterMonth, setFilterMonth] = useState<number | 'all'>(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [viewingTransactionsId, setViewingTransactionsId] = useState<string | null>(null);
  const [categoryForAction, setCategoryForAction] = useState<Category | null>(null);
  const [viewMode, setViewMode] = useState<'balance' | 'budget'>('budget');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingRefund, setEditingRefund] = useState<Transaction | null>(null);
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  const [showSearchFAB, setShowSearchFAB] = useState(false);
  const [modalMode, setModalMode] = useState<'full' | 'budget'>('full');

  useEffect(() => {
    const searchInput = document.getElementById('search-input-categories');
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

  const scrollToSearch = () => {
    const searchInput = document.getElementById('search-input-categories');
    if (searchInput) {
      searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => searchInput.focus(), 500);
    }
  };


  // Scroll Lock
  useEffect(() => {
    if (viewingTransactionsId || categoryForAction || editingTransaction || editingRefund || isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [viewingTransactionsId, categoryForAction, editingTransaction, editingRefund, isModalOpen]);

  // Local helper functions for calculations
  const getCategorySpend = (categoryId: string, month: number | 'all' = filterMonth, year: number = filterYear) => {
    const relevantIds = [categoryId, ...categories.filter(c => c.parentId === categoryId).map(c => c.id)];

    return transactions
      .filter(t => {
        const d = new Date(t.date + 'T12:00:00Z');
        const mMatch = month === 'all' || (d.getUTCMonth() + 1) === month;
        const yMatch = d.getUTCFullYear() === year;

        const isInvoicePayment = t.description?.toLowerCase().includes('pagamento de fatura');
        const isRefund = t.description?.toLowerCase().includes('estorno');

        if (isInvoicePayment || isRefund) return false;

        const pMatch = paymentFilter === 'all' || (paymentFilter === 'paid' ? t.isPaid : !t.isPaid);
        return relevantIds.includes(t.categoryId) && mMatch && yMatch && t.type === 'expense' && pMatch;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getCategoryCommitted = (categoryId: string, month: number | 'all' = filterMonth, year: number = filterYear) => {
    const relevantIds = [categoryId, ...categories.filter(c => c.parentId === categoryId).map(c => c.id)];

    return transactions
      .filter(t => {
        const d = new Date(t.date + 'T12:00:00Z');
        const mMatch = month === 'all' || (d.getUTCMonth() + 1) === month;
        const yMatch = d.getUTCFullYear() === year;

        // Regra para Comprometido: Estar na categoria e ter groupId (Recorrente)
        return relevantIds.includes(t.categoryId) && mMatch && yMatch && t.groupId && (t.type === 'expense' || t.type === 'provision');
      })
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getCategoryEffectiveLimit = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return { total: 0, parent: 0, subs: 0, hasSubsWithLimit: false };

    const subs = categories.filter(s => s.parentId === categoryId && !s.isDeleted && s.isActive !== false);
    const subsLimit = subs.reduce((sum, s) => sum + (s.limit || 0), 0);
    const parentLimit = cat.limit || 0;

    return {
      total: parentLimit + subsLimit,
      parent: parentLimit,
      subs: subsLimit,
      hasSubsWithLimit: subsLimit > 0
    };
  };

  const getCategoryBalance = (categoryId: string, month: number | 'all' = filterMonth, year: number = filterYear) => {
    const relevantIds = [categoryId, ...categories.filter(c => c.parentId === categoryId).map(c => c.id)];

    return transactions
      .filter(t => {
        const d = new Date(t.date + 'T12:00:00Z');
        const mMatch = month === 'all' || (d.getUTCMonth() + 1) === month;
        const yMatch = d.getUTCFullYear() === year;

        const pMatch = paymentFilter === 'all' || (paymentFilter === 'paid' ? t.isPaid : !t.isPaid);
        return relevantIds.includes(t.categoryId) && mMatch && yMatch && pMatch;
      })
      .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
  };

  const availableYears = useMemo(() => getAvailableYears(transactions), [transactions]);

  const toggleExpand = (id: string) => {
    setExpandedCats(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleOpenModal = (parentId?: string, category?: Category, mode: 'full' | 'budget' = 'full') => {
    setEditingCategory(category || null);
    setParentIdForNew(parentId);
    setModalMode(mode);
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (data: Partial<Category>) => {
    if (editingCategory) {
      const updatedCat = { ...editingCategory, ...data } as Category;
      await updateCategory(editingCategory.id, updatedCat);

      if (!editingCategory.parentId) {
        const subcatUpdates = categories
          .filter(sub => sub.parentId === editingCategory.id)
          .map(sub => updateCategory(sub.id, {
            ...sub,
            color: data.color || sub.color,
            type: data.type || (data.type as any) || sub.type
          }));

        await Promise.all(subcatUpdates);
      }
    } else {
      await addCategory({
        ...data,
        isActive: true
      } as Category);
    }
  };

  const handleToggleTxStatus = (tx: Transaction) => {
    updateTransaction(tx.id, { ...tx, isPaid: !tx.isPaid });
  };

  const handleDeleteTx = async (id: string) => {
    const confirmed = await showConfirm(
      'Excluir Lançamento',
      'Tem certeza que deseja excluir este lançamento? Esta ação não poderá ser desfeita e afetará o saldo desta categoria.',
      { variant: 'danger', confirmText: 'Excluir Agora' }
    );

    if (confirmed) {
      deleteTransaction(id);
      setSelectedTxIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleDeleteSubcategory = async (sub: Category) => {
    // Usamos a mesma lógica de exclusão/arquivamento da categoria principal
    await handleDeleteCategory(sub);
  };

  const handleDeleteCategory = async (cat: Category) => {
    const subcategoryIds = categories.filter(c => c.parentId === cat.id).map(c => c.id);
    const allTargetIds = [cat.id, ...subcategoryIds];
    const hasTransactions = transactions.some(t => allTargetIds.includes(t.categoryId));

    const confirmed = await showConfirm(
      hasTransactions ? 'Arquivar Categoria' : 'Excluir Categoria',
      hasTransactions
        ? `Esta categoria (ou suas subcategorias) possui lançamentos vinculados. Ela será ocultada da sua lista, mas os lançamentos históricos serão preservados para seus relatórios. Deseja continuar?`
        : `Deseja excluir permanentemente a categoria "${cat.name}"? Esta ação não pode ser desfeita.`,
      {
        variant: hasTransactions ? 'warning' : 'danger',
        confirmText: hasTransactions ? 'Arquivar e Ocultar' : 'Excluir Permanentemente',
        cancelText: 'Cancelar'
      }
    );

    if (confirmed) {
      try {
        await deleteCategory(cat.id);
        setCategoryForAction(null);
        showAlert('Sucesso', hasTransactions ? 'Categoria arquivada com sucesso!' : 'Categoria excluída com sucesso!', 'success');
      } catch (error) {
        console.error('Erro ao excluir categoria:', error);
        showAlert('Erro', 'Ocorreu um erro ao excluir a categoria.', 'danger');
      }
    }
  };

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
        if (tx) {
          updateTransaction(id, { ...tx, isPaid: action === 'paid' });
        }
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

  const toggleSelectTx = (id: string) => {
    setSelectedTxIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const filteredCategories = categories.filter(c => {
    if (c.isDeleted) return false;
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (c.parentId) {
      const parent = categories.find(p => p.id === c.parentId);
      return matchesSearch || (parent?.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    const hasMatchingChild = categories.some(sub => !sub.isDeleted && sub.parentId === c.id && sub.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch || hasMatchingChild;
  });

  const activeCats = filteredCategories.filter(c => !c.parentId && (c.isActive !== false));
  const inactiveCats = filteredCategories.filter(c => !c.parentId && (c.isActive === false));

  // Sorting Logic: Sort based on viewMode
  const sortedActiveCats = useMemo(() => {
    return [...activeCats].sort((a, b) => {
      if (viewMode === 'balance') {
        const balA = Math.abs(getCategoryBalance(a.id, filterMonth, filterYear));
        const balB = Math.abs(getCategoryBalance(b.id, filterMonth, filterYear));
        return balB - balA;
      } else {
        const spendA = getCategorySpend(a.id, filterMonth, filterYear);
        const spendB = getCategorySpend(b.id, filterMonth, filterYear);
        return spendB - spendA;
      }
    });
  }, [activeCats, viewMode, filterMonth, filterYear, transactions, categories]);

  const sortedInactiveCats = useMemo(() => {
    return [...inactiveCats].sort((a, b) => {
      if (viewMode === 'balance') {
        const balA = Math.abs(getCategoryBalance(a.id, filterMonth, filterYear));
        const balB = Math.abs(getCategoryBalance(b.id, filterMonth, filterYear));
        return balB - balA;
      } else {
        const spendA = getCategorySpend(a.id, filterMonth, filterYear);
        const spendB = getCategorySpend(b.id, filterMonth, filterYear);
        return spendB - spendA;
      }
    });
  }, [inactiveCats, viewMode, filterMonth, filterYear, transactions, categories]);

  const categoryMetrics = useMemo(() => {
    const expenseTxs = transactions.filter(t => {
      if (t.type !== 'expense') return false;
      const d = new Date(t.date + 'T12:00:00Z');
      const mMatch = filterMonth === 'all' || (d.getUTCMonth() + 1) === filterMonth;
      const yMatch = d.getUTCFullYear() === filterYear;

      const isInvoicePayment = t.description?.toLowerCase().includes('pagamento de fatura');
      const isRefund = t.description?.toLowerCase().includes('estorno');

      if (isInvoicePayment || isRefund) return false;

      return mMatch && yMatch;
    });

    const recurrentNecessary = expenseTxs
      .filter(t => t.groupId && t.necessity === 'necessary')
      .reduce((acc, t) => acc + t.amount, 0);

    const recurrentUnnecessary = expenseTxs
      .filter(t => t.groupId && t.necessity === 'unnecessary')
      .reduce((acc, t) => acc + t.amount, 0);

    const recurrentWithoutLimit = expenseTxs
      .filter(t => t.groupId)
      .filter(t => {
        const cat = categories.find(c => c.id === t.categoryId);
        return !cat || !cat.limit || cat.limit === 0;
      })
      .reduce((acc, t) => acc + t.amount, 0);

    const others = expenseTxs
      .filter(t => !t.groupId)
      .reduce((acc, t) => acc + t.amount, 0);

    const totalUsed = recurrentNecessary + recurrentUnnecessary + others;

    return {
      recurrentNecessary,
      recurrentUnnecessary,
      recurrentWithoutLimit,
      others,
      totalUsed
    };
  }, [transactions, wallets, filterMonth, filterYear, categories]);

  const orderedPieData = useMemo(() => {
    const expenseByCatMap = new Map<string, number>();

    transactions.filter(t => {
      const d = new Date(t.date + 'T12:00:00Z');
      const mMatch = filterMonth === 'all' || (d.getUTCMonth() + 1) === filterMonth;
      const yMatch = d.getUTCFullYear() === filterYear;

      const isInvoicePayment = t.description?.toLowerCase().includes('pagamento de fatura');
      const isRefund = t.description?.toLowerCase().includes('estorno');
      if (isInvoicePayment || isRefund) return false;

      // Inclui despesas e provisões para bater com a Visão Geral
      return (t.type === 'expense' || t.type === 'provision') && mMatch && yMatch;
    }).forEach(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      let finalCat = cat;
      if (cat?.parentId) {
        finalCat = categories.find(c => c.id === cat.parentId) || cat;
      }
      const name = (finalCat?.name || 'Sem Categoria').toUpperCase();
      const current = expenseByCatMap.get(name) || 0;
      expenseByCatMap.set(name, current + (Number(t.amount) || 0));
    });

    return Array.from(expenseByCatMap.entries())
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [transactions, categories, filterMonth, filterYear]);

  const totalLimitGlobal = categories
    .filter(c => c.type === 'expense' && !c.isDeleted && c.isActive !== false)
    .reduce((acc, c) => acc + (c.limit || 0), 0);

  const totalSpendGlobal = activeCats
    .filter(c => c.type === 'expense')
    .reduce((acc, c) => acc + getCategorySpend(c.id), 0);

  const totalNeededGlobal = totalLimitGlobal + categoryMetrics.recurrentWithoutLimit;
  const remainingToSpendGlobal = totalLimitGlobal - totalSpendGlobal;
  const globalProgressPercent = totalLimitGlobal > 0 ? (totalSpendGlobal / totalLimitGlobal) * 100 : 0;

  const renderCategoryList = (cats: Category[], label: string, icon: React.ReactNode, colorClass: string, isInactiveSection = false) => (
    <div className="space-y-4">
      <div className={cn("flex items-center gap-2", colorClass)}>
        {icon}
        <h2 className="font-black uppercase tracking-[0.2em] text-[10px]">{label}</h2>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {cats.map((c) => (
          <div key={c.id} className="space-y-2">
            <motion.div
              whileHover={{ scale: 1.01 }}
              className={cn(
                "bg-card p-4 rounded-2xl border border-border shadow-sm group flex items-center justify-between transition-opacity cursor-pointer",
                isInactiveSection && "opacity-60"
              )}
              onClick={() => { setCategoryForAction(c); setSelectedTxIds([]); }}
            >
              <div className="flex items-center gap-3 flex-1 overflow-hidden">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleExpand(c.id); }}
                  className="p-1 hover:bg-muted rounded-md transition-colors"
                >
                  {expandedCats.includes(c.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
                <IconRenderer
                  icon={c.icon}
                  color={c.color}
                  size={44}
                  scale={0.65}
                  className="shadow-lg border-2 border-background"
                />
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm block leading-tight uppercase tracking-tight break-words">{c.name}</span>
                    <Search size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {viewMode === 'balance' ? (
                    <span className={cn(
                      "text-[11px] font-bold tracking-tight mt-1.5 transition-colors",
                      c.type === 'income' ? "text-emerald-500" : "text-rose-500"
                    )}>
                      {formatCurrency(getCategoryBalance(c.id, filterMonth, filterYear))}
                    </span>
                  ) : (
                    <div className="flex flex-col gap-1.5 mt-2 max-w-[240px]">
                      {(() => {
                        const effective = getCategoryEffectiveLimit(c.id);
                        const spend = getCategorySpend(c.id);
                        return (
                          <>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] sm:text-[11px] font-black uppercase tracking-widest leading-none">
                              <span className="opacity-80 italic font-bold">Uso: {formatCurrency(spend)}</span>
                              {effective.total ? (
                                <span className={cn(
                                  "font-black shrink-0 pl-1",
                                  (spend / effective.total) >= 1 ? "text-rose-500" :
                                    (spend / effective.total) >= 0.75 ? "text-amber-500" :
                                      "text-emerald-500"
                                )}>
                                  {Math.round((spend / effective.total) * 100)}%
                                </span>
                              ) : (
                                <span className="opacity-40 italic font-medium shrink-0">Sem Limite</span>
                              )}
                            </div>
                            {effective.total > 0 && (
                              <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground opacity-60 uppercase tracking-tight leading-tight">
                                Limite: {formatCurrency(effective.total)}
                                {effective.hasSubsWithLimit && (
                                  <span className="block sm:inline mt-0.5 sm:mt-0"> (Cat: {formatCurrency(effective.parent)} + Subs: {formatCurrency(effective.subs)})</span>
                                )}
                              </span>
                            )}
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden shadow-inner border border-border/10">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: effective.total ? `${Math.min((spend / effective.total) * 100, 100)}%` : '0%' }}
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  !effective.total ? "bg-slate-400" :
                                    (spend / effective.total) > 1 ? "bg-red-800" :
                                      (spend / effective.total) === 1 ? "bg-rose-500" :
                                        (spend / effective.total) >= 0.75 ? "bg-amber-500" :
                                          "bg-emerald-500"
                                )}
                              />
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>

              {viewMode === 'budget' && (
                <div className="hidden sm:flex flex-col items-end mr-6 text-right shrink-0">
                  <div className="flex flex-col items-end border-b border-border/10 pb-1 mb-1">
                    <span className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40 leading-none">Comprometido (Fixo)</span>
                    <span className={cn(
                      "text-[13px] font-bold",
                      getCategoryCommitted(c.id) > 0 ? "text-amber-500" : "text-muted-foreground"
                    )}>
                      {formatCurrency(getCategoryCommitted(c.id))}
                    </span>
                  </div>

                  {(() => {
                    const effective = getCategoryEffectiveLimit(c.id);
                    const spend = getCategorySpend(c.id);
                    const remaining = effective.total - getCategoryCommitted(c.id) - (spend - getCategoryCommitted(c.id));
                    return effective.total ? (
                      <>
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 opacity-60">Limite Real (Variável)</span>
                        <span className={cn(
                          "text-base font-black tracking-tighter",
                          remaining < 0 ? "text-rose-500" : "text-emerald-500"
                        )}>
                          {formatCurrency(remaining)}
                        </span>
                        <span className="text-[8px] font-black text-muted-foreground opacity-40 uppercase tracking-widest mt-0.5">de {formatCurrency(effective.total)}</span>
                      </>
                    ) : (
                      <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] mt-2">Sem Meta Definida</span>
                    );
                  })()}
                </div>
              )}

              <div className="flex items-center gap-1 transition-opacity whitespace-nowrap" onClick={e => e.stopPropagation()}>
                {!isInactiveSection && (
                  <button
                    onClick={() => handleOpenModal(c.id)}
                    title="Adicionar Subcategoria"
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                  >
                    <Plus size={18} />
                  </button>
                )}
                <button
                  onClick={() => handleOpenModal(undefined, c)}
                  className="p-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => toggleCategoryActive(c.id)}
                  title={c.isActive === false ? "Reativar" : "Inativar"}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    c.isActive === false
                      ? "text-emerald-500 hover:bg-emerald-500/10"
                      : "text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
                  )}
                >
                  {c.isActive === false ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </motion.div>

            <AnimatePresence>
              {expandedCats.includes(c.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="ml-12 overflow-hidden space-y-2 border-l border-dashed border-border/50 pl-3"
                >
                  {(() => {
                    const subcats = categories.filter(sub => sub.parentId === c.id && !sub.isDeleted && sub.name.toLowerCase().includes(searchTerm.toLowerCase()));
                    if (subcats.length === 0) {
                      return (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="py-4 text-center border-l border-dashed border-border/50 ml-6"
                        >
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Nenhuma subcategoria cadastrada</p>
                        </motion.div>
                      );
                    }
                    return subcats.map(sub => (
                      <motion.div
                        key={sub.id}
                        className={cn(
                          "bg-card/40 p-3 rounded-xl border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between group hover:bg-muted/50 transition-all cursor-pointer gap-3 sm:gap-0",
                          sub.isActive === false && "opacity-60"
                        )}
                        onClick={() => { setCategoryForAction(sub); setSelectedTxIds([]); }}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div
                            className="w-2 h-2 rounded-full shadow-sm"
                            style={{ backgroundColor: sub.color }}
                          />
                          <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[13px] text-foreground leading-tight uppercase tracking-tight break-words">{sub.name}</span>
                              <Search size={10} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <span className="text-[10px] font-black text-muted-foreground mt-1 opacity-60">
                              USO: {formatCurrency(getCategoryBalance(sub.id, filterMonth, filterYear))}
                            </span>
                          </div>
                        </div>

                        {viewMode === 'budget' && (
                          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 sm:mr-4 w-full sm:w-auto">
                            <div className="flex flex-col items-start sm:items-end min-w-[80px]">
                              <span className="text-[7px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Comprometido</span>
                              <span className={cn(
                                "text-[10px] font-bold",
                                getCategoryCommitted(sub.id) > 0 ? "text-amber-500" : "text-muted-foreground"
                              )}>
                                {formatCurrency(getCategoryCommitted(sub.id))}
                              </span>
                            </div>
                            {sub.limit > 0 && (
                              <div className="flex flex-col items-start sm:items-end sm:border-l border-border/10 sm:pl-4 flex-1 sm:flex-none min-w-[120px]">
                                <div className="flex items-center justify-between sm:justify-end w-full gap-2 mb-1">
                                  <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Limite Real</span>
                                  <span className={cn(
                                    "text-[9px] font-black px-1.5 py-0.5 rounded-full",
                                    getCategorySpend(sub.id) > sub.limit ? "bg-rose-500 text-white animate-pulse" : "bg-emerald-500/10 text-emerald-500"
                                  )}>
                                    {Math.round((getCategorySpend(sub.id) / sub.limit) * 100)}%
                                  </span>
                                </div>
                                <div className="flex items-baseline justify-between sm:justify-end w-full gap-2">
                                  <span className={cn(
                                    "text-[12px] font-black transition-colors leading-none",
                                    getCategorySpend(sub.id) > sub.limit ? "text-rose-500" : "text-emerald-500"
                                  )}>
                                    {formatCurrency(sub.limit - getCategorySpend(sub.id))}
                                  </span>
                                  <span className="text-[7px] font-black text-muted-foreground uppercase tracking-widest opacity-40">
                                    de {formatCurrency(sub.limit)}
                                  </span>
                                </div>
                                {/* Mini Barra de Progresso Subcategoria */}
                                <div className="h-1 w-full bg-muted rounded-full overflow-hidden mt-1 border border-border/5">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min((getCategorySpend(sub.id) / sub.limit) * 100, 100)}%` }}
                                    className={cn(
                                      "h-full rounded-full",
                                      getCategorySpend(sub.id) > sub.limit ? "bg-rose-500" : "bg-emerald-500"
                                    )}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-1 transition-opacity shrink-0 justify-end" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenModal(undefined, sub)}
                            className="p-1.5 text-muted-foreground hover:text-blue-500 rounded-md transition-all"
                            title="Editar"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => toggleCategoryActive(sub.id)}
                            className="p-1.5 text-muted-foreground hover:text-emerald-500 rounded-md transition-all"
                            title={sub.isActive === false ? "Reativar" : "Inativar"}
                          >
                            {sub.isActive === false ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                          {sub.isActive === false && (
                            <button
                              onClick={() => handleDeleteSubcategory(sub)}
                              className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all"
                              title="Excluir permanentemente"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ));
                  })()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-[2rem] border border-border shadow-sm">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground flex items-center gap-3">
            Gerenciar Categorias
          </h1>
          <p className="text-muted-foreground text-sm font-medium">Controle seus orçamentos e organize seus gastos</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="flex items-center p-1 bg-muted/50 rounded-2xl border border-border/30 h-14">
            <button
              onClick={() => setViewMode('budget')}
              className={cn(
                "flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 h-full rounded-xl transition-all text-[10px] font-black uppercase tracking-widest",
                viewMode === 'budget' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Calendar size={14} /> Limites
            </button>
            <button
              onClick={() => setViewMode('balance')}
              className={cn(
                "flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 h-full rounded-xl transition-all text-[10px] font-black uppercase tracking-widest",
                viewMode === 'balance' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <LayoutDashboard size={14} /> Balanço
            </button>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 px-8 h-14 rounded-2xl bg-primary text-white hover:scale-105 transition-all shadow-lg shadow-primary/25 text-xs font-black uppercase tracking-widest active:scale-95"
          >
            <Plus size={16} /> Nova
          </button>
        </div>
      </div>

      <div className="bg-card/30 backdrop-blur-md p-4 rounded-[2rem] border border-border shadow-sm flex flex-wrap items-center gap-6">
        {/* Search Field */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground opacity-40" size={18} />
          <input
            id="search-input-categories"
            type="text"
            placeholder="Pesquisar categoria ou subcategoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-muted/20 border border-border/30 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium"
          />
        </div>

        {/* Date Filters Group */}
        <div className="flex items-center gap-4 bg-muted/40 p-3 rounded-2xl border border-border/20">
          <div className="flex items-center gap-2 pl-1">
            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest opacity-50">Ano:</span>
            <CustomSelect
              options={availableYears.map(year => ({ id: year.toString(), name: year.toString() }))}
              value={String(filterYear)}
              onChange={(val) => setFilterYear(Number(val))}
              placeholder="Ano"
              className="h-8 min-h-0 py-1 px-3 text-[10px] bg-background border border-border/10 shadow-sm min-w-[90px] rounded-xl"
            />
          </div>
          <div className="w-px h-6 bg-border/20 mx-1" />
          <div className="flex items-center gap-2 pr-2">
            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest opacity-50">Mês:</span>
            <CustomSelect
              options={[
                { id: 'all', name: 'TODOS' },
                ...MONTH_NAMES.map((m, i) => ({ id: (i + 1).toString(), name: m.toUpperCase() }))
              ]}
              value={String(filterMonth)}
              onChange={(val) => setFilterMonth(val === 'all' ? 'all' : Number(val))}
              placeholder="Mês"
              className="h-8 min-h-0 py-1 px-3 text-[10px] bg-background border border-border/10 shadow-sm min-w-[110px] rounded-xl"
            />
          </div>
        </div>

        {/* Status Filters Group */}
        <div className="flex items-center p-2 gap-1 bg-muted/30 rounded-2xl border border-border/20 shadow-inner ml-auto">
          <button
            onClick={() => setPaymentFilter('all')}
            className={cn(
              "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              paymentFilter === 'all' ? "bg-background text-primary shadow-sm" : "text-muted-foreground opacity-60 hover:opacity-100"
            )}
          >
            <LayoutDashboard size={14} /> Total
          </button>
          <button
            onClick={() => setPaymentFilter('paid')}
            className={cn(
              "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              paymentFilter === 'paid' ? "bg-background text-emerald-500 shadow-sm" : "text-muted-foreground opacity-60 hover:opacity-100"
            )}
          >
            <CheckCircle2 size={14} /> Pagos
          </button>
          <button
            onClick={() => setPaymentFilter('pending')}
            className={cn(
              "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              paymentFilter === 'pending' ? "bg-background text-amber-500 shadow-sm" : "text-muted-foreground opacity-60 hover:opacity-100"
            )}
          >
            <Clock size={14} /> Pendentes
          </button>
        </div>
      </div>

      {viewMode === 'budget' && (
        <div className="space-y-6">
          {/* NOVA SEÇÃO: MÉTRICAS DE CATEGORIA */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { label: 'Recorr. Necess.', val: categoryMetrics.recurrentNecessary, color: 'text-primary', icon: <CheckCircle2 size={10} /> },
              { label: 'Recorr. Desnec.', val: categoryMetrics.recurrentUnnecessary, color: 'text-orange-500', icon: <Clock size={10} /> },
              { label: 'Variáveis / Outros', val: categoryMetrics.others, color: 'text-rose-500', icon: <Tag size={10} /> },
              { label: 'Lançamento Consolidado', val: categoryMetrics.totalUsed, color: 'text-foreground font-black', icon: <Layers size={10} />, isTotal: true }
            ].map((m, idx) => (
              <div key={idx} className={cn(
                "bg-card/40 p-5 rounded-[2rem] border border-border/50 flex flex-col gap-1 relative overflow-hidden",
                m.isTotal && "bg-muted/30 border-primary/20 shadow-lg shadow-primary/5"
              )}>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 flex items-center gap-1.5">
                  {m.icon} {m.label}
                </span>
                <p className={cn("text-lg font-black tracking-tight", m.color)}>
                  {formatCurrency(m.val)}
                </p>
                {m.isTotal && <div className="absolute -right-2 -bottom-2 opacity-[0.03] rotate-12"><Layers size={64} /></div>}
              </div>
            ))}
          </motion.div>

          {/* SEÇÃO DE ANÁLISE GRÁFICA E RESUMO */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* GRÁFICO DE MAIORES GASTOS */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card/40 p-8 rounded-[2.5rem] border border-border/50 shadow-xl flex flex-col"
            >
              <div className="flex flex-col gap-1 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <PieIcon size={18} />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest">Maiores Gastos (Ordenados)</h3>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40 ml-11">
                  Distribuição por categoria no período
                </p>
              </div>

              <div className="flex-1 flex flex-col md:flex-row items-center justify-between gap-8 min-h-[260px] mt-4">
                {orderedPieData.length > 0 ? (
                  <>
                    <div className="w-full md:w-1/2 h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={orderedPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            nameKey="name"
                            isAnimationActive={false}
                          >
                            {orderedPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '1rem',
                              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                            }}
                            itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                            formatter={(value: number) => formatCurrency(value)}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Legenda Manual - Garante Ordem 100% */}
                    <div className="w-full md:w-1/2 flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                      {orderedPieData.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between group py-1 border-b border-border/5 last:border-0 hover:bg-muted/30 px-2 rounded-lg transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground/70 leading-tight group-hover:text-foreground transition-colors break-words">
                              {item.name}
                            </span>
                          </div>
                          <span className="text-[11px] font-black text-primary shrink-0">
                            {formatCurrency(item.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
                    <PieIcon size={48} className="text-muted-foreground opacity-20 mb-4" />
                    <p className="text-[10px] font-black text-muted-foreground opacity-40 uppercase tracking-widest">
                      Sem dados para exibir
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* RESUMO DO ORÇAMENTO */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card/40 p-8 rounded-[2.5rem] border border-border/50 shadow-xl relative group overflow-hidden flex flex-col justify-center"
            >
              <div className="relative flex flex-col gap-8">
                {totalLimitGlobal > 0 ? (
                  <>
                    <div className="space-y-6">
                      {/* Valor Principal em Destaque: O que de fato precisa no mês */}
                      <div className="space-y-1">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">Total que vai precisar</h2>
                        <div className="text-5xl font-black tracking-tighter text-foreground drop-shadow-sm">
                          {formatCurrency(totalLimitGlobal + categoryMetrics.recurrentWithoutLimit)}
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <div className="flex items-baseline gap-2 scale-90 origin-left">
                          <span className="text-2xl font-black tracking-tighter text-rose-400">{formatCurrency(totalSpendGlobal)}</span>
                          <span className="text-[10px] font-bold text-muted-foreground opacity-40 uppercase tracking-widest">utilizado de {formatCurrency(totalLimitGlobal)} planejado</span>
                        </div>

                        {categoryMetrics.recurrentWithoutLimit > 0 && (
                          <div className="flex items-center gap-2 py-1.5 px-3 bg-orange-500/5 border border-orange-500/10 rounded-xl w-fit scale-95 origin-left">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse shrink-0" />
                            <span className="text-[9px] font-black uppercase text-orange-600 tracking-wider">
                              {formatCurrency(categoryMetrics.recurrentWithoutLimit)} comprometido sem meta de gasto definida
                            </span>
                          </div>
                        )}

                        {/* Global Toggle for Greeting Card */}
                        <button
                          onClick={() => setIncludeCategoryLimits(!includeCategoryLimits)}
                          className={cn(
                            "w-fit px-4 py-2 rounded-xl border-2 transition-all flex items-center gap-2 group/toggle",
                            includeCategoryLimits
                              ? "bg-primary/5 border-primary text-primary shadow-lg shadow-primary/10 scale-105"
                              : "bg-muted/30 border-border text-muted-foreground grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
                          )}
                        >
                          <Target size={16} className={cn("transition-transform", includeCategoryLimits && "animate-pulse")} />
                          <span className="text-[9px] font-black uppercase tracking-widest">
                            {includeCategoryLimits ? "No Orçamento" : "Oculto no Orçamento"}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="w-full space-y-3">
                      <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground opacity-60">Uso em relação ao planejado mensal (não incluso despesas sem meta de gasto definida)</span>
                          <span className={cn(
                            "text-[9px] mt-0.5",
                            remainingToSpendGlobal < 0 ? "text-rose-500" : "text-emerald-500"
                          )}>
                            {remainingToSpendGlobal < 0 ? "Excedido em:" : "Resta utilizar:"} {formatCurrency(Math.abs(remainingToSpendGlobal))}
                          </span>
                        </div>
                        <span className={cn(
                          globalProgressPercent >= 100 ? "text-rose-500" :
                            globalProgressPercent >= 75 ? "text-amber-500" :
                              "text-emerald-500"
                        )}>
                          {Math.round(globalProgressPercent)}%
                        </span>
                      </div>
                      <div className="h-4 w-full bg-muted/50 rounded-full overflow-hidden border border-border/20 p-1">
                        <motion.div
                          animate={{ width: `${Math.min(globalProgressPercent, 100)}%` }}
                          className={cn(
                            "h-full rounded-full transition-all",
                            globalProgressPercent > 100 ? "bg-red-800" :
                              globalProgressPercent >= 75 ? "bg-amber-500" :
                                "bg-emerald-500"
                          )}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-6 py-2">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 animate-pulse">
                      <TrendingUp size={28} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-black uppercase tracking-tight">Defina seus Limites</h3>
                      <p className="text-sm text-muted-foreground font-medium max-w-md leading-tight">
                        Para uma melhor visualização do seu orçamento mensal, defina limites de gastos nas suas categorias principais abaixo.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}

      <div className="space-y-12">
        <section className="space-y-6">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3">
            <span className="w-12 h-[2px] bg-primary rounded-full" /> Ativas
          </h3>
          <div className={cn("grid gap-8", viewMode === 'budget' ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2")}>
            {viewMode !== 'budget' && renderCategoryList(sortedActiveCats.filter(c => c.type === 'income'), "Receitas", <ArrowUpCircle size={18} />, "text-emerald-500")}
            {renderCategoryList(sortedActiveCats.filter(c => c.type === 'expense'), "Despesas", <ArrowDownCircle size={18} />, "text-rose-500")}
          </div>
        </section>

        {inactiveCats.length > 0 && (
          <section className="space-y-6 pt-12 border-t border-dashed border-border/40">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/40 flex items-center gap-3">
              <span className="w-12 h-[2px] bg-muted-foreground/20 rounded-full" /> Arquivadas
            </h3>
            <div className={cn("grid gap-8", viewMode === 'budget' ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2")}>
              {viewMode !== 'budget' && renderCategoryList(sortedInactiveCats.filter(c => c.type === 'income'), "Receitas (Inat.)", <ArrowUpCircle size={18} />, "text-emerald-500/40", true)}
              {renderCategoryList(sortedInactiveCats.filter(c => c.type === 'expense'), "Despesas (Inat.)", <ArrowDownCircle size={18} />, "text-rose-500/40", true)}
            </div>
          </section>
        )}
      </div>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCategory}
        editingCategory={editingCategory}
        parentId={parentIdForNew}
        mode={modalMode}
      />

      {/* MODAL: Transações da Categoria */}
      <AnimatePresence>
        {viewingTransactionsId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 md:p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setViewingTransactionsId(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-card w-full h-full md:max-w-5xl md:max-h-[90vh] md:rounded-[2.5rem] shadow-2xl border border-border flex flex-col overflow-hidden"
            >
              <div className="p-8 border-b border-border flex flex-col md:flex-row md:items-center justify-between bg-card shrink-0 gap-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      const catId = viewingTransactionsId;
                      setViewingTransactionsId(null);
                      if (catId) {
                        const cat = categories.find(c => c.id === catId);
                        if (cat) setCategoryForAction(cat);
                      }
                    }}
                    className="p-2 hover:bg-muted rounded-xl transition-all"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <div className="flex flex-col">
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Histórico de Lançamentos</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                      {categories.find(c => c.id === viewingTransactionsId)?.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <AnimatePresence>
                    {selectedTxIds.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center gap-2 bg-primary/10 p-1.5 rounded-2xl border border-primary/20"
                      >
                        <span className="text-[10px] font-black uppercase px-3 text-primary">{selectedTxIds.length} selecionados</span>
                        {(() => {
                          const hasCreditCard = selectedTxIds.some(id => {
                            const tx = transactions.find(t => t.id === id);
                            if (!tx) return false;
                            const wallet = wallets.find(w => w.id === tx.walletId);
                            return wallet?.type === 'credit_card';
                          });
                          if (hasCreditCard) return null;
                          return (
                            <>
                              <button onClick={() => handleBulkAction('paid')} className="p-2 hover:bg-emerald-500 hover:text-white rounded-xl transition-all text-emerald-600" title="Marcar como Pago"><ThumbsUp size={16} /></button>
                              <button onClick={() => handleBulkAction('pending')} className="p-2 hover:bg-amber-500 hover:text-white rounded-xl transition-all text-amber-600" title="Marcar como Pendente"><ThumbsDown size={16} /></button>
                            </>
                          );
                        })()}
                        <button onClick={() => handleBulkAction('delete')} className="p-2 hover:bg-rose-500 hover:text-white rounded-xl transition-all text-rose-600" title="Excluir Selecionados"><Trash2 size={16} /></button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <button onClick={() => setViewingTransactionsId(null)} className="p-4 hover:bg-muted rounded-2xl transition-all shadow-sm"><X size={24} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="hidden md:grid grid-cols-[auto_1fr_auto_auto_auto] gap-6 px-6 py-4 border-b border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 items-center">
                  <StyledCheckbox
                    checked={(() => {
                      const cat = categories.find(c => c.id === viewingTransactionsId);
                      const targetIds = [viewingTransactionsId];
                      if (cat && !cat.parentId) targetIds.push(...categories.filter(s => s.parentId === viewingTransactionsId).map(s => s.id));
                      const currentTxs = transactions.filter(t => {
                        const d = new Date(t.date + 'T12:00:00Z');
                        const mMatch = filterMonth === 'all' || (d.getUTCMonth() + 1) === filterMonth;
                        const yMatch = d.getUTCFullYear() === filterYear;
                        const pMatch = paymentFilter === 'all' || (paymentFilter === 'paid' ? t.isPaid : !t.isPaid);
                        return targetIds.includes(t.categoryId || '') && mMatch && yMatch && pMatch;
                      });
                      return currentTxs.length > 0 && currentTxs.every(t => selectedTxIds.includes(t.id));
                    })()}
                    onChange={() => {
                      const cat = categories.find(c => c.id === viewingTransactionsId);
                      const targetIds = [viewingTransactionsId];
                      if (cat && !cat.parentId) targetIds.push(...categories.filter(s => s.parentId === viewingTransactionsId).map(s => s.id));
                      const currentTxs = transactions.filter(t => {
                        const d = new Date(t.date + 'T12:00:00Z');
                        const mMatch = filterMonth === 'all' || (d.getUTCMonth() + 1) === filterMonth;
                        const yMatch = d.getUTCFullYear() === filterYear;
                        const pMatch = paymentFilter === 'all' || (paymentFilter === 'paid' ? t.isPaid : !t.isPaid);
                        return targetIds.includes(t.categoryId || '') && mMatch && yMatch && pMatch;
                      });
                      if (selectedTxIds.length === currentTxs.length) setSelectedTxIds([]);
                      else setSelectedTxIds(currentTxs.map(t => t.id));
                    }}
                  />
                  <span>Descrição / Detalhes</span>
                  <span className="text-center w-24">Data</span>
                  <span className="text-center w-24">Status</span>
                  <span className="text-right w-32">Valor</span>
                </div>
                <div className="space-y-3 mt-6">
                  {(() => {
                    const relevantTransactions = transactions
                      .filter(t => {
                        const cat = categories.find(c => c.id === viewingTransactionsId);
                        const targetIds = [viewingTransactionsId];
                        if (cat && !cat.parentId) targetIds.push(...categories.filter(s => s.parentId === viewingTransactionsId).map(s => s.id));

                        const d = new Date(t.date + 'T12:00:00Z');
                        const mMatch = filterMonth === 'all' || (d.getUTCMonth() + 1) === filterMonth;
                        const yMatch = d.getUTCFullYear() === filterYear;
                        const pMatch = paymentFilter === 'all' || (paymentFilter === 'paid' ? t.isPaid : !t.isPaid);
                        return targetIds.includes(t.categoryId || '') && mMatch && yMatch && pMatch;
                      })
                      .sort((a, b) => {
                        const dateA = a.date || "";
                        const dateB = b.date || "";
                        const dateDiff = dateB.localeCompare(dateA);
                        if (dateDiff !== 0) return dateDiff;

                        const aKey = String(a.created_at || a.id || "");
                        const bKey = String(b.created_at || b.id || "");
                        return aKey.localeCompare(bKey);
                      });

                    if (relevantTransactions.length === 0) {
                      return (
                        <div className="py-20 text-center space-y-4 bg-muted/5 rounded-[2.5rem] border border-dashed border-border/50">
                          <Layers className="mx-auto text-muted-foreground opacity-20" size={48} />
                          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-60">Nenhum lançamento encontrado neste período</p>
                        </div>
                      );
                    }

                    return relevantTransactions.map(t => (
                      <div key={t.id} className={cn(
                        "group p-3 md:p-5 bg-card hover:bg-muted/10 rounded-2xl md:rounded-3xl border border-border flex flex-col md:grid md:grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 md:gap-6 transition-all",
                        selectedTxIds.includes(t.id) && "border-primary bg-primary/5"
                      )}>
                        <div className="md:px-6 md:py-4 hidden md:block">
                          <StyledCheckbox
                            checked={selectedTxIds.includes(t.id)}
                            onChange={() => setSelectedTxIds(prev =>
                              prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id]
                            )}
                          />
                        </div>

                        <div className="flex items-center gap-4 w-full overflow-hidden">
                          {(() => {
                            const w = wallets.find(item => item.id === t.walletId);
                            return (
                              <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-white border border-border/10 shrink-0 shadow-lg">
                                {w?.logoUrl ? (
                                  <img src={w.logoUrl} alt={w?.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: w?.color || '#ccc' }}>
                                    <span className="text-sm font-black text-white">{w?.name.charAt(0).toUpperCase()}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                          <div className="flex flex-col truncate">
                            <div className="flex items-center gap-2 mb-1 md:hidden">
                              <span className="text-[10px] font-black text-muted-foreground">{formatDate(t.date).split('/')[0]}/{formatDate(t.date).split('/')[1]}</span>
                              <div className="w-1 h-1 rounded-full bg-border" />
                              <div className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-60 truncate flex items-center gap-1">
                                {(() => {
                                  const isInvoicePayment = (t.description?.toLowerCase() || '').includes('pagamento de fatura');
                                  const showDouble = isInvoicePayment || t.type === 'transfer' || t.type === 'provision';

                                  if (!showDouble) {
                                    const w = wallets.find(item => item.id === t.walletId);
                                    if (!w) return null;
                                    return (
                                      <div className="flex items-center gap-1 bg-muted/50 px-1 py-0.5 rounded border border-border/20">
                                        <IconRenderer icon={w.logoUrl || w.icon || 'wallet'} color={w.color} size={10} className="shrink-0" />
                                        <span className="text-[8px] font-black uppercase text-primary/80">{w.name}</span>
                                      </div>
                                    );
                                  }

                                  const sourceW = wallets.find(item => item.id === t.walletId);
                                  const destW = wallets.find(item => item.id === t.toWalletId);

                                  return (
                                    <div className="flex items-center gap-1 flex-wrap">
                                      {sourceW && (
                                        <div className="flex items-center gap-1 bg-muted/50 px-1 py-0.5 rounded border border-border/20">
                                          <IconRenderer icon={sourceW.logoUrl || sourceW.icon || 'wallet'} color={sourceW.color} size={10} className="shrink-0" />
                                          <span className="text-[8px] font-black uppercase text-primary/80">{sourceW.name}</span>
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
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap overflow-hidden flex-1">
                              <span className="font-bold text-[11px] uppercase tracking-tight break-words">
                                {t.description}
                                {(() => {
                                  const txCat = categories.find(c => c.id === t.categoryId);
                                  if (txCat && txCat.id !== viewingTransactionsId) {
                                    return <span className="text-muted-foreground/60 ml-1"> / {txCat.name}</span>;
                                  }
                                  return null;
                                })()}
                              </span>
                              {(() => {
                                const wallet = wallets.find(w => w.id === t.walletId);
                                const isInvoicePayment = (t.description?.toLowerCase() || '').includes('pagamento de fatura');
                                const isRefund = t.type === 'income' && wallet?.type === 'credit_card';
                                if (isInvoicePayment || isRefund) {
                                  return <span className="text-[7px] bg-rose-500/10 text-rose-500 px-1 py-0.5 rounded uppercase font-black border border-rose-500/20 shrink-0">Fatura</span>;
                                }
                                if (t.type === 'planned') {
                                  return <span className="text-[7px] bg-yellow-500/10 text-yellow-500 px-1 py-0.5 rounded uppercase font-black border border-yellow-500/20 shrink-0">Planejada</span>;
                                }
                                return null;
                              })()}
                            </div>
                            <span className="hidden md:block text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1.5 opacity-60">
                              {(() => {
                                const isInvoicePayment = (t.description?.toLowerCase() || '').includes('pagamento de fatura');
                                const showDouble = isInvoicePayment || t.type === 'transfer' || t.type === 'provision';

                                const getWalletDisplayName = (w?: Wallet) => {
                                  if (!w) return '';
                                  if (w.type === 'credit_card') {
                                    const hasCartao = w.name.toLowerCase().includes('cartão') || w.name.toLowerCase().includes('cartao');
                                    return hasCartao ? w.name.toUpperCase() : `CARTÃO ${w.name.toUpperCase()}`;
                                  }
                                  return w.name.toUpperCase();
                                };

                                if (!showDouble) {
                                  const w = wallets.find(item => item.id === t.walletId);
                                  return w ? getWalletDisplayName(w) : 'CARTEIRA PADRÃO';
                                }

                                const sourceW = wallets.find(item => item.id === t.walletId);
                                const destW = wallets.find(item => item.id === t.toWalletId);

                                if (sourceW && destW) {
                                  return `${getWalletDisplayName(sourceW)} ➔ ${getWalletDisplayName(destW)}`;
                                }
                                if (sourceW) return getWalletDisplayName(sourceW);
                                if (destW) return getWalletDisplayName(destW);
                                return 'CARTEIRA PADRÃO';
                              })()}
                            </span>
                            {t.groupId && t.type === 'expense' && (
                              <div className={cn(
                                "mt-1 px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-tighter w-fit border",
                                t.necessity === 'necessary'
                                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                              )}>
                                {t.necessity === 'necessary' ? 'Nec.' : 'Desnec.'}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="hidden md:flex flex-col items-center justify-center w-24">
                          <span className="text-[10px] font-black uppercase tracking-tighter mb-1">{formatDate(t.date)}</span>
                          {t.isPaid && t.paidDate && wallets.find(w => w.id === t.walletId)?.type !== 'credit_card' && (
                            <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full mt-1">
                              Pago: {new Date(t.paidDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            </span>
                          )}
                          {t.isContinuous && (
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 bg-slate-500/10 px-2 py-0.5 rounded-full mt-1 flex items-center gap-1">
                              <RefreshCw size={7} /> Ciclo
                            </span>
                          )}
                          {(() => {
                            const wallet = wallets.find(w => w.id === t.walletId);
                            if (wallet?.type === 'credit_card' && t.invoiceMonth && t.invoiceYear) {
                              return (
                                <span className={cn(
                                  "text-[8px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full",
                                  t.isPaid && t.paidDate && "mt-1"
                                )}>
                                  Fatura {MONTH_NAMES[t.invoiceMonth - 1].substring(0, 3)}/{t.invoiceYear.toString().slice(-2)}
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>


                        <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-40 border-t md:border-t-0 border-border/40 pt-3 md:pt-0">
                          <div className="flex flex-col items-start md:hidden">
                            <span className={cn("font-black text-sm tracking-tighter", t.type === 'income' ? "text-emerald-500" : "text-rose-500")}>
                              {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                            </span>
                            {t.recurrenceNumber && (
                              <span className="text-[7px] font-bold text-orange-500 uppercase tracking-tighter">
                                {t.recurrenceNumber.current} de {t.recurrenceNumber.total}
                              </span>
                            )}
                            {t.isContinuous && (
                              <span className="text-[7px] font-bold text-slate-500 uppercase tracking-tighter flex items-center gap-1">
                                <RefreshCw size={7} /> Ciclo
                              </span>
                            )}
                            {t.isPaid === false && wallets.find(w => w.id === t.walletId)?.type !== 'credit_card' && <span className="text-[7px] font-black uppercase text-amber-500 tracking-tighter">Pendente</span>}
                          </div>
                          <div className="hidden md:flex flex-col items-end">
                            <span className={cn("font-black text-base tracking-tighter", t.type === 'income' ? "text-emerald-500" : "text-rose-500")}>
                              {formatCurrency(t.amount)}
                            </span>
                            {t.recurrenceNumber && (
                              <span className="text-[9px] font-bold text-orange-500 uppercase tracking-tighter">
                                {t.recurrenceNumber.current} de {t.recurrenceNumber.total}
                              </span>
                            )}
                            {t.isContinuous && (
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter flex items-center gap-1">
                                <RefreshCw size={8} /> Ciclo
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {(() => {
                              const wallet = wallets.find(w => w.id === t.walletId);
                              if (wallet?.type !== 'credit_card') {
                                return (
                                  <button
                                    onClick={() => handleToggleTxStatus(t)}
                                    className={cn(
                                      "p-2 rounded-xl transition-all",
                                      t.isPaid ? "text-emerald-500" : "text-amber-500"
                                    )}
                                  >
                                    {t.isPaid ? <ThumbsUp size={16} /> : <ThumbsDown size={16} />}
                                  </button>
                                );
                              }
                              return null;
                            })()}
                            <button onClick={() => handleEditTransaction(t)} className="p-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/5 rounded-lg transition-all"><Edit size={16} /></button>
                            <button onClick={() => handleDeleteTx(t.id)} className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5 rounded-lg transition-all"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <TransactionModal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        editingTransaction={editingTransaction}
      />


      {/* Action Choice Modal */}
      <AnimatePresence>
        {categoryForAction && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCategoryForAction(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-card w-full max-w-md rounded-[2.5rem] shadow-2xl border border-border/50 overflow-hidden"
            >
              {/* Header */}
              <div className="p-8 border-b border-border/40 flex items-center justify-between bg-muted/5">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-2 border-background shrink-0 overflow-hidden"
                    style={{ backgroundColor: categoryForAction.color }}
                  >
                    <IconRenderer
                      icon={categoryForAction.icon}
                      name={categoryForAction.name}
                      size={56}
                      simple
                      scale={0.65}
                      className="text-white"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight leading-tight break-words">{categoryForAction.name}</h2>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">O que deseja fazer?</p>
                  </div>
                </div>
                <button onClick={() => setCategoryForAction(null)} className="p-3 hover:bg-muted rounded-2xl transition-all">
                  <X size={20} />
                </button>
              </div>

              {/* Action List */}
              <div className="p-4 space-y-2">
                {[
                  {
                    id: 'txs',
                    label: 'Ver Lançamentos',
                    description: 'Histórico detalhado de movimentações',
                    icon: HistoryIcon,
                    color: 'text-primary',
                    bg: 'bg-primary/10',
                    onClick: () => { setViewingTransactionsId(categoryForAction.id); setCategoryForAction(null); }
                  },
                  ...(!categoryForAction.parentId ? [{
                    id: 'subs',
                    label: 'Ver Subcategorias',
                    description: 'Gerenciar divisões desta categoria',
                    icon: Layers,
                    color: 'text-emerald-500',
                    bg: 'bg-emerald-500/10',
                    onClick: () => { toggleExpand(categoryForAction.id); setCategoryForAction(null); }
                  }] : []),
                  ...(categoryForAction.type === 'expense' ? [{
                    id: 'budget',
                    label: 'Editar Meta Mensal',
                    description: 'Alterar limite de gastos planejado',
                    icon: TrendingUp,
                    color: 'text-blue-500',
                    bg: 'bg-blue-500/10',
                    onClick: () => { handleOpenModal(undefined, categoryForAction, 'budget'); setCategoryForAction(null); }
                  }] : []),
                  {
                    id: 'edit',
                    label: 'Editar Dados',
                    description: categoryForAction.parentId ? 'Alterar nome da subcategoria' : 'Alterar nome, ícone ou cor principal',
                    icon: Edit,
                    color: 'text-muted-foreground',
                    bg: 'bg-muted',
                    onClick: () => { handleOpenModal(undefined, categoryForAction); setCategoryForAction(null); }
                  },
                  ...(categoryForAction.isActive === false ? [{
                    id: 'delete',
                    label: 'Excluir Categoria',
                    description: 'Remover permanentemente ou arquivar',
                    icon: Trash2,
                    color: 'text-rose-500',
                    bg: 'bg-rose-500/10',
                    onClick: () => handleDeleteCategory(categoryForAction)
                  }] : [])
                ].map((action) => (
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

              <div className="p-6 bg-muted/5 border-t border-border/40">
                <button
                  onClick={() => setCategoryForAction(null)}
                  className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-all"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
