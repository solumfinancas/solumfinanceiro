import React, { useState } from 'react';
import { useFinance } from '../FinanceContext';
import { useModal } from '../contexts/ModalContext';
import { 
  X, 
  Search, 
  ThumbsUp, 
  ThumbsDown, 
  Edit, 
  Trash2, 
  CreditCard,
  ArrowLeftRight,
  TrendingDown,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { Transaction } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { TransactionModal } from './TransactionModal';
import { IconRenderer } from './ui/IconRenderer';

interface PendingTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'payable' | 'receivable';
}

export const PendingTransactionsModal: React.FC<PendingTransactionsModalProps> = ({ 
  isOpen, 
  onClose, 
  type 
}) => {
  const { transactions, categories, wallets, updateTransaction, deleteTransaction } = useFinance();
  const { showConfirm } = useModal();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const pendingList = transactions
    .filter(t => {
      const isPending = t.isPaid === false;
      const matchesType = type === 'payable' 
        ? (t.type === 'expense' || t.type === 'provision' || t.type === 'planned')
        : t.type === 'income';
      
      const category = categories.find(c => c.id === t.categoryId);
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (category?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      return isPending && matchesType && matchesSearch;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const totalAmount = pendingList.reduce((sum, t) => sum + t.amount, 0);

  const handleEdit = (id: string) => {
    setEditingId(id);
    setIsEditModalOpen(true);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative bg-card w-full max-w-6xl rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl border p-4 md:p-8 max-h-[95vh] md:max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6 mb-3 md:mb-8 border-b border-border/50 pb-3 md:pb-8">
               <div className="flex items-center gap-3 md:gap-4">
                  <div className={cn(
                    "w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg",
                    type === 'payable' ? "bg-rose-500 text-white shadow-rose-500/20" : "bg-emerald-500 text-white shadow-emerald-500/20"
                  )}>
                    {type === 'payable' ? <TrendingDown size={20} className="md:size-7" /> : <TrendingUp size={20} className="md:size-7" />}
                  </div>
                  <div>
                    <h2 className="text-lg md:text-3xl font-black uppercase tracking-tighter">
                      {type === 'payable' ? 'Contas a Pagar' : 'Valores a Receber'}
                    </h2>
                    <p className="text-muted-foreground text-[8px] md:text-[10px] font-bold uppercase tracking-widest mt-0.5 opacity-60">
                      Sem filtros de data
                    </p>
                  </div>
               </div>
               
               <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
                  <div className="relative group w-full md:min-w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
                    <input 
                      type="text"
                      placeholder="Buscar por descrição..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-muted/30 border border-border/50 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-medium text-xs md:text-sm transition-all"
                    />
                  </div>
                  <button onClick={onClose} className="hidden md:flex p-3 hover:bg-muted rounded-full transition-colors active:scale-95">
                    <X size={24} />
                  </button>
               </div>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
               {pendingList.length > 0 ? (
                 <div className="overflow-x-auto rounded-3xl border border-border/50">
                   <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-muted/30 border-b border-border/50">
                          <th className="px-3 md:px-6 py-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data</th>
                          <th className="px-3 md:px-6 py-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descrição</th>
                          <th className="px-3 md:px-6 py-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Categoria</th>
                          <th className="px-3 md:px-6 py-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Carteira</th>
                          <th className="px-3 md:px-6 py-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Valor</th>
                          <th className="px-3 md:px-6 py-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Status</th>
                          <th className="px-3 md:px-6 py-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Ações</th>
                        </tr>
                      </thead>
                     <tbody className="divide-y divide-border/30">
                       {pendingList.map(t => {
                         const category = categories.find(c => c.id === t.categoryId);
                         const wallet = wallets.find(w => w.id === t.walletId);
                         const isInvoicePayment = t.description.toLowerCase().includes('pagamento de fatura');

                         return (
                            <tr key={t.id} className="hover:bg-muted/20 transition-all group">
                              <td className="px-3 md:px-6 py-3 whitespace-nowrap">
                                <div className="flex flex-col">
                                  <span className="text-[10px] md:text-xs font-black">{new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                                  <span className="text-[8px] font-bold text-muted-foreground uppercase">{new Date(t.date).getUTCFullYear()}</span>
                                </div>
                              </td>
                              <td className="px-3 md:px-6 py-3 min-w-[140px] md:min-w-[200px]">
                                <span className="text-[10px] md:text-sm font-bold text-foreground leading-tight block truncate max-w-[180px] md:max-w-none" title={t.description}>{t.description}</span>
                              </td>
                              <td className="px-3 md:px-6 py-3">
                                  {t.type !== 'provision' && category ? (
                                     <div className="flex items-center gap-2">
                                        <IconRenderer 
                                           icon={category.parentId ? (categories.find(c => c.id === category.parentId)?.icon || category.icon) : category.icon} 
                                           color={category.color}
                                           size={18}
                                           className="rounded-lg shadow-sm border border-border/30 md:scale-125"
                                        />
                                        <div className="flex flex-col">
                                          {category.parentId && (
                                            <span className="text-[7px] md:text-[8px] font-black uppercase text-muted-foreground -mb-0.5">
                                              {categories.find(c => c.id === category.parentId)?.name}
                                            </span>
                                          )}
                                          <span className="text-[9px] md:text-xs font-black uppercase tracking-tighter opacity-80">{category.name}</span>
                                       </div>
                                    </div>
                                  ) : category ? null : (
                                    <span className="text-[10px] italic text-muted-foreground">N/A</span>
                                  )}
                              </td>
                               <td className="px-3 md:px-6 py-3 text-xs whitespace-nowrap">
                                 <div className="flex items-center gap-2">
                                    {(() => {
                                         const wId = isInvoicePayment ? t.toWalletId : t.walletId;
                                         const w = wallets.find(item => item.id === wId);
                                         if (!w) return null;
                                         return (
                                           <IconRenderer 
                                             icon={w.logoUrl || w.icon || (w.type === 'credit_card' ? 'CreditCard' : 'Wallet')} 
                                             color={w.color} 
                                             size={18} 
                                             className="shrink-0 shadow-sm border border-border/10 md:scale-125" 
                                           />
                                         );
                                    })()}
                                    <span className="font-bold text-[10px] md:text-sm whitespace-nowrap">
                                      {(() => {
                                         const wId = isInvoicePayment ? t.toWalletId : t.walletId;
                                         const w = wallets.find(item => item.id === wId);
                                         if (!w) return 'Excluída';
                                         const name = w.type === 'credit_card' ? `(C) ${w.name}` : w.name;
                                         return name.length > 15 ? name.substring(0, 12) + '...' : name;
                                      })()}
                                    </span>
                                 </div>
                               </td>
                              <td className={cn(
                                "px-3 md:px-6 py-3 text-[10px] md:text-sm font-black text-right whitespace-nowrap",
                                type === 'receivable' ? "text-emerald-500" : "text-rose-500"
                              )}>
                                {type === 'receivable' ? '+' : '-'} {formatCurrency(t.amount)}
                              </td>
                              <td className="px-3 md:px-6 py-3">
                                <div className="flex justify-center whitespace-nowrap">
                                  <button 
                                    onClick={() => updateTransaction(t.id, { isPaid: true, date: new Date().toISOString().split('T')[0] })}
                                    className="flex items-center gap-1 px-2 md:px-3 py-1 bg-amber-500/10 text-amber-600 rounded-lg md:rounded-xl hover:bg-amber-500 text-[8px] md:text-[9px] hover:text-white font-black uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap border border-amber-500/20"
                                  >
                                    <ThumbsDown size={12} className="md:size-3.5" /> 
                                    <span className="hidden xs:inline">Pendente</span>
                                  </button>
                                </div>
                              </td>
                              <td className="px-3 md:px-6 py-3 text-center">
                                <div className="flex justify-center gap-1">
                                  <button 
                                    onClick={() => handleEdit(t.id)}
                                    className="p-1.5 md:p-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
                                  >
                                    <Edit size={14} className="md:size-4" />
                                  </button>
                                  <button 
                                    onClick={async () => {
                                      const confirmed = await showConfirm(
                                        'Excluir Lançamento',
                                        'Tem certeza?',
                                        { variant: 'danger', confirmText: 'Excluir' }
                                      );
                                      if (confirmed) deleteTransaction(t.id);
                                    }}
                                    className="p-1.5 md:p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                                  >
                                    <Trash2 size={14} className="md:size-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                         );
                       })}
                     </tbody>
                   </table>
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center text-muted-foreground/30 mb-6">
                       <AlertCircle size={40} />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tighter text-muted-foreground opacity-30">Tudo limpo por aqui!</h3>
                    <p className="text-xs font-bold text-muted-foreground uppercase opacity-20 mt-2">Nenhum lançamento pendente encontrado</p>
                 </div>
               )}
            </div>

            {/* Footer */}
            <div className="mt-3 md:mt-8 pt-3 md:pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
               <div className="flex items-center justify-between w-full md:w-auto md:gap-8">
                  <div className="flex flex-col">
                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Pendências</span>
                    <span className="text-[10px] md:text-sm font-black">{pendingList.length} Lançamentos</span>
                  </div>
                  <div className="flex flex-col text-right md:text-left">
                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Soma Total</span>
                    <span className={cn("text-lg md:text-2xl font-black", type === 'payable' ? "text-rose-500" : "text-emerald-500")}>
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
               </div>
               
               <button 
                 onClick={onClose}
                 className="w-full md:w-auto px-10 py-3 bg-muted text-foreground hover:bg-muted/80 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm"
               >
                 Fechar Janela
               </button>
            </div>
          </motion.div>

          {/* Individual Edit Modal Interaction */}
          <TransactionModal 
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            editingTransaction={editingId ? transactions.find(tx => tx.id === editingId) : null}
          />

        </div>
      )}
    </AnimatePresence>
  );
};
