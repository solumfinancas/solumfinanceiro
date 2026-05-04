import React, { useMemo, useState } from 'react';
import { useFinance } from '../FinanceContext';
import {
   TrendingUp,
   TrendingDown,
   DollarSign,
   Clock,
   Calendar,
   AlertTriangle,
   ArrowUpRight,
   ArrowDownRight,
   Plus,
   ArrowRightLeft,
   CalendarDays,
   FileDown,
   CreditCard,
   ChevronRight,
   PieChart as PieIcon,
   Target,
   ChevronLeft,
   Wallet as WalletIcon,
   LayoutList,
   ChevronDown,
   ChevronUp,
   Tag,
   Check,
   AlertCircle,
   X,
   History
} from 'lucide-react';
import { IconRenderer } from './ui/IconRenderer';
import {
   ResponsiveContainer,
   PieChart,
   Pie,
   Cell,
   Tooltip,
   BarChart,
   Bar,
   XAxis,
   YAxis,
   CartesianGrid,
   Legend,
   Area,
   ComposedChart,
   LineChart,
   Line
} from 'recharts';
import { formatCurrency, cn, getInvoicePeriod, getInvoiceAmount } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { TransactionModal } from './TransactionModal';
import { PendingTransactionsModal } from './PendingTransactionsModal';
import { Transaction, TransactionType, Category } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { CategoryHistoryModal } from './CategoryHistoryModal';

