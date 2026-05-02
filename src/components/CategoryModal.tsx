import React, { useState, useEffect } from 'react';
import { 
  X, Tag, Wine, Shirt, ClipboardList, GraduationCap, Smile, Plane, 
  Building2, Music, Dribbble, Umbrella, Book, Briefcase, ChefHat, 
  Banknote, Monitor, Dice5, TrendingUp, Trophy, Eye, Users, Heart, 
  Flag, Utensils, Gamepad2, HeartHandshake, ShoppingCart, Dumbbell, 
  Plus, Home, Zap, BarChart3, Image as LucideImage, DollarSign, Lock, 
  Bike, Coffee, List, MoreHorizontal, Palette, FileText, User, 
  PawPrint, Shield, Ship, Star, Truck, ShoppingBag, SmilePlus, 
  Snowflake, Sprout, Store, Syringe, Tablet, Percent, Car, Wrench, 
  Train, Bus, PlaneTakeoff, Map, Compass, Wallet, LifeBuoy, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModal } from '../contexts/ModalContext';
import { cn, formatCurrency } from '../lib/utils';
import { Check } from 'lucide-react';
import { Category } from '../types';
import { Portal } from './ui/Portal';
import { IconRenderer } from './ui/IconRenderer';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Partial<Category>) => void;
  editingCategory?: Category | null;
  parentId?: string;
  parentType?: 'income' | 'expense';
  parentColor?: string;
  mode?: 'full' | 'budget';
}

const CATEGORY_COLORS = [
  '#ec4899', '#8b5cf6', '#6366f1', '#3b82f6', '#be185d', '#f43f5e', '#fda4af',
  '#2563eb', '#22c55e', '#fb923c', '#f9a8d4', '#15803d', '#f97316', '#f59e0b',
  '#c2410c', '#60a5fa', '#9ca3af', '#14b8a6', '#065f46', '#99f6e4', '#dc2626'
];

const ICONS = [
  { name: 'Tag', icon: Tag }, { name: 'Wine', icon: Wine }, { name: 'Shirt', icon: Shirt },
  { name: 'ClipboardList', icon: ClipboardList }, { name: 'GraduationCap', icon: GraduationCap },
  { name: 'Smile', icon: Smile }, { name: 'Plane', icon: Plane }, { name: 'Building2', icon: Building2 },
  { name: 'Music', icon: Music }, { name: 'Dribbble', icon: Dribbble }, { name: 'Umbrella', icon: Umbrella },
  { name: 'Book', icon: Book }, { name: 'Briefcase', icon: Briefcase }, { name: 'ChefHat', icon: ChefHat },
  { name: 'Banknote', icon: Banknote }, { name: 'Monitor', icon: Monitor }, { name: 'Dice5', icon: Dice5 },
  { name: 'TrendingUp', icon: TrendingUp }, { name: 'Trophy', icon: Trophy }, { name: 'Eye', icon: Eye },
  { name: 'Users', icon: Users }, { name: 'Heart', icon: Heart }, { name: 'Flag', icon: Flag },
  { name: 'Utensils', icon: Utensils }, { name: 'Gamepad2', icon: Gamepad2 }, { name: 'HeartHandshake', icon: HeartHandshake },
  { name: 'ShoppingCart', icon: ShoppingCart }, { name: 'Dumbbell', icon: Dumbbell }, { name: 'Plus', icon: Plus },
  { name: 'Home', icon: Home }, { name: 'Zap', icon: Zap }, { name: 'BarChart3', icon: BarChart3 },
  { name: 'LucideImage', icon: LucideImage }, { name: 'DollarSign', icon: DollarSign }, { name: 'Lock', icon: Lock },
  { name: 'Bike', icon: Bike }, { name: 'Coffee', icon: Coffee }, { name: 'List', icon: List },
  { name: 'MoreHorizontal', icon: MoreHorizontal }, { name: 'Palette', icon: Palette }, { name: 'FileText', icon: FileText },
  { name: 'User', icon: User }, { name: 'PawPrint', icon: PawPrint }, { name: 'Shield', icon: Shield },
  { name: 'Ship', icon: Ship }, { name: 'Star', icon: Star }, { name: 'Truck', icon: Truck },
  { name: 'ShoppingBag', icon: ShoppingBag }, { name: 'SmilePlus', icon: SmilePlus }, { name: 'Snowflake', icon: Snowflake },
  { name: 'Sprout', icon: Sprout }, { name: 'Store', icon: Store }, { name: 'Syringe', icon: Syringe },
  { name: 'Tablet', icon: Tablet }, { name: 'Percent', icon: Percent }, { name: 'Car', icon: Car },
  { name: 'Wrench', icon: Wrench }, { name: 'Train', icon: Train }, { name: 'Bus', icon: Bus },
  { name: 'PlaneTakeoff', icon: PlaneTakeoff }, { name: 'Map', icon: Map }, { name: 'Compass', icon: Compass },
  { name: 'Wallet', icon: Wallet }, { name: 'LifeBuoy', icon: LifeBuoy }
];

