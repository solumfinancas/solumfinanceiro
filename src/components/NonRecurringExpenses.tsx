import React, { useState, useMemo } from 'react';
import { useFinance } from '../FinanceContext';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import {
  Plus,
  Search,
  X,
  Edit2,
  Trash2,
  AlertCircle,
  PiggyBank,
  CalendarClock,
  History,
  TrendingUp,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Info,
  Check,
  RotateCcw,
  RefreshCw,
  SkipForward,
  ArrowUpRight,
  Target,
  Trophy
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmModal } from './ui/ConfirmModal';
import { NonRecurringExpense } from '../types';

interface NonRecurringExpensesProps {
  category?: 'expense' | 'objective';
}

export const NonRecurringExpenses: React.FC<NonRecurringExpensesProps> = ({
  category = 'expense'
}) => {
  const isObjective = category === 'objective';
  const labelCap = isObjective ? 'Objetivo' : 'Gasto Eventual';
  const labelLow = isObjective ? 'objetivo' : 'gasto eventual';
  const labelPluralCap = isObjective ? 'Objetivos' : 'Gastos Eventuais';
  const labelPluralLow = isObjective ? 'objetivos' : 'gastos eventuais';

  const { user } = useAuth();
  const { viewingUserId } = useAuth();
  const {
    activeSpace,
    nonRecurringExpenses,
    addNonRecurringExpense,
    updateNonRecurringExpense,
    deleteNonRecurringExpense,
    loading: contextLoading
  } = useFinance();
  const { showAlert } = useModal();

  const targetUserId = viewingUserId || user?.id;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<NonRecurringExpense | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Estados de navegação mensal
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const selectedMonthStr = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = String(selectedMonth.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }, [selectedMonth]);

  const oldestMonthDate = useMemo(() => {
    const list = nonRecurringExpenses.filter(e => (e.category || 'expense') === category);
    if (list.length === 0) return new Date();
    
    const dates = list
      .map(e => e.identification_date ? new Date(e.identification_date + 'T12:00:00') : new Date(e.created_at))
      .sort((a, b) => a.getTime() - b.getTime());
    
    const oldest = dates[0] || new Date();
    return new Date(oldest.getFullYear(), oldest.getMonth(), 1);
  }, [nonRecurringExpenses, category]);

  const changeMonth = (delta: number) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + delta);
    
    if (delta < 0 && newDate < oldestMonthDate) {
      showAlert(
        'Período Indisponível',
        `Não existem ${labelPluralLow} identificados antes de ${oldestMonthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}.`,
        'info'
      );
      return;
    }
    
    setSelectedMonth(newDate);
  };

  const formattedSelectedMonth = useMemo(() => {
    const raw = selectedMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [selectedMonth]);

  // Modal de gerenciamento do gasto
  const [viewingExpenseDetails, setViewingExpenseDetails] = useState<NonRecurringExpense | null>(null);
  
  // Formulário de gerenciamento de atualizações do gasto
  const [manageForm, setManageForm] = useState<{
    month_year: string;
    skipped: boolean;
    observation: string;
    type: 'save' | 'use';
  }>({
    month_year: '',
    skipped: false,
    observation: '',
    type: 'save'
  });
  const [manageValueRaw, setManageValueRaw] = useState('');
  const [editingHistoryItemId, setEditingHistoryItemId] = useState<string | null>(null);

  // Modals de confirmação
  const [confirmDelete, setConfirmDelete] = useState<NonRecurringExpense | null>(null);
  const [confirmToggleBudget, setConfirmToggleBudget] = useState<NonRecurringExpense | null>(null);
  const [confirmFinish, setConfirmFinish] = useState<NonRecurringExpense | null>(null);
  const [confirmReactivate, setConfirmReactivate] = useState<NonRecurringExpense | null>(null);
  const [confirmDeleteHistoryItem, setConfirmDeleteHistoryItem] = useState<{ id: string; monthYear: string; valueLabel: string } | null>(null);
  const [finishDate, setFinishDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [budgetEntryDateInput, setBudgetEntryDateInput] = useState(() => new Date().toISOString().split('T')[0]);

  // Add/Edit Form State
  const [form, setForm] = useState({
    description: '',
    amount: 0,
    frequency_months: 12,
    in_budget: false,
    identification_date: new Date().toISOString().split('T')[0],
    budget_entry_date: '' as string | null,
    observation: '',
    is_recurrent: false,
    finished_at: '' as string | null
  });

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const digits = rawValue.replace(/\D/g, '');
    const amountInCents = parseInt(digits || '0');
    setForm(prev => ({ ...prev, amount: amountInCents / 100 }));
  };

  const getDisplayAmount = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleOpenAddModal = () => {
    setForm({
      description: '',
      amount: 0,
      frequency_months: 12,
      in_budget: false,
      identification_date: new Date().toISOString().split('T')[0],
      budget_entry_date: '',
      observation: '',
      is_recurrent: false,
      finished_at: ''
    });
    setEditingExpense(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (expense: NonRecurringExpense) => {
    setForm({
      description: expense.description,
      amount: expense.amount,
      frequency_months: expense.frequency_months,
      in_budget: expense.in_budget,
      identification_date: expense.identification_date || '',
      budget_entry_date: expense.budget_entry_date || '',
      observation: expense.observation || '',
      is_recurrent: expense.is_recurrent || false,
      finished_at: expense.finished_at || ''
    });
    setEditingExpense(expense);
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId) return;

    if (!form.description) {
      showAlert('Atenção', 'A descrição é obrigatória', 'warning');
      return;
    }

    if (form.amount <= 0) {
      showAlert('Atenção', 'O valor deve ser maior que zero', 'warning');
      return;
    }

    if (form.frequency_months <= 0) {
      showAlert('Atenção', isObjective ? 'O tempo para alcançar deve ser de pelo menos 1 mês' : 'A frequência deve ser de pelo menos 1 mês', 'warning');
      return;
    }

    try {
      if (editingExpense) {
        await updateNonRecurringExpense(editingExpense.id, {
          description: form.description,
          amount: form.amount,
          frequency_months: form.frequency_months,
          in_budget: form.in_budget,
          identification_date: form.identification_date || null,
          budget_entry_date: form.in_budget ? (form.budget_entry_date || new Date().toISOString().split('T')[0]) : null,
          observation: form.observation || null,
          is_recurrent: isObjective ? false : form.is_recurrent,
          finished_at: editingExpense.status === 'finished' ? (form.finished_at || new Date().toISOString().split('T')[0]) : null
        });
        setIsAddModalOpen(false);
        setEditingExpense(null);
        showAlert('Sucesso', `${labelCap} atualizado com sucesso`, 'success');
      } else {
        await addNonRecurringExpense({
          space: activeSpace,
          description: form.description,
          amount: form.amount,
          frequency_months: form.frequency_months,
          in_budget: form.in_budget,
          identification_date: form.identification_date || null,
          budget_entry_date: form.in_budget ? (form.budget_entry_date || new Date().toISOString().split('T')[0]) : null,
          observation: form.observation || null,
          is_recurrent: isObjective ? false : form.is_recurrent,
          finished_at: null,
          category: category
        });
        setIsAddModalOpen(false);
        showAlert('Sucesso', `${labelCap} adicionado com sucesso`, 'success');
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      showAlert('Erro', `Não foi possível salvar o ${labelLow}`, 'danger');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNonRecurringExpense(id);
      setConfirmDelete(null);
      showAlert('Sucesso', `${labelCap} removido com sucesso`, 'success');
    } catch (error) {
      showAlert('Erro', `Não foi possível excluir o ${labelLow}`, 'danger');
    }
  };

  const handleToggleBudgetStatus = async (expense: NonRecurringExpense, entryDateStr?: string | null) => {
    try {
      const isEntering = !expense.in_budget;
      await updateNonRecurringExpense(expense.id, {
        description: expense.description,
        amount: expense.amount,
        frequency_months: expense.frequency_months,
        in_budget: isEntering,
        identification_date: expense.identification_date,
        budget_entry_date: isEntering ? (entryDateStr || new Date().toISOString().split('T')[0]) : null,
        observation: expense.observation
      });
      setConfirmToggleBudget(null);
      showAlert('Sucesso', isEntering ? `${labelCap} movido para o orçamento` : `${labelCap} removido do orçamento`, 'success');
    } catch (error) {
      console.error('Error toggling expense budget status:', error);
      showAlert('Erro', `Não foi possível alterar o status do ${labelLow}`, 'danger');
    }
  };

  const handleFinishExpense = async (expense: NonRecurringExpense, dateStr: string) => {
    try {
      await updateNonRecurringExpense(expense.id, {
        status: 'finished',
        finished_at: dateStr
      });
      setConfirmFinish(null);
      showAlert('Sucesso', `${labelCap} finalizado com sucesso`, 'success');
    } catch (error) {
      console.error('Error finishing expense:', error);
      showAlert('Erro', `Não foi possível finalizar o ${labelLow}`, 'danger');
    }
  };

  const handleReactivateExpense = async (expense: NonRecurringExpense, toBudget: boolean) => {
    try {
      if (toBudget) {
        await updateNonRecurringExpense(expense.id, {
          status: 'active',
          finished_at: null,
          in_budget: true,
          budget_entry_date: expense.budget_entry_date || new Date().toISOString().split('T')[0]
        });
        showAlert('Sucesso', `${labelCap} reativado e retornado ao orçamento`, 'success');
      } else {
        await updateNonRecurringExpense(expense.id, {
          status: 'active',
          finished_at: null,
          in_budget: false,
          budget_entry_date: null
        });
        showAlert('Sucesso', `${labelCap} reativado fora do orçamento`, 'success');
      }
      setConfirmReactivate(null);
    } catch (error) {
      console.error('Error reactivating expense:', error);
      showAlert('Erro', `Não foi possível reativar o ${labelLow}`, 'danger');
    }
  };

  // Inicializa formulário de gestão ao selecionar o gasto
  React.useEffect(() => {
    if (viewingExpenseDetails) {
      const defaultVal = viewingExpenseDetails.amount / viewingExpenseDetails.frequency_months;
      setManageValueRaw(getDisplayAmount(defaultVal));
      
      const entryDate = viewingExpenseDetails.budget_entry_date ? new Date(viewingExpenseDetails.budget_entry_date + 'T12:00:00') : new Date();
      const entryMonthStr = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}`;
      
      setManageForm({
        month_year: selectedMonthStr >= entryMonthStr ? selectedMonthStr : entryMonthStr,
        skipped: false,
        observation: '',
        type: 'save'
      });
      setEditingHistoryItemId(null);
    }
  }, [viewingExpenseDetails, selectedMonthStr]);

  const manageAvailableMonths = useMemo(() => {
    if (!viewingExpenseDetails) return [];
    
    const startDateStr = viewingExpenseDetails.budget_entry_date || viewingExpenseDetails.identification_date || viewingExpenseDetails.created_at.substring(0, 10);
    const startDate = new Date(startDateStr + 'T12:00:00');
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();
    
    const today = new Date();
    const endYear = today.getFullYear();
    const endMonth = today.getMonth();
    
    const options = [];
    let currYear = startYear;
    let currMonth = startMonth;
    
    while (currYear < endYear || (currYear === endYear && currMonth <= endMonth)) {
      const monthStr = String(currMonth + 1).padStart(2, '0');
      const key = `${currYear}-${monthStr}`;
      
      const dateObj = new Date(currYear, currMonth, 15);
      const label = dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      const capitalLabel = label.charAt(0).toUpperCase() + label.slice(1);
      
      options.push({ key, label: capitalLabel });
      
      currMonth++;
      if (currMonth > 11) {
        currMonth = 0;
        currYear++;
      }
    }
    
    return options.reverse();
  }, [viewingExpenseDetails]);

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingExpenseDetails) return;
    
    const valInCents = parseInt(manageValueRaw.replace(/\D/g, '') || '0');
    const rawVal = valInCents / 100;
    const savedValue = manageForm.skipped ? 0 : (manageForm.type === 'use' ? -Math.abs(rawVal) : Math.abs(rawVal));
    
    if (!manageForm.month_year) {
      showAlert('Atenção', 'Selecione o mês de referência', 'warning');
      return;
    }
    
    if (!manageForm.skipped && Math.abs(savedValue) <= 0) {
      showAlert('Atenção', 'Informe um valor maior que zero ou selecione "Pular este mês"', 'warning');
      return;
    }
    
    try {
      const history = viewingExpenseDetails.history || [];
      let updatedHistory;

      if (editingHistoryItemId) {
        updatedHistory = history.map(h => {
          if (h.id === editingHistoryItemId) {
            return {
              ...h,
              month_year: manageForm.month_year,
              value: savedValue,
              skipped: manageForm.skipped,
              observation: manageForm.observation.toUpperCase(),
              type: manageForm.type
            };
          }
          return h;
        });
        setEditingHistoryItemId(null);
      } else {
        const newUpdate = {
          id: crypto.randomUUID(),
          month_year: manageForm.month_year,
          value: savedValue,
          skipped: manageForm.skipped,
          observation: manageForm.observation.toUpperCase(),
          created_at: new Date().toISOString(),
          type: manageForm.type || 'save'
        };
        
        // Permitir múltiplos lançamentos de tipo diferente no mesmo mês para qualquer gasto ou objetivo
        updatedHistory = history.filter(h => !(h.month_year === manageForm.month_year && (h.type || 'save') === (newUpdate.type || 'save')));
        updatedHistory.push(newUpdate);
      }

      updatedHistory.sort((a, b) => b.month_year.localeCompare(a.month_year));
      
      await updateNonRecurringExpense(viewingExpenseDetails.id, {
        history: updatedHistory
      });
      
      setViewingExpenseDetails(prev => prev ? { ...prev, history: updatedHistory } : null);
      
      setManageForm(prev => ({
        ...prev,
        skipped: false,
        observation: '',
        type: 'save'
      }));
      const defaultVal = viewingExpenseDetails.amount / viewingExpenseDetails.frequency_months;
      setManageValueRaw(getDisplayAmount(defaultVal));
      
      showAlert('Sucesso', 'Atualização salva com sucesso', 'success');
    } catch (err) {
      console.error('Error saving history update:', err);
      showAlert('Erro', 'Não foi possível registrar a atualização', 'danger');
    }
  };

  const handleDeleteUpdate = async (updateId: string) => {
    if (!viewingExpenseDetails) return;
    
    try {
      const history = viewingExpenseDetails.history || [];
      const updatedHistory = history.filter(h => h.id !== updateId);
      
      await updateNonRecurringExpense(viewingExpenseDetails.id, {
        history: updatedHistory
      });
      
      setViewingExpenseDetails(prev => prev ? { ...prev, history: updatedHistory } : null);
      
      showAlert('Sucesso', 'Atualização excluída com sucesso', 'success');
    } catch (err) {
      console.error('Error deleting history update:', err);
      showAlert('Erro', 'Não foi possível excluir a atualização', 'danger');
    }
  };

  const { inBudgetExpenses, outBudgetExpenses, finishedExpenses } = useMemo(() => {
    const filteredBySearch = nonRecurringExpenses.filter(exp => {
      const expCategory = exp.category || 'expense';
      return expCategory === category && exp.description.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const grouped = filteredBySearch.reduce((acc, exp) => {
      // 1. Filtrar pela data de identificação (só exibe se identificação_date <= selectedMonth)
      const identDate = exp.identification_date ? new Date(exp.identification_date + 'T12:00:00') : null;
      const identMonth = identDate ? new Date(identDate.getFullYear(), identDate.getMonth(), 1) : null;
      if (identMonth && identMonth > selectedMonth) {
        return acc; // Gasto ainda não identificado no período do filtro
      }

      // 2. Verificar se está finalizado no período
      const finDate = exp.finished_at ? new Date(exp.finished_at + 'T12:00:00') : null;
      const finMonth = finDate ? new Date(finDate.getFullYear(), finDate.getMonth(), 1) : null;
      const isFinishedInSelectedMonth = exp.status === 'finished' && finMonth && finMonth <= selectedMonth;

      if (isFinishedInSelectedMonth) {
        acc.finishedExpenses.push(exp);
      } else {
        // Gasto está ativo no período. Vamos ver se está no orçamento no mês selecionado
        const entryDate = exp.budget_entry_date ? new Date(exp.budget_entry_date + 'T12:00:00') : null;
        const entryMonth = entryDate ? new Date(entryDate.getFullYear(), entryDate.getMonth(), 1) : null;
        const isInBudgetInMonth = exp.in_budget && entryMonth && entryMonth <= selectedMonth;

        if (isInBudgetInMonth) {
          acc.inBudgetExpenses.push(exp);
        } else {
          acc.outBudgetExpenses.push(exp);
        }
      }

      return acc;
    }, {
      inBudgetExpenses: [] as NonRecurringExpense[],
      outBudgetExpenses: [] as NonRecurringExpense[],
      finishedExpenses: [] as NonRecurringExpense[]
    });

    // Ordenar de forma cronológica crescente (da data mais antiga para a mais recente)
    grouped.inBudgetExpenses.sort((a, b) => {
      const dateA = a.budget_entry_date ? new Date(a.budget_entry_date + 'T12:00:00').getTime() : 0;
      const dateB = b.budget_entry_date ? new Date(b.budget_entry_date + 'T12:00:00').getTime() : 0;
      return dateA - dateB;
    });

    grouped.outBudgetExpenses.sort((a, b) => {
      const dateA = a.identification_date ? new Date(a.identification_date + 'T12:00:00').getTime() : 0;
      const dateB = b.identification_date ? new Date(b.identification_date + 'T12:00:00').getTime() : 0;
      return dateA - dateB;
    });

    grouped.finishedExpenses.sort((a, b) => {
      const dateA = a.finished_at ? new Date(a.finished_at + 'T12:00:00').getTime() : 0;
      const dateB = b.finished_at ? new Date(b.finished_at + 'T12:00:00').getTime() : 0;
      return dateA - dateB;
    });

    return grouped;
  }, [nonRecurringExpenses, searchQuery, selectedMonth, category]);

  const pendingUpdates = useMemo(() => {
    return inBudgetExpenses.filter(exp => {
      const history = exp.history || [];
      return !history.some(item => item.month_year === selectedMonthStr);
    });
  }, [inBudgetExpenses, selectedMonthStr]);

  const summary = useMemo(() => {
    const calc = (list: NonRecurringExpense[]) => ({
      cost: list.reduce((sum, exp) => sum + exp.amount, 0),
      monthly: list.reduce((sum, exp) => sum + (exp.amount / exp.frequency_months), 0),
      count: list.length,
      saved: list.reduce((sum, exp) => sum + (exp.history || []).reduce((hSum, item) => hSum + (item.skipped ? 0 : (item.value || 0)), 0), 0)
    });

    const inBudget = calc(inBudgetExpenses);
    const outBudget = calc(outBudgetExpenses);
    const finished = calc(finishedExpenses);

    return {
      inBudget,
      outBudget,
      finished,
      totalMonthly: inBudget.monthly + outBudget.monthly
    };
  }, [inBudgetExpenses, outBudgetExpenses, finishedExpenses]);

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              {isObjective ? <Target size={20} /> : <CalendarClock size={20} />}
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground">{labelPluralCap}</h1>
          </div>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em]">
            {isObjective ? 'Planeje seus objetivos de médio e longo prazo e saiba quanto poupar' : 'Planeje suas despesas periódicas e saiba quanto poupar'}
          </p>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <div className="flex items-center bg-card border border-border rounded-2xl p-1 shadow-sm">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="w-10 h-10 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="px-4 text-[10px] font-black uppercase tracking-widest text-foreground min-w-[140px] text-center">
              {formattedSelectedMonth}
            </div>
            <button
              type="button"
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
            Novo
          </button>
        </div>
      </div>

      {pendingUpdates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-5 rounded-3xl flex items-start gap-4 text-left shadow-sm animate-fadeIn"
        >
          <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-500 shrink-0">
            <AlertCircle size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-wider">Atualizações Pendentes no Orçamento</h4>
            <p className="text-[10px] font-semibold leading-relaxed uppercase tracking-wider text-muted-foreground">
              Você possui {pendingUpdates.length} {pendingUpdates.length === 1 ? labelLow : labelPluralLow} no orçamento de <span className="font-black text-foreground">{formattedSelectedMonth}</span> que ainda não {pendingUpdates.length === 1 ? 'foi atualizado' : 'foram atualizados'} (valor guardado ou mês pulado). Clique no nome do {labelLow} na tabela abaixo para gerenciar.
            </p>
          </div>
        </motion.div>
      )}

      {nonRecurringExpenses.filter(e => (e.category || 'expense') === category).length === 0 && !contextLoading ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-dashed border-border rounded-[3rem] p-20 flex flex-col items-center text-center gap-6 shadow-2xl shadow-slate-200/20 dark:shadow-none"
        >
          <div className="w-32 h-32 rounded-[3rem] bg-amber-500/5 flex items-center justify-center text-amber-500/30 relative">
            <div className="absolute inset-0 bg-amber-500/10 rounded-[3rem] animate-pulse" />
            {isObjective ? <Target size={64} className="relative z-10" /> : <CalendarClock size={64} className="relative z-10" />}
          </div>
          <div className="space-y-3 max-w-md">
            <h3 className="text-2xl font-black uppercase tracking-tighter text-foreground">Sem {labelPluralLow} periódicos</h3>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              {isObjective
                ? 'Você ainda não cadastrou nenhum objetivo de médio ou longo prazo (como viagens, estudos ou compras planejadas). Cadastre-os para saber exatamente quanto precisa reservar por mês.'
                : 'Você ainda não cadastrou nenhum gasto eventual (como IPVA, seguros anuais ou viagens). Cadastre-os para saber exatamente quanto precisa reservar por mês.'}
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="h-16 px-10 rounded-2xl bg-primary text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:scale-[1.05] active:scale-95 transition-all shadow-2xl shadow-primary/30 mt-4"
          >
            <Plus size={24} />
            Cadastrar meu primeiro {labelCap}
          </button>
        </motion.div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {/* Card 1: No Orçamento */}
            <div className="relative group overflow-hidden bg-card border border-border rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col justify-between h-full min-h-[130px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:scale-110" />
              <div className="relative flex items-start justify-between gap-2 w-full">
                <p className="text-[9px] font-black uppercase tracking-[0.05em] text-primary leading-tight mt-1">No Orçamento (Mensal)</p>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner shrink-0">
                  <PiggyBank size={18} />
                </div>
              </div>
              <div className="relative mt-4 w-full">
                <h2 className="text-xl lg:text-2xl font-black tracking-tighter text-foreground break-all" title={formatCurrency(summary.inBudget.monthly)}>
                  {formatCurrency(summary.inBudget.monthly)}
                </h2>
                <p className="text-[8px] font-bold text-muted-foreground mt-1 uppercase tracking-widest leading-normal">{summary.inBudget.count} itens planejados</p>
              </div>
            </div>

            {/* Card 2: Guardado no Orçamento */}
            <div className="relative group overflow-hidden bg-card border border-border rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col justify-between h-full min-h-[130px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:scale-110" />
              <div className="relative flex items-start justify-between gap-2 w-full">
                <p className="text-[9px] font-black uppercase tracking-[0.05em] text-emerald-500 leading-tight mt-1">Guardado no Orçamento</p>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner shrink-0">
                  <PiggyBank size={18} />
                </div>
              </div>
              <div className="relative mt-4 w-full">
                <h2 className="text-xl lg:text-2xl font-black tracking-tighter text-foreground break-all" title={formatCurrency(summary.inBudget.saved)}>
                  {formatCurrency(summary.inBudget.saved)}
                </h2>
                <p className="text-[8px] font-bold text-muted-foreground mt-1 uppercase tracking-widest leading-normal">Acumulado líquido ativo</p>
              </div>
            </div>

            {/* Card 3: Fora do Orçamento */}
            <div className="relative group overflow-hidden bg-card border border-border rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col justify-between h-full min-h-[130px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:scale-110" />
              <div className="relative flex items-start justify-between gap-2 w-full">
                <p className="text-[9px] font-black uppercase tracking-[0.05em] text-amber-500 leading-tight mt-1">Fora do Orçamento (Mensal)</p>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner shrink-0">
                  <AlertCircle size={18} />
                </div>
              </div>
              <div className="relative mt-4 w-full">
                <h2 className="text-xl lg:text-2xl font-black tracking-tighter text-foreground break-all" title={formatCurrency(summary.outBudget.monthly)}>
                  {formatCurrency(summary.outBudget.monthly)}
                </h2>
                <p className="text-[8px] font-bold text-muted-foreground mt-1 uppercase tracking-widest leading-normal">{summary.outBudget.count} itens aguardando</p>
              </div>
            </div>

            {/* Card 4: Guardado Finalizados */}
            <div className="relative group overflow-hidden bg-card border border-border rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col justify-between h-full min-h-[130px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:scale-110" />
              <div className="relative flex items-start justify-between gap-2 w-full">
                <p className="text-[9px] font-black uppercase tracking-[0.05em] text-rose-500 leading-tight mt-1">Guardado Finalizados</p>
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-inner shrink-0">
                  <Trophy size={18} />
                </div>
              </div>
              <div className="relative mt-4 w-full">
                <h2 className="text-xl lg:text-2xl font-black tracking-tighter text-foreground break-all" title={formatCurrency(summary.finished.saved)}>
                  {formatCurrency(summary.finished.saved)}
                </h2>
                <p className="text-[8px] font-bold text-muted-foreground mt-1 uppercase tracking-widest leading-normal">{summary.finished.count} itens concluídos</p>
              </div>
            </div>

            {/* Card 5: Reserva Mensal Total */}
            <div className="relative group overflow-hidden bg-card border border-border rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col justify-between h-full min-h-[130px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:scale-110" />
              <div className="relative flex items-start justify-between gap-2 w-full">
                <p className="text-[9px] font-black uppercase tracking-[0.05em] text-blue-500 leading-tight mt-1">Reserva Mensal Total</p>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner shrink-0">
                  <DollarSign size={18} />
                </div>
              </div>
              <div className="relative mt-4 w-full">
                <h2 className="text-xl lg:text-2xl font-black tracking-tighter text-foreground break-all" title={formatCurrency(summary.totalMonthly)}>
                  {formatCurrency(summary.totalMonthly)}
                </h2>
                <p className="text-[8px] font-bold text-muted-foreground mt-1 uppercase tracking-widest leading-normal">Soma de todos os ciclos</p>
              </div>
            </div>
          </div>

          {/* Tables Section */}
          <div className="space-y-12">
            {/* Table: No Orçamento */}
            <div className="bg-card border border-border rounded-[3rem] overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-none">
              <div className="p-8 border-b border-border bg-emerald-500/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="text-lg font-black uppercase tracking-tighter text-foreground">No Orçamento</h3>
                  </div>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{labelPluralCap} que você já está poupando mensalmente</p>
                </div>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input
                    type="text"
                    placeholder="BUSCAR..."
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
                      <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Identificação</th>
                      <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descrição</th>
                      <th className="text-center px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{isObjective ? 'Tempo para Alcançar' : 'Frequência'}</th>
                      <th className="text-right px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Valor Total</th>
                      <th className="text-right px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reserva Mensal</th>
                      <th className="text-right px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inBudgetExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-8 py-12 text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nenhum {labelLow} planejado no orçamento.</p>
                        </td>
                      </tr>
                    ) : (
                      inBudgetExpenses.map(expense => (
                        <tr key={expense.id} className="group border-b border-border last:border-none hover:bg-muted/30 transition-all">
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase tracking-tight text-primary">
                                {expense.identification_date ? new Date(expense.identification_date + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                              </span>
                              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Entrou: {expense.budget_entry_date ? new Date(expense.budget_entry_date + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span 
                                  onClick={() => setViewingExpenseDetails(expense)}
                                  className="text-sm font-black uppercase tracking-tight group-hover:text-primary transition-colors cursor-pointer hover:underline"
                                >
                                  {expense.description}
                                </span>
                                {(() => {
                                  const hasUpdateThisMonth = (expense.history || []).some(item => item.month_year === selectedMonthStr);
                                  if (hasUpdateThisMonth) {
                                    return (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[7px] font-black uppercase tracking-wider">
                                        <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                                        Atualizado
                                      </span>
                                    );
                                  }
                                  return (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[7px] font-black uppercase tracking-wider animate-pulse">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                                      Pendente
                                    </span>
                                  );
                                })()}
                              </div>
                              {expense.observation && (
                                <span className="text-[10px] font-medium text-muted-foreground italic mt-1">
                                  {expense.observation}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest">
                                {isObjective ? `Em ${expense.frequency_months} meses` : `A cada ${expense.frequency_months} meses`}
                              </div>
                              {expense.is_recurrent && (
                                <span className="inline-flex items-center gap-1 text-[8px] font-black text-blue-500 uppercase tracking-widest mt-1">
                                  <RefreshCw size={8} /> Recorrente
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex flex-col items-end">
                              <span className="text-sm font-bold text-muted-foreground">
                                {formatCurrency(expense.amount)}
                              </span>
                              {(() => {
                                const saved = (expense.history || []).reduce((sum, item) => sum + (item.skipped ? 0 : (item.value || 0)), 0);
                                return (
                                  <span className="text-[9px] font-bold text-primary mt-1 whitespace-nowrap">
                                    Guardado: {formatCurrency(saved)}
                                  </span>
                                );
                              })()}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              <TrendingUp size={14} />
                              <span className="text-sm font-black">
                                {formatCurrency(expense.amount / expense.frequency_months)}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setFinishDate(new Date().toISOString().split('T')[0]);
                                  setConfirmFinish(expense);
                                }}
                                className="w-10 h-10 rounded-xl bg-emerald-500/5 text-emerald-500 border border-emerald-500/10 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                title="Finalizar Gasto"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => setConfirmToggleBudget(expense)}
                                className="w-10 h-10 rounded-xl bg-amber-500/5 text-amber-500 border border-amber-500/10 flex items-center justify-center hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                                title="Remover do Orçamento"
                              >
                                <RotateCcw size={16} />
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(expense)}
                                className="w-10 h-10 rounded-xl bg-primary/5 text-primary border border-primary/10 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => setConfirmDelete(expense)}
                                className="w-10 h-10 rounded-xl bg-rose-500/5 text-rose-500 border border-rose-500/10 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table: Fora do Orçamento */}
            <div className="bg-card border border-border rounded-[3rem] overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-none">
              <div className="p-8 border-b border-border bg-amber-500/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <h3 className="text-lg font-black uppercase tracking-tighter text-foreground">Fora do Orçamento</h3>
                  </div>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{labelPluralCap} futuros ou ainda não provisionados</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/10">
                      <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Identificação</th>
                      <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descrição</th>
                      <th className="text-center px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{isObjective ? 'Tempo para Alcançar' : 'Frequência'}</th>
                      <th className="text-right px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Valor Total</th>
                      <th className="text-right px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reserva Mensal</th>
                      <th className="text-right px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outBudgetExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-8 py-12 text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nenhum {labelLow} fora do orçamento.</p>
                        </td>
                      </tr>
                    ) : (
                      outBudgetExpenses.map(expense => (
                        <tr key={expense.id} className="group border-b border-border last:border-none hover:bg-muted/30 transition-all">
                          <td className="px-8 py-6">
                            <span className="text-[10px] font-black uppercase tracking-tight text-muted-foreground">
                              {expense.identification_date ? new Date(expense.identification_date + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <span 
                                onClick={() => setViewingExpenseDetails(expense)}
                                className="text-sm font-black uppercase tracking-tight group-hover:text-amber-500 transition-colors text-muted-foreground cursor-pointer hover:underline"
                              >
                                {expense.description}
                              </span>
                              {expense.observation && (
                                <span className="text-[10px] font-medium text-muted-foreground italic mt-1">
                                  {expense.observation}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                                {isObjective ? `Em ${expense.frequency_months} meses` : `A cada ${expense.frequency_months} meses`}
                              </div>
                              {expense.is_recurrent && (
                                <span className="inline-flex items-center gap-1 text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                                  <RefreshCw size={8} /> Recorrente
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex flex-col items-end">
                              <span className="text-sm font-bold text-muted-foreground/60">
                                {formatCurrency(expense.amount)}
                              </span>
                              {(() => {
                                const saved = (expense.history || []).reduce((sum, item) => sum + (item.skipped ? 0 : (item.value || 0)), 0);
                                if (saved > 0) {
                                  return (
                                    <span className="text-[9px] font-bold text-primary mt-1 whitespace-nowrap">
                                      Guardado: {formatCurrency(saved)}
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/5 text-amber-500/60 border border-amber-500/10">
                              <span className="text-sm font-black">
                                {formatCurrency(expense.amount / expense.frequency_months)}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setBudgetEntryDateInput(new Date().toISOString().split('T')[0]);
                                  setConfirmToggleBudget(expense);
                                }}
                                className="w-10 h-10 rounded-xl bg-blue-500/5 text-blue-500 border border-blue-500/10 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                                title="Mover para o Orçamento"
                              >
                                <ArrowUpRight size={16} />
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(expense)}
                                className="w-10 h-10 rounded-xl bg-primary/5 text-primary border border-primary/10 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => setConfirmDelete(expense)}
                                className="w-10 h-10 rounded-xl bg-rose-500/5 text-rose-500 border border-rose-500/10 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table: Finalizados */}
            <div className="bg-card border border-border rounded-[3rem] overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-none">
              <div className="p-8 border-b border-border bg-slate-500/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-slate-500" />
                    <h3 className="text-lg font-black uppercase tracking-tighter text-foreground">{isObjective ? 'Objetivos Concluídos' : 'Gastos Finalizados'}</h3>
                  </div>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Histórico de {labelPluralLow} concluídos</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/10">
                      <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ciclo</th>
                      <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descrição</th>
                      <th className="text-center px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{isObjective ? 'Tempo para Alcançar' : 'Frequência'}</th>
                      <th className="text-right px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Valor Total</th>
                      <th className="text-right px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                      <th className="text-right px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finishedExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-8 py-12 text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nenhum {labelLow} finalizado recentemente.</p>
                        </td>
                      </tr>
                    ) : (
                      finishedExpenses.map(expense => (
                        <tr key={expense.id} className="group border-b border-border last:border-none hover:bg-muted/30 transition-all">
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase tracking-tight text-muted-foreground">
                                Entrou: {expense.budget_entry_date ? new Date(expense.budget_entry_date + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                              </span>
                              <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">Finalizado: {expense.finished_at ? new Date(expense.finished_at + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <span 
                                onClick={() => setViewingExpenseDetails(expense)}
                                className="text-sm font-black uppercase tracking-tight text-muted-foreground/60 cursor-pointer hover:underline"
                              >
                                {expense.description}
                              </span>
                              {expense.observation && (
                                <span className="text-[10px] font-medium text-muted-foreground italic mt-1">
                                  {expense.observation}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                                {isObjective ? `Em ${expense.frequency_months} meses` : `A cada ${expense.frequency_months} meses`}
                              </div>
                              {expense.is_recurrent && (
                                <span className="inline-flex items-center gap-1 text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest mt-1">
                                  <RefreshCw size={8} /> Recorrente
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex flex-col items-end">
                              <span className="text-sm font-bold text-muted-foreground/40 line-through">
                                {formatCurrency(expense.amount)}
                              </span>
                              {(() => {
                                const saved = (expense.history || []).reduce((sum, item) => sum + (item.skipped ? 0 : (item.value || 0)), 0);
                                if (saved > 0) {
                                  return (
                                    <span className="text-[9px] font-bold text-primary mt-1 whitespace-nowrap">
                                      Guardado: {formatCurrency(saved)}
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest">
                              Concluído
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setConfirmReactivate(expense)}
                                className="w-10 h-10 rounded-xl bg-blue-500/5 text-blue-500 border border-blue-500/10 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                                title="Reativar Gasto"
                              >
                                <RotateCcw size={16} />
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(expense)}
                                className="w-10 h-10 rounded-xl bg-primary/5 text-primary border border-primary/10 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"
                                title="Editar Gasto"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => setConfirmDelete(expense)}
                                className="w-10 h-10 rounded-xl bg-rose-500/5 text-rose-500 border border-rose-500/10 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                title="Excluir Gasto"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
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
              className="relative w-full max-w-lg bg-card border border-border rounded-[3rem] p-8 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6 shrink-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Plus className="text-primary" size={20} />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                      {editingExpense ? 'Editar Registro' : 'Novo Registro'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">
                    {editingExpense ? `Editar ${labelCap}` : `Cadastrar ${labelCap}`}
                  </h2>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-rose-500 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Identificado em</label>
                    <input
                      type="date"
                      required
                      value={form.identification_date || ''}
                      onChange={e => setForm(prev => ({ ...prev, identification_date: e.target.value }))}
                      className="w-full h-14 bg-muted border-none rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 text-primary">Descrição do {labelCap}</label>
                    <input
                      type="text"
                      required
                      placeholder={isObjective ? "EX: VIAGEM, NOTEBOOK, CARRO..." : "EX: IPVA, SEGURO, VIAGEM..."}
                      value={form.description}
                      onChange={e => setForm(prev => ({ ...prev, description: e.target.value.toUpperCase() }))}
                      className="w-full h-14 bg-muted border-none rounded-2xl px-6 text-sm font-bold uppercase tracking-widest focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Valor Total</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground">R$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        value={getDisplayAmount(form.amount)}
                        onChange={handleAmountChange}
                        className="w-full h-14 bg-muted border-none rounded-2xl pl-12 pr-6 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{isObjective ? 'Tempo para alcançar (Meses)' : 'Frequência (Meses)'}</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={form.frequency_months || ''}
                      onChange={e => setForm(prev => ({ ...prev, frequency_months: Number(e.target.value) }))}
                      className="w-full h-14 bg-muted border-none rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Observações (Opcional)</label>
                  <textarea
                    placeholder={`DETALHES DO ${isObjective ? 'OBJETIVO' : 'GASTO'}...`}
                    value={form.observation}
                    onChange={e => setForm(prev => ({ ...prev, observation: e.target.value.toUpperCase() }))}
                    className="w-full h-24 bg-muted border-none rounded-2xl p-6 text-sm font-bold uppercase tracking-widest focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>

                <div className="p-6 rounded-[2rem] bg-muted/30 border border-border space-y-4">
                  {/* Recorrência */}
                  {!isObjective && (
                    <div className="flex items-center justify-between border-b border-border/50 pb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-inner",
                          form.is_recurrent ? "bg-blue-500/10 text-blue-500" : "bg-slate-500/10 text-slate-500"
                        )}>
                          {isObjective ? <Target size={20} /> : <CalendarClock size={20} />}
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-foreground">{labelCap} Recorrente?</p>
                          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Define se o {labelLow} é contínuo e permite lançamentos de uso</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, is_recurrent: !prev.is_recurrent }))}
                        className={cn(
                          "w-11 h-6 rounded-full transition-colors relative flex items-center px-1 shadow-inner cursor-pointer",
                          form.is_recurrent ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-700"
                        )}
                      >
                        <div
                          className={cn(
                            "w-4 h-4 rounded-full bg-white shadow-lg transition-transform duration-200",
                            form.is_recurrent ? "translate-x-5" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-inner",
                        form.in_budget ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                      )}>
                        {form.in_budget ? <PiggyBank size={20} /> : <AlertCircle size={20} />}
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Incluir no Orçamento?</p>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Define se o valor será somado à reserva mensal</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm(prev => {
                        const nextInBudget = !prev.in_budget;
                        return {
                          ...prev,
                          in_budget: nextInBudget,
                          budget_entry_date: nextInBudget ? (prev.budget_entry_date || new Date().toISOString().split('T')[0]) : ''
                        };
                      })}
                      className={cn(
                        "w-11 h-6 rounded-full transition-colors relative flex items-center px-1 shadow-inner cursor-pointer",
                        form.in_budget ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                      )}
                    >
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full bg-white shadow-lg transition-transform duration-200",
                          form.in_budget ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>

                  {form.in_budget && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-2 pt-4 border-t border-border"
                    >
                      <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 ml-1">Entrou no Orçamento em</label>
                      <input
                        type="date"
                        required
                        value={form.budget_entry_date || ''}
                        onChange={e => setForm(prev => ({ ...prev, budget_entry_date: e.target.value }))}
                        className="w-full h-14 bg-muted border-none rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                      />
                    </motion.div>
                  )}

                  {editingExpense?.status === 'finished' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-2 pt-4 border-t border-border"
                    >
                      <label className="text-[10px] font-black uppercase tracking-widest text-rose-500 dark:text-rose-400 ml-1">Finalizado em</label>
                      <input
                        type="date"
                        required
                        value={form.finished_at || ''}
                        onChange={e => setForm(prev => ({ ...prev, finished_at: e.target.value }))}
                        className="w-full h-14 bg-muted border-none rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-rose-500/20"
                      />
                    </motion.div>
                  )}

                  {form.amount > 0 && form.frequency_months > 0 && (
                    <div className="pt-4 border-t border-border flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Reserva Mensal Estimada</p>
                          <p className={cn(
                            "text-xl font-black tracking-tighter",
                            form.in_budget ? "text-emerald-500" : "text-amber-500"
                          )}>
                            {formatCurrency(form.amount / form.frequency_months)}
                          </p>
                        </div>
                      </div>
                      <Info size={16} className="text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                <div className="px-3 pb-3 pt-1 shrink-0 w-full">
                  <button
                    type="submit"
                    className="w-full h-16 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    {editingExpense ? 'Salvar Alterações' : 'Confirmar Cadastro'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Gestão do Gasto Eventual */}
      <AnimatePresence>
        {viewingExpenseDetails && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
              onClick={() => setViewingExpenseDetails(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-card border border-border rounded-[3rem] p-8 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6 shrink-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <History className="text-primary" size={20} />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                      Gestão de {labelCap}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground break-words max-w-[420px]">
                    {viewingExpenseDetails.description}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      handleOpenEditModal(viewingExpenseDetails);
                      setViewingExpenseDetails(null);
                    }}
                    className="h-10 px-4 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
                    title={`Editar ${labelCap}`}
                  >
                    <Edit2 size={14} /> Editar
                  </button>
                  <button
                    onClick={() => setViewingExpenseDetails(null)}
                    className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-rose-500 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-6">
                {/* Informações Gerais */}
                <div className={cn(
                  "grid gap-4 p-5 rounded-[2rem] bg-muted/30 border border-border/60 text-left",
                  viewingExpenseDetails.status === 'finished' ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"
                )}>
                  <div className="space-y-1">
                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Identificado em</span>
                    <p className="text-xs font-bold text-foreground">
                      {viewingExpenseDetails.identification_date ? new Date(viewingExpenseDetails.identification_date + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Entrou no Orçamento</span>
                    <p className="text-xs font-bold text-foreground">
                      {viewingExpenseDetails.budget_entry_date ? new Date(viewingExpenseDetails.budget_entry_date + 'T12:00:00').toLocaleDateString('pt-BR') : 'Não incluído'}
                    </p>
                  </div>
                  {viewingExpenseDetails.status === 'finished' && (
                    <div className="space-y-1">
                      <span className="text-[8px] font-black uppercase tracking-widest text-rose-500">Finalizado em</span>
                      <p className="text-xs font-bold text-foreground">
                        {viewingExpenseDetails.finished_at ? new Date(viewingExpenseDetails.finished_at + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                      </p>
                    </div>
                  )}
                  <div className={cn(
                    "space-y-1 pt-2 border-t border-border/40",
                    viewingExpenseDetails.status === 'finished' ? "md:col-span-3" : "md:col-span-2"
                  )}>
                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Observações Gerais</span>
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wider leading-relaxed">
                      {viewingExpenseDetails.observation || 'Nenhuma observação registrada.'}
                    </p>
                  </div>
                </div>

                {/* Formulário de Lançamento */}
                {viewingExpenseDetails.in_budget && viewingExpenseDetails.status !== 'finished' && (
                  <form onSubmit={handleSaveUpdate} className="p-6 rounded-[2rem] border border-primary/20 bg-primary/5 space-y-4 text-left">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                      <Plus size={14} /> {editingHistoryItemId ? 'Editar Acompanhamento Mensal' : 'Registrar Acompanhamento Mensal'}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Seleção do Mês */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Mês de Referência</label>
                        <select
                          required
                          value={manageForm.month_year}
                          onChange={e => setManageForm(prev => ({ ...prev, month_year: e.target.value }))}
                          className="w-full h-11 bg-card border border-border rounded-xl px-4 text-xs font-bold text-foreground outline-none focus:border-primary transition-all cursor-pointer"
                        >
                          <option value="" disabled>Selecione...</option>
                          {manageAvailableMonths.map(m => (
                            <option key={m.key} value={m.key}>{m.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Input de Valor */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                            {manageForm.type === 'use' ? 'Valor Utilizado' : 'Valor Guardado'}
                          </label>
                          {manageForm.type !== 'use' && (
                            <button
                              type="button"
                              onClick={() => {
                                const nextSkipped = !manageForm.skipped;
                                setManageForm(prev => ({ ...prev, skipped: nextSkipped }));
                                if (nextSkipped) {
                                  setManageValueRaw(getDisplayAmount(0));
                                } else {
                                  const defaultVal = viewingExpenseDetails.amount / viewingExpenseDetails.frequency_months;
                                  setManageValueRaw(getDisplayAmount(defaultVal));
                                }
                              }}
                              className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all text-[8px] font-black uppercase tracking-wider select-none cursor-pointer",
                                manageForm.skipped
                                  ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                                  : "bg-muted border-border text-muted-foreground hover:bg-muted/80"
                              )}
                            >
                              <span className={cn(
                                "w-1.5 h-1.5 rounded-full transition-all",
                                manageForm.skipped ? "bg-amber-500 animate-pulse" : "bg-muted-foreground/50"
                              )} />
                              Pular Mês
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-muted-foreground">R$</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            required
                            disabled={manageForm.skipped}
                            value={manageValueRaw}
                            onChange={e => {
                              const rawValue = e.target.value;
                              const digits = rawValue.replace(/\D/g, '');
                              const amountInCents = parseInt(digits || '0');
                              setManageValueRaw(getDisplayAmount(amountInCents / 100));
                            }}
                            className="w-full h-11 bg-card border border-border rounded-xl pl-10 pr-4 text-xs font-bold text-foreground outline-none focus:border-primary transition-all disabled:opacity-50 disabled:bg-muted"
                          />
                        </div>
                        {manageForm.type === 'use' && (parseInt(manageValueRaw.replace(/\D/g, '') || '0') <= 0) && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-[9px] font-black text-rose-500 uppercase tracking-wider pl-1 mt-1.5"
                          >
                            ⚠️ Insira o valor que deseja utilizar / gastar (mínimo R$ 0,01)
                          </motion.p>
                        )}
                      </div>

                      {/* Seletor de Tipo */}
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tipo de Lançamento</label>
                        <div className="grid grid-cols-2 gap-2 bg-card border border-border p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => {
                              setManageForm(prev => ({ ...prev, type: 'save' }));
                              if (!manageForm.skipped) {
                                const defaultVal = viewingExpenseDetails.amount / viewingExpenseDetails.frequency_months;
                                setManageValueRaw(getDisplayAmount(defaultVal));
                              }
                            }}
                            className={cn(
                              "h-9 rounded-lg text-[9px] font-black tracking-widest uppercase transition-all flex items-center justify-center gap-1.5",
                              manageForm.type === 'save'
                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                : "text-muted-foreground hover:text-foreground border border-transparent"
                            )}
                          >
                            <PiggyBank size={14} /> Guardar Valor
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setManageForm(prev => ({ ...prev, type: 'use', skipped: false }));
                              setManageValueRaw(getDisplayAmount(0));
                            }}
                            className={cn(
                              "h-9 rounded-lg text-[9px] font-black tracking-widest uppercase transition-all flex items-center justify-center gap-1.5",
                              manageForm.type === 'use'
                                ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                : "text-muted-foreground hover:text-foreground border border-transparent"
                            )}
                          >
                            <TrendingUp className="rotate-180" size={14} /> Utilizar / Gastar
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Observações da Atualização (Opcional)</label>
                      <input
                        type="text"
                        placeholder="EX: GUARDADO NO COFRINHO..."
                        value={manageForm.observation}
                        onChange={e => setManageForm(prev => ({ ...prev, observation: e.target.value.toUpperCase() }))}
                        className="w-full h-11 bg-card border border-border rounded-xl px-4 text-xs font-bold uppercase tracking-wider text-foreground outline-none focus:border-primary transition-all"
                      />
                    </div>

                    <div className="flex gap-3 mt-2">
                      {editingHistoryItemId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingHistoryItemId(null);
                            setManageForm({
                              month_year: selectedMonthStr,
                              skipped: false,
                              observation: ''
                            });
                            const defaultVal = viewingExpenseDetails.amount / viewingExpenseDetails.frequency_months;
                            setManageValueRaw(getDisplayAmount(defaultVal));
                          }}
                          className="w-1/3 h-12 bg-muted text-muted-foreground border border-border rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-muted/80 active:scale-95 transition-all"
                        >
                          Cancelar
                        </button>
                      )}
                      <button
                        type="submit"
                        className={cn(
                          "h-12 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2",
                          editingHistoryItemId ? "w-2/3" : "w-full"
                        )}
                      >
                        <Check size={14} /> {editingHistoryItemId ? 'Salvar Alterações' : 'Salvar Atualização'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Histórico de Lançamentos */}
                <div className="space-y-4 text-left">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 pl-1">
                    <History size={14} /> Histórico de Atualizações
                  </h3>
                  
                  {(!viewingExpenseDetails.history || viewingExpenseDetails.history.length === 0) ? (
                    <div className="p-8 text-center border border-dashed border-border rounded-[2rem] bg-muted/10">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">Nenhuma atualização registrada para este gasto.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 no-scrollbar pl-2">
                      {viewingExpenseDetails.history.map(item => {
                        let monthLabel = item.month_year;
                        try {
                          const [year, month] = item.month_year.split('-');
                          const date = new Date(parseInt(year), parseInt(month) - 1, 15);
                          const rawLabel = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                          monthLabel = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
                        } catch (e) {}

                        return (
                          <div key={item.id} className="relative pl-6 pb-6 last:pb-0">
                            {/* Timeline Line */}
                            <div className="absolute left-0 top-2 bottom-0 w-px bg-border" />
                            {/* Timeline Dot */}
                            <div className="absolute left-[-4px] top-2 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.5)]" />

                            <div className={cn(
                              "bg-card border border-border rounded-2xl p-4 hover:shadow-md transition-all group flex flex-col gap-2",
                              editingHistoryItemId === item.id && "border-primary bg-primary/5"
                            )}>
                              <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                                  {monthLabel}
                                </p>
                                <div className="flex items-center gap-3">
                                  {item.type === 'use' ? (
                                    <span className="inline-flex items-center gap-1 text-[8px] font-black bg-rose-500/15 text-rose-500 border border-rose-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                      <TrendingUp className="rotate-180" size={8} /> Utilizou {formatCurrency(Math.abs(item.value))}
                                    </span>
                                  ) : item.skipped ? (
                                    <span className="inline-flex items-center gap-1 text-[8px] font-black bg-amber-500/15 text-amber-500 border border-amber-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                      <SkipForward size={8} /> Pulado
                                    </span>
                                  ) : (
                                    <span className="text-[8px] font-black bg-emerald-500/15 text-emerald-500 border border-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                      Guardou {formatCurrency(item.value)}
                                    </span>
                                  )}
                                  {viewingExpenseDetails.status !== 'finished' && (
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingHistoryItemId(item.id);
                                          setManageForm({
                                            month_year: item.month_year,
                                            skipped: item.skipped,
                                            observation: item.observation || '',
                                            type: item.type || 'save'
                                          });
                                          setManageValueRaw(getDisplayAmount(Math.abs(item.value)));
                                        }}
                                        className="p-1.5 rounded-lg bg-muted border border-border text-muted-foreground hover:text-primary transition-all shadow-sm"
                                        title="Editar Atualização"
                                      >
                                        <Edit2 size={12} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          let label = '';
                                          if (item.type === 'use') {
                                            label = `Utilizou ${formatCurrency(Math.abs(item.value))}`;
                                          } else if (item.skipped) {
                                            label = 'Pulado';
                                          } else {
                                            label = `Guardou ${formatCurrency(item.value)}`;
                                          }
                                          setConfirmDeleteHistoryItem({
                                            id: item.id,
                                            monthYear: monthLabel,
                                            valueLabel: label
                                          });
                                        }}
                                        className="p-1.5 rounded-lg bg-muted border border-border text-muted-foreground hover:text-rose-500 transition-all shadow-sm"
                                        title="Excluir Atualização"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {item.observation && (
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                  Obs: {item.observation}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!confirmDelete}
        title={`Excluir ${labelCap}`}
        message={`Tem certeza que deseja excluir o planejamento de "${confirmDelete?.description}"? Esta ação não pode ser desfeita.`}
        confirmText="Sim, Excluir"
        validationKeyword={confirmDelete ? (confirmDelete.in_budget || confirmDelete.status === 'finished' ? "APAGAR" : undefined) : undefined}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete.id)}
        onClose={() => setConfirmDelete(null)}
        variant="danger"
      />

      <ConfirmModal
        isOpen={!!confirmDeleteHistoryItem}
        title="Excluir Atualização"
        message={`Tem certeza que deseja excluir a atualização de "${confirmDeleteHistoryItem?.monthYear}" (${confirmDeleteHistoryItem?.valueLabel})?`}
        confirmText="Sim, Excluir"
        onConfirm={() => {
          if (confirmDeleteHistoryItem) {
            handleDeleteUpdate(confirmDeleteHistoryItem.id);
            setConfirmDeleteHistoryItem(null);
          }
        }}
        onClose={() => setConfirmDeleteHistoryItem(null)}
        variant="danger"
      />

      <ConfirmModal
        isOpen={!!confirmToggleBudget && confirmToggleBudget.in_budget}
        title="Remover do Orçamento"
        message={`Deseja remover "${confirmToggleBudget?.description}" do seu orçamento mensal?`}
        confirmText="Sim, Remover"
        onConfirm={() => confirmToggleBudget && handleToggleBudgetStatus(confirmToggleBudget)}
        onClose={() => setConfirmToggleBudget(null)}
        variant="warning"
      />

      {/* Modal Customizado de Entrada no Orçamento */}
      <AnimatePresence>
        {confirmToggleBudget && !confirmToggleBudget.in_budget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
              onClick={() => setConfirmToggleBudget(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-card border border-border rounded-[3rem] p-8 shadow-2xl overflow-hidden flex flex-col gap-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <PiggyBank className="text-emerald-500" size={20} />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">
                      Incluir no Orçamento
                    </span>
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground max-w-[320px] truncate">
                    {confirmToggleBudget.description}
                  </h2>
                </div>
                <button
                  onClick={() => setConfirmToggleBudget(null)}
                  className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-rose-500 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed font-semibold uppercase tracking-wider pl-1">
                Confirme a data de entrada do gasto no orçamento mensal.
              </p>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 ml-1">Entrou no Orçamento em</label>
                <input
                  type="date"
                  required
                  value={budgetEntryDateInput}
                  onChange={e => setBudgetEntryDateInput(e.target.value)}
                  className="w-full h-14 bg-muted border-none rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setConfirmToggleBudget(null)}
                  className="w-1/3 h-12 bg-muted border border-border rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-muted/80 active:scale-95 transition-all text-muted-foreground"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleBudgetStatus(confirmToggleBudget, budgetEntryDateInput)}
                  className="w-2/3 h-12 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-600 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Customizado de Finalização */}
      <AnimatePresence>
        {confirmFinish && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
              onClick={() => setConfirmFinish(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-card border border-border rounded-[3rem] p-8 shadow-2xl overflow-hidden flex flex-col gap-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Check className="text-emerald-500" size={20} />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">
                      Finalizar {labelCap}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground max-w-[320px] truncate">
                    {confirmFinish.description}
                  </h2>
                </div>
                <button
                  onClick={() => setConfirmFinish(null)}
                  className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-rose-500 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed font-semibold uppercase tracking-wider pl-1">
                Confirme a data de finalização do {labelLow}. Ele será movido para o histórico e não será mais somado à reserva mensal.
              </p>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 ml-1">Data de Finalização</label>
                <input
                  type="date"
                  required
                  value={finishDate}
                  onChange={e => setFinishDate(e.target.value)}
                  className="w-full h-14 bg-muted border-none rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setConfirmFinish(null)}
                  className="w-1/3 h-12 bg-muted border border-border rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-muted/80 active:scale-95 transition-all text-muted-foreground"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleFinishExpense(confirmFinish, finishDate)}
                  className="w-2/3 h-12 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-600 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
                >
                  Sim, Finalizar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Customizado de Reativação */}
      <AnimatePresence>
        {confirmReactivate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
              onClick={() => setConfirmReactivate(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-card border border-border rounded-[3rem] p-8 shadow-2xl overflow-hidden flex flex-col gap-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="text-primary" size={20} />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                      Reativar {labelCap}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground max-w-[320px] truncate">
                    {confirmReactivate.description}
                  </h2>
                </div>
                <button
                  onClick={() => setConfirmReactivate(null)}
                  className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-rose-500 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed font-semibold uppercase tracking-wider pl-1">
                Escolha o destino deste {labelLow} ao reativá-lo no sistema:
              </p>

              <div className="grid grid-cols-1 gap-4">
                <button
                  type="button"
                  onClick={() => handleReactivateExpense(confirmReactivate, true)}
                  className="p-5 rounded-2xl bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/30 text-left transition-all group active:scale-98"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5 animate-pulse">
                      <Check size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Voltar ao Orçamento</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1 leading-relaxed">
                        Retorna o {labelLow} diretamente ao orçamento mensal.
                      </p>
                      {confirmReactivate.budget_entry_date && (
                        <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-2">
                          Data original de entrada: {new Date(confirmReactivate.budget_entry_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleReactivateExpense(confirmReactivate, false)}
                  className="p-5 rounded-2xl bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/30 text-left transition-all group active:scale-98"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
                      <AlertCircle size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">Fora do Orçamento</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1 leading-relaxed">
                        Retorna o {labelLow} como "Fora do Orçamento" para ser planejado depois.
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setConfirmReactivate(null)}
                className="w-full h-12 bg-muted border border-border rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-muted/80 active:scale-95 transition-all text-muted-foreground mt-2"
              >
                Voltar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
