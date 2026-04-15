import React, { useState, useEffect, useMemo } from 'react';
import { X, TrendingUp, ThumbsUp, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Transaction, Wallet, Category } from '../types';
import { cn } from '../lib/utils';
import { CustomSelect, SelectOption } from './ui/CustomSelect';

interface RefundEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onSave: (id: string, updates: Partial<Transaction>) => void;
  wallets: Wallet[];
  categories: Category[];
}

export const RefundEditModal: React.FC<RefundEditModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onSave,
  wallets,
  categories
}) => {
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  useEffect(() => {
    if (isOpen && transaction) {
      setEditingTx({ ...transaction });
    } else if (!isOpen) {
      setEditingTx(null);
    }
  }, [isOpen, transaction]);

  const wallet = useMemo(() => 
    wallets.find(w => w.id === editingTx?.walletId), 
  [wallets, editingTx?.walletId]);

  const categoryOptions = useMemo(() => {
    if (!editingTx) return [];
    const filtered = categories.filter(c => 
      (c.isActive !== false || c.id === editingTx.categoryId) && 
      c.type === 'income'
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
  }, [categories, editingTx?.categoryId]);

  if (!isOpen || !editingTx) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTx) {
      const { id, ...updates } = editingTx;
      onSave(id, updates);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative bg-card w-full max-w-lg rounded-3xl shadow-2xl border p-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Editar Estorno de Cartão</h2>
                <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                  <X size={20} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <span className="block text-[10px] font-black uppercase text-emerald-600 tracking-widest leading-none mb-1">LANÇAMENTO DE ESTORNO</span>
                  <span className="text-[9px] font-bold text-emerald-600/60 uppercase leading-tight block">Este lançamento libera limite no seu cartão e reduz o valor da fatura.</span>
                </div>
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
                        setEditingTx({...editingTx, amount: Number(val) / 100});
                      }} 
                      className="w-full pl-10 pr-4 py-4 bg-muted/10 border border-border/40 rounded-2xl font-mono font-black focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground text-sm" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Data Competência</label>
                  <input 
                    type="date" 
                    value={editingTx.date} 
                    onChange={e => setEditingTx({...editingTx, date: e.target.value})} 
                    className="w-full p-4 bg-muted/10 border border-border/40 rounded-2xl font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground text-sm" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 ml-1">Data do Pagamento / Recebimento</label>
                <div className="relative">
                   <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                     <span className="text-[10px] font-bold text-emerald-600/60 uppercase">Confirmado</span>
                     <ThumbsUp size={14} className="text-emerald-500" />
                   </div>
                   <input 
                    type="date" 
                    value={editingTx.paidDate || editingTx.date} 
                    onChange={e => setEditingTx({...editingTx, paidDate: e.target.value})} 
                    className="w-full p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-foreground text-sm" 
                  />
                </div>
              </div>

              <div className="space-y-2 opacity-60">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Descrição</label>
                <div className="w-full p-4 bg-muted/20 border border-border/40 rounded-2xl font-bold text-muted-foreground cursor-not-allowed text-xs">
                  {editingTx.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Carteira</label>
                  <div className="w-full p-4 bg-muted/20 border border-border/40 rounded-2xl font-bold text-muted-foreground cursor-not-allowed flex items-center gap-3">
                    <CreditCard size={18} />
                    <span className="text-[11px] uppercase tracking-tight">{wallet?.name || 'Cartão não encontrado'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Categoria</label>
                  <CustomSelect 
                    options={categoryOptions}
                    value={editingTx.categoryId || ''} 
                    onChange={val => setEditingTx({...editingTx, categoryId: val})}
                    placeholder="Selecionar Categoria"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-4 bg-emerald-500/10 border border-emerald-500/20 px-6 py-4 rounded-[2rem] text-emerald-600">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <ThumbsUp size={20} fill="currentColor" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-[11px] font-black uppercase tracking-widest leading-none mb-1">Confirmado / Liquidado</p>
                    <p className="text-[9px] font-bold opacity-60 uppercase tracking-tighter italic text-emerald-900/60">Status travado para estornos confirmados</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="flex-1 py-5 font-black uppercase text-[10px] tracking-widest text-muted-foreground hover:bg-muted rounded-[1.5rem] transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-5 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-[1.5rem] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Salvar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