export const CategoryModal: React.FC<CategoryModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  editingCategory,
  parentId,
  parentType,
  parentColor,
  mode = 'full'
}) => {
  const { showAlert } = useModal();
  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    type: 'expense',
    color: '#3b82f6',
    icon: 'Tag',
    limit: 0,
    isActive: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [hasLimit, setHasLimit] = useState(false);

  useEffect(() => {
    if (editingCategory) {
      if (editingCategory.parentId) {
        setFormData({
          ...editingCategory,
          icon: 'Tag',
          color: parentColor || editingCategory.color
        });
        setHasLimit((editingCategory.limit || 0) > 0);
      } else {
        setFormData(editingCategory);
        setHasLimit(true); // Categorias pai sempre mostram o campo, ou baseado em limite > 0
      }
    } else {
      setFormData({
        name: '',
        type: parentType || 'expense',
        color: parentId ? (parentColor || (parentType === 'income' ? '#22c55e' : '#f43f5e')) : '#3b82f6',
        icon: 'Tag',
        limit: 0,
        parentId: parentId,
        isActive: true
      });
      setHasLimit(!parentId); // Subcategorias novas começam sem meta (false), categorias novas começam com (true)
    }
  }, [editingCategory, parentId, parentType, parentColor, isOpen]);

  // Lock background scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleAmountChange = (val: string) => {
    const onlyNums = val.replace(/\D/g, '');
    const numValue = parseInt(onlyNums || '0') / 100;
    setFormData(prev => ({ ...prev, limit: numValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      setErrors(['name']);
      showAlert('Nome Obrigatório', 'Por favor, informe o nome da categoria para prosseguir.', 'warning');
      return;
    }
    
    setErrors([]);
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar categoria:', error);
      showAlert('Erro ao Salvar', 'Não foi possível salvar a categoria. Tente novamente.', 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999] overflow-y-auto backdrop-premium flex justify-center items-start p-4 sm:p-6 md:p-8" onClick={onClose}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-card w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-border flex flex-col my-auto max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Fixo */}
              <div className="p-8 border-b border-border flex items-center justify-between shrink-0 bg-background/50 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={onClose}
                    className="p-2 hover:bg-muted rounded-xl transition-all hover:scale-110 active:scale-95"
                  >
                    <ChevronLeft size={24} className="text-muted-foreground" />
                  </button>
                  <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground">
                    {mode === 'budget' ? 'Meta de Gasto Mensal' : (editingCategory ? (editingCategory.parentId ? 'Editar Subcategoria' : 'Editar Categoria') : parentId || formData.parentId ? 'Nova Subcategoria' : 'Nova Categoria')}
                  </h2>
                </div>
                <button 
                  onClick={onClose}
                  className="p-3 hover:bg-muted rounded-2xl transition-all hover:scale-110 active:scale-95"
                >
                  <X size={24} className="text-muted-foreground" />
                </button>
              </div>

              {/* Corpo Scrollável */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                {mode === 'full' && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                      Nome da {(parentId || formData.parentId) ? 'Subcategoria' : 'Categoria'}
                    </label>
                    <input 
                      type="text" 
                      required
                      autoFocus
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (e.target.value && errors.includes('name')) {
                          setErrors(prev => prev.filter(err => err !== 'name'));
                        }
                      }}
                      className={cn(
                        "w-full px-6 py-5 bg-muted/30 border rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none shadow-sm font-black text-xl uppercase tracking-tighter transition-all",
                        errors.includes('name') ? "border-rose-500 bg-rose-500/5 ring-4 ring-rose-500/10" : "border-border"
                      )}
                      placeholder={(parentId || formData.parentId) ? "Ex: Mercado, Aluguel..." : "Ex: Alimentação, Salário..."}
                    />
                  </div>
                )}

                {mode === 'budget' && editingCategory && (
                  <div className="bg-muted/10 p-6 rounded-3xl border border-border/50 flex items-center gap-4 mb-4">
                    <IconRenderer icon={editingCategory.icon || 'Tag'} color={editingCategory.color} size={32} />
                    <div>
                      <h4 className="font-black text-lg uppercase tracking-tight leading-none">{editingCategory.name}</h4>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-60">Ajustando meta de gastos</p>
                    </div>
                  </div>
                )}

                {mode === 'full' && !parentId && !editingCategory && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Tipo de Fluxo</label>
                    <div className="flex p-1.5 bg-muted/50 rounded-2xl gap-2 border border-border/50">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'income', color: '#22c55e' })}
                        className={cn(
                          "flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                          formData.type === 'income' ? "bg-background text-emerald-500 shadow-lg ring-1 ring-emerald-500/20" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Receita
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'expense', color: '#f43f5e' })}
                        className={cn(
                          "flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                          formData.type === 'expense' ? "bg-background text-rose-500 shadow-lg ring-1 ring-rose-500/20" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Despesa
                      </button>
                    </div>
                  </div>
                )}

                {/* Icon and Color Selection Area - Oculto para subcategorias conforme solicitado */}
                {mode === 'full' && !(parentId || formData.parentId) && (
                  <div className="bg-muted/20 p-8 rounded-[2rem] border border-border/50 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-6">
                      <IconRenderer 
                        icon={formData.icon || 'Tag'} 
                        color={formData.color} 
                        size={80} 
                        className="shadow-2xl border-4 border-background transition-transform duration-500 hover:rotate-12" 
                      />
                      <div className="space-y-1">
                        <h3 className="font-black text-lg uppercase tracking-tight">Identidade Visual</h3>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">Escolha o ícone e a cor que melhor representam este item</p>
                      </div>
                    </div>

                    {/* Colors - Oculto para ícones de imagem (pré-cadastrados) */}
                    {!(formData.icon?.startsWith('/') || formData.icon?.startsWith('http')) && (
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Paleta de Cores</label>
                        <div className="flex flex-wrap gap-3">
                          {CATEGORY_COLORS.map(color => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setFormData({ ...formData, color })}
                              className={cn(
                                "w-8 h-8 rounded-full border-4 transition-all hover:scale-125 hover:shadow-lg active:scale-95",
                                formData.color === color ? "border-foreground scale-110 shadow-md" : "border-background/50"
                              )}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Icons */}
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Ícones Disponíveis (64)</label>
                      <div className="grid grid-cols-8 gap-2.5 h-[240px] overflow-y-auto pr-3 custom-scrollbar">
                        {ICONS.map(({ name, icon: IconComp }) => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => setFormData({ ...formData, icon: name })}
                            className={cn(
                              "w-full aspect-square flex items-center justify-center rounded-2xl transition-all hover:scale-110 active:scale-90",
                              formData.icon === name 
                                ? "bg-primary text-white shadow-xl shadow-primary/20 scale-105" 
                                : "bg-background border border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                            )}
                          >
                            <IconComp size={22} strokeWidth={2} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {formData.type === 'expense' && (
                  <div className="space-y-4">
                    {formData.parentId && (
                      <div 
                        className={cn(
                          "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer",
                          hasLimit ? "bg-primary/5 border-primary/30" : "bg-muted/10 border-border/50 hover:bg-muted/20"
                        )}
                        onClick={() => {
                          const nextHasLimit = !hasLimit;
                          setHasLimit(nextHasLimit);
                          if (!nextHasLimit) setFormData(prev => ({ ...prev, limit: 0 }));
                        }}
                      >
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Definir Meta de Gasto?</span>
                          <span className={cn("text-xs font-bold", hasLimit ? "text-primary" : "text-muted-foreground/60")}>
                            {hasLimit ? 'Ativado' : 'Não definido'}
                          </span>
                        </div>
                        <div className={cn(
                          "w-12 h-6 rounded-full relative transition-all duration-300",
                          hasLimit ? "bg-primary" : "bg-muted-foreground/30"
                        )}>
                          <div className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm",
                            hasLimit ? "left-7" : "left-1"
                          )} />
                        </div>
                      </div>
                    )}

                    {!formData.parentId && (
                      <div className="flex flex-col ml-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Meta de Gasto Mensal</label>
                      </div>
                    )}
                    
                    <AnimatePresence>
                      {hasLimit && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden space-y-3"
                        >
                          <p className="text-[9px] font-medium text-amber-500/80 uppercase tracking-wider ml-1">
                            {formData.parentId 
                              ? "Esta meta será somada ao limite global da categoria principal."
                              : "Este valor será somado às metas individuais de suas subcategorias."}
                          </p>
                          <div className="relative group">
                            <input 
                              type="text" 
                              inputMode="numeric"
                              value={formData.limit === 0 ? "" : formData.limit?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              onChange={(e) => handleAmountChange(e.target.value)}
                              className="w-full px-8 py-6 bg-muted/10 border-2 border-border rounded-[2rem] focus:border-primary outline-none shadow-sm font-black text-3xl tracking-tighter text-right pr-20 transition-all font-mono"
                              placeholder="0,00"
                            />
                            <span className="absolute right-8 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground opacity-30 uppercase tracking-widest">BRL</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </form>

              {/* Footer Fixo */}
              <div className="p-8 border-t border-border bg-background/50 backdrop-blur-md flex gap-4 shrink-0">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="flex-1 px-8 py-5 rounded-2xl border-2 border-border font-black uppercase tracking-[0.2em] text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className={cn(
                    "flex-[2] px-8 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl flex items-center justify-center gap-3",
                    isSaving 
                      ? "bg-primary/70 text-white/50 cursor-not-allowed" 
                      : "bg-primary text-white hover:scale-[1.02] active:scale-95 shadow-primary/30"
                  )}
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>{editingCategory ? 'Salvar Alterações' : (parentId || formData.parentId) ? 'Criar Subcategoria' : 'Criar Nova Categoria'}</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
};
