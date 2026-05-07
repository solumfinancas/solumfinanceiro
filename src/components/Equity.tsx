import React, { useState, useMemo } from 'react';
import { useFinance } from '../FinanceContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Gem, 
  Plus, 
  Calendar, 
  Search, 
  MoreVertical, 
  TrendingUp, 
  History,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  PowerOff,
  Layout
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmModal } from './ui/ConfirmModal';
import { EquityAsset } from '../types';

export const Equity: React.FC = () => {
  const { user } = useAuth();
  const { viewingUserId } = useAuth();
  const { 
    activeSpace, 
    showAlert, 
    equityAssets, 
    equityHistory,
    addEquityAsset,
    updateEquityAsset,
    deleteEquityAsset,
    updateEquityValue,
    loading: contextLoading
  } = useFinance();
  
  const targetUserId = viewingUserId || user?.id;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<EquityAsset | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Modals de confirmação
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmEnd, setConfirmEnd] = useState<string | null>(null);

  // Add/Edit Asset Form State
  const [assetForm, setAssetForm] = useState({
    name: '',
    initial_value: '',
    observation: '',
    registration_date: new Date().toISOString().split('T')[0]
  });

  // Edit Value State
  const [editingValue, setEditingValue] = useState<{assetId: string, value: string, observation: string} | null>(null);

  const handleOpenAddModal = () => {
    setAssetForm({
      name: '',
      initial_value: '',
      observation: '',
      registration_date: new Date().toISOString().split('T')[0]
    });
    setEditingAsset(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (asset: EquityAsset) => {
    setAssetForm({
      name: asset.name,
      initial_value: asset.initial_value.toString(),
      observation: asset.observation || '',
      registration_date: asset.registration_date
    });
    setEditingAsset(asset);
    setIsAddModalOpen(true);
    setActiveMenu(null);
  };

  const handleSubmitAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId) return;

    try {
      if (editingAsset) {
        await updateEquityAsset(editingAsset.id, {
          name: assetForm.name,
          initial_value: parseFloat(assetForm.initial_value) || 0,
          registration_date: assetForm.registration_date,
          observation: assetForm.observation
        });
        showAlert('Sucesso', 'Patrimônio atualizado com sucesso', 'success');
      } else {
        await addEquityAsset({
          space: activeSpace,
          name: assetForm.name,
          initial_value: parseFloat(assetForm.initial_value) || 0,
          registration_date: assetForm.registration_date,
          observation: assetForm.observation
        });
        showAlert('Sucesso', 'Patrimônio adicionado com sucesso', 'success');
      }
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error saving asset:', error);
      showAlert('Erro', 'Não foi possível salvar o patrimônio', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEquityAsset(id);
      showAlert('Sucesso', 'Patrimônio removido com sucesso', 'success');
      setConfirmDelete(null);
    } catch (error) {
      showAlert('Erro', 'Não foi possível excluir o patrimônio', 'error');
    }
  };

  const handleEndAsset = async (id: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await updateEquityAsset(id, { ended_at: today });
      showAlert('Sucesso', 'Patrimônio encerrado. Ele não aparecerá a partir do próximo mês.', 'success');
      setConfirmEnd(null);
      setActiveMenu(null);
    } catch (error) {
      showAlert('Erro', 'Não foi possível encerrar o patrimônio', 'error');
    }
  };

  const handleReactivateAsset = async (id: string) => {
    try {
      await updateEquityAsset(id, { ended_at: null });
      showAlert('Sucesso', 'Patrimônio reativado.', 'success');
      setActiveMenu(null);
    } catch (error) {
      showAlert('Erro', 'Não foi possível reativar o patrimônio', 'error');
    }
  };

  const handleUpdateValue = async () => {
    if (!editingValue) return;

    const monthStr = selectedMonth.toISOString().split('T')[0];

    try {
      await updateEquityValue(
        editingValue.assetId,
        monthStr,
        parseFloat(editingValue.value) || 0,
        editingValue.observation
      );

      showAlert('Sucesso', 'Valor atualizado com sucesso', 'success');
      setEditingValue(null);
    } catch (error) {
      console.error('Error updating value:', error);
      showAlert('Erro', 'Não foi possível atualizar o valor', 'error');
    }
  };

  const formattedSelectedMonth = useMemo(() => {
    return selectedMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  const monthStr = selectedMonth.toISOString().split('T')[0];

  const filteredAssets = useMemo(() => {
    return equityAssets.filter(asset => {
      // Filtro de Busca
      if (searchQuery && !asset.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      const regDate = new Date(asset.registration_date + 'T12:00:00');
      const regMonth = new Date(regDate.getFullYear(), regDate.getMonth(), 1);
      const selMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      
      // Mês de registro ou posterior
      if (selMonth < regMonth) return false;
      
      // Se encerrado, não mostrar em meses posteriores ao encerramento
      if (asset.ended_at) {
        const endDate = new Date(asset.ended_at + 'T12:00:00');
        const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        if (selMonth > endMonth) return false;
      }
      
      return true;
    });
  }, [equityAssets, selectedMonth, searchQuery]);

  const assetSummary = useMemo(() => {
    let total = 0;
    filteredAssets.forEach(asset => {
      const hist = equityHistory.find(h => h.asset_id === asset.id && h.month_year === monthStr);
      if (hist) {
        total += hist.value;
      } else {
        const pastHistories = equityHistory
          .filter(h => h.asset_id === asset.id && new Date(h.month_year) <= selectedMonth)
          .sort((a, b) => new Date(b.month_year).getTime() - new Date(a.month_year).getTime());
        
        if (pastHistories.length > 0) {
          total += pastHistories[0].value;
        } else {
          total += asset.initial_value;
        }
      }
    });
    return {
      total,
      count: filteredAssets.length
    };
  }, [filteredAssets, equityHistory, selectedMonth, monthStr]);

  const changeMonth = (delta: number) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + delta);
    setSelectedMonth(newDate);
    setActiveMenu(null);
  };

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Gem size={20} />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground">Patrimônio</h1>
          </div>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em]">Acompanhamento e evolução dos seus ativos</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-card border border-border rounded-2xl p-1 shadow-sm">
            <button 
              onClick={() => changeMonth(-1)}
              className="w-10 h-10 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="px-4 text-[10px] font-black uppercase tracking-widest text-foreground min-w-[140px] text-center">
              {formattedSelectedMonth}
            </div>
            <button 
              onClick={() => changeMonth(1)}
              className="w-10 h-10 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <button 
            onClick={handleOpenAddModal}
            className="h-12 px-6 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={18} />
            Novo Patrimônio
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative group overflow-hidden bg-card border border-border rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 dark:shadow-none">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:scale-110" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">Valor Total do Patrimônio</p>
              <h2 className="text-4xl font-black tracking-tighter text-foreground">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(assetSummary.total)}
              </h2>
            </div>
            <div className="w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <TrendingUp size={32} />
            </div>
          </div>
        </div>

        <div className="relative group overflow-hidden bg-card border border-border rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 dark:shadow-none">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:scale-110" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-2">Ativos em {formattedSelectedMonth}</p>
              <h2 className="text-4xl font-black tracking-tighter text-foreground">
                {assetSummary.count} <span className="text-lg font-bold text-muted-foreground uppercase ml-2 tracking-widest">Ativos</span>
              </h2>
            </div>
            <div className="w-16 h-16 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
              <Gem size={32} />
            </div>
          </div>
        </div>
      </div>

      {/* Assets Table/List */}
      <div className="bg-card border border-border rounded-[3rem] overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-none">
        <div className="p-8 border-b border-border bg-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black uppercase tracking-tighter text-foreground">Seus Ativos</h3>
            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Clique no valor para atualizar mensalmente</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input 
              type="text"
              placeholder="BUSCAR ATIVO..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-11 bg-muted border-none rounded-xl pl-12 pr-4 text-[10px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/10">
                <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Patrimônio</th>
                <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data Registro</th>
                <th className="text-right px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Valor em {formattedSelectedMonth}</th>
                <th className="text-center px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {contextLoading ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="w-8 h-8 border-2 border-primary/20 rounded-full animate-spin border-t-primary mx-auto" />
                  </td>
                </tr>
              ) : filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-muted-foreground">
                      <History size={48} className="opacity-20" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Nenhum patrimônio para este período.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAssets.map(asset => {
                  const monthData = equityHistory.find(h => h.asset_id === asset.id && h.month_year === monthStr);
                  const displayValue = monthData ? monthData.value : (() => {
                    const past = equityHistory
                      .filter(h => h.asset_id === asset.id && new Date(h.month_year) <= selectedMonth)
                      .sort((a, b) => new Date(b.month_year).getTime() - new Date(a.month_year).getTime());
                    return past.length > 0 ? past[0].value : asset.initial_value;
                  })();

                  const isEndedThisMonth = asset.ended_at && 
                    new Date(asset.ended_at + 'T12:00:00').getMonth() === selectedMonth.getMonth() &&
                    new Date(asset.ended_at + 'T12:00:00').getFullYear() === selectedMonth.getFullYear();

                  return (
                    <tr key={asset.id} className="group border-b border-border last:border-none hover:bg-muted/30 transition-all">
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-sm font-black uppercase tracking-tight group-hover:text-primary transition-colors",
                              asset.ended_at && "text-muted-foreground line-through"
                            )}>
                              {asset.name}
                            </span>
                            {isEndedThisMonth && (
                              <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[8px] font-black uppercase tracking-widest">
                                Encerrado
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest truncate max-w-[200px]">
                            {asset.observation || 'SEM OBSERVAÇÃO'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar size={12} />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            {new Date(asset.registration_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => setEditingValue({
                            assetId: asset.id,
                            value: displayValue.toString(),
                            observation: monthData?.observation || ''
                          })}
                          className={cn(
                            "inline-flex items-center gap-3 px-4 py-2 rounded-xl transition-all border group/btn",
                            monthData 
                              ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500" 
                              : "bg-muted border-transparent text-muted-foreground hover:border-primary/30"
                          )}
                        >
                          <span className="text-sm font-black">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(displayValue)}
                          </span>
                          <Edit2 size={12} className="opacity-0 group-hover/btn:opacity-100 transition-all" />
                        </button>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center relative">
                          <button 
                            onClick={() => setActiveMenu(activeMenu === asset.id ? null : asset.id)}
                            className="w-10 h-10 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground transition-all"
                          >
                            <MoreVertical size={18} />
                          </button>

                          <AnimatePresence>
                            {activeMenu === asset.id && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                  className="absolute right-full top-0 mr-2 z-20 w-48 bg-card border border-border rounded-2xl shadow-xl p-2 overflow-hidden"
                                >
                                  <button 
                                    onClick={() => handleOpenEditModal(asset)}
                                    className="w-full h-10 flex items-center gap-3 px-4 rounded-xl hover:bg-muted text-[10px] font-black uppercase tracking-widest text-foreground transition-all"
                                  >
                                    <Edit2 size={14} className="text-primary" />
                                    Editar Ativo
                                  </button>
                                  
                                  {asset.ended_at ? (
                                    <button 
                                      onClick={() => handleReactivateAsset(asset.id)}
                                      className="w-full h-10 flex items-center gap-3 px-4 rounded-xl hover:bg-muted text-[10px] font-black uppercase tracking-widest text-emerald-500 transition-all"
                                    >
                                      <Layout size={14} />
                                      Reativar Ativo
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={() => setConfirmEnd(asset.id)}
                                      className="w-full h-10 flex items-center gap-3 px-4 rounded-xl hover:bg-muted text-[10px] font-black uppercase tracking-widest text-amber-500 transition-all"
                                    >
                                      <PowerOff size={14} />
                                      Encerrar Bem
                                    </button>
                                  )}

                                  <div className="h-px bg-border my-2" />
                                  
                                  <button 
                                    onClick={() => setConfirmDelete(asset.id)}
                                    className="w-full h-10 flex items-center gap-3 px-4 rounded-xl hover:bg-rose-500/10 text-[10px] font-black uppercase tracking-widest text-rose-500 transition-all"
                                  >
                                    <Trash2 size={14} />
                                    Excluir Ativo
                                  </button>
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Asset Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
              onClick={() => setIsAddModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-card border border-border rounded-[3rem] p-8 shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Plus className="text-primary" size={20} />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                      {editingAsset ? 'Editar Registro' : 'Novo Registro'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">
                    {editingAsset ? 'Editar Patrimônio' : 'Cadastrar Patrimônio'}
                  </h2>
                </div>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-rose-500 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitAsset} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nome do Ativo</label>
                  <input 
                    required
                    type="text"
                    value={assetForm.name}
                    onChange={e => setAssetForm({...assetForm, name: e.target.value})}
                    placeholder="EX: APARTAMENTO, CARRO, INVESTIMENTOS..."
                    className="w-full h-14 bg-muted border-none rounded-2xl px-6 text-sm font-bold uppercase tracking-widest focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Valor Inicial</label>
                    <input 
                      required
                      type="number"
                      step="0.01"
                      value={assetForm.initial_value}
                      onChange={e => setAssetForm({...assetForm, initial_value: e.target.value})}
                      placeholder="0,00"
                      className="w-full h-14 bg-muted border-none rounded-2xl px-6 text-sm font-bold uppercase tracking-widest focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Data de Registro</label>
                    <input 
                      required
                      type="date"
                      value={assetForm.registration_date}
                      onChange={e => setAssetForm({...assetForm, registration_date: e.target.value})}
                      className="w-full h-14 bg-muted border-none rounded-2xl px-6 text-sm font-bold uppercase tracking-widest focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Observação</label>
                  <textarea 
                    value={assetForm.observation}
                    onChange={e => setAssetForm({...assetForm, observation: e.target.value})}
                    placeholder="DETALHES SOBRE O PATRIMÔNIO..."
                    className="w-full h-32 bg-muted border-none rounded-2xl p-6 text-sm font-bold uppercase tracking-widest focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full h-16 rounded-[2rem] bg-primary text-white text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/30"
                >
                  {editingAsset ? <Save size={18} /> : <Plus size={18} />}
                  {editingAsset ? 'Salvar Alterações' : 'Cadastrar Ativo'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Value Modal */}
      <AnimatePresence>
        {editingValue && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
              onClick={() => setEditingValue(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-card border border-border rounded-[3rem] p-8 shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="text-primary" size={20} />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Atualização Mensal</span>
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">Ajustar Valor</h2>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Para o mês de {formattedSelectedMonth}</p>
                </div>
                <button 
                  onClick={() => setEditingValue(null)}
                  className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-rose-500 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Novo Valor Atualizado</label>
                  <input 
                    required
                    type="number"
                    step="0.01"
                    value={editingValue.value}
                    onChange={e => setEditingValue({...editingValue, value: e.target.value})}
                    placeholder="0,00"
                    className="w-full h-14 bg-muted border-none rounded-2xl px-6 text-sm font-bold uppercase tracking-widest focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Observação do Mês</label>
                  <textarea 
                    value={editingValue.observation}
                    onChange={e => setEditingValue({...editingValue, observation: e.target.value})}
                    placeholder="POR QUE O VALOR MUDOU? (EX: VALORIZAÇÃO DE MERCADO, REFORMA...)"
                    className="w-full h-32 bg-muted border-none rounded-2xl p-6 text-sm font-bold uppercase tracking-widest focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>

                <button 
                  onClick={handleUpdateValue}
                  className="w-full h-16 rounded-[2rem] bg-emerald-500 text-white text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-emerald-500/30"
                >
                  <Save size={18} />
                  Salvar Atualização
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        title="Excluir Patrimônio"
        message="Tem certeza que deseja excluir este patrimônio? Todo o histórico de evolução deste bem será apagado permanentemente."
        confirmText="Excluir Permanentemente"
        type="danger"
      />

      <ConfirmModal
        isOpen={confirmEnd !== null}
        onClose={() => setConfirmEnd(null)}
        onConfirm={() => confirmEnd && handleEndAsset(confirmEnd)}
        title="Encerrar Bem"
        message="Ao encerrar este bem, ele deixará de aparecer no cálculo do seu patrimônio a partir do próximo mês. Esta ação é usada quando você vende ou se desfaz de um ativo."
        confirmText="Encerrar Agora"
        type="warning"
      />
    </div>
  );
};
