import React, { useState, useMemo } from 'react';
import { useFinance } from '../FinanceContext';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
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
  Layout,
  ArrowUpRight,
  AlertCircle,
  Eye,
  Info,
  ChevronDown,
  FileText,
  CheckCircle2,
  MessageSquare,
  Settings2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmModal } from './ui/ConfirmModal';
import { EquityAsset } from '../types';

export const Equity: React.FC = () => {
  const { user } = useAuth();
  const { viewingUserId } = useAuth();
  const { 
    activeSpace, 
    equityAssets, 
    equityHistory,
    addEquityAsset,
    updateEquityAsset,
    deleteEquityAsset,
    updateEquityValue,
    deleteEquityValue,
    loading: contextLoading
  } = useFinance();
  const { showAlert } = useModal();
  
  const targetUserId = viewingUserId || user?.id;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<EquityAsset | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [searchQuery, setSearchQuery] = useState('');

  // Modals de confirmação
  const [confirmDelete, setConfirmDelete] = useState<EquityAsset | null>(null);
  const [deleteInput, setDeleteInput] = useState('');
  const [confirmEnd, setConfirmEnd] = useState<EquityAsset | null>(null);
  const [confirmReactivate, setConfirmReactivate] = useState<EquityAsset | null>(null);
  const [viewingAssetDetails, setViewingAssetDetails] = useState<EquityAsset | null>(null);

  // Add/Edit Asset Form State
  const [assetForm, setAssetForm] = useState({
    name: '',
    initial_value: 0,
    observation: '',
    registration_date: new Date().toISOString().split('T')[0]
  });

  // Edit Value State
  const [editingValue, setEditingValue] = useState<{
    assetId: string;
    value: number;
    observation: string;
    monthYear: string;
    step?: 'choice' | 'confirm_keep' | 'observation_only' | 'full_adjust';
  } | null>(null);

  const [chartRange, setChartRange] = useState<'12m' | '24m' | 'all'>('12m');
  const [confirmDeleteHistory, setConfirmDeleteHistory] = useState<{
    id: string;
    monthYear: string;
  } | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const oldestDate = useMemo(() => {
    if (equityAssets.length === 0) return new Date();
    const dates = equityAssets.map(a => new Date(a.registration_date + 'T12:00:00'));
    return new Date(Math.min(...dates.map(d => d.getTime())));
  }, [equityAssets]);

  const oldestMonthDate = useMemo(() => {
    return new Date(oldestDate.getFullYear(), oldestDate.getMonth(), 1);
  }, [oldestDate]);

  const handleOpenAddModal = () => {
    setAssetForm({
      name: '',
      initial_value: 0,
      observation: '',
      registration_date: new Date().toISOString().split('T')[0]
    });
    setEditingAsset(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (asset: EquityAsset) => {
    setAssetForm({
      name: asset.name,
      initial_value: asset.initial_value,
      observation: asset.observation || '',
      registration_date: asset.registration_date
    });
    setEditingAsset(asset);
    setIsAddModalOpen(true);
  };

  const handleSubmitAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId) return;

    try {
      if (editingAsset) {
        await updateEquityAsset(editingAsset.id, {
          name: assetForm.name,
          initial_value: assetForm.initial_value,
          registration_date: assetForm.registration_date,
          observation: assetForm.observation
        });
        setIsAddModalOpen(false);
        setEditingAsset(null);
        showAlert('Sucesso', 'Patrimônio atualizado com sucesso', 'success');
      } else {
        await addEquityAsset({
          space: activeSpace,
          name: assetForm.name,
          initial_value: assetForm.initial_value,
          registration_date: assetForm.registration_date,
          observation: assetForm.observation
        });
        setIsAddModalOpen(false);
        showAlert('Sucesso', 'Patrimônio adicionado com sucesso', 'success');
      }
    } catch (error) {
      console.error('Error saving asset:', error);
      showAlert('Erro', 'Não foi possível salvar o patrimônio', 'danger');
    }
  };

  const handleDelete = async (id: string) => {
    if (deleteInput !== 'APAGAR') return;

    try {
      await deleteEquityAsset(id);
      setConfirmDelete(null);
      setDeleteInput('');
      showAlert('Sucesso', 'Patrimônio removido com sucesso', 'success');
    } catch (error) {
      showAlert('Erro', 'Não foi possível excluir o patrimônio', 'danger');
    }
  };

  const handleEndAsset = async (id: string) => {
    try {
      const endMonthDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1, 12, 0, 0);
      const endMonthStr = endMonthDate.toISOString().split('T')[0];
      
      await updateEquityAsset(id, { ended_at: endMonthStr });
      setConfirmEnd(null);
      showAlert('Sucesso', 'Patrimônio encerrado com sucesso', 'success');
    } catch (error) {
      showAlert('Erro', 'Não foi possível encerrar o patrimônio', 'danger');
    }
  };

  const handleReactivateAsset = async (id: string) => {
    try {
      await updateEquityAsset(id, { ended_at: null });
      setConfirmReactivate(null);
      showAlert('Sucesso', 'Patrimônio reativado com sucesso', 'success');
    } catch (error) {
      showAlert('Erro', 'Não foi possível reativar o patrimônio', 'danger');
    }
  };

  const handleUpdateValue = async () => {
    if (!editingValue) return;

    try {
      await updateEquityValue(
        editingValue.assetId,
        editingValue.monthYear,
        editingValue.value,
        editingValue.observation
      );

      setEditingValue(null);
      showAlert('Sucesso', 'Valor atualizado com sucesso', 'success');
    } catch (error) {
      console.error('Error updating value:', error);
      showAlert('Erro', 'Não foi possível atualizar o valor', 'danger');
    }
  };

  const handleDeleteHistoryEntry = async (id: string) => {
    try {
      await deleteEquityValue(id);
      setConfirmDeleteHistory(null);
      showAlert('Sucesso', 'Atualização removida com sucesso', 'success');
    } catch (error) {
      showAlert('Erro', 'Não foi possível remover a atualização', 'danger');
    }
  };

  const formattedSelectedMonth = useMemo(() => {
    return selectedMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  const monthStr = selectedMonth.toISOString().split('T')[0];

  const filteredAssets = useMemo(() => {
    return equityAssets.filter(asset => {
      if (searchQuery && !asset.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      const regDate = new Date(asset.registration_date + 'T12:00:00');
      const regMonth = new Date(regDate.getFullYear(), regDate.getMonth(), 1);
      const selMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      
      if (selMonth < regMonth) return false;
      
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
    
    if (delta < 0 && newDate < oldestMonthDate) {
      showAlert(
        'Período Indisponível', 
        `Não existem ativos cadastrados antes de ${oldestMonthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}.`,
        'info'
      );
      return;
    }

    setSelectedMonth(newDate);
  };

  const chartData = useMemo(() => {
    if (equityAssets.length === 0) return [];

    const data = [];
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    let startDate = new Date(currentMonth);
    if (chartRange === '12m') {
      startDate.setMonth(startDate.getMonth() - 11);
    } else if (chartRange === '24m') {
      startDate.setMonth(startDate.getMonth() - 23);
    } else {
      startDate = new Date(oldestMonthDate);
    }

    const tempDate = new Date(startDate);
    const monthsNames = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    while (tempDate <= currentMonth) {
      const mStr = tempDate.toISOString().split('T')[0];
      let totalForMonth = 0;

      equityAssets.forEach(asset => {
        const regDate = new Date(asset.registration_date + 'T12:00:00');
        const regMonth = new Date(regDate.getFullYear(), regDate.getMonth(), 1);
        
        if (tempDate >= regMonth) {
          if (asset.ended_at) {
            const endDate = new Date(asset.ended_at + 'T12:00:00');
            const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
            if (tempDate > endMonth) return;
          }

          const hist = equityHistory.find(h => h.asset_id === asset.id && h.month_year === mStr);
          if (hist) {
            totalForMonth += hist.value;
          } else {
            const pastHistories = equityHistory
              .filter(h => h.asset_id === asset.id && new Date(h.month_year) <= tempDate)
              .sort((a, b) => new Date(b.month_year).getTime() - new Date(a.month_year).getTime());
            
            if (pastHistories.length > 0) {
              totalForMonth += pastHistories[0].value;
            } else {
              totalForMonth += asset.initial_value;
            }
          }
        }
      });

      data.push({
        name: `${monthsNames[tempDate.getMonth()]}/${tempDate.getFullYear().toString().slice(-2)}`,
        valor: totalForMonth,
        rawDate: new Date(tempDate)
      });

      tempDate.setMonth(tempDate.getMonth() + 1);
    }

    return data;
  }, [equityAssets, equityHistory, chartRange, oldestMonthDate]);

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

      {equityAssets.length === 0 && !contextLoading ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-dashed border-border rounded-[3rem] p-20 flex flex-col items-center text-center gap-6 shadow-2xl shadow-slate-200/20 dark:shadow-none"
        >
          <div className="w-32 h-32 rounded-[3rem] bg-primary/5 flex items-center justify-center text-primary/30 relative">
            <div className="absolute inset-0 bg-primary/10 rounded-[3rem] animate-pulse" />
            <Gem size={64} className="relative z-10" />
          </div>
          <div className="space-y-3 max-w-md">
            <h3 className="text-2xl font-black uppercase tracking-tighter text-foreground">Seu Patrimônio está vazio</h3>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              Você ainda não cadastrou nenhum bem ou ativo. Comece agora para acompanhar sua evolução financeira e patrimonial de forma detalhada.
            </p>
          </div>
          <button 
            onClick={handleOpenAddModal}
            className="h-16 px-10 rounded-2xl bg-primary text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:scale-[1.05] active:scale-95 transition-all shadow-2xl shadow-primary/30 mt-4"
          >
            <Plus size={24} />
            Cadastrar meu primeiro Ativo
          </button>
        </motion.div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative group overflow-hidden bg-card border border-border rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:scale-110" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">Valor Total do Patrimônio</p>
                  <h2 className="text-3xl font-black tracking-tighter text-foreground">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(assetSummary.total)}
                  </h2>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                  <TrendingUp size={24} />
                </div>
              </div>
            </div>

            <div className="relative group overflow-hidden bg-card border border-border rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:scale-110" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-2">Ativos em {formattedSelectedMonth}</p>
                  <h2 className="text-3xl font-black tracking-tighter text-foreground">
                    {assetSummary.count} <span className="text-sm font-bold text-muted-foreground uppercase ml-2 tracking-widest">Ativos</span>
                  </h2>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
                  <Gem size={24} />
                </div>
              </div>
            </div>
          </div>


          {/* Assets Table/List */}
          <div className="bg-card border border-border rounded-[3rem] overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-none">
            <div className="p-8 border-b border-border bg-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tighter text-foreground">Seus Ativos</h3>
                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Gerencie e acompanhe a evolução de cada bem</p>
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
                    <th className="text-right px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ações</th>
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

                      const regDate = new Date(asset.registration_date + 'T12:00:00');
                      const isRegistrationMonth = regDate.getMonth() === selectedMonth.getMonth() && 
                                                 regDate.getFullYear() === selectedMonth.getFullYear();

                      return (
                        <tr key={asset.id} className="group border-b border-border last:border-none hover:bg-muted/30 transition-all">
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setViewingAssetDetails(asset)}
                                  className={cn(
                                    "text-sm font-black uppercase tracking-tight group-hover:text-primary transition-colors text-left",
                                    asset.ended_at && "text-muted-foreground line-through"
                                  )}
                                >
                                  {asset.name}
                                </button>
                                {isRegistrationMonth ? (
                                  <span className="px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-500 text-[7px] font-black uppercase tracking-widest">
                                    Mês de Registro
                                  </span>
                                ) : monthData ? (
                                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[7px] font-black uppercase tracking-widest flex items-center gap-1">
                                    <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                    Atualizado
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[7px] font-black uppercase tracking-widest flex items-center gap-1 animate-pulse">
                                    <AlertCircle size={8} />
                                    Pendente de Atualização
                                  </span>
                                )}
                                {isEndedThisMonth && (
                                  <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[8px] font-black uppercase tracking-widest">
                                    Encerrado
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 flex flex-col gap-0.5">
                                {isRegistrationMonth ? (
                                  asset.observation && (
                                    <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest leading-relaxed break-words">
                                      {asset.observation}
                                    </span>
                                  )
                                ) : monthData ? (
                                  <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest leading-relaxed break-words">
                                    {monthData.observation || 'Sem observações novas'}
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-medium text-amber-500/60 uppercase tracking-widest italic">
                                    Aguardando atualização de valor e observações...
                                  </span>
                                )}
                              </div>
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
                            <div className={cn(
                              "inline-flex items-center gap-3 px-4 py-2 rounded-xl border",
                              monthData 
                                ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500" 
                                : "bg-muted border-transparent text-muted-foreground"
                            )}>
                              <span className="text-sm font-black">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(displayValue)}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center justify-end gap-2">
                              {isRegistrationMonth ? (
                                <button 
                                  onClick={() => handleOpenEditModal(asset)}
                                  title="Editar Ativo"
                                  className="w-10 h-10 rounded-xl bg-primary/5 text-primary border border-primary/10 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"
                                >
                                  <Edit2 size={16} />
                                </button>
                              ) : (
                                <button 
                                  onClick={() => setEditingValue({
                                    assetId: asset.id,
                                    value: displayValue,
                                    observation: monthData?.observation || '',
                                    monthYear: selectedMonth.toISOString().split('T')[0],
                                    step: 'choice'
                                  })}
                                  title="Atualizar Valor Mensal"
                                  className="w-10 h-10 rounded-xl bg-emerald-500/5 text-emerald-500 border border-emerald-500/10 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                >
                                  <TrendingUp size={16} />
                                </button>
                              )}

                              {asset.ended_at ? (
                                <button 
                                  onClick={() => setConfirmReactivate(asset)}
                                  title="Reativar Ativo"
                                  className="w-10 h-10 rounded-xl bg-blue-500/5 text-blue-500 border border-blue-500/10 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                                >
                                  <Layout size={16} />
                                </button>
                              ) : (
                                <button 
                                  onClick={() => setConfirmEnd(asset)}
                                  title="Encerrar Bem"
                                  className="w-10 h-10 rounded-xl bg-amber-500/5 text-amber-500 border border-amber-500/10 flex items-center justify-center hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                                >
                                  <PowerOff size={16} />
                                </button>
                              )}

                              <button 
                                onClick={() => setConfirmDelete(asset)}
                                title="Excluir Ativo Permanente"
                                className="w-10 h-10 rounded-xl bg-rose-500/5 text-rose-500 border border-rose-500/10 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                              >
                                <Trash2 size={16} />
                              </button>
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

          {/* Evolution Chart at the Bottom */}
          <div className="relative group bg-card border border-border rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 dark:shadow-none">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                  <ArrowUpRight size={14} className="text-primary" />
                  Evolução Patrimonial
                </h3>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Visão histórica dos seus ativos</p>
              </div>
              <div className="flex bg-muted/50 p-1 rounded-xl">
                {[
                  { id: '12m', label: '12M' },
                  { id: '24m', label: '24M' },
                  { id: 'all', label: 'TUDO' }
                ].map(range => (
                  <button
                    key={range.id}
                    onClick={() => setChartRange(range.id as any)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[9px] font-black tracking-widest transition-all",
                      chartRange === range.id 
                        ? "bg-card text-primary shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[250px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ left: 10, right: 10, bottom: 20, top: 10 }}>
                    <defs>
                      <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fontWeight: 900, fill: 'var(--muted-foreground)' }}
                      dy={15}
                      padding={{ left: 30, right: 30 }}
                      interval={chartRange === 'all' ? 'preserveStartEnd' : 0}
                      minTickGap={10}
                    />
                    <YAxis 
                      hide
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-card/95 backdrop-blur-md border border-border p-4 rounded-2xl shadow-2xl">
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                                {payload[0].payload.rawDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}
                              </p>
                              <p className="text-lg font-black text-primary tracking-tighter">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payload[0].value as number)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="valor" 
                      stroke="var(--color-primary)" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorValor)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground/30">
                  <History size={48} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Dados Insuficientes</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

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
                    <div className="relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-xs opacity-40">R$</span>
                       <input
                         type="text"
                         value={(assetForm.initial_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                         onChange={e => {
                           const val = e.target.value.replace(/\D/g, '');
                           setAssetForm({...assetForm, initial_value: Number(val) / 100});
                         }}
                         className="w-full pl-10 pr-4 py-4 h-14 bg-muted border-none rounded-2xl font-mono font-black focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground text-sm"
                         placeholder="0,00"
                       />
                     </div>
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
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
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
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Para o mês de {editingValue.monthYear 
                      ? new Date(editingValue.monthYear + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                      : formattedSelectedMonth}
                  </p>
                </div>
                <button 
                  onClick={() => setEditingValue(null)}
                  className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-rose-500 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {!editingValue.step || editingValue.step === 'choice' ? (
                  <div className="grid gap-4">
                    <button
                      onClick={() => setEditingValue({ ...editingValue, step: 'confirm_keep' })}
                      className="group p-6 bg-muted hover:bg-emerald-500/10 border-2 border-transparent hover:border-emerald-500/20 rounded-[2rem] transition-all text-left flex items-center gap-5"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <CheckCircle2 size={24} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-foreground group-hover:text-emerald-600 transition-colors">Manter Valor</h4>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase mt-0.5">Sem novas observações</p>
                      </div>
                      <ChevronRight size={16} className="text-muted-foreground group-hover:text-emerald-500 translate-x-0 group-hover:translate-x-1 transition-all" />
                    </button>

                    <button
                      onClick={() => setEditingValue({ ...editingValue, step: 'observation_only' })}
                      className="group p-6 bg-muted hover:bg-blue-500/10 border-2 border-transparent hover:border-blue-500/20 rounded-[2rem] transition-all text-left flex items-center gap-5"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <MessageSquare size={24} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-foreground group-hover:text-blue-600 transition-colors">Manter Valor + Nota</h4>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase mt-0.5">Adicionar observação do mês</p>
                      </div>
                      <ChevronRight size={16} className="text-muted-foreground group-hover:text-blue-500 translate-x-0 group-hover:translate-x-1 transition-all" />
                    </button>

                    <button
                      onClick={() => setEditingValue({ ...editingValue, step: 'full_adjust' })}
                      className="group p-6 bg-muted hover:bg-primary/10 border-2 border-transparent hover:border-primary/20 rounded-[2rem] transition-all text-left flex items-center gap-5"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <Settings2 size={24} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">Ajustar Ativo</h4>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase mt-0.5">Mudar valor e observação</p>
                      </div>
                      <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary translate-x-0 group-hover:translate-x-1 transition-all" />
                    </button>
                  </div>
                ) : editingValue.step === 'confirm_keep' ? (
                  <div className="space-y-6 py-4">
                    <div className="bg-emerald-500/5 border border-emerald-500/10 p-8 rounded-[2rem] text-center">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto mb-4">
                        <CheckCircle2 size={32} />
                      </div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-foreground mb-2">Confirmar Manutenção</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Deseja manter o valor de <span className="font-black text-emerald-500">{formatCurrency(editingValue.value)}</span> para este mês, sem adicionar observações?
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setEditingValue({ ...editingValue, step: 'choice' })}
                        className="flex-1 h-14 rounded-2xl border-2 border-border font-black uppercase tracking-widest text-[10px] text-muted-foreground hover:bg-muted transition-all"
                      >
                        Voltar
                      </button>
                      <button
                        onClick={() => handleUpdateValue()}
                        className="flex-[1.5] h-14 rounded-2xl bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                      >
                        Confirmar e Salvar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {editingValue.step === 'full_adjust' && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Novo Valor Atualizado</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-xs opacity-40">R$</span>
                          <input
                            type="text"
                            value={(editingValue.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            onChange={e => {
                              const val = e.target.value.replace(/\D/g, '');
                              setEditingValue({...editingValue, value: Number(val) / 100});
                            }}
                            className="w-full pl-10 pr-4 py-4 h-14 bg-muted border-none rounded-2xl font-mono font-black focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground text-sm"
                            placeholder="0,00"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                        {editingValue.step === 'observation_only' ? 'Observação do Mês (Manter Valor)' : 'Observação do Mês'}
                      </label>
                      <textarea 
                        value={editingValue.observation}
                        onChange={e => setEditingValue({...editingValue, observation: e.target.value})}
                        placeholder="POR QUE O VALOR MUDOU? (EX: VALORIZAÇÃO DE MERCADO, REFORMA...)"
                        className="w-full h-32 bg-muted border-none rounded-2xl p-6 text-sm font-bold uppercase tracking-widest focus:ring-2 focus:ring-primary/20 resize-none"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setEditingValue({ ...editingValue, step: 'choice' })}
                        className="flex-1 h-14 rounded-2xl border-2 border-border font-black uppercase tracking-widest text-[10px] text-muted-foreground hover:bg-muted transition-all"
                      >
                        Voltar
                      </button>
                      <button 
                        onClick={handleUpdateValue}
                        className="flex-[1.5] h-14 rounded-2xl bg-emerald-500 text-white text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-emerald-500/30"
                      >
                        <Save size={18} />
                        Salvar Atualização
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Enhanced Delete Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
              onClick={() => {
                setConfirmDelete(null);
                setDeleteInput('');
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-card border border-border rounded-[3rem] p-8 shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="h-2 w-full bg-rose-500 absolute top-0 left-0" />
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shadow-lg shadow-rose-500/10">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-foreground">Excluir Ativo</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">Ação Irreversível</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="bg-rose-500/5 border border-rose-500/10 p-6 rounded-3xl">
                  <p className="text-sm font-medium text-foreground leading-relaxed mb-4">
                    Tem certeza que deseja excluir <span className="font-black text-rose-500">{confirmDelete.name}</span>?
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Esta ação apagará permanentemente o ativo e <span className="font-bold underline">todo o seu histórico de evolução mensal</span>.
                  </p>
                </div>

                <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl flex items-start gap-3">
                  <PowerOff size={16} className="text-amber-500 shrink-0 mt-1" />
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest leading-relaxed">
                    Dica: Se o bem deixou de existir neste mês (ex: foi vendido), considere usar a opção <span className="font-black">ENCERRAR BEM</span> nas ações da tabela.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Digite <span className="text-rose-500">APAGAR</span> para confirmar
                  </label>
                  <input 
                    type="text"
                    value={deleteInput}
                    onChange={e => setDeleteInput(e.target.value.toUpperCase())}
                    placeholder="APAGAR"
                    className="w-full h-12 bg-muted border-2 border-rose-500/10 rounded-xl px-4 text-center text-sm font-black uppercase tracking-[0.3em] focus:border-rose-500/30 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setConfirmDelete(null);
                    setDeleteInput('');
                  }}
                  className="flex-1 px-6 py-4 rounded-2xl border-2 border-border font-black uppercase tracking-widest text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                >
                  Cancelar
                </button>
                <button
                  disabled={deleteInput !== 'APAGAR'}
                  onClick={() => handleDelete(confirmDelete.id)}
                  className="flex-[1.5] px-6 py-4 rounded-2xl bg-rose-500 text-white font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-rose-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale disabled:scale-100"
                >
                  Excluir Permanentemente
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm History Delete Modal */}
      <AnimatePresence>
        {confirmDeleteHistory && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
              onClick={() => setConfirmDeleteHistory(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-card border border-border rounded-[3rem] p-8 shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="h-2 w-full bg-rose-500 absolute top-0 left-0" />
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shadow-lg shadow-rose-500/10">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-foreground">Excluir Atualização</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">Resetar Mês</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="bg-rose-500/5 border border-rose-500/10 p-6 rounded-3xl text-center">
                  <p className="text-sm font-medium text-foreground leading-relaxed">
                    Deseja realmente excluir a atualização de <span className="font-black text-rose-600">
                      {new Date(confirmDeleteHistory.monthYear + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </span>?
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-4 font-bold text-center">
                    O ATIVO SERÁ RESETADO PARA O ESTADO PENDENTE NESTE MÊS.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDeleteHistory(null)}
                  className="flex-1 px-6 py-4 rounded-2xl border-2 border-border font-black uppercase tracking-widest text-[10px] text-muted-foreground hover:bg-muted transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteHistoryEntry(confirmDeleteHistory.id)}
                  className="flex-[1.5] px-6 py-4 rounded-2xl bg-rose-500 text-white font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-rose-500/20 active:scale-95"
                >
                  Excluir Agora
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm End Modal */}
      <AnimatePresence>
        {confirmEnd && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
              onClick={() => setConfirmEnd(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-card border border-border rounded-[3rem] p-8 shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="h-2 w-full bg-amber-500 absolute top-0 left-0" />
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-lg shadow-amber-500/10">
                  <PowerOff size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-foreground">Encerrar Bem</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Suspensão de Visibilidade</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="bg-amber-500/5 border border-amber-500/10 p-6 rounded-3xl">
                  <p className="text-sm font-medium text-foreground leading-relaxed mb-4">
                    Deseja encerrar o ativo <span className="font-black text-amber-600">{confirmEnd.name}</span>?
                  </p>
                  <div className="grid grid-cols-2 gap-4 mt-4 py-4 border-t border-amber-500/10">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Cadastrado em</p>
                      <p className="text-[10px] font-bold text-foreground">{new Date(confirmEnd.registration_date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Encerrando em</p>
                      <p className="text-[10px] font-bold text-amber-600">{formattedSelectedMonth}</p>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground leading-relaxed px-2">
                  O ativo deixará de aparecer no cálculo do seu patrimônio a partir do <span className="font-bold underline text-foreground">próximo mês</span>.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmEnd(null)}
                  className="flex-1 px-6 py-4 rounded-2xl border-2 border-border font-black uppercase tracking-widest text-[10px] text-muted-foreground hover:bg-muted transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleEndAsset(confirmEnd.id)}
                  className="flex-[1.5] px-6 py-4 rounded-2xl bg-amber-500 text-white font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-amber-500/20 active:scale-95"
                >
                  Confirmar Encerramento
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Reactivate Modal */}
      <AnimatePresence>
        {confirmReactivate && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
              onClick={() => setConfirmReactivate(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-card border border-border rounded-[3rem] p-8 shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="h-2 w-full bg-blue-500 absolute top-0 left-0" />
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shadow-lg shadow-blue-500/10">
                  <Layout size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-foreground">Reativar Ativo</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Retorno ao Patrimônio</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="bg-blue-500/5 border border-blue-500/10 p-6 rounded-3xl">
                  <p className="text-sm font-medium text-foreground leading-relaxed mb-4">
                    Deseja reativar o ativo <span className="font-black text-blue-600">{confirmReactivate.name}</span>?
                  </p>
                  <div className="grid grid-cols-2 gap-4 mt-4 py-4 border-t border-blue-500/10">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Cadastrado em</p>
                      <p className="text-[10px] font-bold text-foreground">{new Date(confirmReactivate.registration_date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Encerrado em</p>
                      <p className="text-[10px] font-bold text-rose-500">
                        {confirmReactivate.ended_at ? new Date(confirmReactivate.ended_at + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '---'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground leading-relaxed px-2">
                  O ativo voltará a ser exibido em todos os meses futuros a partir da data de encerramento original.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmReactivate(null)}
                  className="flex-1 px-6 py-4 rounded-2xl border-2 border-border font-black uppercase tracking-widest text-[10px] text-muted-foreground hover:bg-muted transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleReactivateAsset(confirmReactivate.id)}
                  className="flex-[1.5] px-6 py-4 rounded-2xl bg-blue-500 text-white font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                >
                  Reativar Agora
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Asset Details & History Modal */}
      <AnimatePresence>
        {viewingAssetDetails && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
              onClick={() => setViewingAssetDetails(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-card border border-border rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8 border-b border-border bg-muted/20 shrink-0">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                      <Gem size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">{viewingAssetDetails.name}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Detalhes do Ativo</span>
                        {viewingAssetDetails.ended_at && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[8px] font-black uppercase tracking-widest">
                            Encerrado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        handleOpenEditModal(viewingAssetDetails);
                        setViewingAssetDetails(null);
                      }}
                      title="Editar Origem do Ativo"
                      className="w-12 h-12 rounded-xl bg-primary/5 text-primary border border-primary/10 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button 
                      onClick={() => setViewingAssetDetails(null)}
                      className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-rose-500 transition-all"
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-card border border-border p-4 rounded-2xl">
                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Registro</p>
                    <p className="text-[11px] font-bold text-foreground">{new Date(viewingAssetDetails.registration_date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="bg-card border border-border p-4 rounded-2xl">
                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Valor Inicial</p>
                    <p className="text-[11px] font-bold text-primary">{formatCurrency(viewingAssetDetails.initial_value)}</p>
                  </div>
                  <div className="bg-card border border-border p-4 rounded-2xl">
                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Valor Atualizado</p>
                    {(() => {
                      const assetHistory = equityHistory.filter(h => h.asset_id === viewingAssetDetails.id);
                      const latestValue = assetHistory.length > 0 
                        ? [...assetHistory].sort((a, b) => new Date(b.month_year).getTime() - new Date(a.month_year).getTime())[0].value 
                        : viewingAssetDetails.initial_value;
                      
                      const isHigher = latestValue > viewingAssetDetails.initial_value;
                      const isLower = latestValue < viewingAssetDetails.initial_value;

                      return (
                        <p className={`text-[11px] font-bold ${isHigher ? 'text-emerald-500' : isLower ? 'text-rose-500' : 'text-foreground'}`}>
                          {formatCurrency(latestValue)}
                        </p>
                      );
                    })()}
                  </div>
                  <div className="bg-card border border-border p-4 rounded-2xl">
                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Espaço</p>
                    <p className="text-[11px] font-bold text-foreground uppercase">{viewingAssetDetails.space === 'personal' ? 'Pessoal' : 'Empresarial'}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="space-y-8">
                  {/* Original Observation */}
                  {viewingAssetDetails.observation && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-primary">
                        <Info size={14} />
                        <h3 className="text-[10px] font-black uppercase tracking-widest">Observação de Origem</h3>
                      </div>
                      <div className="bg-muted/30 p-5 rounded-2xl border border-border/50">
                        <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                          {viewingAssetDetails.observation}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* History List */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                      <History size={14} />
                      <h3 className="text-[10px] font-black uppercase tracking-widest">Histórico de Atualizações</h3>
                    </div>

                    <div className="space-y-3">
                      {equityHistory
                        .filter(h => h.asset_id === viewingAssetDetails.id)
                        .sort((a, b) => new Date(b.month_year).getTime() - new Date(a.month_year).getTime())
                        .map((entry, idx) => (
                          <div key={entry.id} className="relative pl-6 pb-6 last:pb-0">
                            {/* Timeline Line */}
                            <div className="absolute left-0 top-2 bottom-0 w-px bg-border" />
                            <div className="absolute left-[-4px] top-2 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.5)]" />
                            
                            <div className="bg-card border border-border rounded-2xl p-4 hover:shadow-md transition-all group">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                                  {new Date(entry.month_year + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                                </p>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingValue({
                                        assetId: viewingAssetDetails.id,
                                        value: entry.value,
                                        observation: entry.observation || '',
                                        monthYear: entry.month_year,
                                        step: 'full_adjust'
                                      });
                                    }}
                                    className="p-1.5 rounded-lg bg-muted border border-border text-muted-foreground hover:text-primary transition-all"
                                    title="Editar Atualização"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteHistory({ id: entry.id, monthYear: entry.month_year })}
                                    className="p-1.5 rounded-lg bg-muted border border-border text-muted-foreground hover:text-rose-500 transition-all"
                                    title="Excluir Atualização"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                  <span className="text-xs font-black text-foreground">{formatCurrency(entry.value)}</span>
                                </div>
                              </div>
                              {entry.observation && (
                                <div className="mt-2 flex gap-2">
                                  <FileText size={12} className="text-muted-foreground shrink-0 mt-0.5" />
                                  <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                                    "{entry.observation}"
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                      {equityHistory.filter(h => h.asset_id === viewingAssetDetails.id).length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center gap-3 bg-muted/20 rounded-[2rem] border border-dashed border-border">
                          <AlertCircle className="text-muted-foreground/30" size={32} />
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Nenhuma atualização registrada ainda.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-border bg-muted/10 shrink-0">
                <button 
                  onClick={() => setViewingAssetDetails(null)}
                  className="w-full h-14 rounded-2xl bg-foreground text-background text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition-all"
                >
                  Fechar Detalhes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