interface DashboardProps {
   setActiveTab: (tab: string) => void;
   setTxFilter: (filter: 'all' | 'pending' | 'paid') => void;
   setTxTypeFilter: (filter: 'all' | 'income' | 'expense') => void;
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#f43f5e', '#06b6d4', '#ec4899', '#84cc16'];

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab, setTxFilter, setTxTypeFilter }) => {
   const {
      includeCategoryLimits,
      transactions, categories, wallets,
      orderedAccounts,
      updateTransaction, deleteTransaction
   } = useFinance();
   const { user } = useAuth();

   const [modalOpen, setModalOpen] = useState(false);
   const [modalType, setModalType] = useState<TransactionType>('expense');
   const [pendingModalType, setPendingModalType] = useState<'payable' | 'receivable' | null>(null);
   const [selectedCategoryDetail, setSelectedCategoryDetail] = useState<Category | null>(null);
   const [historyCategoryId, setHistoryCategoryId] = useState<string | null>(null);
   const [isHistoryOpen, setIsHistoryOpen] = useState(false);
   const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

   // Time-based state
   // Stabilized reference to current date to prevent flickering in useMemo dependencies
   const now = useMemo(() => new Date(), []);

   // New Report States
   const [reportType, setReportType] = useState<'fluxo' | 'conta' | 'categoria'>('fluxo');
   const [reportWalletId, setReportWalletId] = useState<string | null>(null);
   const [reportReferenceDate, setReportReferenceDate] = useState(new Date());
   const [reportPeriod, setReportPeriod] = useState<1 | 3 | 6 | 9 | 12>(1);
   const [reportGranularity, setReportGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily');
   const [isPeriodExpanded, setIsPeriodExpanded] = useState(false);
   const [budgetOffset, setBudgetOffset] = useState(0);

   // Update effect to reset selection if switching to Fluxo
   React.useEffect(() => {
      if (reportType === 'fluxo') {
         setReportWalletId(null);
      }
   }, [reportType]);

   const currentMonth = now.getMonth() + 1;
   const currentYear = now.getFullYear();

   // 1. Data Aggregation for Greeting Header (Linked to Budget Month Selector)
   const { monthlyIncome, monthlyExpenses, balance } = useMemo(() => {
      const targetDate = new Date(now.getFullYear(), now.getMonth() + budgetOffset, 1);
      const tMonth = targetDate.getMonth() + 1;
      const tYear = targetDate.getFullYear();

      const income = transactions
         .filter(t => {
            const wallet = wallets.find(w => w.id === t.walletId);
            const isCreditCard = wallet?.type === 'credit_card';
            const d = new Date(t.date + 'T12:00:00Z');

            // Somente Entradas Reais em Contas (Liquidez)
            return t.type === 'income' &&
               !isCreditCard &&
               (d.getUTCMonth() + 1) === tMonth &&
               d.getUTCFullYear() === tYear &&
               t.isPaid;
         })
         .reduce((sum, t) => sum + t.amount, 0);

      const expenses = transactions
         .filter(t => {
            const wallet = wallets.find(w => w.id === t.walletId);
            const isCreditCard = wallet?.type === 'credit_card';
            const isCCPayment = t.description.toLowerCase().includes('pagamento de fatura');
            const d = new Date(t.date + 'T12:00:00Z');

            // Somente Saídas Reais de Contas (Despesas Pagas + Pagamento de Fatura)
            // Ignoramos compras individuais no cartão de crédito pois não afetam o saldo bancário agora
            const isRelevantDate = (d.getUTCMonth() + 1) === tMonth && d.getUTCFullYear() === tYear;

            return !isCreditCard &&
               t.isPaid &&
               isRelevantDate &&
               (t.type === 'expense' || isCCPayment);
         })
         .reduce((sum, t) => sum + t.amount, 0);

      return { monthlyIncome: income, monthlyExpenses: expenses, balance: income - expenses };
   }, [transactions, budgetOffset, wallets, now]);

   const budgetVision = useMemo(() => {
      const targetDate = new Date(now.getFullYear(), now.getMonth() + budgetOffset, 1);
      const tMonth = targetDate.getMonth() + 1;
      const tYear = targetDate.getFullYear();

      const expensesInMonth = transactions.filter(t => {
         const wallet = wallets.find(w => w.id === t.walletId);
         const isCreditCard = wallet?.type === 'credit_card';

         const d = new Date(t.date + 'T12:00:00Z');
         const isRelevantType = ['expense', 'provision'].includes(t.type);
         return isRelevantType && (d.getUTCMonth() + 1) === tMonth && d.getUTCFullYear() === tYear;
      });

      const necRec = expensesInMonth
         .filter(t => t.groupId && t.necessity === 'necessary')
         .reduce((sum, t) => sum + t.amount, 0);

      const unnecRec = expensesInMonth
         .filter(t => t.groupId && t.necessity === 'unnecessary')
         .reduce((sum, t) => sum + t.amount, 0);

      // Metas de Categorias (Estimados Totais)
      const estimated = includeCategoryLimits ? categories
         .filter(c => c.type === 'expense' && !c.isDeleted && c.isActive !== false)
         .reduce((sum, c) => sum + (c.limit || 0), 0) : 0;

      // Cartões à Pagar (Soma das faturas no mês selecionado)
      const targetMonth = targetDate.getUTCMonth() + 1;
      const targetYear = targetDate.getUTCFullYear();
      const cardsToPay = wallets
         .filter(w => w.type === 'credit_card' && w.isActive !== false)
         .reduce((sum, w) => {
            const closingDay = w.closingDay || 5;
            const dueDay = w.dueDay || 15;
            // Se o vencimento é antes do fechamento (ex: vence dia 10 e fecha dia 25), 
            // a fatura que vence neste mês foi a que fechou no mês anterior.
            const dueMonthOffset = dueDay < closingDay ? 1 : 0;

            // Criamos uma data de referência que, ao ser passada para getInvoicePeriod,
            // resulte no vencimento (due) igual ao mês/ano que estamos visualizando no Dashboard.
            const refDate = new Date(Date.UTC(targetYear, targetMonth - 1 - dueMonthOffset, 1));
            const period = getInvoicePeriod(closingDay, dueDay, refDate);

            const info = getInvoiceAmount(transactions, w.id, period);
            // Mostrar apenas o que falta pagar. Se já estiver pago (isLastPaid), contribui com 0.
            const remaining = info.isLastPaid ? 0 : Math.max(0, info.amount - info.paidSum);
            return sum + remaining;
         }, 0);

      const recurrentWithoutLimit = expensesInMonth
         .filter(t => t.groupId)
         .filter(t => {
            const cat = categories.find(c => c.id === t.categoryId);
            return !cat || !cat.limit || cat.limit === 0;
         })
         .reduce((sum, t) => sum + t.amount, 0);

      // Total que vai precisar
      // Se includeCategoryLimits for true, usamos o estimado + recorrentes sem meta (necessidade real)
      // Se for false, usamos o comprometido total (recorrentes cadastradas)
      const totalNeeded = includeCategoryLimits ? (estimated + recurrentWithoutLimit) : (necRec + unnecRec);

      return {
         monthName: targetDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }),
         necRec,
         unnecRec,
         estimated,
         recurrentWithoutLimit,
         cardsToPay,
         totalNeeded
      };
   }, [transactions, categories, wallets, budgetOffset, includeCategoryLimits]);

   // 2. Quick Access Triggers
   const openNewTx = (type: TransactionType) => {
      setModalType(type);
      setModalOpen(true);
   };

   // 3. Credit Card Data
   const creditCards = useMemo(() => {
      return wallets
         .filter(w => w.type === 'credit_card' && w.isActive !== false)
         .map(card => {
            const period = getInvoicePeriod(card.closingDay || 5, card.dueDay || 15, now);
            const invoice = getInvoiceAmount(transactions, card.id, period);
            const invoiceAmount = invoice.amount;
            return {
               ...card,
               invoiceAmount,
               availableLimit: (card.limit || 0) + (card.balance || 0)
            };
         })
         .slice(0, 3);
   }, [wallets, transactions, now]);

   const totalAvailableCredit = useMemo(() => {
      return wallets
         .filter(w => w.type === 'credit_card' && w.isActive !== false)
         .reduce((sum, card) => {
            return sum + ((card.limit || 0) + (card.balance || 0));
         }, 0);
   }, [wallets]);

   const totalBankBalance = useMemo(() => {
      return wallets
         .filter(w => w.type !== 'credit_card' && w.isActive !== false)
         .reduce((sum, w) => sum + (w.balance || 0), 0);
   }, [wallets]);

   // 4. Pending Values
   const pendingToPay = useMemo(() => {
      const list = transactions
         .filter(t =>
            t.isPaid === false &&
            (t.type === 'expense' || t.type === 'provision' || t.type === 'planned')
         )
         .sort((a, b) => {
            const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
            if (dateCompare !== 0) return dateCompare;
            const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return timeA - timeB;
         });

      const total = list.reduce((sum, t) => sum + t.amount, 0);
      return { total, count: list.length, list: list.slice(0, 5) };
   }, [transactions]);

   const pendingToReceive = useMemo(() => {
      const list = transactions
         .filter(t => t.isPaid === false && t.type === 'income')
         .sort((a, b) => {
            const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
            if (dateCompare !== 0) return dateCompare;
            const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return timeA - timeB;
         });

      const total = list.reduce((sum, t) => sum + t.amount, 0);
      return { total, count: list.length, list: list.slice(0, 5) };
   }, [transactions]);

   const groupedAccounts = useMemo(() => {
      const activeAccounts = wallets.filter(w => w.type !== 'credit_card' && w.isActive !== false);
      const sorted = [...activeAccounts].sort((a, b) => {
         const indexA = orderedAccounts.indexOf(a.id);
         const indexB = orderedAccounts.indexOf(b.id);
         if (indexA === -1 && indexB === -1) return 0;
         if (indexA === -1) return 1;
         if (indexB === -1) return -1;
         return indexA - indexB;
      });

      return [
         { id: 'checking', name: 'Conta Corrente', items: sorted.filter(w => (w.walletCategory || 'checking') === 'checking') },
         { id: 'savings', name: 'Cofrinhos', items: sorted.filter(w => w.walletCategory === 'savings') },
         { id: 'wishlist', name: 'Lista de Desejos', items: sorted.filter(w => w.walletCategory === 'wishlist') }
      ].filter(group => group.items.length > 0);
   }, [wallets, orderedAccounts]);

   // 5. Category Analysis (Current Month or Selected Report Month)
   const { topSpendingData, totalCategorySpending } = useMemo(() => {
      const isReportMonthSelected = reportPeriod === 1;
      const refMonth = isReportMonthSelected ? reportReferenceDate.getUTCMonth() + 1 : currentMonth;
      const refYear = isReportMonthSelected ? reportReferenceDate.getUTCFullYear() : currentYear;
      const expenseByCat: Record<string, number> = {};
      let total = 0;

      transactions
         .filter(t => {
            const d = new Date(t.date);
            const isCurrentMonth = (d.getUTCMonth() + 1) === refMonth && d.getUTCFullYear() === refYear;
            const cat = categories.find(c => c.id === t.categoryId);
            // Inclui TODOS os gastos computados (isPaid ou não) para o gráfico de categorias
            return cat?.type === 'expense' && isCurrentMonth && t.type === 'expense';
         })
         .forEach(t => {
            const cat = categories.find(c => c.id === t.categoryId);
            let finalCat = cat;
            if (cat?.parentId) {
               finalCat = categories.find(c => c.id === cat.parentId) || cat;
            }
            const name = finalCat?.name || 'Sem Categoria';
            expenseByCat[name] = (expenseByCat[name] || 0) + t.amount;
            total += t.amount;
         });

      const data = Object.entries(expenseByCat)
         .map(([name, value]) => ({ name, value }))
         .sort((a, b) => b.value - a.value)
         .slice(0, 5);

      return { topSpendingData: data, totalCategorySpending: total };
   }, [transactions, categories, reportReferenceDate, reportPeriod, currentMonth, currentYear]);

   const subcategoriesDetail = useMemo(() => {
      if (!selectedCategoryDetail) return [];

      const isReportMonthSelected = reportPeriod === 1;
      const refMonth = isReportMonthSelected ? reportReferenceDate.getUTCMonth() + 1 : currentMonth;
      const refYear = isReportMonthSelected ? reportReferenceDate.getUTCFullYear() : currentYear;

      const subcats = categories.filter(c => c.parentId === selectedCategoryDetail.id && c.isActive !== false);
      const spendingBySubcat: Record<string, number> = {};
      let total = 0;

      transactions.forEach(t => {
         const d = new Date(t.date);
         const isCurrentMonth = (d.getUTCMonth() + 1) === refMonth && d.getUTCFullYear() === refYear;
         if (t.type === 'expense' && isCurrentMonth) {
            const cat = categories.find(c => c.id === t.categoryId);
            if (cat?.parentId === selectedCategoryDetail.id) {
               spendingBySubcat[cat.id] = (spendingBySubcat[cat.id] || 0) + t.amount;
               total += t.amount;
            } else if (cat?.id === selectedCategoryDetail.id) {
               spendingBySubcat['unclassified'] = (spendingBySubcat['unclassified'] || 0) + t.amount;
               total += t.amount;
            }
         }
      });

      const data = subcats.map(s => ({
         ...s,
         total: spendingBySubcat[s.id] || 0
      }));

      if (spendingBySubcat['unclassified']) {
         data.push({
            id: 'unclassified',
            name: 'Sem Subcategoria',
            total: spendingBySubcat['unclassified'],
            icon: selectedCategoryDetail.icon,
            color: selectedCategoryDetail.color,
            isActive: true,
            type: 'expense'
         } as Category & { total: number });
      }

      return data.sort((a, b) => b.total - a.total);
   }, [selectedCategoryDetail, transactions, categories, reportReferenceDate, reportPeriod, currentMonth, currentYear]);

   const budgetProgress = useMemo(() => {
      return categories
         .filter(c => c.limit && c.limit > 0 && c.isActive !== false && !c.parentId)
         .map(cat => {
            const relevantIds = [cat.id, ...categories.filter(c => c.parentId === cat.id).map(c => c.id)];
            const spent = transactions
               .filter(t => {
                  const d = new Date(t.date);
                  const isMatchingCategory = relevantIds.includes(t.categoryId);
                  const isMatchingMonth = (d.getUTCMonth() + 1) === currentMonth && d.getUTCFullYear() === currentYear;
                  const isExpense = t.type === 'expense' || t.type === 'provision' || t.type === 'planned';
                  // Para o progresso do orçamento, consideramos tudo o que foi planejado/provisionado/gasto no mês
                  return isMatchingCategory && isMatchingMonth && isExpense;
               })
               .reduce((sum, t) => sum + t.amount, 0);

            return {
               name: cat.name,
               limit: cat.limit!,
               spent,
               percent: Math.min(Math.round((spent / cat.limit!) * 100), 100)
            };
         })
         .sort((a, b) => b.percent - a.percent)
         .slice(0, 5);
   }, [categories, transactions, currentMonth, currentYear]);



   // 6. Relatórios (Historical Charts & Granularity)
   const chartData = useMemo(() => {
      const buckets = [];
      const baseDate = reportPeriod === 1 ? new Date(reportReferenceDate) : new Date();

      if (reportPeriod === 1) {
         // Single Month Granularity Logic
         if (reportGranularity === 'daily') {
            const year = baseDate.getUTCFullYear();
            const month = baseDate.getUTCMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            for (let i = 1; i <= daysInMonth; i++) {
               buckets.push({
                  label: i.toString().padStart(2, '0'),
                  monthNum: month + 1,
                  year,
                  dayNum: i,
                  income: 0,
                  expense: 0,
                  planned: 0,
                  balance: 0
               });
            }
         } else if (reportGranularity === 'weekly') {
            const year = baseDate.getUTCFullYear();
            const month = baseDate.getUTCMonth();

            // Find first Sunday of the month (or leading Sunday)
            const firstDay = new Date(Date.UTC(year, month, 1));
            let current = new Date(firstDay);
            current.setUTCDate(current.getUTCDate() - current.getUTCDay()); // Back to Sunday

            const lastDay = new Date(Date.UTC(year, month + 1, 0));
            while (current <= lastDay || current.getUTCDay() !== 0) {
               const weekStart = new Date(current);
               const weekEnd = new Date(current);
               weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

               const monthsShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
               const startFmt = `${weekStart.getUTCDate().toString().padStart(2, '0')} ${monthsShort[weekStart.getUTCMonth()]}`;
               const endFmt = `${weekEnd.getUTCDate().toString().padStart(2, '0')} ${monthsShort[weekEnd.getUTCMonth()]}`;

               buckets.push({
                  label: `${startFmt} à ${endFmt}`,
                  startDate: new Date(weekStart),
                  endDate: new Date(weekEnd),
                  income: 0,
                  expense: 0,
                  planned: 0,
                  balance: 0
               });

               current.setUTCDate(current.getUTCDate() + 7);
               if (current > lastDay && current.getUTCDay() === 0) break;
            }
         } else {
            // Monthly (Single Month)
            buckets.push({
               label: baseDate.toLocaleString('pt-BR', { month: 'short', timeZone: 'UTC' }).toUpperCase(),
               monthNum: baseDate.getUTCMonth() + 1,
               year: baseDate.getUTCFullYear(),
               income: 0,
               expense: 0,
               planned: 0,
               balance: 0
            });
         }
      } else {
         // Multi-month context (Always Monthly)
         for (let i = reportPeriod - 1; i >= 0; i--) {
            const d = new Date(baseDate);
            d.setUTCMonth(baseDate.getUTCMonth() - i);
            buckets.push({
               label: d.toLocaleString('pt-BR', { month: 'short', timeZone: 'UTC' }).toUpperCase(),
               monthNum: d.getUTCMonth() + 1,
               year: d.getUTCFullYear(),
               income: 0,
               expense: 0,
               planned: 0,
               balance: 0
            });
         }
      }

      transactions.forEach(t => {
         const wallet = wallets.find(w => w.id === t.walletId);
         const isCreditCard = wallet?.type === 'credit_card';

         const d = new Date(t.date + 'T12:00:00Z');

         const m = d.getUTCMonth() + 1;
         const y = d.getUTCFullYear();
         const day = d.getUTCDate();

         let targetBucket = null;

         if (reportPeriod === 1) {
            if (reportGranularity === 'daily') {
               targetBucket = buckets.find(p => p.dayNum === day && p.monthNum === m && p.year === y);
            } else if (reportGranularity === 'weekly') {
               targetBucket = buckets.find(p => d >= p.startDate && d <= p.endDate);
            } else {
               targetBucket = buckets.find(p => p.monthNum === m && p.year === y);
            }
         } else {
            targetBucket = buckets.find(p => p.monthNum === m && p.year === y);
         }

         if (!targetBucket) return;

         if (reportType === 'fluxo') {
            const wallet = wallets.find(w => w.id === t.walletId);
            const isCreditCard = wallet?.type === 'credit_card';
            const isCCPayment = t.description.toLowerCase().includes('pagamento de fatura');

            if (!isCreditCard) {
               if (t.type === 'income' && t.isPaid) {
                  targetBucket.income += t.amount;
               } else if (t.isPaid && (t.type === 'expense' || isCCPayment)) {
                  targetBucket.expense += t.amount;
               }
            }
         } else if (reportType === 'conta' && reportWalletId) {
            const isOrigin = t.walletId === reportWalletId;
            const isDest = (t.type === 'transfer' || t.type === 'provision' || t.description.toLowerCase().includes('pagamento de fatura')) && t.toWalletId === reportWalletId;

            if (t.isPaid || t.type === 'planned') {
               if (isOrigin) {
                  if (t.type === 'expense' || t.type === 'transfer' || t.type === 'provision' || t.type === 'planned') {
                     targetBucket.expense += t.amount;
                  }
               }
               if (isDest) {
                  targetBucket.income += t.amount;
               }
               if (t.type === 'income' && t.walletId === reportWalletId && t.isPaid) {
                  targetBucket.income += t.amount;
               }
            }
         } else if (reportType === 'categoria') {
            if (t.type === 'expense') {
               const cat = categories.find(c => c.id === t.categoryId);
               if (cat?.type === 'expense') {
                  let finalCat = cat;
                  if (cat.parentId) {
                     finalCat = categories.find(c => c.id === cat.parentId) || cat;
                  }
                  const catName = finalCat.name;
                  targetBucket[catName] = (targetBucket[catName] || 0) + t.amount;
               }
            }
         }
      });

      const foundNames = new Set<string>();
      buckets.forEach(b => {
         Object.keys(b).forEach(k => {
            if (!['label', 'monthNum', 'year', 'dayNum', 'income', 'expense', 'planned', 'balance', 'startDate', 'endDate'].includes(k)) {
               foundNames.add(k);
            }
         });
      });

      let runningBalance = 0;
      return buckets.map(p => {
         p.balance = p.income - p.expense; // Exclui planned conforme lógica de fluxo de caixa
         runningBalance += p.balance;
         p.accumulated = runningBalance;
         foundNames.forEach(name => {
            if ((p as any)[name] === undefined) (p as any)[name] = 0;
         });
         return p;
      });
   }, [transactions, reportReferenceDate, reportPeriod, reportGranularity, reportType, reportWalletId, categories]);

   const activeCategoryNames = useMemo(() => {
      if (reportType !== 'categoria') return [];
      const names = new Set<string>();
      chartData.forEach(bucket => {
         Object.keys(bucket).forEach(key => {
            if (!['label', 'monthNum', 'year', 'dayNum', 'income', 'expense', 'planned', 'balance', 'startDate', 'endDate', 'accumulated'].includes(key)) {
               names.add(key);
            }
         });
      });
      return Array.from(names).sort();
   }, [chartData, reportType]);

   // User Greeting Refinement
   const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'Visitante';
   const greeting = useMemo(() => {
      const hour = now.getHours();
      if (hour >= 5 && hour < 12) return 'Bom dia';
      if (hour >= 12 && hour < 18) return 'Boa tarde';
      return 'Boa noite';
   }, [now]);

   const lastAccess = user?.user_metadata?.last_access ? new Date(user.user_metadata.last_access) : null;
   const lastUpdate = user?.user_metadata?.last_update ? new Date(user.user_metadata.last_update) : null;

   const engagementStatus = useMemo(() => {
      if (!lastUpdate) return { emoji: "😊", message: "Tudo pronto para começar!", sub: "Crie seu primeiro lançamento." };

      const diffTime = Math.abs(new Date().getTime() - lastUpdate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 3) return {
         emoji: "😊",
         message: "Registros em dia!",
         sub: "Continue assim."
      };
      if (diffDays <= 5) return {
         emoji: "😟",
         message: "Senti sua falta...",
         sub: "Faz tempo que não registramos nada."
      };
      return {
         emoji: "😡",
         message: "Onde você se meteu?",
         sub: "Suas finanças precisam de você!"
      };
   }, [lastUpdate]);

   const financialStatus = useMemo(() => {
      const isBudgetExceeded = budgetProgress.some(b => b.percent >= 100);
      const isNearLimit = budgetProgress.some(b => b.percent >= 80);

      if (balance < 0) return {
         message: "Mês desafiador. Vamos revisar os gastos para recuperar o fôlego? 📉",
         color: "text-rose-500"
      };
      if (isBudgetExceeded) return {
         message: "Limite ultrapassado em algumas categorias! Hora de pisar no freio. 🛑",
         color: "text-orange-500"
      };
      if (isNearLimit) return {
         message: "Atenção aos limites! Você está quase no teto. 🚧",
         color: "text-yellow-500"
      };
      return {
         message: "Suas finanças estão saudáveis! Continue assim. 🚀",
         color: "text-emerald-500"
      };
   }, [balance, budgetProgress]);

   return (
      <div className="space-y-8 pb-12 animate-in fade-in duration-700">

         {/* 1. Header & Quick Summary */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card p-8 rounded-[2.5rem] border border-border shadow-sm flex flex-col justify-between relative overflow-hidden">
               <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-50" />

               <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                     <h1 className="text-4xl font-black tracking-tighter uppercase mb-1">{greeting}, {userName}!</h1>
                     <div className="flex flex-col gap-1 text-[10px] font-black text-muted-foreground uppercase opacity-60">
                        <span className="flex items-center gap-1"><Clock size={12} /> Última atualização: {lastUpdate ? lastUpdate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Nenhuma'}</span>
                        <span className="flex items-center gap-1"><Calendar size={12} /> Último acesso: {lastAccess ? lastAccess.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Nenhuma'}</span>
                     </div>
                  </div>

                  {/* Engagement Mood (Right Side) */}
                  <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-3xl border border-border/50 min-w-[240px]">
                     <span className="text-4xl">{engagementStatus.emoji}</span>
                     <div className="flex flex-col">
                        <span className="text-xs font-black uppercase tracking-tighter">{engagementStatus.message}</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase leading-tight">{engagementStatus.sub}</span>
                     </div>
                  </div>
               </div>

               {/* Monthly Budget Vision */}
               <div className="mt-8 p-6 bg-muted/20 border border-border/40 rounded-[2rem] flex flex-col gap-8 shadow-inner">
                  <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border/40 pb-6 gap-6">
                     <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">Orçamento Mensal</span>
                        <div className="flex flex-wrap items-center gap-3">
                           <span className="text-sm font-black uppercase text-primary shrink-0">{budgetVision.monthName}</span>
                           <div className="flex items-center gap-2">
                              <button
                                 type="button"
                                 onClick={() => setBudgetOffset(prev => Math.max(0, prev - 1))}
                                 disabled={budgetOffset === 0}
                                 className="p-2 hover:bg-muted bg-muted/30 rounded-xl transition-all disabled:opacity-30 border border-border/20 shadow-sm"
                                 title="Mês Anterior"
                              >
                                 <ChevronLeft size={18} />
                              </button>

                              <button
                                 type="button"
                                 onClick={() => setBudgetOffset(0)}
                                 className={cn(
                                    "px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border shadow-sm",
                                    budgetOffset === 0
                                       ? "bg-primary text-white border-primary"
                                       : "bg-muted/30 text-muted-foreground border-border/20 hover:bg-muted"
                                 )}
                              >
                                 Hoje
                              </button>

                              <button
                                 type="button"
                                 onClick={() => setBudgetOffset(prev => Math.min(11, prev + 1))}
                                 disabled={budgetOffset === 11}
                                 className="p-2 hover:bg-muted bg-muted/30 rounded-xl transition-all disabled:opacity-30 border border-border/20 shadow-sm"
                                 title="Próximo Mês"
                              >
                                 <ChevronRight size={18} />
                              </button>
                           </div>
                        </div>
                     </div>
                     <div className="text-left md:text-right border-t md:border-t-0 border-border/10 pt-4 md:pt-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 block mb-1">Total que vai precisar</span>
                        <span className="text-2xl md:text-3xl font-black tracking-tighter text-primary">
                           {formatCurrency(budgetVision.totalNeeded)}
                        </span>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left relative pt-8">
                     {/* Indicador de Comprometimento Total */}
                     <div className="absolute -top-1 left-0 flex items-center gap-2">
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-40">Comprometido Total:</span>
                        <div className="px-2 py-0.5 rounded-md bg-muted/50 border border-border/10 text-[9px] font-bold text-muted-foreground/80">
                           {formatCurrency(budgetVision.necRec + budgetVision.unnecRec)}
                        </div>
                     </div>

                     <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-wider flex items-center justify-center md:justify-start gap-1">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Nec. Recorrentes
                        </span>
                        <p className="text-lg font-black">{formatCurrency(budgetVision.necRec)}</p>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase opacity-40">Não pode ser guardado para realizar</p>
                     </div>

                     <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-wider flex items-center justify-center md:justify-start gap-1">
                           <div className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Desnec. Recorrentes
                        </span>
                        <p className="text-lg font-black">{formatCurrency(budgetVision.unnecRec)}</p>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase opacity-40">Deveria ter sido planejado para realizar</p>
                     </div>

                     <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-wider flex items-center justify-center md:justify-start gap-1">
                           <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Estimados do Mês
                        </span>
                        <p className={cn("text-lg font-black transition-all", !includeCategoryLimits && "opacity-20")}>
                           {formatCurrency(budgetVision.estimated)}
                        </p>
                        <p className={cn(
                           "text-[8px] font-bold uppercase transition-all",
                           !includeCategoryLimits ? "text-amber-500 animate-pulse" : "text-muted-foreground opacity-40"
                        )}>
                           {!includeCategoryLimits ? "Inativo (Ativar nas categorias)" : "Deve considerar o comprometido com recorrentes"}
                        </p>

                        {includeCategoryLimits && budgetVision.recurrentWithoutLimit > 0 && (
                           <div className="flex items-center gap-1.5 py-1 px-2 bg-orange-500/5 border border-orange-500/10 rounded-lg w-fit mt-2">
                              <div className="w-1 h-1 rounded-full bg-orange-500 animate-pulse shrink-0" />
                              <span className="text-[7px] font-black uppercase text-orange-600 tracking-tighter leading-none">
                                 {formatCurrency(budgetVision.recurrentWithoutLimit)} comprometido sem meta de gasto definida
                              </span>
                           </div>
                        )}
                     </div>

                  </div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12">
                  <div className="space-y-1">
                     <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1">
                        <TrendingUp size={12} /> Entradas
                     </span>
                     <p className="text-[clamp(1rem,2vw,1.5rem)] font-black whitespace-nowrap">{formatCurrency(monthlyIncome)}</p>
                     <p className="text-[9px] font-bold text-muted-foreground uppercase italic opacity-60">Recebidas este mês</p>
                  </div>
                  <div className="space-y-1">
                     <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-1">
                        <TrendingDown size={12} /> Saídas
                     </span>
                     <p className="text-[clamp(1rem,2vw,1.5rem)] font-black whitespace-nowrap">{formatCurrency(monthlyExpenses)}</p>
                     <p className="text-[9px] font-bold text-muted-foreground uppercase italic opacity-60">Somente Pagas</p>
                  </div>
                  <div className="space-y-1 min-w-0">
                     <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-1">
                        <WalletIcon size={12} /> Saldo em Contas
                     </span>
                     <p className={cn("text-[clamp(1rem,2vw,1.5rem)] font-black whitespace-nowrap", totalBankBalance < -0.01 && "text-rose-500")} title={formatCurrency(totalBankBalance)}>{formatCurrency(totalBankBalance)}</p>
                     <p className="text-[9px] font-bold text-muted-foreground uppercase italic opacity-60">Soma das Contas</p>
                  </div>
                  <div className="space-y-1 min-w-0 pr-4">
                     <span className="text-[10px] font-black uppercase tracking-widest text-[#820ad1] flex items-center gap-1">
                        <CreditCard size={12} /> Limite Utilizável
                     </span>
                     <p className="text-[clamp(1rem,2vw,1.5rem)] font-black whitespace-nowrap" title={formatCurrency(totalAvailableCredit)}>{formatCurrency(totalAvailableCredit)}</p>
                     <p className="text-[9px] font-bold text-muted-foreground uppercase italic opacity-60">Cartões Ativos</p>
                  </div>
               </div>
            </div>

            {/* Quick Access Row (6 Buttons in Grid) */}
            <div className="bg-muted/30 p-8 rounded-[2.5rem] border border-border/50 flex flex-col h-full">
               <div className="mb-6">
                  <h3 className="text-xl font-black uppercase tracking-tighter">Acesso Rápido</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Realize novos lançamentos ou importe extratos bancários</p>
               </div>
               <div className="grid grid-cols-2 gap-3 flex-1">
                  <button onClick={() => openNewTx('expense')} className="group p-4 bg-rose-500 text-white rounded-3xl flex flex-col items-center justify-center gap-2 hover:scale-[1.03] transition-all shadow-lg shadow-rose-500/20 active:scale-95">
                     <ArrowDownRight size={20} className="group-hover:rotate-45 transition-transform" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Despesa</span>
                  </button>
                  <button onClick={() => openNewTx('income')} className="group p-4 bg-emerald-500 text-white rounded-3xl flex flex-col items-center justify-center gap-2 hover:scale-[1.03] transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                     <ArrowUpRight size={20} className="group-hover:rotate-45 transition-transform" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Receita</span>
                  </button>
                  <button onClick={() => openNewTx('transfer')} className="group p-4 bg-blue-500 text-white rounded-3xl flex flex-col items-center justify-center gap-2 hover:scale-[1.03] transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                     <ArrowRightLeft size={20} />
                     <span className="text-[10px] font-black uppercase tracking-widest">Transf.</span>
                  </button>
                  <button onClick={() => openNewTx('provision')} className="group p-4 bg-orange-500 text-white rounded-3xl flex flex-col items-center justify-center gap-2 hover:scale-[1.03] transition-all shadow-lg shadow-orange-500/20 active:scale-95">
                     <Plus size={20} />
                     <span className="text-[10px] font-black uppercase tracking-widest">Provisão</span>
                  </button>
                  <button onClick={() => openNewTx('planned')} className="group p-4 bg-yellow-500 text-white rounded-3xl flex flex-col items-center justify-center gap-2 hover:scale-[1.03] transition-all shadow-lg shadow-yellow-500/20 active:scale-95">
                     <CalendarDays size={20} />
                     <span className="text-[10px] font-black uppercase tracking-widest text-center">Planejado</span>
                  </button>
                  <button onClick={() => setActiveTab('import')} className="group p-4 bg-card border border-border shadow-sm text-foreground rounded-3xl flex flex-col items-center justify-center gap-2 hover:border-primary transition-all hover:bg-primary/5 active:scale-95">
                     <FileDown size={20} className="text-orange-600" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-center">Importar</span>
                  </button>
               </div>
            </div>
         </div>

         {/* 2. Middle Row: Cards Section */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Faturas Card */}
            <div className="bg-card p-6 rounded-[2rem] border border-border flex flex-col gap-4 shadow-sm">
               <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                     <CreditCard size={14} className="text-primary" /> Faturas do Mês
                  </h3>
                  <button onClick={() => setActiveTab('wallets')} className="p-2 hover:bg-muted rounded-xl transition-all"><ChevronRight size={16} /></button>
               </div>

               <div className="space-y-3 flex-1">
                  {creditCards.length > 0 ? creditCards.map(card => (
                     <div key={card.id} className="p-3 bg-muted/30 rounded-2xl border border-border/50 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                           <span className="text-[10px] font-black uppercase tracking-tight">{card.name}</span>
                           <span className="text-[10px] font-bold text-muted-foreground">{formatCurrency(card.invoiceAmount)}</span>
                        </div>
                        <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
                           <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${Math.min((card.invoiceAmount / (card.limit || 1)) * 100, 100)}%` }}
                           />
                        </div>
                        <div className="flex items-center justify-between text-[8px] font-bold text-muted-foreground uppercase">
                           <span>Limite: {formatCurrency(card.limit || 0)}</span>
                           <span className="text-primary">Livre: {formatCurrency(card.availableLimit)}</span>
                        </div>
                     </div>
                  )) : (
                     <div className="h-full flex items-center justify-center text-muted-foreground text-[10px] font-bold uppercase italic p-8 text-center">Nenhum cartão cadastrado</div>
                  )}
               </div>

               <button onClick={() => setActiveTab('wallets')} className="w-full py-3 bg-muted/50 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all">Gerenciar Cartões</button>
            </div>

            {/* Valores a Pagar */}
            <div className="bg-card p-6 rounded-[2rem] border border-border flex flex-col gap-4 shadow-sm">
               <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                     <TrendingDown size={14} className="text-rose-500" /> Valores a Pagar
                  </h3>
                  <span className="text-[10px] font-black bg-rose-500/10 text-rose-600 px-2 py-1 rounded-lg">{pendingToPay.count} Pendentes</span>
               </div>

               <div className="space-y-3 flex-1 overflow-y-auto max-h-[160px] pr-2">
                  {pendingToPay.list.map(t => (
                     <div key={t.id} className="flex items-center justify-between p-2 hover:bg-muted/30 rounded-xl transition-all">
                        <div className="flex flex-col">
                           <p className="text-[10px] font-black leading-tight line-clamp-2 mb-0.5">{t.description}</p>
                           <p className="text-[8px] font-bold text-muted-foreground">{new Date(t.date).toLocaleDateString()}</p>
                        </div>
                        <span className="text-[10px] font-black text-rose-500">{formatCurrency(t.amount)}</span>
                     </div>
                  ))}
                  {pendingToPay.list.length === 0 && (
                     <div className="h-full flex items-center justify-center text-muted-foreground text-[10px] font-bold uppercase italic p-8 text-center pt-12">Tudo pago por aqui!</div>
                  )}
               </div>

               <div className="pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between mb-3">
                     <span className="text-[10px] font-black uppercase text-muted-foreground">Total Pendente</span>
                     <span className="text-lg font-black text-rose-600">{formatCurrency(pendingToPay.total)}</span>
                  </div>
                  <button onClick={() => setPendingModalType('payable')} className="w-full py-3 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/10">Ver Todos</button>
               </div>
            </div>

            {/* Valores a Receber */}
            <div className="bg-card p-6 rounded-[2rem] border border-border flex flex-col gap-4 shadow-sm">
               <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                     <TrendingUp size={14} className="text-emerald-500" /> Valores a Receber
                  </h3>
                  <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-lg">{pendingToReceive.count} Pendentes</span>
               </div>

               <div className="space-y-3 flex-1 overflow-y-auto max-h-[160px] pr-2">
                  {pendingToReceive.list.map(t => (
                     <div key={t.id} className="flex items-center justify-between p-2 hover:bg-muted/30 rounded-xl transition-all">
                        <div className="flex flex-col">
                           <p className="text-[10px] font-black leading-tight line-clamp-2 mb-0.5">{t.description}</p>
                           <p className="text-[8px] font-bold text-muted-foreground">{new Date(t.date).toLocaleDateString()}</p>
                        </div>
                        <span className="text-[10px] font-black text-emerald-500">{formatCurrency(t.amount)}</span>
                     </div>
                  ))}
                  {pendingToReceive.list.length === 0 && (
                     <div className="h-full flex items-center justify-center text-muted-foreground text-[10px] font-bold uppercase italic p-8 text-center pt-12">Nenhuma entrada pendente</div>
                  )}
               </div>

               <div className="pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between mb-3">
                     <span className="text-[10px] font-black uppercase text-muted-foreground">Total a Receber</span>
                     <span className="text-lg font-black text-emerald-600">{formatCurrency(pendingToReceive.total)}</span>
                  </div>
                  <button onClick={() => setPendingModalType('receivable')} className="w-full py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/10">Ver Todos</button>
               </div>
            </div>
         </div>

         {/* 3. Category & Budget Analysis Section */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm flex flex-col gap-6">
               <div className="flex items-center justify-between">
                  <div>
                     <h3 className="text-lg font-black uppercase tracking-tighter flex items-center gap-2">
                        <PieIcon size={20} className="text-primary" /> Maiores Gastos
                     </h3>
                     <p className="text-[10px] font-bold text-muted-foreground uppercase leading-tight mt-1 max-w-[200px]">
                        {reportPeriod === 1 ? 'Seguindo mês selecionado nos relatórios' : 'Seguindo o mês atual (filtro de relatório não é único mês)'}
                     </p>
                  </div>
                  <button onClick={() => setActiveTab('categories')} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Ver Categorias</button>
               </div>

               <div className="min-h-[240px] w-full flex flex-col md:flex-row items-center gap-6 md:gap-0">
                  <div className="w-full md:w-1/2 h-[240px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                           <Pie
                              data={topSpendingData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                              onClick={(data) => {
                                 if (data && data.name) {
                                    const cat = categories.find(c => c.name === data.name);
                                    if (cat) setSelectedCategoryDetail(cat);
                                 }
                              }}
                              style={{ cursor: 'pointer' }}
                           >
                              {topSpendingData.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                           </Pie>
                           <Tooltip
                              formatter={(value: number) => formatCurrency(value)}
                              contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                           />
                        </PieChart>
                     </ResponsiveContainer>
                  </div>
                  <div className="w-full md:w-1/2 flex flex-col justify-center px-0 md:px-4">
                     <div className="space-y-3">
                        {topSpendingData.map((item, i) => (
                           <div
                              key={i}
                              className="flex items-center justify-between cursor-pointer hover:bg-muted/30 p-1.5 rounded-lg transition-colors"
                              onClick={() => {
                                 const cat = categories.find(c => c.name === item.name);
                                 if (cat) setSelectedCategoryDetail(cat);
                              }}
                           >
                              <div className="flex items-center gap-2 overflow-hidden flex-1">
                                 <IconRenderer
                                    icon={categories.find(c => c.name === item.name)?.icon || 'Tag'}
                                    color={COLORS[i % COLORS.length]}
                                    size={18}
                                 />
                                 <span className="text-[10px] font-bold truncate md:whitespace-normal uppercase flex-1">{item.name}</span>
                              </div>
                              <span className="text-[10px] font-black ml-2 shrink-0">{formatCurrency(item.value)}</span>
                           </div>
                        ))}
                        {topSpendingData.length === 0 && (
                           <p className="text-[10px] font-bold text-muted-foreground italic uppercase text-center pt-8">Sem despesas registradas</p>
                        )}
                     </div>
                     {totalCategorySpending > 0 && (
                        <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between">
                           <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total do Mês</span>
                           <span className="text-sm font-black text-rose-500">{formatCurrency(totalCategorySpending)}</span>
                        </div>
                     )}
                  </div>
               </div>
            </div>

            {/* Limite de Gastos */}
            <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm flex flex-col gap-6">
               <div className="flex items-center justify-between">
                  <div>
                     <h3 className="text-lg font-black uppercase tracking-tighter flex items-center gap-2">
                        <Target size={20} className="text-primary" /> Limite de Gastos
                     </h3>
                     <p className="text-[10px] font-bold text-muted-foreground uppercase">Proximidade do teto mensal</p>
                  </div>
                  <button onClick={() => setActiveTab('categories')} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Ver Metas</button>
               </div>

               <div className="space-y-4 flex-1">
                  {budgetProgress.map((item, i) => (
                     <div key={i} className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase">
                           <span className="truncate max-w-[60%]">{item.name}</span>
                           <span className={cn(item.percent > 90 ? "text-rose-500" : "text-primary")}>{item.percent}%</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                           <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.percent}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className={cn(
                                 "h-full rounded-full",
                                 item.percent > 90 ? "bg-rose-500" : item.percent > 75 ? "bg-yellow-500" : "bg-primary"
                              )}
                           />
                        </div>
                        <div className="flex justify-between text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                           <span>{formatCurrency(item.spent)} gastos</span>
                           <span>Limite {formatCurrency(item.limit)}</span>
                        </div>
                     </div>
                  ))}
                  {budgetProgress.length === 0 && (
                     <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-[10px] font-bold uppercase italic p-8 text-center pt-12">
                        <p>Nenhum limite definido</p>
                        <button onClick={() => setActiveTab('categories')} className="mt-2 text-primary underline not-italic">Definir limites em Categorias</button>
                     </div>
                  )}
               </div>
            </div>
         </div>

         {/* 4. Bottom Section: Relatórios (Historical Charts) */}
         <div className="p-10 bg-card rounded-[3rem] border border-border shadow-sm space-y-8">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
               <div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground flex items-center gap-3">
                     <div className="w-1.5 h-10 bg-primary rounded-full" />
                     Relatórios
                  </h2>
                  <p className="text-muted-foreground text-sm font-medium mt-1">
                     {reportType === 'fluxo' ? 'Análise de Fluxo de Caixa Geral' : reportType === 'conta' ? 'Análise Detalhada por Conta' : 'Análise de Despesas por Categoria'}
                  </p>
               </div>

               <div className="flex flex-wrap items-center gap-3 max-w-full">
                  {/* Back Button (If viewing specific account) */}
                  {reportType === 'conta' && reportWalletId && (
                     <button
                        onClick={() => setReportWalletId(null)}
                        className="flex items-center gap-2 px-4 h-11 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 shrink-0"
                     >
                        <ArrowRightLeft size={16} /> Trocar Conta
                     </button>
                  )}

                  {/* Report Type Toggle */}
                  <div className="flex bg-muted/50 p-1 rounded-2xl border border-border/30 h-11 shadow-sm overflow-x-auto no-scrollbar max-w-full">
                     <button
                        onClick={() => {
                           setReportType('fluxo');
                           setReportWalletId(null);
                        }}
                        className={cn(
                           "px-4 h-full rounded-xl transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2",
                           reportType === 'fluxo' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:bg-muted"
                        )}
                     >
                        <PieIcon size={14} /> Fluxo Geral
                     </button>
                     <button
                        onClick={() => setReportType('conta')}
                        className={cn(
                           "px-4 h-full rounded-xl transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2",
                           reportType === 'conta' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:bg-muted"
                        )}
                     >
                        <WalletIcon size={14} /> Por Conta
                     </button>
                     <button
                        onClick={() => {
                           setReportType('categoria');
                           setReportWalletId(null);
                           setReportPeriod(1);
                           setReportGranularity('daily');
                        }}
                        className={cn(
                           "px-4 h-full rounded-xl transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2",
                           reportType === 'categoria' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:bg-muted"
                        )}
                     >
                        <Tag size={14} /> Por Categoria
                     </button>
                  </div>

                  {/* Month/Year Navigation (Only for Single Month view) */}
                  {reportPeriod === 1 && (
                     <div className="flex flex-wrap items-center gap-3 max-w-full">
                        {reportType !== 'categoria' && (
                           <div className="flex bg-muted/50 p-1 rounded-2xl border border-border/30 h-11 shadow-sm overflow-x-auto no-scrollbar max-w-full">
                              {(['daily', 'weekly', 'monthly'] as const).map(g => (
                                 <button
                                    key={g}
                                    onClick={() => setReportGranularity(g)}
                                    className={cn(
                                       "px-4 h-full rounded-xl transition-all text-[10px] font-black uppercase tracking-widest",
                                       reportGranularity === g ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:bg-muted"
                                    )}
                                 >
                                    {g === 'daily' ? 'Diário' : g === 'weekly' ? 'Semanal' : 'Mensal'}
                                 </button>
                              ))}
                           </div>
                        )}

                        <div className="flex items-center bg-muted/50 p-1 rounded-2xl border border-border/30 h-11 shadow-sm shrink-0">
                           <button
                              onClick={() => {
                                 const d = new Date(reportReferenceDate);
                                 d.setMonth(d.getMonth() - 1);
                                 setReportReferenceDate(d);
                              }}
                              className="w-10 h-full flex items-center justify-center text-muted-foreground hover:bg-muted rounded-xl transition-colors"
                           >
                              <ChevronLeft size={16} />
                           </button>
                           <div className="px-3 text-[10px] font-black uppercase tracking-widest text-foreground min-w-[120px] text-center">
                              {reportReferenceDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}
                           </div>
                           <button
                              onClick={() => {
                                 const d = new Date(reportReferenceDate);
                                 d.setMonth(d.getMonth() + 1);
                                 setReportReferenceDate(d);
                              }}
                              className="w-10 h-full flex items-center justify-center text-muted-foreground hover:bg-muted rounded-xl transition-colors"
                           >
                              <ChevronRight size={16} />
                           </button>
                        </div>
                     </div>
                  )}

                  {/* Period Buttons */}
                  {reportType !== 'categoria' && (
                     <div className="flex bg-muted/50 p-1 rounded-2xl border border-border/30 h-11 shadow-sm overflow-x-auto no-scrollbar max-w-full">
                        <button
                           onClick={() => setReportPeriod(1)}
                           className={cn(
                              "px-4 h-full rounded-xl transition-all text-[10px] font-black uppercase tracking-widest",
                              reportPeriod === 1 ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:bg-muted"
                           )}
                        >
                           Mês
                        </button>
                        {[3, 6, 9, 12].map(m => (
                           <button
                              key={m}
                              onClick={() => setReportPeriod(m as any)}
                              className={cn(
                                 "px-4 h-full rounded-xl transition-all text-[10px] font-black uppercase tracking-widest",
                                 reportPeriod === m ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:bg-muted"
                              )}
                           >
                              {m} Meses
                           </button>
                        ))}
                     </div>
                  )}
               </div>
            </div>


            {/* Report Content Body Section */}
            <AnimatePresence mode="wait">
               {reportType === 'conta' && !reportWalletId ? (
                  <motion.div
                     key="account-grid"
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -20 }}
                     className="space-y-12 py-10"
                  >
                     {groupedAccounts.map(group => (
                        <div key={group.id} className="space-y-4">
                           <div className="flex items-center gap-4">
                              <div className="h-px flex-1 bg-border/40" />
                              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground bg-muted/30 px-4 py-1.5 rounded-full border border-border/40">
                                 {group.name}
                              </h3>
                              <div className="h-px flex-1 bg-border/40" />
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                              {group.items.map(wallet => (
                                 <button
                                    key={wallet.id}
                                    onClick={() => setReportWalletId(wallet.id)}
                                    className="p-6 bg-muted/20 border border-border/50 rounded-[2.5rem] flex flex-col items-center gap-4 hover:bg-primary/5 hover:border-primary/30 hover:scale-[1.02] transition-all group"
                                 >
                                    <IconRenderer
                                       icon={wallet.logoUrl || wallet.icon || 'wallet'}
                                       color={wallet.color}
                                       size={48}
                                       className="group-hover:scale-110 transition-transform shadow-sm"
                                    />
                                    <div className="text-center">
                                       <h4 className="text-sm font-black tracking-tight text-foreground line-clamp-1">{wallet.name}</h4>
                                       <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">Analisar Movimentação</p>
                                    </div>
                                 </button>
                              ))}
                           </div>
                        </div>
                     ))}
                  </motion.div>
               ) : (
                  <motion.div
                     key="chart-view"
                     initial={{ opacity: 0, scale: 0.98 }}
                     animate={{ opacity: 1, scale: 1 }}
                     className="space-y-8"
                  >
                     <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           {reportType === 'categoria' ? (
                              <LineChart data={chartData}>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                 <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} dy={10} />
                                 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} tickFormatter={(value) => `R$${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`} />
                                 <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', backdropFilter: 'blur(8px)', padding: '16px' }} itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} />
                                 <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} />
                                 {activeCategoryNames.map((name, i) => {
                                    const catColors = categories.find(c => c.name === name)?.color || COLORS[i % COLORS.length];
                                    return (
                                       <Line key={name} type="monotone" dataKey={name} name={name} stroke={catColors} strokeWidth={4} dot={{ r: 4, strokeWidth: 0, fill: catColors }} activeDot={{ r: 6, strokeWidth: 0, fill: catColors }} connectNulls={false} />
                                    );
                                 })}
                              </LineChart>
                           ) : (
                              <ComposedChart data={chartData}>
                                 <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                       <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                       <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                       <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8} />
                                       <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                 </defs>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                 <XAxis
                                    dataKey="label"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                                    dy={10}
                                 />
                                 <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                                    tickFormatter={(value) => `R$${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`}
                                 />
                                 <Tooltip
                                    formatter={(value: number) => formatCurrency(value)}
                                    contentStyle={{
                                       backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                       borderRadius: '20px',
                                       border: 'none',
                                       boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                                       backdropFilter: 'blur(8px)',
                                       padding: '16px'
                                    }}
                                    itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                                 />
                                 <Legend
                                    verticalAlign="top"
                                    align="right"
                                    iconType="circle"
                                    wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                                 />
                                 <Bar
                                    dataKey="income"
                                    name="Entradas"
                                    fill="#10b981"
                                    radius={[6, 6, 0, 0]}
                                    barSize={20}
                                 />
                                 <Bar
                                    dataKey="expense"
                                    name="Saídas"
                                    fill="#f43f5e"
                                    radius={[6, 6, 0, 0]}
                                    barSize={20}
                                 />
                                 <Area
                                    type="monotone"
                                    dataKey="accumulated"
                                    name="Saldo Acumulado"
                                    stroke="#3b82f6"
                                    fillOpacity={1}
                                    fill="url(#colorIncome)"
                                    strokeWidth={4}
                                 />
                              </ComposedChart>
                           )}
                        </ResponsiveContainer>
                     </div>
                     {reportType === 'categoria' ? (
                        <div className="overflow-x-auto custom-scrollbar pb-4 mt-8">
                           <table className="w-full text-left border-collapse">
                              <thead>
                                 <tr>
                                    <th className="p-3 text-[10px] font-black uppercase text-muted-foreground whitespace-nowrap bg-card z-10 sticky left-0 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">Categoria</th>
                                    {chartData.map((d, i) => (
                                       <th key={i} className="p-3 text-[10px] font-black uppercase text-muted-foreground whitespace-nowrap min-w-[80px] text-right">{d.label}</th>
                                    ))}
                                    <th className="p-3 text-[10px] font-black uppercase text-muted-foreground whitespace-nowrap min-w-[100px] text-right text-rose-500/50">Total</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {activeCategoryNames.map((name, i) => {
                                    const totalCat = chartData.reduce((acc, bucket) => acc + ((bucket as any)[name] || 0), 0);
                                    return (
                                       <tr key={name} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                                          <td className="p-3 bg-card z-10 sticky left-0 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">
                                             <div className="flex items-center gap-2">
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: categories.find(c => c.name === name)?.color || COLORS[i % COLORS.length] }}>
                                                   <IconRenderer icon={categories.find(c => c.name === name)?.icon || 'Tag'} size={40} simple scale={0.65} className="text-white" />
                                                </div>
                                                <span className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap">{name}</span>
                                             </div>
                                          </td>
                                          {chartData.map((d, idx) => {
                                             const val = (d as any)[name] || 0;
                                             return (
                                                <td key={idx} className={cn("p-3 text-[10px] font-bold text-right", val > 0 ? "text-foreground" : "text-muted-foreground/30")}>
                                                   {val > 0 ? formatCurrency(val) : '-'}
                                                </td>
                                             );
                                          })}
                                          <td className="p-3 text-[11px] font-black text-right text-rose-500 bg-rose-500/5 rounded-r-xl">
                                             {formatCurrency(totalCat)}
                                          </td>
                                       </tr>
                                    );
                                 })}
                              </tbody>
                              <tfoot>
                                 <tr className="bg-muted/50 border-t-2 border-border/60 font-black">
                                    <td className="p-4 bg-muted/50 z-10 sticky left-0 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] uppercase tracking-widest text-[10px]">Total Geral</td>
                                    {chartData.map((d, idx) => {
                                       const colTotal = activeCategoryNames.reduce((acc, name) => acc + ((d as any)[name] || 0), 0);
                                       return (
                                          <td key={idx} className="p-3 text-[10px] font-black text-right text-foreground">
                                             {colTotal > 0 ? formatCurrency(colTotal) : '-'}
                                          </td>
                                       );
                                    })}
                                    <td className="p-3 text-[11px] font-black text-right text-rose-600 bg-rose-500/10 rounded-br-xl">
                                       {formatCurrency(
                                          chartData.reduce((grandTotal, bucket) =>
                                             grandTotal + activeCategoryNames.reduce((acc, name) => acc + ((bucket as any)[name] || 0), 0),
                                             0)
                                       )}
                                    </td>
                                 </tr>
                              </tfoot>
                           </table>
                        </div>
                     ) : (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
                           <div className="p-6 bg-muted/30 rounded-3xl border border-border/50 text-center">
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Média de Receitas</p>
                              <h3 className="text-2xl font-black text-emerald-500">
                                 {formatCurrency(chartData.reduce((acc, curr) => acc + curr.income, 0) / chartData.length)}
                              </h3>
                           </div>
                           <div className="p-6 bg-muted/30 rounded-3xl border border-border/50 text-center">
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Média de Despesas</p>
                              <h3 className="text-2xl font-black text-rose-500">
                                 {formatCurrency(chartData.reduce((acc, curr) => acc + curr.expense, 0) / chartData.length)}
                              </h3>
                           </div>
                           <div className="p-6 bg-muted/30 rounded-3xl border border-border/50 text-center">
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Melhor Mês Saldo</p>
                              <h3 className="text-2xl font-black text-orange-500 italic">
                                 {formatCurrency(Math.max(...chartData.map(d => d.balance)))}
                              </h3>
                           </div>
                           <div className="flex items-center justify-center">
                              <button
                                 onClick={() => setActiveTab('transactions')}
                                 className="flex items-center gap-2 group"
                              >
                                 <span className="text-[10px] font-black uppercase tracking-[0.2em] group-hover:text-primary transition-colors">Ver Lançamentos</span>
                                 <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-all">
                                    <ArrowRightLeft size={18} className="rotate-90" />
                                 </div>
                              </button>
                           </div>
                        </div>
                     )}

                     {/* New: Data Table for Detailed View */}
                     {reportPeriod === 1 && reportGranularity !== 'monthly' && reportType !== 'categoria' && (
                        <div className="pt-10 space-y-6">
                           <div className="flex items-center justify-between border-b border-border/50 pb-4">
                              <h4 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                                 <LayoutList size={18} className="text-primary" /> Detalhamento do Período
                              </h4>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase bg-muted/50 px-3 py-1 rounded-lg border border-border/30">
                                 {reportGranularity === 'daily' ? 'Visualização por Dia' : 'Visualização por Semana'}
                              </span>
                           </div>

                           <div className="overflow-x-auto custom-scrollbar rounded-[2rem] border border-border/50 bg-muted/10 backdrop-blur-sm shadow-sm">
                              <table className="w-full text-left border-collapse min-w-[600px]">
                                 <thead>
                                    <tr className="bg-muted/30">
                                       <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground w-20">
                                          {reportGranularity === 'daily' ? 'Dia' : 'Semana'}
                                       </th>
                                       <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Entradas</th>
                                       <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Saídas</th>
                                       <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Resultado</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-border/30">
                                    {(isPeriodExpanded ? chartData : chartData.slice(0, 5)).map((row, idx) => (
                                       <tr key={idx} className="hover:bg-primary/5 transition-colors group">
                                          <td className="px-4 py-4">
                                             <span className="text-[10px] font-black uppercase tracking-tighter text-foreground group-hover:text-primary transition-colors">
                                                {row.label}
                                             </span>
                                          </td>
                                          <td className="px-4 py-4 text-right">
                                             <span className="text-[11px] font-extrabold text-emerald-500">
                                                {row.income > 0 ? formatCurrency(row.income) : '-'}
                                             </span>
                                          </td>
                                          <td className="px-4 py-4 text-right">
                                             <span className="text-[11px] font-extrabold text-rose-500">
                                                {row.expense + row.planned > 0 ? formatCurrency(row.expense + row.planned) : '-'}
                                             </span>
                                          </td>
                                          <td className="px-4 py-4 text-right">
                                             <div className={cn(
                                                "inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-sm",
                                                row.balance > 0 ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                                   row.balance < 0 ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" :
                                                      "bg-muted text-muted-foreground"
                                             )}>
                                                {row.balance !== 0 ? formatCurrency(row.balance) : 'Equilibrado'}
                                             </div>
                                          </td>
                                       </tr>
                                    ))}
                                 </tbody>
                                 <tfoot>
                                    <tr className="bg-muted/20 border-t border-border/50">
                                       <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-foreground">Total Líquido</th>
                                       <th className="px-4 py-4 text-right text-[11px] font-black text-emerald-600">
                                          {formatCurrency(chartData.reduce((acc, curr) => acc + curr.income, 0))}
                                       </th>
                                       <th className="px-4 py-4 text-right text-[11px] font-black text-rose-600">
                                          {formatCurrency(chartData.reduce((acc, curr) => acc + curr.expense + curr.planned, 0))}
                                       </th>
                                       <th className="px-4 py-4 text-right">
                                          <span className={cn(
                                             "text-sm font-black italic",
                                             chartData[chartData.length - 1].accumulated >= 0 ? "text-emerald-500" : "text-rose-500"
                                          )}>
                                             {formatCurrency(chartData[chartData.length - 1].accumulated)}
                                          </span>
                                       </th>
                                    </tr>
                                 </tfoot>
                              </table>
                           </div>

                           {chartData.length > 5 && (
                              <div className="flex justify-center mt-4">
                                 <button
                                    onClick={() => setIsPeriodExpanded(!isPeriodExpanded)}
                                    className="flex items-center gap-2 px-6 py-3 bg-muted/50 hover:bg-primary/10 hover:text-primary rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-border/30 shadow-sm"
                                 >
                                    {isPeriodExpanded ? (
                                       <>Ocultar Período <ChevronUp size={14} /></>
                                    ) : (
                                       <>Ver Todo o Período <ChevronDown size={14} /></>
                                    )}
                                 </button>
                              </div>
                           )}
                        </div>
                     )}
                  </motion.div>
               )}
            </AnimatePresence>
         </div>

         {/* Modular Modal */}
         <PendingTransactionsModal
            isOpen={pendingModalType !== null}
            onClose={() => setPendingModalType(null)}
            type={pendingModalType || 'payable'}
         />

         {/* Modal de Detalhes da Categoria */}
         <AnimatePresence>
            {selectedCategoryDetail && (
               <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                  <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     onClick={() => setSelectedCategoryDetail(null)}
                     className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  />
                  <motion.div
                     initial={{ scale: 0.9, opacity: 0, y: 20 }}
                     animate={{ scale: 1, opacity: 1, y: 0 }}
                     exit={{ scale: 0.9, opacity: 0, y: 20 }}
                     className="relative bg-card w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-border overflow-hidden"
                  >
                     <div className="p-8 flex flex-col gap-8">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-4">
                              <div
                                 className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                                 style={{ backgroundColor: selectedCategoryDetail.color + '20' }}
                              >
                                 <IconRenderer
                                    icon={selectedCategoryDetail.icon}
                                    color={selectedCategoryDetail.color}
                                    size={24}
                                 />
                              </div>
                              <div>
                                 <h2 className="text-xl font-black uppercase tracking-tighter">{selectedCategoryDetail.name}</h2>
                                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Detalhamento de Gastos</p>
                              </div>
                           </div>
                           <button
                              onClick={() => setSelectedCategoryDetail(null)}
                              className="p-3 hover:bg-muted rounded-2xl transition-all"
                           >
                              <X size={20} />
                           </button>
                        </div>

                        <div className="bg-muted/30 p-6 rounded-[2rem] border border-border/50 text-center">
                           <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Total Gasto no Período</span>
                           <h3 className="text-3xl font-black text-rose-500">
                              {formatCurrency(topSpendingData.find(d => d.name === selectedCategoryDetail.name)?.value || 0)}
                           </h3>
                        </div>

                        <div className="space-y-3">
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">Subcategorias</h4>
                           <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                              {subcategoriesDetail.length > 0 ? (
                                 subcategoriesDetail.map((sub, idx) => (
                                    <div key={idx} className="group flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border/30 hover:bg-muted/40 transition-all">
                                       <div className="flex items-center gap-3">
                                          <div className="shrink-0">
                                             <IconRenderer
                                                icon={sub.icon || 'Tag'}
                                                color={selectedCategoryDetail.color}
                                                size={18}
                                             />
                                          </div>
                                          <div className="flex flex-col">
                                             <span className="text-[11px] font-bold uppercase tracking-tight">{sub.name}</span>
                                             {sub.id !== 'unclassified' && (
                                                <button
                                                   onClick={() => {
                                                      setHistoryCategoryId(sub.id);
                                                      setIsHistoryOpen(true);
                                                   }}
                                                   className="text-[8px] font-black uppercase text-primary hover:underline flex items-center gap-1 mt-0.5 w-fit"
                                                >
                                                   <History size={10} /> Ver Lançamentos
                                                </button>
                                             )}
                                          </div>
                                       </div>
                                       <span className="text-[11px] font-black">{formatCurrency((sub as any).total || 0)}</span>
                                    </div>
                                 ))
                              ) : (
                                 <div className="py-8 text-center bg-muted/10 rounded-2xl border border-dashed border-border/50">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase italic px-4">Esta categoria não possui subcategorias vinculadas.</p>
                                 </div>
                              )}
                           </div>
                        </div>

                        <button
                           onClick={() => {
                              setHistoryCategoryId(null);
                              setIsHistoryOpen(true);
                           }}
                           className="w-full py-4 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
                        >
                           <History size={16} />
                           Ver Lançamentos (Total)
                        </button>
                     </div>
                  </motion.div>
               </div>
            )}
         </AnimatePresence>

         {/* Modal de Histórico de Lançamentos */}
         {selectedCategoryDetail && (
            <CategoryHistoryModal
               isOpen={isHistoryOpen}
               onClose={() => {
                  setIsHistoryOpen(false);
                  setHistoryCategoryId(null);
                  setSelectedCategoryDetail(null);
               }}
               onBack={() => {
                  setIsHistoryOpen(false);
                  setHistoryCategoryId(null);
               }}
               categoryId={historyCategoryId || selectedCategoryDetail.id}
               categories={categories}
               transactions={transactions}
               wallets={wallets}
               updateTransaction={updateTransaction}
               deleteTransaction={deleteTransaction}
               onEditTransaction={(tx) => {
                  setEditingTransaction(tx);
                  setModalOpen(true);
               }}
               filterMonth={reportPeriod === 1 ? new Date(reportReferenceDate).getUTCMonth() + 1 : currentMonth}
               filterYear={reportPeriod === 1 ? new Date(reportReferenceDate).getUTCFullYear() : currentYear}
               paymentFilter="all"
            />
         )}

         {/* Ajuste no TransactionModal para suportar edição vinda do histórico */}
         <TransactionModal
            isOpen={modalOpen}
            onClose={() => {
               setModalOpen(false);
               setEditingTransaction(null);
            }}
            initialType={modalType}
            editingTransaction={editingTransaction || undefined}
         />

      </div>
   );
};
