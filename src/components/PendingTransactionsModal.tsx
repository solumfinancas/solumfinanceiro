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
            className="relative bg-card w-full max-w-6xl rounded-[2.5rem] shadow-2xl border p-8 max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-border/50 pb-8">
               <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg",
                    type === 'payable' ? "bg-rose-500 text-white shadow-rose-500/20" : "bg-emerald-500 text-white shadow-emerald-500/20"
                  )}>
                    {type === 'payable' ? <TrendingDown size={28} /> : <TrendingUp size={28} />}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter">
                      {type === 'payable' ? 'Contas a Pagar' : 'Valores a Receber'}
                    </h2>
                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-0.5 opacity-60">
                      Gerencie todas as suas pendências sem filtros de data
                    </p>
                  </div>
               </div>
               
               <div className="flex items-center gap-4">
                  <div className="relative group min-w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                    <input 
                      type="text"
                      placeholder="Buscar por descrição ou categoria..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-muted/30 border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-medium text-sm transition-all"
                    />
                  </div>
                  <button onClick={onClose} className="p-3 hover:bg-muted rounded-full transition-colors active:scale-95">
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
                         <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data</th>
                         <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descrição</th>
                         <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Categoria</th>
                         <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Carteira</th>
                         <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Valor</th>
                         <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Status</th>
                         <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Ações</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-border/30">
                       {pendingList.map(t => {
                         const category = categories.find(c => c.id === t.categoryId);
                         const wallet = wallets.find(w => w.id === t.walletId);
                         const isInvoicePayment = t.description.toLowerCase().includes('pagamento de fatura');

                         return (
                           <tr key={t.id} className="hover:bg-muted/20 transition-all group">
                             <td className="px-6 py-4 whitespace-nowrap">
                               <div className="flex flex-col">
                                 <span className="text-xs font-black">{new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                                 <span className="text-[9px] font-bold text-muted-foreground uppercase">{new Date(t.date).getUTCFullYear()}</span>
                               </div>
                             </td>
                             <td className="px-6 py-4">
                               <span className="text-sm font-bold text-foreground line-clamp-1">{t.description}</span>
                             </td>
                             <td className="px-6 py-4">
                                {t.type !== 'provision' && category ? (
                                   <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-lg flex items-center justify-center border border-border/30" style={{ backgroundColor: category.color + '20' }}>
                                         <img 
                                           src={category.parentId ? categories.find(c => c.id === category.parentId)?.icon : category.icon} 
                                           alt="" 
                                           className="w-4 h-4 opacity-70" 
                                         />
                                      </div>
                                      <div className="flex flex-col">
                                         {category.parentId && (
                                           <span className="text-[8px] font-black uppercase text-muted-foreground -mb-0.5">
                                             {categories.find(c => c.id === category.parentId)?.name}
                                           </span>
                                         )}
                                         <span className="text-xs font-black uppercase tracking-tighter opacity-80">{category.name}</span>
                                      </div>
                                   </div>
                                 ) : category ? null : (
                                   <span className="text-[10px] italic text-muted-foreground">N/A</span>
                                 )}
                             </td>
                             <td className="px-6 py-4 text-sm whitespace-nowrap">
                               <div className="flex items-center gap-2">
                                  <CreditCard size={14} className="text-muted-foreground" />
                                  <span className="font-bold whitespace-nowrap">
                                    {(() => {
                                       const wId = isInvoicePayment ? t.toWalletId : t.walletId;
                                       const w = wallets.find(item => item.id === wId);
                                       if (!w) return 'Conta Excluída';
                                       return w.type === 'credit_card' ? `(CARTÃO) ${w.name}` : w.name;
                                    })()}
                                  </span>
                               </div>
                             </td>
                             <td className={cn(
                               "px-6 py-4 text-sm font-black text-right whitespace-nowrap",
                               type === 'receivable' ? "text-emerald-500" : "text-rose-500"
                             )}>
                               {type === 'receivable' ? '+' : '-'} {formatCurrency(t.amount)}
                             </td>
                             <td className="px-6 py-4">
                               <div className="flex justify-center whitespace-nowrap">
                                 <button 
                                   onClick={() => updateTransaction(t.id, { isPaid: true, date: new Date().toISOString().split('T')[0] })}
                                   className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-600 rounded-xl hover:bg-amber-500 text-[9px] hover:text-white font-black uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap border border-amber-500/20"
                                 >
                                   <ThumbsDown size={14} /> 
                                   Pendente
                                 </button>
                               </div>
                             </td>
                             <td className="px-6 py-4 text-center">
                               <div className="flex justify-center gap-1 transition-all">
                                 <button 
                                   onClick={() => handleEdit(t.id)}
                                   className="p-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
                                   title="Editar"
                                 >
                                   <Edit size={16} />
                                 </button>
                                 <button 
                                   onClick={async () => {
                                     const confirmed = await showConfirm(
                                       'Excluir Lançamento',
                                       'Tem certeza que deseja excluir este lançamento pendente? Esta ação afetará sua previsão de saldo.',
                                       { variant: 'danger', confirmText: 'Excluir Agora' }
                                     );
                                     if (confirmed) deleteTransaction(t.id);
                                   }}
                                   className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                                   title="Excluir"
                                 >
                                   <Trash2 size={16} />
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
            <div className="mt-8 pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="flex items-center gap-8">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total de Pendências</span>
                    <span className="text-sm font-black">{pendingList.length} Lançamentos</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Soma dos Valores</span>
                    <span className={cn("text-2xl font-black", type === 'payable' ? "text-rose-500" : "text-emerald-500")}>
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
               </div>
               
               <button 
                 onClick={onClose}
                 className="px-10 py-4 bg-muted text-foreground hover:bg-muted/80 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm"
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
