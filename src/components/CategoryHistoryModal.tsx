import React, { useState, useMemo } from 'react';
import { 
  X, ChevronLeft, ThumbsUp, ThumbsDown, Trash2, Edit, RefreshCw, Layers, History, Search, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Transaction, Category, Wallet } from '../types';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { useModal } from '../contexts/ModalContext';

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const StyledCheckbox = ({ checked, onChange, title }: { checked: boolean, onChange: () => void, title?: string }) => (
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

interface CategoryHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  categoryId: string;
  categories: Category[];
  transactions: Transaction[];
  wallets: Wallet[];
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  onEditTransaction: (tx: Transaction) => void;
  // Filters
  filterMonth: number | 'all';
  filterYear: number;
  paymentFilter: 'all' | 'paid' | 'pending';
}

export const CategoryHistoryModal: React.FC<CategoryHistoryModalProps> = ({
  isOpen, onClose, onBack, categoryId, categories, transactions, wallets,
  updateTransaction, deleteTransaction, onEditTransaction,
  filterMonth, filterYear, paymentFilter
}) => {
  const { showConfirm } = useModal();
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);

  const category = categories.find(c => c.id === categoryId);
  const targetCategoryIds = useMemo(() => {
    const ids = [categoryId];
    if (category && !category.parentId) {
      ids.push(...categories.filter(s => s.parentId === categoryId).map(s => s.id));
    }
    return ids;
  }, [categoryId, category, categories]);

  const relevantTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const d = new Date(t.date + 'T12:00:00Z');
        const mMatch = filterMonth === 'all' || (d.getUTCMonth() + 1) === filterMonth;
        const yMatch = d.getUTCFullYear() === filterYear;
        const pMatch = paymentFilter === 'all' || (paymentFilter === 'paid' ? t.isPaid : !t.isPaid);
        return targetCategoryIds.includes(t.categoryId || '') && mMatch && yMatch && pMatch;
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
  }, [transactions, targetCategoryIds, filterMonth, filterYear, paymentFilter]);

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

  const allSelected = relevantTransactions.length > 0 && relevantTransactions.every(t => selectedTxIds.includes(t.id));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="relative bg-card w-full h-full md:max-w-5xl md:max-h-[90vh] md:rounded-[2.5rem] shadow-2xl border border-border flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 border-b border-border flex flex-col md:flex-row md:items-center justify-between bg-card shrink-0 gap-4">
              <div className="flex items-center gap-4">
                {onBack && (
                  <button
                    onClick={onBack}
                    className="p-2 hover:bg-muted rounded-xl transition-all"
                  >
                    <ChevronLeft size={24} />
                  </button>
                )}
                <div className="flex flex-col">
                  <h2 className="text-2xl font-black uppercase tracking-tighter">Histórico de Lançamentos</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                    {category?.name}
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
                <button onClick={onClose} className="p-4 hover:bg-muted rounded-2xl transition-all shadow-sm"><X size={24} /></button>
              </div>
            </div>

            {/* Table Header */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
              <div className="hidden md:grid grid-cols-[auto_1fr_auto_auto_auto] gap-6 px-6 py-4 border-b border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 items-center">
                <StyledCheckbox
                  checked={allSelected}
                  onChange={() => {
                    if (allSelected) setSelectedTxIds([]);
                    else setSelectedTxIds(relevantTransactions.map(t => t.id));
                  }}
                />
                <span>Descrição / Detalhes</span>
                <span className="text-center w-24">Data</span>
                <span className="text-center w-24">Status</span>
                <span className="text-right w-32">Valor</span>
              </div>

              {/* Transactions List */}
              <div className="space-y-3 mt-6">
                {relevantTransactions.length === 0 ? (
                  <div className="py-20 text-center space-y-4 bg-muted/5 rounded-[2.5rem] border border-dashed border-border/50">
                    <Layers className="mx-auto text-muted-foreground opacity-20" size={48} />
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-60">Nenhum lançamento encontrado neste período</p>
                  </div>
                ) : (
                  relevantTransactions.map(t => (
                    <div key={t.id} className={cn(
                      "group p-4 md:p-5 bg-card hover:bg-muted/10 rounded-2xl md:rounded-3xl border border-border flex flex-col md:grid md:grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 md:gap-6 transition-all",
                      selectedTxIds.includes(t.id) && "border-primary bg-primary/5"
                    )}>
                      <div className="px-6 py-4">
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
                        <div className="flex flex-col flex-1 min-w-0">
                          {(() => {
                            const cat = categories.find(c => c.id === t.categoryId);
                            return (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-[11px] uppercase tracking-tight break-words">{t.description}</span>
                                <span className="text-muted-foreground text-[10px]">/</span>
                                <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-widest">{cat?.name || 'Geral'}</span>
                              </div>
                            );
                          })()}
                          <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1.5 opacity-60">
                            {wallets.find(w => w.id === t.walletId)?.name || 'Carteira Padrão'}
                          </span>
                          {t.groupId && t.type === 'expense' && (
                            <div className={cn(
                              "mt-2 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter w-fit border",
                              t.necessity === 'necessary'
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            )}>
                              {t.necessity === 'necessary' ? 'Nec. Recorrente' : 'Desnec. Recorrente'}
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

                      <div className="flex items-center justify-center gap-2">
                        {(() => {
                          const wallet = wallets.find(w => w.id === t.walletId);
                          if (wallet?.type === 'credit_card') return null;
                          return (
                            <>
                              <button
                                onClick={() => handleToggleTxStatus(t)}
                                className={cn(
                                  "p-2 rounded-xl transition-all",
                                  t.isPaid ? "bg-emerald-500/10 text-emerald-500" : "text-muted-foreground hover:bg-muted"
                                )}
                                title="Marcar como Pago"
                              >
                                <ThumbsUp size={16} />
                              </button>
                              <button
                                onClick={() => handleToggleTxStatus(t)}
                                className={cn(
                                  "p-2 rounded-xl transition-all",
                                  !t.isPaid ? "bg-amber-500/10 text-amber-500" : "text-muted-foreground hover:bg-muted"
                                )}
                                title="Marcar como Pendente"
                              >
                                <ThumbsDown size={16} />
                              </button>
                            </>
                          );
                        })()}
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-40">
                        <span className={cn("font-black text-base tracking-tighter", t.type === 'income' ? "text-emerald-500" : "text-rose-500")}>
                          {formatCurrency(t.amount)}
                        </span>
                        <div className="flex gap-1">
                          <button onClick={() => onEditTransaction(t)} className="p-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/5 rounded-lg transition-all"><Edit size={16} /></button>
                          <button onClick={() => handleDeleteTx(t.id)} className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5 rounded-lg transition-all"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
