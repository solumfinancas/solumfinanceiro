import React from 'react';
import { X, ThumbsUp, ThumbsDown, Check, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Transaction, Wallet, Category } from '../types';
import { cn, getInvoicePeriod } from '../lib/utils';
import { CustomSelect, SelectOption } from './ui/CustomSelect';

interface TransactionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onSave: (tx: Transaction) => void;
  wallets: Wallet[];
  categories: Category[];
}

export const TransactionEditModal: React.FC<TransactionEditModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onSave,
  wallets,
  categories
}) => {
  const [editingTx, setEditingTx] = React.useState<Transaction | null>(null);

  React.useEffect(() => {
    if (isOpen && transaction) {
      setEditingTx({ ...transaction });
    } else if (!isOpen) {
      setEditingTx(null);
    }
  }, [isOpen, transaction]);

  // Auto-select invoice when credit card is chosen or date changed
  React.useEffect(() => {
    if (!editingTx || !editingTx.date) return;
    const wallet = wallets.find(w => w.id === editingTx.walletId);
    if (wallet?.type === 'credit_card') {
      const d = new Date(editingTx.date + 'T12:00:00Z');
      const period = getInvoicePeriod(wallet.closingDay || 5, wallet.dueDay || 15, d);
      const m = period.due.getUTCMonth() + 1;
      const y = period.due.getUTCFullYear();

      const isFirstLoadOrWalletChange = !editingTx.invoiceMonth || !editingTx.invoiceYear;

      if (isFirstLoadOrWalletChange) {
        setEditingTx(prev => prev ? ({ ...prev, invoiceMonth: m, invoiceYear: y }) : null);
      }
    }

    // Auto-clear invalid wallet selection
    if (editingTx.walletId) {
      const isCreditCard = wallet?.type === 'credit_card';
      const isSpecialType = ['income', 'transfer', 'provision'].includes(editingTx.type || '');
      if (isSpecialType && isCreditCard) {
        setEditingTx(prev => prev ? ({ ...prev, walletId: undefined as any }) : null);
      }
    }
  }, [editingTx?.walletId, editingTx?.date, editingTx?.type, wallets]);

  if (!isOpen || !editingTx) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTx) {
      onSave(editingTx);
      onClose();
    }
  };

  const activeWallets = wallets.filter(w => w.isActive !== false || w.id === editingTx.walletId);
  const activeCategories = categories.filter(c => c.isActive !== false || c.id === editingTx.categoryId);

  const walletOptions = React.useMemo(() => {
    if (!editingTx) return [];
    const filteredId = editingTx.walletId;
    const filteredWallets = wallets.filter(w => {
      const isActive = w.isActive !== false || w.id === filteredId;
      const isCreditCard = w.type === 'credit_card';
      if (editingTx.type === 'income') return isActive && !isCreditCard;
      if (editingTx.type === 'transfer' || editingTx.type === 'provision') return isActive && !isCreditCard;
      return isActive;
    });

    const banks = filteredWallets.filter(w => w.type !== 'credit_card');
    const cards = filteredWallets.filter(w => w.type === 'credit_card');

    const result: SelectOption[] = [];
    if (cards.length > 0) {
      result.push({ id: 'header-cards', name: 'Cartões de Crédito', isHeader: true });
      cards.forEach(w => result.push({ id: w.id, name: `(CARTÃO) ${w.name}`, logoUrl: w.logoUrl, type: w.type }));
    }
    if (banks.length > 0) {
      result.push({ id: 'header-banks', name: 'Bancos', isHeader: true });
      banks.forEach(w => result.push({ id: w.id, name: w.name, logoUrl: w.logoUrl, type: w.type }));
    }
    return result;
  }, [wallets, editingTx.walletId, editingTx.type]);

  const categoryOptions = React.useMemo(() => {
    if (!editingTx) return [];
    const targetType = (editingTx.type === 'provision' || editingTx.type === 'planned') ? 'expense' : (editingTx.type === 'transfer' ? 'expense' : editingTx.type);

    const filtered = categories.filter(c =>
      (c.isActive !== false || c.id === editingTx.categoryId) &&
      c.type === targetType
    );

    const result: SelectOption[] = [];
    const parents = filtered.filter(c => !c.parentId);

    parents.forEach(parent => {
      result.push({ id: parent.id, name: parent.name, icon: parent.icon, color: parent.color });

      const children = categories.filter(c => c.parentId === parent.id && (c.isActive !== false || c.id === editingTx.categoryId));
      children.forEach(child => {
        result.push({ id: child.id, name: `${parent.name} > ${child.name}`, icon: child.icon, color: child.color, parentId: parent.id });
      });
    });

    return result;
  }, [categories, editingTx.type, editingTx.categoryId]);

  const targetWalletOptions = React.useMemo(() => {
    if (!editingTx) return [];
    return wallets
      .filter(w => (w.isActive !== false || w.id === editingTx.toWalletId) && w.id !== editingTx.walletId && ((editingTx.type !== 'transfer' && editingTx.type !== 'provision') || w.type !== 'credit_card'))
      .sort((a, b) => (a.type === b.type ? 0 : a.type === 'credit_card' ? -1 : 1))
      .map(w => ({
        id: w.id,
        name: w.type === 'credit_card' ? `(CARTÃO) ${w.name}` : w.name,
        logoUrl: w.logoUrl,
        type: w.type
      }));
  }, [wallets, editingTx?.walletId, editingTx?.toWalletId, editingTx?.type]);

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
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
        className="relative bg-card w-full max-w-xl rounded-[2.5rem] p-8 border border-border/50 shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">Editar Lançamento</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Ajustar detalhes do registro financeiro</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-muted rounded-2xl transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Descrição</label>
            <input
              type="text"
              value={editingTx.description || ''}
              onChange={e => setEditingTx({ ...editingTx, description: e.target.value })}
              className="w-full p-4 bg-muted/10 border border-border/40 rounded-2xl font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="Ex: Aluguel, Supermercado..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Valor</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-xs opacity-40">R$</span>
                <input
                  type="text"
                  value={(editingTx.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    setEditingTx({ ...editingTx, amount: Number(val) / 100 });
                  }}
                  className="w-full pl-10 pr-4 py-4 bg-muted/10 border border-border/40 rounded-2xl font-mono font-black focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Data</label>
              <input
                type="date"
                value={editingTx.date}
                onChange={e => setEditingTx({ ...editingTx, date: e.target.value })}
                className="w-full p-4 bg-muted/10 border border-border/40 rounded-2xl font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{(editingTx.type === 'transfer' || editingTx.type === 'provision') ? 'Carteira de Origem' : 'Carteira'}</label>
              <CustomSelect
                options={walletOptions}
                value={editingTx.walletId}
                onChange={val => setEditingTx({ ...editingTx, walletId: val })}
                placeholder="Selecionar Carteira"
              />

              {/* Fatura vinculada diretamente abaixo da carteira */}
              {wallets.find(w => w.id === editingTx.walletId)?.type === 'credit_card' && (
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 space-y-2 mt-1">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary">Vincular à Fatura</span>
                  </div>
                  <div className="flex gap-2">
                    <select
                      required
                      value={editingTx.invoiceMonth && editingTx.invoiceYear ? `${editingTx.invoiceMonth}-${editingTx.invoiceYear}` : ''}
                      onChange={(e) => {
                        const [m, y] = e.target.value.split('-').map(Number);
                        setEditingTx({ ...editingTx, invoiceMonth: m, invoiceYear: y });
                      }}
                      className="w-full px-3 py-2 bg-background border border-primary/20 rounded-xl text-[10px] font-bold outline-none text-foreground"
                    >
                      {!editingTx.invoiceMonth && <option value="">Selecionar Fatura</option>}
                      {(() => {
                        if (!editingTx.date) return null;
                        const baseDate = new Date(editingTx.date + 'T12:00:00');
                        if (isNaN(baseDate.getTime())) return null;

                        const options = [];
                        // Mostra a fatura do mês anterior e os próximos 6 meses
                        for (let i = -1; i < 7; i++) {
                          const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1);
                          if (isNaN(d.getTime())) continue;
                          const m = d.getMonth() + 1;
                          const y = d.getFullYear();
                          const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                          options.push(<option key={`${m}-${y}`} value={`${m}-${y}`}>{label.toUpperCase()}</option>);
                        }
                        return options;
                      })()}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {editingTx.type !== 'provision' && (editingTx.type === 'transfer' ? (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Carteira de Destino</label>
                <CustomSelect
                  options={targetWalletOptions}
                  value={editingTx.toWalletId || ''}
                  onChange={val => setEditingTx({ ...editingTx, toWalletId: val })}
                  placeholder="Selecionar Destino"
                />
              </div>
            ) : editingTx.type !== 'planned' ? (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Categoria</label>
                <CustomSelect
                  options={categoryOptions}
                  value={editingTx.categoryId || ''}
                  onChange={val => setEditingTx({ ...editingTx, categoryId: val })}
                  placeholder="Selecionar Categoria"
                />
              </div>
            ) : null)}
          </div>

          {editingTx.type !== 'provision' && (editingTx.type === 'transfer') && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Categoria</label>
              <CustomSelect
                options={categoryOptions}
                value={editingTx.categoryId || ''}
                onChange={val => setEditingTx({ ...editingTx, categoryId: val })}
                placeholder="Selecionar Categoria"
              />
            </div>
          )}

          {editingTx.type === 'expense' && editingTx.groupId && (
            <div className="space-y-2 mt-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Classificação</label>
              <div className="flex gap-4 p-1 bg-muted/30 rounded-2xl border border-border/50">
                <button
                  type="button"
                  onClick={() => setEditingTx({ ...editingTx, necessity: 'necessary' })}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center gap-1 py-4 rounded-xl transition-all",
                    editingTx.necessity === 'necessary' ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Check size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Necessário</span>
                  </div>
                  <span className={cn(
                    "text-[8px] font-bold uppercase opacity-60 leading-tight px-2 text-center",
                    editingTx.necessity === 'necessary' ? "text-white" : "text-muted-foreground"
                  )}>Essencial. Não pode ser guardado para realizar (Ex: Aluguel, Internet).</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditingTx({ ...editingTx, necessity: 'unnecessary' })}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center gap-1 py-4 rounded-xl transition-all",
                    editingTx.necessity === 'unnecessary' ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20 scale-[1.02]" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Desnecessário</span>
                  </div>
                  <span className={cn(
                    "text-[8px] font-bold uppercase opacity-60 leading-tight px-2 text-center",
                    editingTx.necessity === 'unnecessary' ? "text-white" : "text-muted-foreground"
                  )}>Variável. Poderia ter sido planejado antes de realizar (Ex: Roupas, Móveis).</span>
                </button>
              </div>
            </div>
          )}

          {wallets.find(w => w.id === editingTx.walletId)?.type !== 'credit_card' && (
            <div className="flex flex-col gap-2 mt-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Status de Pagamento</label>
              <button
                type="button"
                onClick={() => setEditingTx({ ...editingTx, isPaid: !editingTx.isPaid })}
                className={cn(
                  "flex items-center gap-4 px-6 py-4 rounded-[2rem] transition-all border-2 w-full",
                  editingTx.isPaid !== false
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 shadow-lg shadow-emerald-500/10"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-600 shadow-lg shadow-amber-500/10"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm",
                  editingTx.isPaid !== false ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                )}>
                  <ThumbsUp size={20} fill={editingTx.isPaid !== false ? "currentColor" : "none"} className={cn("transition-transform", editingTx.isPaid === false && "rotate-180")} />
                </div>
                <div className="text-left flex-1">
                  <p className="text-[11px] font-black uppercase tracking-widest leading-none mb-1">
                    {editingTx.isPaid !== false
                      ? (editingTx.type === 'income' ? 'Recebido / Liquidado' : 'Pago / Liquidado')
                      : (editingTx.type === 'income' ? 'Aguardando Recebimento' : 'Aguardando Pagamento')}
                  </p>
                  <p className="text-[9px] font-bold opacity-60 uppercase tracking-tighter">Clique para alterar o status</p>
                </div>
                <div className="text-right">
                  <span className={cn(
                    "text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest",
                    editingTx.isPaid !== false ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                  )}>
                    {editingTx.isPaid !== false ? 'Confirmado' : 'Pendente'}
                  </span>
                </div>
              </button>
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
              className="w-full sm:flex-1 shrink-0 px-4 h-14 sm:h-12 rounded-xl font-black uppercase text-xs tracking-widest bg-primary text-white shadow-lg shadow-primary/20 transition-all flex items-center justify-center hover:scale-[1.02] active:scale-95"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
