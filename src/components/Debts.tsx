import React, { useState, useMemo, useEffect } from 'react';
import { useFinance } from '../FinanceContext';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import {
  Plus,
  Calendar,
  Search,
  TrendingDown,
  History,
  X,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Edit3,
  Trash2,
  PowerOff,
  ArrowDownRight,
  AlertCircle,
  CreditCard,
  Percent,
  Calculator,
  Layout,
  RotateCcw,
  Info,
  FileText
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
import { Debt } from '../types';

export const Debts: React.FC = () => {
  const { user } = useAuth();
  const { viewingUserId } = useAuth();
  const {
    activeSpace,
    debts,
    debtHistory,
    equityAssets,
    equityHistory,
    addDebt,
    updateDebt,
    deleteDebt,
    updateDebtValue,
    deleteDebtValue,
    loading: contextLoading
  } = useFinance();
  const { showAlert } = useModal();

  const targetUserId = viewingUserId || user?.id;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [searchQuery, setSearchQuery] = useState('');

  // Modals de confirmação
  const [confirmDelete, setConfirmDelete] = useState<Debt | null>(null);
  const [deleteInput, setDeleteInput] = useState('');
  const [confirmPaid, setConfirmPaid] = useState<Debt | null>(null);
  const [confirmReactivate, setConfirmReactivate] = useState<Debt | null>(null);
  const [viewingDebtDetails, setViewingDebtDetails] = useState<Debt | null>(null);

  // Add/Edit Debt Form State
  const [debtForm, setDebtForm] = useState({
    name: '',
    total_value: 0,
    monthly_payment: 0,
    installments_count: 0,
    interest_rate: 0,
    observation: '',
    due_date: new Date().toISOString().split('T')[0]
  });

  // Cálculo automático do valor total
  useEffect(() => {
    if (debtForm.monthly_payment > 0 && debtForm.installments_count > 0) {
      setDebtForm(prev => ({
        ...prev,
        total_value: prev.monthly_payment * prev.installments_count
      }));
    }
  }, [debtForm.monthly_payment, debtForm.installments_count]);

  // Edit Value State
  const [editingValue, setEditingValue] = useState<{
    debtId: string;
    value: number;
    observation: string;
    monthYear: string;
    step?: 'choice' | 'confirm_keep' | 'pay_installment_simple' | 'pay_installment_obs' | 'full_adjust';
  } | null>(null);
  const [showUpdateSuccessAfterQuittance, setShowUpdateSuccessAfterQuittance] = useState(false);

  const [chartRange, setChartRange] = useState<'12m' | '24m' | 'all'>('12m');
  const [confirmDeleteHistory, setConfirmDeleteHistory] = useState<{
    id: string;
    monthYear: string;
  } | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const oldestDate = useMemo(() => {
    const debtDates = debts.map(a => new Date(a.due_date + 'T12:00:00'));
    const equityDates = equityAssets.map(a => new Date(a.registration_date + 'T12:00:00'));
    const allDates = [...debtDates, ...equityDates];

    if (allDates.length === 0) return new Date();
    return new Date(Math.min(...allDates.map(d => d.getTime())));
  }, [debts, equityAssets]);

  const oldestMonthDate = useMemo(() => {
    return new Date(oldestDate.getFullYear(), oldestDate.getMonth(), 1);
  }, [oldestDate]);

  const handleOpenAddModal = () => {
    setDebtForm({
      name: '',
      total_value: 0,
      monthly_payment: 0,
      installments_count: 0,
      interest_rate: 0,
      observation: '',
      due_date: new Date().toISOString().split('T')[0]
    });
    setEditingDebt(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (debt: Debt) => {
    setDebtForm({
      name: debt.name,
      total_value: debt.total_value,
      monthly_payment: debt.monthly_payment,
      installments_count: debt.installments_count,
      interest_rate: debt.interest_rate,
      observation: debt.observation || '',
      due_date: debt.due_date
    });
    setEditingDebt(debt);
    setIsAddModalOpen(true);
  };

  const handleSubmitDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId) return;

    try {
      if (editingDebt) {
        await updateDebt(editingDebt.id, {
          name: debtForm.name,
          total_value: debtForm.total_value,
          monthly_payment: debtForm.monthly_payment,
          installments_count: debtForm.installments_count,
          interest_rate: debtForm.interest_rate,
          due_date: debtForm.due_date,
          observation: debtForm.observation
        });
        setIsAddModalOpen(false);
        setEditingDebt(null);
        showAlert('Sucesso', 'Dívida atualizada com sucesso', 'success');
      } else {
        await addDebt({
          space: activeSpace,
          name: debtForm.name,
          total_value: debtForm.total_value,
          monthly_payment: debtForm.monthly_payment,
          installments_count: debtForm.installments_count,
          interest_rate: debtForm.interest_rate,
          due_date: debtForm.due_date,
          observation: debtForm.observation,
          status: 'active'
        });
        setIsAddModalOpen(false);
        showAlert('Sucesso', 'Dívida adicionada com sucesso', 'success');
      }
    } catch (error) {
      console.error('Error saving debt:', error);
      showAlert('Erro', 'Não foi possível salvar a dívida', 'danger');
    }
  };

  const handleDelete = async (id: string) => {
    if (deleteInput !== 'APAGAR') return;

    try {
      await deleteDebt(id);
      setConfirmDelete(null);
      setDeleteInput('');
      showAlert('Sucesso', 'Dívida removida com sucesso', 'success');
    } catch (error) {
      showAlert('Erro', 'Não foi possível excluir a dívida', 'danger');
    }
  };

  const handlePaidDebt = async (id: string) => {
    try {
      await updateDebt(id, { status: 'paid' });
      setConfirmPaid(null);
      setShowUpdateSuccessAfterQuittance(false);
      showAlert('Sucesso', 'Dívida marcada como paga', 'success');
    } catch (error) {
      showAlert('Erro', 'Não foi possível atualizar a dívida', 'danger');
    }
  };

  const handleReactivateDebt = async (id: string) => {
    try {
      await updateDebt(id, { status: 'active' });
      setConfirmReactivate(null);
      showAlert('Sucesso', 'Dívida reativada com sucesso', 'success');
    } catch (error) {
      showAlert('Erro', 'Não foi possível reativar a dívida', 'danger');
    }
  };

  const handleUpdateValue = async () => {
    if (!editingValue) return;
    const finalValue = editingValue.value;
    const debtId = editingValue.debtId;

    try {
      await updateDebtValue(
        editingValue.debtId,
        editingValue.monthYear,
        editingValue.value,
        editingValue.observation
      );

      setEditingValue(null);

      // Sugerir quitação se o saldo for 0
      if (finalValue <= 0) {
        const debt = debts.find(d => d.id === debtId);
        if (debt && debt.status === 'active') {
          setShowUpdateSuccessAfterQuittance(true);
          setConfirmPaid(debt);
        } else {
          showAlert('Sucesso', 'Saldo devedor atualizado com sucesso', 'success');
        }
      } else {
        showAlert('Sucesso', 'Saldo devedor atualizado com sucesso', 'success');
      }
    } catch (error) {
      console.error('Error updating value:', error);
      showAlert('Erro', 'Não foi possível atualizar o saldo', 'danger');
    }
  };

  const handleDeleteHistoryEntry = async (id: string) => {
    try {
      await deleteDebtValue(id);
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

  const filteredDebts = useMemo(() => {
    return debts.filter(debt => {
      if (searchQuery && !debt.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      const regDate = new Date(debt.due_date + 'T12:00:00');
      const regMonth = new Date(regDate.getFullYear(), regDate.getMonth(), 1);
      const selMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);

      if (selMonth < regMonth) return false;

      if (debt.status === 'paid') {
        // Encontrar o último mês com histórico (mês da quitação)
        const debtHistories = debtHistory
          .filter(h => h.debt_id === debt.id)
          .sort((a, b) => new Date(b.month_year + 'T12:00:00').getTime() - new Date(a.month_year + 'T12:00:00').getTime());

        if (debtHistories.length > 0) {
          const lastHistDate = new Date(debtHistories[0].month_year + 'T12:00:00');
          const lastMonth = new Date(lastHistDate.getFullYear(), lastHistDate.getMonth(), 1);

          // Se o mês selecionado for após o mês da última atualização (quitação), oculta
          if (selMonth > lastMonth) return false;
        }
      }

      return true;
    });
  }, [debts, debtHistory, selectedMonth, searchQuery]);

  const debtSummary = useMemo(() => {
    let totalDebtValue = 0;
    let monthlyInstallments = 0;
    let paidInMonth = 0;
    let pendingUpdates = 0;

    filteredDebts.forEach(debt => {
      // Se for ativa e não tiver histórico no mês, conta como pendente
      if (debt.status === 'active') {
        const hasHistory = debtHistory.some(h => h.debt_id === debt.id && h.month_year === monthStr);
        if (!hasHistory) pendingUpdates++;
      }

      // Valor das parcelas previstas para o mês (dívidas ativas)
      if (debt.status === 'active') {
        monthlyInstallments += debt.monthly_payment;
      }

      // Cálculo do Saldo Devedor Total e Valor Pago
      const hist = debtHistory.find(h => h.debt_id === debt.id && h.month_year === monthStr);
      let currentVal = 0;

      if (hist) {
        currentVal = hist.value;
        totalDebtValue += currentVal;

        // Cálculo do quanto foi pago este mês
        const registrationDate = new Date(debt.due_date + 'T12:00:00');
        const isRegMonth = registrationDate.getMonth() === selectedMonth.getMonth() &&
          registrationDate.getFullYear() === selectedMonth.getFullYear();

        const prevVal = isRegMonth ? debt.total_value : (() => {
          const prevMonth = new Date(selectedMonth);
          prevMonth.setMonth(prevMonth.getMonth() - 1);
          const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}-01`;
          const prevHist = debtHistory.find(h => h.debt_id === debt.id && h.month_year === prevMonthStr);

          if (prevHist) return prevHist.value;

          const past = debtHistory
            .filter(h => h.debt_id === debt.id && new Date(h.month_year + 'T12:00:00') < selectedMonth)
            .sort((a, b) => new Date(b.month_year + 'T12:00:00').getTime() - new Date(a.month_year + 'T12:00:00').getTime());

          return past.length > 0 ? past[0].value : debt.total_value;
        })();

        const diff = prevVal - currentVal;
        if (diff > 0.01) {
          paidInMonth += diff;
        }
      } else {
        const pastHistories = debtHistory
          .filter(h => h.debt_id === debt.id && new Date(h.month_year) <= selectedMonth)
          .sort((a, b) => new Date(b.month_year).getTime() - new Date(a.month_year).getTime());

        if (pastHistories.length > 0) {
          totalDebtValue += pastHistories[0].value;
        } else {
          totalDebtValue += debt.total_value;
        }
      }
    });

    return {
      total: totalDebtValue,
      monthly: monthlyInstallments,
      paid: paidInMonth,
      count: filteredDebts.filter(d => d.status === 'active').length,
      pending: pendingUpdates
    };
  }, [filteredDebts, debtHistory, selectedMonth, monthStr]);

  const changeMonth = (delta: number) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + delta);

    if (delta < 0 && newDate < oldestMonthDate) {
      showAlert(
        'Período Indisponível',
        `Não existem dívidas cadastradas antes de ${oldestMonthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}.`,
        'info'
      );
      return;
    }

    setSelectedMonth(newDate);
  };

  const chartData = useMemo(() => {
    if (debts.length === 0) return [];

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
      let totalDebtForMonth = 0;
      let totalInstallmentsForMonth = 0;
      let totalEquityForMonth = 0;

      // Cálculo Dívidas
      debts.forEach(debt => {
        const regDate = new Date(debt.due_date + 'T12:00:00');
        const regMonth = new Date(regDate.getFullYear(), regDate.getMonth(), 1);

        if (tempDate >= regMonth) {
          // Saldo Devedor
          const hist = debtHistory.find(h => h.debt_id === debt.id && h.month_year === mStr);
          if (hist) {
            totalDebtForMonth += hist.value;
          } else {
            const pastHistories = debtHistory
              .filter(h => h.debt_id === debt.id && new Date(h.month_year) <= tempDate)
              .sort((a, b) => new Date(b.month_year).getTime() - new Date(a.month_year).getTime());

            if (pastHistories.length > 0) {
              totalDebtForMonth += pastHistories[0].value;
            } else {
              totalDebtForMonth += debt.total_value;
            }
          }

          // Parcelas Mensais
          if (debt.status === 'active') {
            totalInstallmentsForMonth += (debt.monthly_payment || 0);
          } else if (debt.status === 'paid') {
            const dHist = debtHistory
              .filter(h => h.debt_id === debt.id)
              .sort((a, b) => new Date(b.month_year).getTime() - new Date(a.month_year).getTime());

            if (dHist.length > 0) {
              const lastMonth = new Date(dHist[0].month_year + 'T12:00:00');
              const lastMonthNormalized = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
              if (tempDate <= lastMonthNormalized) {
                totalInstallmentsForMonth += (debt.monthly_payment || 0);
              }
            }
          }
        }
      });

      // Cálculo Patrimônio
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
            totalEquityForMonth += hist.value;
          } else {
            const past = equityHistory
              .filter(h => h.asset_id === asset.id && new Date(h.month_year) <= tempDate)
              .sort((a, b) => new Date(b.month_year).getTime() - new Date(a.month_year).getTime());

            totalEquityForMonth += past.length > 0 ? past[0].value : asset.initial_value;
          }
        }
      });

      data.push({
        name: `${monthsNames[tempDate.getMonth()]}/${tempDate.getFullYear().toString().slice(-2)}`,
        valor: totalDebtForMonth,
        parcelas: totalInstallmentsForMonth,
        patrimonio: totalEquityForMonth,
        rawDate: new Date(tempDate)
      });

      tempDate.setMonth(tempDate.getMonth() + 1);
    }

    return data;
  }, [debts, debtHistory, equityAssets, equityHistory, chartRange, oldestMonthDate]);

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
              <CreditCard size={20} />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground">Dívidas</h1>
          </div>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em]">Gestão e amortização de compromissos financeiros</p>
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
            className="h-12 px-6 rounded-2xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-rose-500/20"
          >
            <Plus size={18} />
            Nova Dívida
          </button>
        </div>
      </div>

      {debts.length === 0 && !contextLoading ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-dashed border-border rounded-[3rem] p-20 flex flex-col items-center text-center gap-6 shadow-2xl shadow-slate-200/20 dark:shadow-none"
        >
          <div className="w-32 h-32 rounded-[3rem] bg-rose-500/5 flex items-center justify-center text-rose-500/30 relative">
            <div className="absolute inset-0 bg-rose-500/10 rounded-[3rem] animate-pulse" />
            <CreditCard size={64} className="relative z-10" />
          </div>
          <div className="space-y-3 max-w-md">
            <h3 className="text-2xl font-black uppercase tracking-tighter text-foreground">Sua lista de dívidas está limpa</h3>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              Você ainda não cadastrou nenhuma dívida ou financiamento. Comece agora para traçar sua estratégia de quitação e liberdade financeira.
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="h-16 px-10 rounded-2xl bg-rose-500 text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:scale-[1.05] active:scale-95 transition-all shadow-2xl shadow-rose-500/30 mt-4"
          >
            <Plus size={24} />
            Cadastrar minha primeira Dívida
          </button>
        </motion.div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="relative group overflow-hidden bg-card border border-border rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:scale-110" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 mb-2">Saldo Devedor Total</p>
                  <h2 className="text-3xl font-black tracking-tighter text-foreground">
                    {formatCurrency(debtSummary.total)}
                  </h2>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-inner">
                  <TrendingDown size={24} />
                </div>
              </div>
            </div>

            <div className="relative group overflow-hidden bg-card border border-border rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:scale-110" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 mb-2">Parcelas do Mês (ATUALIZADO)</p>
                  <h2 className="text-3xl font-black tracking-tighter text-foreground">
                    {formatCurrency(debtSummary.monthly)}
                  </h2>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
                  <Calculator size={24} />
                </div>
              </div>
            </div>

            <div className="relative group overflow-hidden bg-card border border-border rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:scale-110" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-2">Pago no Mês</p>
                  <h2 className="text-3xl font-black tracking-tighter text-foreground">
                    {formatCurrency(debtSummary.paid)}
                  </h2>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
                  <div className="relative">
                    <TrendingDown size={24} className="rotate-180" />
                    <div className="absolute inset-0 bg-emerald-500 blur-md opacity-20" />
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group overflow-hidden bg-card border border-border rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:scale-110" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-2">Dívidas Ativas</p>
                  <h2 className="text-3xl font-black tracking-tighter text-foreground">
                    {debtSummary.count} <span className="text-sm font-bold text-muted-foreground uppercase ml-2 tracking-widest">Contratos</span>
                  </h2>
                  {debtSummary.pending > 0 && (
                    <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mt-1 flex items-center gap-1 animate-pulse">
                      <AlertCircle size={10} />
                      {debtSummary.pending} Atualização{debtSummary.pending > 1 ? 'ões' : 'ª'} Pendente{debtSummary.pending > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner">
                  <Layout size={24} />
                </div>
              </div>
            </div>
          </div>


          {/* Debts Table/List */}
          <div className="bg-card border border-border rounded-[3rem] overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-none">
            <div className="p-8 border-b border-border bg-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tighter text-foreground">Suas Dívidas</h3>
                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Gerencie e acompanhe a quitação de cada compromisso</p>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  type="text"
                  placeholder="BUSCAR CREDOR..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full h-11 bg-muted border-none rounded-xl pl-12 pr-4 text-[10px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/10">
                    <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Credor / Dívida</th>
                    <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Info. Pagamento</th>
                    <th className="text-right px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Saldo em {formattedSelectedMonth}</th>
                    <th className="text-right px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {contextLoading ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <div className="w-8 h-8 border-2 border-rose-500/20 rounded-full animate-spin border-t-rose-500 mx-auto" />
                      </td>
                    </tr>
                  ) : filteredDebts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-4 text-muted-foreground">
                          <History size={48} className="opacity-20" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma dívida para este período.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredDebts.map(debt => {
                      const monthData = debtHistory.find(h => h.debt_id === debt.id && h.month_year === monthStr);
                      const displayValue = monthData ? monthData.value : (() => {
                        const past = debtHistory
                          .filter(h => h.debt_id === debt.id && new Date(h.month_year + 'T12:00:00') < selectedMonth)
                          .sort((a, b) => new Date(b.month_year + 'T12:00:00').getTime() - new Date(a.month_year + 'T12:00:00').getTime());
                        return past.length > 0 ? past[0].value : debt.total_value;
                      })();

                      const regDate = new Date(debt.due_date + 'T12:00:00');
                      const isRegistrationMonth = regDate.getMonth() === selectedMonth.getMonth() &&
                        regDate.getFullYear() === selectedMonth.getFullYear();

                      return (
                        <tr key={debt.id} className="group border-b border-border last:border-none hover:bg-muted/30 transition-all">
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setViewingDebtDetails(debt)}
                                  className={cn(
                                    "text-sm font-black uppercase tracking-tight group-hover:text-rose-500 transition-colors text-left",
                                    debt.status === 'paid' && "text-muted-foreground line-through"
                                  )}
                                >
                                  {debt.name}
                                </button>
                                {debt.status === 'paid' ? (
                                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[7px] font-black uppercase tracking-widest">
                                    Quitada
                                  </span>
                                ) : monthData ? (
                                  <span className={cn(
                                    "px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest flex items-center gap-1",
                                    isRegistrationMonth ? "bg-blue-500/10 text-blue-500" : "bg-emerald-500/10 text-emerald-500"
                                  )}>
                                    {isRegistrationMonth ? (
                                      <>Mês de Registro</>
                                    ) : (
                                      <>
                                        <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                        Saldo Atualizado
                                      </>
                                    )}
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[7px] font-black uppercase tracking-widest flex items-center gap-1 animate-pulse">
                                    <AlertCircle size={8} />
                                    Pendente Atualização
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 flex flex-col gap-0.5">
                                <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest leading-relaxed break-words">
                                  {debt.observation || 'Sem observações de origem'}
                                </span>
                                {monthData?.observation &&
                                  monthData.observation.trim() !== '' && (
                                    <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest leading-relaxed break-words">
                                      Mês: {monthData.observation}
                                    </span>
                                  )}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar size={12} />
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                  {debt.installments_count}X DE {formatCurrency(debt.monthly_payment)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Percent size={12} />
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                  JUROS: {debt.interest_rate}%
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex flex-col items-end gap-1">
                              <div className={cn(
                                "inline-flex items-center gap-3 px-4 py-2 rounded-xl border",
                                monthData
                                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500"
                                  : "bg-muted border-transparent text-muted-foreground"
                              )}>
                                <span className="text-sm font-black">
                                  {formatCurrency(displayValue)}
                                </span>
                              </div>
                              {monthData && (() => {
                                const registrationDate = new Date(debt.due_date + 'T12:00:00');
                                const isRegMonth = registrationDate.getMonth() === selectedMonth.getMonth() &&
                                  registrationDate.getFullYear() === selectedMonth.getFullYear();

                                const prevVal = isRegMonth ? debt.total_value : (() => {
                                  const prevMonth = new Date(selectedMonth);
                                  prevMonth.setMonth(prevMonth.getMonth() - 1);
                                  const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}-01`;
                                  const prevHist = debtHistory.find(h => h.debt_id === debt.id && h.month_year === prevMonthStr);

                                  if (prevHist) return prevHist.value;

                                  const past = debtHistory
                                    .filter(h => h.debt_id === debt.id && new Date(h.month_year + 'T12:00:00') < selectedMonth)
                                    .sort((a, b) => new Date(b.month_year + 'T12:00:00').getTime() - new Date(a.month_year + 'T12:00:00').getTime());

                                  return past.length > 0 ? past[0].value : debt.total_value;
                                })();

                                const diff = prevVal - monthData.value;

                                if (diff > 0.01) {
                                  return (
                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mr-2">
                                      Pago: {formatCurrency(diff)}
                                    </span>
                                  );
                                } else if (Math.abs(diff) <= 0.01) {
                                  return (
                                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest mr-2">
                                      Saldo Mantido
                                    </span>
                                  );
                                } else {
                                  return (
                                    <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest mr-2">
                                      Saldo Aumentou: {formatCurrency(Math.abs(diff))}
                                    </span>
                                  );
                                }
                              })()}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center justify-end gap-2">
                              {isRegistrationMonth && (
                                <button
                                  onClick={() => handleOpenEditModal(debt)}
                                  title="Editar Configurações da Dívida"
                                  className="w-10 h-10 rounded-xl bg-rose-500/5 text-rose-500 border border-rose-500/10 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                >
                                  <Edit2 size={16} />
                                </button>
                              )}

                              {monthData ? (
                                <button
                                  onClick={() => setConfirmDeleteHistory({ id: monthData.id, monthYear: monthStr })}
                                  title="Remover Atualização do Mês"
                                  className="w-10 h-10 rounded-xl bg-orange-500/5 text-orange-500 border border-orange-500/10 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all shadow-sm"
                                >
                                  <RotateCcw size={16} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => setEditingValue({
                                    debtId: debt.id,
                                    value: displayValue,
                                    observation: '',
                                    monthYear: monthStr,
                                    step: 'choice'
                                  })}
                                  title="Atualizar Saldo Devedor Mensal"
                                  className="w-10 h-10 rounded-xl bg-emerald-500/5 text-emerald-500 border border-emerald-500/10 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                >
                                  <TrendingDown size={16} />
                                </button>
                              )}

                              {debt.status === 'active' && (
                                <button
                                  onClick={() => setConfirmPaid(debt)}
                                  title="Marcar como Quitada"
                                  className="w-10 h-10 rounded-xl bg-emerald-500/5 text-emerald-500 border border-emerald-500/10 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                >
                                  <PowerOff size={16} />
                                </button>
                              )}

                              {debt.status === 'paid' && (
                                <button
                                  onClick={() => setConfirmReactivate(debt)}
                                  title="Reativar Dívida"
                                  className="w-10 h-10 rounded-xl bg-amber-500/5 text-amber-500 border border-amber-500/10 flex items-center justify-center hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                                >
                                  <RotateCcw size={16} />
                                </button>
                              )}

                              <button
                                onClick={() => setConfirmDelete(debt)}
                                title="Excluir Dívida Permanente"
                                className="w-10 h-10 rounded-xl bg-slate-500/5 text-slate-500 border border-slate-500/10 flex items-center justify-center hover:bg-slate-500 hover:text-white transition-all shadow-sm"
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

          {/* Charts Section */}
          <div className="space-y-6">
            {/* 1. Monthly Installments Chart */}
            <div className="relative group bg-card border border-border rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 dark:shadow-none">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                    <CreditCard size={14} className="text-blue-500" />
                    Evolução das Parcelas Mensais
                  </h3>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Peso das parcelas no seu orçamento mensal</p>
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
                          ? "bg-card text-blue-500 shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-[200px] w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ left: 10, right: 10, bottom: 20, top: 10 }}>
                      <defs>
                        <linearGradient id="colorParcelas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fontWeight: 900, fill: 'var(--muted-foreground)' }}
                        dy={15}
                        interval={chartRange === 'all' ? 'preserveStartEnd' : 0}
                        minTickGap={10}
                        padding={{ left: 20, right: 20 }}
                      />
                      <YAxis hide domain={['auto', 'auto']} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-card/95 backdrop-blur-md border border-border p-4 rounded-2xl shadow-2xl">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                                  {payload[0].payload.rawDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}
                                </p>
                                <p className="text-lg font-black text-blue-500 tracking-tighter">
                                  {formatCurrency(payload[0].value as number)}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="parcelas"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorParcelas)"
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

            {/* 2. Debt Balance Chart (Existing) */}
            <div className="relative group bg-card border border-border rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 dark:shadow-none">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                    <ArrowDownRight size={14} className="text-rose-500" />
                    Evolução do Saldo Devedor
                  </h3>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Acompanhe a redução das suas dívidas</p>
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
                          ? "bg-card text-rose-500 shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-[200px] w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ left: 10, right: 10, bottom: 20, top: 10 }}>
                      <defs>
                        <linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fontWeight: 900, fill: 'var(--muted-foreground)' }}
                        dy={15}
                        interval={chartRange === 'all' ? 'preserveStartEnd' : 0}
                        minTickGap={10}
                        padding={{ left: 20, right: 20 }}
                      />
                      <YAxis hide domain={['auto', 'auto']} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-card/95 backdrop-blur-md border border-border p-4 rounded-2xl shadow-2xl">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                                  {payload[0].payload.rawDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}
                                </p>
                                <p className="text-lg font-black text-rose-500 tracking-tighter">
                                  {formatCurrency(payload[0].value as number)}
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
                        stroke="#f43f5e"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorDebt)"
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

            {/* 3. Debt vs Equity Comparison Chart */}
            <div className="relative group bg-card border border-border rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 dark:shadow-none">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                    <Layout size={14} className="text-emerald-500" />
                    Dívidas vs. Patrimônio
                  </h3>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Comparativo entre o que você deve e o que você possui</p>
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
                          ? "bg-card text-emerald-500 shadow-sm"
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
                        <linearGradient id="colorDebtComp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorEquityComp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fontWeight: 900, fill: 'var(--muted-foreground)' }}
                        dy={15}
                        interval={chartRange === 'all' ? 'preserveStartEnd' : 0}
                        minTickGap={10}
                        padding={{ left: 20, right: 20 }}
                      />
                      <YAxis hide domain={['auto', 'auto']} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const equity = payload.find(p => p.dataKey === 'patrimonio')?.value as number || 0;
                            const debt = payload.find(p => p.dataKey === 'valor')?.value as number || 0;
                            const netValue = equity - debt;

                            return (
                              <div className="bg-card/95 backdrop-blur-md border border-border p-4 rounded-2xl shadow-2xl min-w-[200px]">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 pb-2 border-b border-border">
                                  {payload[0].payload.rawDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}
                                </p>
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500 opacity-80">Patrimônio Total</p>
                                    <p className="text-base font-black text-emerald-500 tracking-tighter">
                                      {formatCurrency(equity)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-rose-500 opacity-80">Saldo Devedor</p>
                                    <p className="text-base font-black text-rose-500 tracking-tighter">
                                      {formatCurrency(debt)}
                                    </p>
                                  </div>
                                  
                                  <div className="pt-3 border-t border-border/50">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Saldo Líquido</p>
                                    <p className={cn(
                                      "text-base font-black tracking-tighter",
                                      netValue >= 0 ? "text-emerald-500" : "text-rose-500"
                                    )}>
                                      {formatCurrency(netValue)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="patrimonio"
                        stroke="#10b981"
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#colorEquityComp)"
                        animationDuration={1500}
                      />
                      <Area
                        type="monotone"
                        dataKey="valor"
                        stroke="#f43f5e"
                        strokeWidth={3}
                        strokeDasharray="5 5"
                        fillOpacity={1}
                        fill="url(#colorDebtComp)"
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
          </div>
        </>
      )}

      {/* Add/Edit Debt Modal */}
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
                    <Plus className="text-rose-500" size={20} />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500">
                      {editingDebt ? 'Editar Registro' : 'Novo Registro'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">
                    {editingDebt ? 'Editar Dívida' : 'Cadastrar Dívida'}
                  </h2>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-rose-500 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitDebt} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Credor / Instituição</label>
                    <input
                      required
                      type="text"
                      placeholder="Ex: Banco do Brasil, Nubank..."
                      value={debtForm.name}
                      onChange={e => setDebtForm({ ...debtForm, name: e.target.value })}
                      className="w-full h-14 bg-muted border border-border rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-rose-500/20 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Valor da Parcela</label>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">R$</span>
                        <input
                          required
                          type="text"
                          placeholder="0,00"
                          value={(debtForm.monthly_payment || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '');
                            setDebtForm({ ...debtForm, monthly_payment: Number(val) / 100 });
                          }}
                          className="w-full h-14 bg-muted border border-border rounded-2xl pl-12 pr-6 text-sm font-bold focus:ring-2 focus:ring-rose-500/20 transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Qtd. de Parcelas</label>
                      <input
                        required
                        type="number"
                        placeholder="Ex: 12"
                        value={debtForm.installments_count || ''}
                        onChange={e => setDebtForm({ ...debtForm, installments_count: Number(e.target.value) })}
                        className="w-full h-14 bg-muted border border-border rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-rose-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Valor Total (Auto)</label>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xs font-bold text-rose-500">R$</span>
                        <input
                          readOnly
                          type="text"
                          value={(debtForm.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          className="w-full h-14 bg-rose-500/5 border border-rose-500/20 rounded-2xl pl-12 pr-6 text-sm font-black text-rose-500 cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Taxa de Juros (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 1.5"
                        value={debtForm.interest_rate || ''}
                        onChange={e => setDebtForm({ ...debtForm, interest_rate: Number(e.target.value) })}
                        className="w-full h-14 bg-muted border border-border rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-rose-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Data da Primeira Parcela</label>
                      <input
                        required
                        type="date"
                        value={debtForm.due_date}
                        onChange={e => setDebtForm({ ...debtForm, due_date: e.target.value })}
                        className="w-full h-14 bg-muted border border-border rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-rose-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Observações</label>
                    <textarea
                      placeholder="Algum detalhe importante sobre esta dívida..."
                      value={debtForm.observation}
                      onChange={e => setDebtForm({ ...debtForm, observation: e.target.value })}
                      className="w-full h-24 bg-muted border border-border rounded-2xl p-6 text-sm font-medium focus:ring-2 focus:ring-rose-500/20 transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 h-14 rounded-2xl border border-border text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-2 h-14 px-10 rounded-2xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    {editingDebt ? 'Salvar Alterações' : 'Cadastrar Dívida'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Monthly Value Modal */}
      <AnimatePresence>
        {editingValue && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
              onClick={() => setEditingValue(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-card border border-border rounded-[3rem] p-8 shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {editingValue.step === 'choice' ? (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
                      <TrendingDown size={32} />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tighter text-foreground">Atualizar Saldo Devedor</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {new Date(editingValue.monthYear + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <button
                      onClick={() => {
                        const currentDebt = debts.find(d => d.id === editingValue.debtId);
                        const registrationDate = new Date((currentDebt?.due_date || '') + 'T12:00:00');
                        const isRegMonth = registrationDate.getMonth() === selectedMonth.getMonth() &&
                          registrationDate.getFullYear() === selectedMonth.getFullYear();

                        const msg = isRegMonth
                          ? "Manutenção do saldo inicial (sem pagamento)"
                          : "Manutenção do saldo anterior (sem pagamento)";

                        setEditingValue({ ...editingValue, step: 'confirm_keep', observation: msg });
                      }}
                      className="h-16 px-6 rounded-2xl bg-muted border border-border flex items-center justify-between group hover:bg-emerald-500/5 hover:border-emerald-500/20 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                          <History size={18} />
                        </div>
                        <div className="text-left">
                          <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Manter Saldo Anterior</p>
                          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Replicar o valor do mês passado</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        const currentDebt = debts.find(d => d.id === editingValue.debtId);
                        const newValue = Math.max(0, (editingValue.value || 0) - (currentDebt?.monthly_payment || 0));
                        setEditingValue({ ...editingValue, value: newValue, step: 'pay_installment_simple', observation: '' });
                      }}
                      className="h-16 px-6 rounded-2xl bg-muted border border-border flex items-center justify-between group hover:bg-blue-500/5 hover:border-blue-500/20 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                          <CreditCard size={18} />
                        </div>
                        <div className="text-left">
                          <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Pagar Parcela (Simples)</p>
                          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Abater uma parcela sem observação</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        const currentDebt = debts.find(d => d.id === editingValue.debtId);
                        const newValue = Math.max(0, (editingValue.value || 0) - (currentDebt?.monthly_payment || 0));
                        setEditingValue({ ...editingValue, value: newValue, step: 'pay_installment_obs', observation: 'Pagamento da parcela do mês' });
                      }}
                      className="h-16 px-6 rounded-2xl bg-muted border border-border flex items-center justify-between group hover:bg-amber-500/5 hover:border-amber-500/20 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                          <Calculator size={18} />
                        </div>
                        <div className="text-left">
                          <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Pagar Parcela + Obs</p>
                          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Abater uma parcela com observação</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        const currentDebt = debts.find(d => d.id === editingValue.debtId);
                        const registrationDate = new Date((currentDebt?.due_date || '') + 'T12:00:00');
                        const isRegMonth = registrationDate.getMonth() === selectedMonth.getMonth() &&
                          registrationDate.getFullYear() === selectedMonth.getFullYear();

                        const msg = isRegMonth
                          ? "Pagamento parcial / Ajuste no mês de registro"
                          : "Pagamento parcial / Ajuste de saldo";

                        setEditingValue({ ...editingValue, step: 'full_adjust', observation: msg });
                      }}
                      className="h-16 px-6 rounded-2xl bg-muted border border-border flex items-center justify-between group hover:bg-primary/5 hover:border-primary/20 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <Edit2 size={18} />
                        </div>
                        <div className="text-left">
                          <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Novo Valor / Amortização</p>
                          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Informar o saldo exato deste mês</p>
                        </div>
                      </div>
                    </button>
                  </div>

                  <button
                    onClick={() => setEditingValue(null)}
                    className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
                  >
                    Voltar
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black uppercase tracking-tighter text-foreground">
                      {editingValue.step === 'confirm_keep' && 'Confirmar Manutenção'}
                      {editingValue.step === 'pay_installment_simple' && 'Confirmar Pagamento'}
                      {editingValue.step === 'pay_installment_obs' && 'Pagamento com Obs'}
                      {editingValue.step === 'full_adjust' && 'Informar Novo Saldo'}
                    </h3>
                    <button onClick={() => setEditingValue({ ...editingValue, step: 'choice' })} className="text-muted-foreground hover:text-foreground">
                      <ChevronLeft size={20} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Saldo Devedor Atual</label>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">R$</span>
                        <input
                          type="text"
                          value={(editingValue.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '');
                            setEditingValue({ ...editingValue, value: Number(val) / 100 });
                          }}
                          disabled={editingValue.step === 'confirm_keep' || editingValue.step === 'pay_installment_simple' || editingValue.step === 'pay_installment_obs'}
                          className={cn(
                            "w-full h-14 bg-muted border border-border rounded-2xl pl-12 pr-6 text-sm font-black focus:ring-2 focus:ring-primary/20 transition-all",
                            (editingValue.step === 'confirm_keep' || editingValue.step === 'pay_installment_simple' || editingValue.step === 'pay_installment_obs') && "opacity-70 cursor-not-allowed"
                          )}
                        />
                      </div>
                    </div>

                    {editingValue.step !== 'pay_installment_simple' && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Observação deste mês</label>
                        <textarea
                          placeholder={
                            editingValue.step === 'confirm_keep'
                              ? "Descreva o motivo da manutenção (ex: imprevisto financeiro)..."
                              : "Descreva detalhes (ex: amortização extra, renegociação)..."
                          }
                          value={editingValue.observation}
                          onChange={e => setEditingValue({ ...editingValue, observation: e.target.value })}
                          className="w-full h-24 bg-muted border border-border rounded-2xl p-6 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleUpdateValue}
                    className="w-full h-14 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Salvar Atualização
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => {
          setConfirmDelete(null);
          setDeleteInput('');
        }}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete.id)}
        title="Excluir Dívida Permanentemente"
        message={
          <div className="space-y-4">
            <p>
              Você está prestes a excluir <span className="font-bold text-foreground">"{confirmDelete?.name}"</span> e todo o seu histórico de pagamentos. Esta ação não pode ser desfeita.
            </p>
            <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20">
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-2">Para confirmar, digite APAGAR abaixo:</p>
              <input
                type="text"
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value.toUpperCase())}
                placeholder="Digite APAGAR"
                className="w-full h-12 bg-card border border-rose-500/30 rounded-xl px-4 text-sm font-black text-rose-500 text-center placeholder:text-rose-500/30 focus:ring-0 uppercase"
              />
            </div>
          </div>
        }
        confirmText="Confirmar Exclusão"
        variant="danger"
        disabled={deleteInput !== 'APAGAR'}
      />

      {/* Paid Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmPaid}
        onClose={() => {
          setConfirmPaid(null);
          if (showUpdateSuccessAfterQuittance) {
            showAlert('Sucesso', 'Saldo devedor atualizado com sucesso', 'success');
            setShowUpdateSuccessAfterQuittance(false);
          }
        }}
        onConfirm={() => confirmPaid && handlePaidDebt(confirmPaid.id)}
        title="Marcar como Quitada"
        message={confirmPaid ? `Deseja marcar a dívida "${confirmPaid.name}" como totalmente quitada? Ela não aparecerá mais nos cálculos de parcelas mensais.` : ''}
        confirmText="Sim, Quitar Dívida"
        variant="success"
      />

      <ConfirmModal
        isOpen={!!confirmReactivate}
        onClose={() => setConfirmReactivate(null)}
        onConfirm={() => confirmReactivate && handleReactivateDebt(confirmReactivate.id)}
        title="Reativar Dívida"
        message={confirmReactivate ? `Deseja reativar a dívida "${confirmReactivate.name}"? Ela voltará a ser considerada nos cálculos de parcelas mensais.` : ''}
        confirmText="Sim, Reativar"
        variant="warning"
      />

      {/* Debt History Details Modal */}
      <AnimatePresence>
        {viewingDebtDetails && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
              onClick={() => setViewingDebtDetails(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-card border border-border rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Header Section with Cards */}
              <div className="p-8 pb-0 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20">
                      <CreditCard size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">{viewingDebtDetails.name}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Detalhes do Compromisso</span>
                        {viewingDebtDetails.status === 'paid' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest">
                            Quitada
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        handleOpenEditModal(viewingDebtDetails);
                        setViewingDebtDetails(null);
                      }}
                      title="Editar Origem da Dívida"
                      className="w-12 h-12 rounded-xl bg-rose-500/5 text-rose-500 border border-rose-500/10 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button 
                      onClick={() => setViewingDebtDetails(null)}
                      className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-rose-500 transition-all"
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted/30 border border-border p-4 rounded-2xl">
                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Registro</p>
                    <p className="text-[11px] font-bold text-foreground">
                      {new Date(viewingDebtDetails.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="bg-muted/30 border border-border p-4 rounded-2xl">
                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Valor Inicial</p>
                    <p className="text-[11px] font-bold text-primary">{formatCurrency(viewingDebtDetails.total_value)}</p>
                  </div>
                  <div className="bg-muted/30 border border-border p-4 rounded-2xl">
                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Valor Atualizado</p>
                    {(() => {
                      const history = debtHistory.filter(h => h.debt_id === viewingDebtDetails.id);
                      const latestValue = history.length > 0
                        ? [...history].sort((a, b) => new Date(b.month_year).getTime() - new Date(a.month_year).getTime())[0].value
                        : viewingDebtDetails.total_value;

                      const isLower = latestValue < viewingDebtDetails.total_value;
                      const isHigher = latestValue > viewingDebtDetails.total_value;

                      return (
                        <p className={cn(
                          "text-[11px] font-bold",
                          isLower ? "text-emerald-500" : isHigher ? "text-rose-500" : "text-foreground"
                        )}>
                          {formatCurrency(latestValue)}
                        </p>
                      );
                    })()}
                  </div>
                  <div className="bg-muted/30 border border-border p-4 rounded-2xl">
                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Espaço</p>
                    <p className="text-[11px] font-bold text-foreground uppercase">
                      {viewingDebtDetails.space === 'personal' ? 'Pessoal' : 'Empresarial'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="space-y-8">
                  {/* Original Observation */}
                  {viewingDebtDetails.observation && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-primary">
                        <Info size={14} />
                        <h3 className="text-[10px] font-black uppercase tracking-widest">Observação de Origem</h3>
                      </div>
                      <div className="bg-muted/30 p-5 rounded-2xl border border-border/50">
                        <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                          {viewingDebtDetails.observation}
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
                      {debtHistory
                        .filter(h => h.debt_id === viewingDebtDetails.id)
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
                                        debtId: viewingDebtDetails.id,
                                        value: entry.value,
                                        observation: entry.observation || '',
                                        monthYear: entry.month_year,
                                        step: 'input'
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

                      {debtHistory.filter(h => h.debt_id === viewingDebtDetails.id).length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                          <History size={48} className="mx-auto opacity-10 mb-4" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma atualização registrada.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-8 pt-0 mt-auto">
                <button
                  onClick={() => setViewingDebtDetails(null)}
                  className="w-full h-14 rounded-2xl bg-slate-950 text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-slate-900 transition-all"
                >
                  Fechar Detalhes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!confirmDeleteHistory}
        onClose={() => setConfirmDeleteHistory(null)}
        onConfirm={() => confirmDeleteHistory && handleDeleteHistoryEntry(confirmDeleteHistory.id)}
        title="Remover Atualização"
        message={confirmDeleteHistory ? `Deseja realmente excluir a atualização de ${new Date(confirmDeleteHistory.monthYear + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}?` : ''}
        confirmText="Sim, Remover"
        variant="danger"
      />
    </div>
  );
};
