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
  ChevronRight,
  Info,
  Check,
  RotateCcw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmModal } from './ui/ConfirmModal';
import { NonRecurringExpense } from '../types';

export const NonRecurringExpenses: React.FC = () => {
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

  // Modals de confirmação
  const [confirmDelete, setConfirmDelete] = useState<NonRecurringExpense | null>(null);
  const [confirmToggleBudget, setConfirmToggleBudget] = useState<NonRecurringExpense | null>(null);
  const [confirmFinish, setConfirmFinish] = useState<NonRecurringExpense | null>(null);
  const [confirmReactivate, setConfirmReactivate] = useState<NonRecurringExpense | null>(null);

  // Add/Edit Form State
  const [form, setForm] = useState({
    description: '',
    amount: 0,
    frequency_months: 12,
    in_budget: false,
    identification_date: new Date().toISOString().split('T')[0],
    budget_entry_date: '' as string | null,
    observation: ''
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
      observation: ''
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
      observation: expense.observation || ''
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
      showAlert('Atenção', 'A frequência deve ser de pelo menos 1 mês', 'warning');
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
          observation: form.observation || null
        });
        setIsAddModalOpen(false);
        setEditingExpense(null);
        showAlert('Sucesso', 'Gasto atualizado com sucesso', 'success');
      } else {
        await addNonRecurringExpense({
          space: activeSpace,
          description: form.description,
          amount: form.amount,
          frequency_months: form.frequency_months,
          in_budget: form.in_budget,
          identification_date: form.identification_date || null,
          budget_entry_date: form.in_budget ? (form.budget_entry_date || new Date().toISOString().split('T')[0]) : null,
          observation: form.observation || null
        });
        setIsAddModalOpen(false);
        showAlert('Sucesso', 'Gasto adicionado com sucesso', 'success');
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      showAlert('Erro', 'Não foi possível salvar o gasto', 'danger');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNonRecurringExpense(id);
      setConfirmDelete(null);
      showAlert('Sucesso', 'Gasto removido com sucesso', 'success');
    } catch (error) {
      showAlert('Erro', 'Não foi possível excluir o gasto', 'danger');
    }
  };

  const handleToggleBudgetStatus = async (expense: NonRecurringExpense) => {
    try {
      const isEntering = !expense.in_budget;
      await updateNonRecurringExpense(expense.id, {
        description: expense.description,
        amount: expense.amount,
        frequency_months: expense.frequency_months,
        in_budget: isEntering,
        identification_date: expense.identification_date,
        budget_entry_date: isEntering ? new Date().toISOString().split('T')[0] : null,
        observation: expense.observation
      });
      setConfirmToggleBudget(null);
      showAlert('Sucesso', isEntering ? 'Gasto movido para o orçamento' : 'Gasto removido do orçamento', 'success');
    } catch (error) {
      console.error('Error toggling expense budget status:', error);
      showAlert('Erro', 'Não foi possível alterar o status do gasto', 'danger');
    }
  };

  const handleFinishExpense = async (expense: NonRecurringExpense) => {
    try {
      await updateNonRecurringExpense(expense.id, {
        status: 'finished',
        finished_at: new Date().toISOString().split('T')[0]
      });
      setConfirmFinish(null);
      showAlert('Sucesso', 'Gasto finalizado com sucesso', 'success');
    } catch (error) {
      console.error('Error finishing expense:', error);
      showAlert('Erro', 'Não foi possível finalizar o gasto', 'danger');
    }
  };

  const handleReactivateExpense = async (expense: NonRecurringExpense) => {
    try {
      await updateNonRecurringExpense(expense.id, {
        status: 'active',
        finished_at: null,
        in_budget: false, // Reativa fora do orçamento para reavaliação
        budget_entry_date: null
      });
      setConfirmReactivate(null);
      showAlert('Sucesso', 'Gasto reativado com sucesso', 'success');
    } catch (error) {
      console.error('Error reactivating expense:', error);
      showAlert('Erro', 'Não foi possível reativar o gasto', 'danger');
    }
  };

  const { inBudgetExpenses, outBudgetExpenses, finishedExpenses } = useMemo(() => {
    const filtered = nonRecurringExpenses.filter(exp =>
      exp.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return {
      inBudgetExpenses: filtered.filter(e => e.in_budget && e.status !== 'finished'),
      outBudgetExpenses: filtered.filter(e => !e.in_budget && e.status !== 'finished'),
      finishedExpenses: filtered.filter(e => e.status === 'finished')
    };
  }, [nonRecurringExpenses, searchQuery]);

  const summary = useMemo(() => {
    const calc = (list: NonRecurringExpense[]) => ({
      cost: list.reduce((sum, exp) => sum + exp.amount, 0),
      monthly: list.reduce((sum, exp) => sum + (exp.amount / exp.frequency_months), 0),
      count: list.length
    });

    const inBudget = calc(inBudgetExpenses);
    const outBudget = calc(outBudgetExpenses);

    return {
      inBudget,
      outBudget,
      totalMonthly: inBudget.monthly + outBudget.monthly
    };
  }, [inBudgetExpenses, outBudgetExpenses]);

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <CalendarClock size={20} />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground">Gastos Não Recorrentes</h1>
          </div>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em]">Planeje suas despesas periódicas e saiba quanto poupar</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="h-12 px-6 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20"
        >
          <Plus size={18} />
          Novo
        </button>
      </div>

      {nonRecurringExpenses.length === 0 && !contextLoading ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-dashed border-border rounded-[3rem] p-20 flex flex-col items-center text-center gap-6 shadow-2xl shadow-slate-200/20 dark:shadow-none"
        >
          <div className="w-32 h-32 rounded-[3rem] bg-amber-500/5 flex items-center justify-center text-amber-500/30 relative">
            <div className="absolute inset-0 bg-amber-500/10 rounded-[3rem] animate-pulse" />
            <CalendarClock size={64} className="relative z-10" />
          </div>
          <div className="space-y-3 max-w-md">
            <h3 className="text-2xl font-black uppercase tracking-tighter text-foreground">Sem gastos periódicos</h3>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              Você ainda não cadastrou nenhum gasto não recorrente (como IPVA, seguros anuais ou viagens). Cadastre-os para saber exatamente quanto precisa reservar por mês.
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="h-16 px-10 rounded-2xl bg-primary text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:scale-[1.05] active:scale-95 transition-all shadow-2xl shadow-primary/30 mt-4"
          >
            <Plus size={24} />
            Cadastrar meu primeiro Gasto
          </button>
        </motion.div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="relative group overflow-hidden bg-card border border-border rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:scale-110" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">No Orçamento (Mensal)</p>
                  <h2 className="text-3xl font-black tracking-tighter text-foreground">
                    {formatCurrency(summary.inBudget.monthly)}
                  </h2>
                  <p className="text-[9px] font-bold text-muted-foreground mt-1 uppercase tracking-widest">{summary.inBudget.count} itens planejados</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                  <PiggyBank size={24} />
                </div>
              </div>
            </div>

            <div className="relative group overflow-hidden bg-card border border-border rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:scale-110" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 mb-2">Fora do Orçamento (Mensal)</p>
                  <h2 className="text-3xl font-black tracking-tighter text-foreground">
                    {formatCurrency(summary.outBudget.monthly)}
                  </h2>
                  <p className="text-[9px] font-bold text-muted-foreground mt-1 uppercase tracking-widest">{summary.outBudget.count} itens aguardando</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
                  <AlertCircle size={24} />
                </div>
              </div>
            </div>

            <div className="relative group overflow-hidden bg-card border border-border rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col justify-center lg:col-span-1 md:col-span-2">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:scale-110" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-2">Reserva Mensal Total</p>
                  <h2 className="text-3xl font-black tracking-tighter text-foreground">
                    {formatCurrency(summary.totalMonthly)}
                  </h2>
                  <p className="text-[9px] font-bold text-muted-foreground mt-1 uppercase tracking-widest">Soma de todos os ciclos</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner">
                  <DollarSign size={24} />
                </div>
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
                  <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Gastos que você já está poupando mensalmente</p>
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
                      <th className="text-center px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Frequência</th>
                      <th className="text-right px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Valor Total</th>
                      <th className="text-right px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reserva Mensal</th>
                      <th className="text-right px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inBudgetExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-8 py-12 text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nenhum gasto planejado no orçamento.</p>
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
                              <span className="text-sm font-black uppercase tracking-tight group-hover:text-primary transition-colors">
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
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest">
                              A cada {expense.frequency_months} meses
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <span className="text-sm font-bold text-muted-foreground">
                              {formatCurrency(expense.amount)}
                            </span>
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
                                onClick={() => setConfirmFinish(expense)}
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
                  <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Gastos futuros ou ainda não provisionados</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/10">
                      <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Identificação</th>
                      <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descrição</th>
                      <th className="text-center px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Frequência</th>
                      <th className="text-right px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Valor Total</th>
                      <th className="text-right px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reserva Mensal</th>
                      <th className="text-right px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outBudgetExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-8 py-12 text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nenhum gasto fora do orçamento.</p>
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
                              <span className="text-sm font-black uppercase tracking-tight group-hover:text-amber-500 transition-colors text-muted-foreground">
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
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                              A cada {expense.frequency_months} meses
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <span className="text-sm font-bold text-muted-foreground/60">
                              {formatCurrency(expense.amount)}
                            </span>
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
                                onClick={() => setConfirmToggleBudget(expense)}
                                className="w-10 h-10 rounded-xl bg-emerald-500/5 text-emerald-500 border border-emerald-500/10 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                title="Mover para o Orçamento"
                              >
                                <Check size={16} />
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
                    <h3 className="text-lg font-black uppercase tracking-tighter text-foreground">Gastos Finalizados</h3>
                  </div>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Histórico de despesas concluídas</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/10">
                      <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ciclo</th>
                      <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descrição</th>
                      <th className="text-center px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Frequência</th>
                      <th className="text-right px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Valor Total</th>
                      <th className="text-right px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                      <th className="text-right px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finishedExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-8 py-12 text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nenhum gasto finalizado recentemente.</p>
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
                              <span className="text-sm font-black uppercase tracking-tight text-muted-foreground/60">
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
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                              A cada {expense.frequency_months} meses
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <span className="text-sm font-bold text-muted-foreground/40 line-through">
                              {formatCurrency(expense.amount)}
                            </span>
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
              className="relative w-full max-w-lg bg-card border border-border rounded-[3rem] p-8 shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Plus className="text-primary" size={20} />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                      {editingExpense ? 'Editar Registro' : 'Novo Registro'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">
                    {editingExpense ? 'Editar Gasto' : 'Cadastrar Gasto'}
                  </h2>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-rose-500 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
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
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 text-primary">Descrição do Gasto</label>
                    <input
                      type="text"
                      required
                      placeholder="EX: IPVA, SEGURO, VIAGEM..."
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
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Frequência (Meses)</label>
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
                    placeholder="DETALHES DO GASTO..."
                    value={form.observation}
                    onChange={e => setForm(prev => ({ ...prev, observation: e.target.value.toUpperCase() }))}
                    className="w-full h-24 bg-muted border-none rounded-2xl p-6 text-sm font-bold uppercase tracking-widest focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>

                <div className="p-6 rounded-[2rem] bg-muted/30 border border-border space-y-4">
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
                        "w-12 h-6 rounded-full transition-all relative flex items-center px-1 shadow-inner",
                        form.in_budget ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                      )}
                    >
                      <motion.div
                        animate={{ x: form.in_budget ? 24 : 0 }}
                        className="w-4 h-4 rounded-full bg-white shadow-lg"
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

                <button
                  type="submit"
                  className="w-full h-16 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all mt-4"
                >
                  {editingExpense ? 'Salvar Alterações' : 'Confirmar Cadastro'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Excluir Gasto"
        message={`Tem certeza que deseja excluir o planejamento de "${confirmDelete?.description}"? Esta ação não pode ser desfeita.`}
        confirmText="Sim, Excluir"
        onConfirm={() => confirmDelete && handleDelete(confirmDelete.id)}
        onClose={() => setConfirmDelete(null)}
        variant="danger"
      />

      <ConfirmModal
        isOpen={!!confirmToggleBudget}
        title={confirmToggleBudget?.in_budget ? "Remover do Orçamento" : "Adicionar ao Orçamento"}
        message={confirmToggleBudget?.in_budget
          ? `Deseja remover "${confirmToggleBudget?.description}" do seu orçamento mensal?`
          : `Deseja adicionar "${confirmToggleBudget?.description}" ao seu orçamento mensal?`
        }
        confirmText={confirmToggleBudget?.in_budget ? "Sim, Remover" : "Sim, Adicionar"}
        onConfirm={() => confirmToggleBudget && handleToggleBudgetStatus(confirmToggleBudget)}
        onClose={() => setConfirmToggleBudget(null)}
        variant={confirmToggleBudget?.in_budget ? "warning" : "success"}
      />

      <ConfirmModal
        isOpen={!!confirmFinish}
        title="Finalizar Gasto"
        message={`Deseja marcar "${confirmFinish?.description}" como finalizado? Ele será movido para o histórico e não será mais somado à reserva mensal.`}
        confirmText="Sim, Finalizar"
        onConfirm={() => confirmFinish && handleFinishExpense(confirmFinish)}
        onClose={() => setConfirmFinish(null)}
        variant="success"
      />

      <ConfirmModal
        isOpen={!!confirmReactivate}
        title="Reativar Gasto"
        message={`Deseja reativar o gasto "${confirmReactivate?.description}"? Ele voltará para a lista de gastos fora do orçamento.`}
        confirmText="Sim, Reativar"
        onConfirm={() => confirmReactivate && handleReactivateExpense(confirmReactivate)}
        onClose={() => setConfirmReactivate(null)}
        variant="info"
      />
    </div>
  );
};
