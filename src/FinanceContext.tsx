import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction, Category, Wallet, ProfileType, EquityAsset, EquityHistory } from './types';
import { supabase } from './lib/supabase';
import { useAuth } from './contexts/AuthContext';
import { getInvoicePeriod } from './lib/utils';

interface FinanceContextType {
  transactions: Transaction[];
  categories: Category[];
  wallets: Wallet[];
  profile: ProfileType;
  theme: 'light' | 'dark';
  loading: boolean;
  activeSpace: 'personal' | 'business';
  setActiveSpace: (space: 'personal' | 'business') => void;
  toggleTheme: () => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
  addTransactions: (txs: Omit<Transaction, 'id'>[]) => Promise<void>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (c: Omit<Category, 'id' | 'userId' | 'space'>) => Promise<void>;
  updateCategory: (id: string, c: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  toggleCategoryActive: (id: string) => Promise<void>;
  addWallet: (w: Omit<Wallet, 'id'>) => Promise<void>;
  updateWallet: (id: string, w: Partial<Wallet>) => Promise<void>;
  toggleWalletActive: (id: string) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  updateActivity: (type: 'access' | 'update') => Promise<void>;
  includeCategoryLimits: boolean;
  setIncludeCategoryLimits: (v: boolean) => void;
  seedCategories: (space: 'personal' | 'business', targetUserId?: string) => Promise<void>;
  orderedCards: string[];
  orderedAccounts: string[];
  saveWalletOrder: (cards: string[], accounts: string[]) => Promise<void>;
  initializedSpaces: ('personal' | 'business')[];
  overdueServices: any[];
  hasAcknowledgedOverdue: boolean;
  acknowledgeOverdue: () => void;
  tasks: any[];
  setGlobalTasks: (tasks: any[]) => void;
  equityAssets: EquityAsset[];
  equityHistory: EquityHistory[];
  addEquityAsset: (asset: Omit<EquityAsset, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateEquityAsset: (id: string, asset: Partial<EquityAsset>) => Promise<void>;
  deleteEquityAsset: (id: string) => Promise<void>;
  updateEquityValue: (assetId: string, monthYear: string, value: number, observation: string) => Promise<void>;
  deleteEquityValue: (id: string) => Promise<void>;
  debts: any[];
  debtHistory: any[];
  addDebt: (debt: any) => Promise<void>;
  updateDebt: (id: string, debt: any) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  updateDebtValue: (debtId: string, monthYear: string, value: number, observation: string) => Promise<void>;
  deleteDebtValue: (id: string) => Promise<void>;
  nonRecurringExpenses: NonRecurringExpense[];
  addNonRecurringExpense: (expense: Omit<NonRecurringExpense, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateNonRecurringExpense: (id: string, expense: Partial<NonRecurringExpense>) => Promise<void>;
  deleteNonRecurringExpense: (id: string) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const INITIAL_CATEGORIES_TEMPLATE: Omit<Category, 'id' | 'userId' | 'space'>[] = [
  // RECEITAS
  { name: 'Salário', type: 'income', icon: '/categorias/salario.png', color: '#10b981', isActive: true },
  { name: 'Investimentos', type: 'income', icon: '/categorias/investimento.png', color: '#10b981', isActive: true },
  { name: 'Empréstimos', type: 'income', icon: '/categorias/emprestimo.png', color: '#10b981', isActive: true },
  { name: 'Outras receitas', type: 'income', icon: '/categorias/outras.png', color: '#10b981', isActive: true },

  // DESPESAS
  { name: 'Alimentação', type: 'expense', icon: '/categorias/alimentacao.png', color: '#f43f5e', isActive: true, limit: 0 },
  { name: 'Assinaturas e serviços', type: 'expense', icon: '/categorias/assinaturas.png', color: '#8b5cf6', isActive: true },
  { name: 'Bares e restaurantes', type: 'expense', icon: '/categorias/bares.png', color: '#f59e0b', isActive: true },
  { name: 'Moradia', type: 'expense', icon: '/categorias/moradia.png', color: '#3b82f6', isActive: true },
  { name: 'Compras', type: 'expense', icon: '/categorias/compras.png', color: '#ec4899', isActive: true },
  { name: 'Cuidados pessoais', type: 'expense', icon: '/categorias/cuidados.png', color: '#d946ef', isActive: true },
  { name: 'Dívidas e empréstimos', type: 'expense', icon: '/categorias/dividas.png', color: '#64748b', isActive: true },
  { name: 'Educação', type: 'expense', icon: '/categorias/educacao.png', color: '#6366f1', isActive: true },
  { name: 'Família e filhos', type: 'expense', icon: '/categorias/familia.png', color: '#f97316', isActive: true },
  { name: 'Impostos e taxas', type: 'expense', icon: '/categorias/taxas.png', color: '#475569', isActive: true },
  { name: 'Investimentos', type: 'expense', icon: '/categorias/investimentos.png', color: '#0ea5e9', isActive: true },
  { name: 'Lazer e hobbies', type: 'expense', icon: '/categorias/lazer.png', color: '#84cc16', isActive: true, limit: 0 },
  { name: 'Mercado', type: 'expense', icon: '/categorias/mercado.png', color: '#10b981', isActive: true },
  { name: 'Outros', type: 'expense', icon: '/categorias/outros.png', color: '#94a3b8', isActive: true },
  { name: 'Pets', type: 'expense', icon: '/categorias/pet.png', color: '#a855f7', isActive: true },
  { name: 'Presentes e doações', type: 'expense', icon: '/categorias/doacao.png', color: '#f43f5e', isActive: true },
  { name: 'Roupas', type: 'expense', icon: '/categorias/roupas.png', color: '#ec4899', isActive: true },
  { name: 'Saúde', type: 'expense', icon: '/categorias/saude.png', color: '#ef4444', isActive: true },
  { name: 'Trabalho', type: 'expense', icon: '/categorias/trabalho.png', color: '#06b6d4', isActive: true },
  { name: 'Viagem', type: 'expense', icon: '/categorias/viagem.png', color: '#14b8a6', isActive: true },
  { name: 'Transporte', type: 'expense', icon: '/categorias/transporte.png', color: '#3b82f6', isActive: true, limit: 0 },
];

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, viewingUserId, viewingProfile } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [rawWallets, setRawWallets] = useState<Wallet[]>([]);
  const [activeSpace, setActiveSpace] = useState<'personal' | 'business'>('personal');
  const [isSpaceInitialized, setIsSpaceInitialized] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [loading, setLoading] = useState(true);
  const [orderedCards, setOrderedCards] = useState<string[]>([]);
  const [orderedAccounts, setOrderedAccounts] = useState<string[]>([]);
  const [includeCategoryLimits, setIncludeCategoryLimits] = useState<boolean>(() => {
    const saved = localStorage.getItem('includeCategoryLimits');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [overdueServices, setOverdueServices] = useState<any[]>([]);
  const [hasAcknowledgedOverdue, setHasAcknowledgedOverdue] = useState<boolean>(() => {
    return sessionStorage.getItem('overdue_acknowledged') === 'true';
  });
  const [tasks, setGlobalTasks] = useState<any[]>([]);
  const [equityAssets, setEquityAssets] = useState<EquityAsset[]>([]);
  const [equityHistory, setEquityHistory] = useState<EquityHistory[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [debtHistory, setDebtHistory] = useState<any[]>([]);
  const [nonRecurringExpenses, setNonRecurringExpenses] = useState<NonRecurringExpense[]>([]);

  const acknowledgeOverdue = () => {
    setHasAcknowledgedOverdue(true);
    sessionStorage.setItem('overdue_acknowledged', 'true');
  };
  const isFetchingData = React.useRef(false);
  const lastActivityUpdate = React.useRef<number>(0);
  const lastFetchedId = React.useRef<string>('');
  const lastFetchedSpace = React.useRef<string>('');
 
  const effectiveUserId = viewingUserId || user?.id;
  const storageId = user?.id;

  const fetchData = useCallback(async () => {
    if (!user || !effectiveUserId || !isSpaceInitialized || isFetchingData.current) {
      // Se não há requisitos ou já está buscando, não bloqueia a tela infinitamente
      if (!isFetchingData.current) setLoading(false);
      return;
    }
    
    isFetchingData.current = true;

    // Detectar mudança de identidade (usuário ou espaço) para limpar o estado imediatamente
    const identityChanged = lastFetchedId.current !== effectiveUserId || lastFetchedSpace.current !== activeSpace;
    if (identityChanged) {
      setTransactions([]);
      setCategories([]);
      setRawWallets([]);
      setGlobalTasks([]);
      setEquityAssets([]);
      setEquityHistory([]);
      setDebts([]);
      setDebtHistory([]);
      setNonRecurringExpenses([]);
      setOverdueServices([]);
      setOrderedCards([]);
      setOrderedAccounts([]);
      
      lastFetchedId.current = effectiveUserId || '';
      lastFetchedSpace.current = activeSpace;
    }

    setLoading(true);
    try {
      // 1. Categorias

      const { data: cats, error: catErr } = await supabase
        .from('categories')
        .select('*')
        .eq('userId', effectiveUserId)
        .eq('space', activeSpace)
        .order('name');
      
      if (catErr) throw catErr;

      let finalCats = cats || [];
      setCategories(prev => {
        const optimistic = prev.filter(c => typeof c.id === 'string' && c.id.startsWith('temp-'));
        const filteredOptimistic = optimistic.filter(opt => !finalCats.some(c => c.name === opt.name));
        return [...finalCats, ...filteredOptimistic];
      });

      // 2. Carteiras
      const { data: wals, error: walErr } = await supabase
        .from('wallets')
        .select('*')
        .eq('userId', effectiveUserId)
        .eq('space', activeSpace)
        .order('created_at');
      if (walErr) throw walErr;
      const fetchedWallets = wals || [];
      // Preservar itens otimistas (temp-) que ainda não foram confirmados, para evitar que desapareçam se o fetchData rodar rápido demais
      setRawWallets(prev => {
        const optimistic = prev.filter(w => typeof w.id === 'string' && w.id.startsWith('temp-'));
        // Evitar duplicatas se o item real já estiver no fetch
        const filteredOptimistic = optimistic.filter(opt => !fetchedWallets.some(w => w.name === opt.name && w.type === opt.type));
        return [...fetchedWallets, ...filteredOptimistic];
      });

      // 3. Carregar Ordenação do user_metadata
      if (user.user_metadata) {
        const metadata = user.user_metadata;
        const cardOrderKey = `wallet_order_${activeSpace}_cards`;
        const accountOrderKey = `wallet_order_${activeSpace}_accounts`;
        
        // Sincronizar Cartões
        const cards = fetchedWallets.filter(w => w.type === 'credit_card' && w.isActive !== false).map(w => w.id);
        let finalCardOrder: string[] = [];
        if (metadata[cardOrderKey]) {
          const parsed = metadata[cardOrderKey];
          const valid = parsed.filter((id: string) => cards.includes(id));
          const missing = cards.filter(id => !parsed.includes(id));
          finalCardOrder = [...valid, ...missing];
        } else {
          finalCardOrder = cards;
        }
        setOrderedCards(finalCardOrder);

        // Sincronizar Contas
        const accounts = fetchedWallets.filter(w => w.type !== 'credit_card' && w.isActive !== false).map(w => w.id);
        let finalAccountOrder: string[] = [];
        if (metadata[accountOrderKey]) {
          const parsed = metadata[accountOrderKey];
          const valid = parsed.filter((id: string) => accounts.includes(id));
          const missing = accounts.filter(id => !parsed.includes(id));
          finalAccountOrder = [...valid, ...missing];
        } else {
          finalAccountOrder = accounts;
        }
        setOrderedAccounts(finalAccountOrder);
      }

      // 4. Transações
      const { data: txs, error: txErr } = await supabase
        .from('transactions')
        .select('*')
        .eq('userId', effectiveUserId)
        .eq('space', activeSpace)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
      if (txErr) throw txErr;
      const txsData = txs || [];
      setTransactions(prev => {
        const optimistic = prev.filter(t => typeof t.id === 'string' && t.id.startsWith('temp-'));
        return [...txsData, ...optimistic];
      });

      // 5. Tarefas
      const { data: fetchedTasks, error: taskErr } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', effectiveUserId)
        .eq('archived', false);
      
      if (!taskErr) {
        setGlobalTasks(fetchedTasks || []);
      }

      // 6. Verificar pagamentos em atraso (Somente para o usuário real, não em visualização)
      if (profile?.role === 'user' && !viewingUserId) {
        const today = new Date().toISOString().split('T')[0];
        const { data: svcs, error: svcsErr } = await supabase
          .from('contracted_services')
          .select('*')
          .eq('client_id', effectiveUserId)
          .eq('status', 'pending')
          .lt('due_date', today);
        
        if (!svcsErr) {
          setOverdueServices(svcs || []);
        }
      } else {
        setOverdueServices([]);
      }

      // 7. Patrimônio
      const { data: eAssets, error: eAssetsErr } = await supabase
        .from('equity_assets')
        .select('*')
        .eq('user_id', effectiveUserId)
        .eq('space', activeSpace)
        .order('created_at', { ascending: false });

      if (eAssetsErr) throw eAssetsErr;
      const fetchedEquity = eAssets || [];
      setEquityAssets(prev => {
        const optimistic = prev.filter(a => typeof a.id === 'string' && a.id.startsWith('temp-'));
        const filteredOptimistic = optimistic.filter(opt => !fetchedEquity.some(a => a.name === opt.name));
        return [...fetchedEquity, ...filteredOptimistic];
      });

      if (fetchedEquity.length > 0) {
        const assetIds = fetchedEquity.map(a => a.id);
        const { data: eHistory, error: eHistoryErr } = await supabase
          .from('equity_history')
          .select('*')
          .in('asset_id', assetIds);

        if (eHistoryErr) throw eHistoryErr;
        setEquityHistory(eHistory || []);
      } else {
        setEquityHistory([]);
      }

      // 8. Dívidas
      const { data: dData, error: dErr } = await supabase
        .from('debts')
        .select('*')
        .eq('user_id', effectiveUserId)
        .eq('space', activeSpace)
        .order('created_at', { ascending: false });

      if (dErr) throw dErr;
      const fetchedDebts = dData || [];
      setDebts(prev => {
        const optimistic = prev.filter(a => typeof a.id === 'string' && a.id.startsWith('temp-'));
        const filteredOptimistic = optimistic.filter(opt => !fetchedDebts.some(a => a.name === opt.name));
        return [...fetchedDebts, ...filteredOptimistic];
      });

      if (fetchedDebts.length > 0) {
        const debtIds = fetchedDebts.map(a => a.id);
        const { data: dHistory, error: dHistoryErr } = await supabase
          .from('debt_history')
          .select('*')
          .in('debt_id', debtIds);

        if (dHistoryErr) throw dHistoryErr;
        setDebtHistory(dHistory || []);
      } else {
        setDebtHistory([]);
      }

      // 9. Gastos Não Recorrentes
      const { data: nrData, error: nrErr } = await supabase
        .from('non_recurring_expenses')
        .select('*')
        .eq('user_id', effectiveUserId)
        .eq('space', activeSpace)
        .order('created_at', { ascending: false });

      if (nrErr) throw nrErr;
      const fetchedNR = nrData || [];
      setNonRecurringExpenses(prev => {
        const optimistic = prev.filter(a => typeof a.id === 'string' && a.id.startsWith('temp-'));
        const filteredOptimistic = optimistic.filter(opt => !fetchedNR.some(a => a.description === opt.description));
        return [...fetchedNR, ...filteredOptimistic];
      });
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
    } finally {
      setLoading(false);
      isFetchingData.current = false;
    }
  }, [user, effectiveUserId, activeSpace, isSpaceInitialized]);

  const currentMetadata = viewingProfile ? viewingProfile.user_metadata : user?.user_metadata;
  const initializedSpaces = (currentMetadata?.initialized_spaces || []) as ('personal' | 'business')[];

  useEffect(() => {
    if (user && !isSpaceInitialized) {
      if (initializedSpaces.length === 1) {
        setActiveSpace(initializedSpaces[0]);
      } 
      setIsSpaceInitialized(true);
    }
  }, [user, isSpaceInitialized, initializedSpaces]);

  useEffect(() => {
    if (isSpaceInitialized) {
      fetchData();
    }
  }, [fetchData, isSpaceInitialized]);

  // Realtime Sync for Wallets, Categories and Transactions
  useEffect(() => {
    if (!effectiveUserId || !isSpaceInitialized) return;

    const channel = supabase
      .channel(`finance_sync_${effectiveUserId}_${activeSpace}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'wallets',
        filter: `userId=eq.${effectiveUserId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setRawWallets(prev => {
            // BUG FIX: Somente adicionar se pertencer ao espaço ativo
            if (payload.new.space !== activeSpace) return prev;
            if (prev.some(w => w.id === payload.new.id)) return prev;
            // Se já existir um item otimista com o mesmo nome/tipo, removemos ele para dar lugar ao real
            return [...prev.filter(w => !(typeof w.id === 'string' && w.id.startsWith('temp-') && w.name === payload.new.name)), payload.new as Wallet];
          });
        } else if (payload.eventType === 'UPDATE') {
          setRawWallets(prev => prev.map(w => w.id === payload.new.id ? { ...w, ...payload.new } : w));
        } else if (payload.eventType === 'DELETE') {
          setRawWallets(prev => prev.filter(w => w.id !== payload.old.id));
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'categories',
        filter: `userId=eq.${effectiveUserId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setCategories(prev => {
            if (payload.new.space !== activeSpace) return prev;
            if (prev.some(c => c.id === payload.new.id)) return prev;
            return [...prev.filter(c => !(typeof c.id === 'string' && c.id.startsWith('temp-') && c.name === payload.new.name)), payload.new as Category];
          });
        } else if (payload.eventType === 'UPDATE') {
          setCategories(prev => prev.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c));
        } else if (payload.eventType === 'DELETE') {
          setCategories(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions',
        filter: `userId=eq.${effectiveUserId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTransactions(prev => {
            if (payload.new.space !== activeSpace) return prev;
            if (prev.some(t => t.id === payload.new.id)) return prev;
            
            // Tentar encontrar uma transação otimista correspondente para evitar duplicidade momentânea
            const isOptimisticMatch = (t: Transaction) => 
              typeof t.id === 'string' && 
              t.id.startsWith('temp-') && 
              t.description === payload.new.description && 
              t.amount === payload.new.amount &&
              t.date === payload.new.date;

            const filtered = prev.filter(t => !isOptimisticMatch(t));
            return [payload.new as Transaction, ...filtered];
          });
        } else if (payload.eventType === 'UPDATE') {
          setTransactions(prev => prev.map(t => t.id === payload.new.id ? { ...t, ...payload.new } : t));
        } else if (payload.eventType === 'DELETE') {
          setTransactions(prev => prev.filter(t => t.id !== payload.old.id));
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'equity_assets',
        filter: `user_id=eq.${effectiveUserId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setEquityAssets(prev => {
            if (payload.new.space !== activeSpace) return prev;
            if (prev.some(a => a.id === payload.new.id)) return prev;
            return [...prev.filter(a => !(typeof a.id === 'string' && a.id.startsWith('temp-') && a.name === payload.new.name)), payload.new as EquityAsset];
          });
        } else if (payload.eventType === 'UPDATE') {
          setEquityAssets(prev => prev.map(a => a.id === payload.new.id ? { ...a, ...payload.new } : a));
        } else if (payload.eventType === 'DELETE') {
          setEquityAssets(prev => prev.filter(a => a.id !== payload.old.id));
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'equity_history',
      }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setEquityHistory(prev => {
            const exists = prev.some(h => h.id === payload.new.id);
            if (exists) {
              return prev.map(h => h.id === payload.new.id ? payload.new as EquityHistory : h);
            }
            return [...prev, payload.new as EquityHistory];
          });
        } else if (payload.eventType === 'DELETE') {
          setEquityHistory(prev => prev.filter(h => h.id !== payload.old.id));
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'debts',
        filter: `user_id=eq.${effectiveUserId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setDebts(prev => {
            if (payload.new.space !== activeSpace) return prev;
            if (prev.some(a => a.id === payload.new.id)) return prev;
            return [...prev.filter(a => !(typeof a.id === 'string' && a.id.startsWith('temp-') && a.name === payload.new.name)), payload.new];
          });
        } else if (payload.eventType === 'UPDATE') {
          setDebts(prev => prev.map(a => a.id === payload.new.id ? { ...a, ...payload.new } : a));
        } else if (payload.eventType === 'DELETE') {
          setDebts(prev => prev.filter(a => a.id !== payload.old.id));
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'debt_history',
      }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setDebtHistory(prev => {
            const exists = prev.some(h => h.id === payload.new.id);
            if (exists) {
              return prev.map(h => h.id === payload.new.id ? payload.new : h);
            }
            return [...prev, payload.new];
          });
        } else if (payload.eventType === 'DELETE') {
          setDebtHistory(prev => prev.filter(h => h.id !== payload.old.id));
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'non_recurring_expenses',
        filter: `user_id=eq.${effectiveUserId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setNonRecurringExpenses(prev => {
            if (payload.new.space !== activeSpace) return prev;
            if (prev.some(a => a.id === payload.new.id)) return prev;
            return [...prev.filter(a => !(typeof a.id === 'string' && a.id.startsWith('temp-') && a.description === payload.new.description)), payload.new as NonRecurringExpense];
          });
        } else if (payload.eventType === 'UPDATE') {
          setNonRecurringExpenses(prev => prev.map(a => a.id === payload.new.id ? { ...a, ...payload.new } : a));
        } else if (payload.eventType === 'DELETE') {
          setNonRecurringExpenses(prev => prev.filter(a => a.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [effectiveUserId, activeSpace, isSpaceInitialized]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('includeCategoryLimits', JSON.stringify(includeCategoryLimits));
  }, [includeCategoryLimits]);

  const wallets = useMemo(() => {
    return rawWallets.map(w => {
      const txSum = transactions.reduce((sum, t) => {
        let balanceChange = 0;
        const isCreditCard = w.type === 'credit_card';
        
        const isExpenseType = t.type === 'expense' || t.type === 'planned' || t.type === 'provision';
        const isIncomeType = t.type === 'income';

        const shouldCountExpense = isCreditCard ? isExpenseType : (t.isPaid !== false && isExpenseType);
        const shouldCountIncome = isCreditCard ? isIncomeType : (t.isPaid !== false && isIncomeType);

        if (t.walletId === w.id) {
          if (shouldCountIncome) balanceChange += t.amount;
          if (shouldCountExpense) balanceChange -= t.amount;
          if (t.type === 'transfer') balanceChange -= t.amount;
        }

        const isInvoicePayment = t.description.toLowerCase().includes('pagamento de fatura');
        if ((t.type === 'transfer' || t.type === 'provision' || (isCreditCard && isInvoicePayment)) && t.toWalletId === w.id) {
          balanceChange += t.amount;
        }

        return sum + balanceChange;
      }, 0);
      
      return { ...w, balance: (w.initialBalance || 0) + txSum };
    });
  }, [transactions, rawWallets]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const addTransaction = async (tx: any) => {
    if (!user) return;
    
    // Clean joined fields that shouldn't be inserted
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, category, wallet, created_at: _ca, ...txToInsert } = tx;

    const walletData = wallets.find(w => w.id === txToInsert.walletId);
    if (walletData?.type === 'credit_card') {
      txToInsert.isPaid = true; 
      
      if (!txToInsert.invoiceMonth || !txToInsert.invoiceYear) {
        const period = getInvoicePeriod(walletData.closingDay || 5, walletData.dueDay || 15, new Date(txToInsert.date + 'T12:00:00'));
        txToInsert.invoiceMonth = period.due.getUTCMonth() + 1;
        txToInsert.invoiceYear = period.due.getUTCFullYear();
      }
    }
    if (txToInsert.isPaid && !txToInsert.paidDate) {
      txToInsert.paidDate = new Date().toISOString().split('T')[0];
    }

    // Prevent duplicates only for recurrent transactions (Ciclo/Recurrence)
    const isRecurrent = !!(txToInsert.groupId || txToInsert.isContinuous);
    if (isRecurrent) {
      const alreadyExists = transactions.some(t => 
        t.description === txToInsert.description && 
        t.date === txToInsert.date && 
        t.walletId === txToInsert.walletId && 
        t.amount === txToInsert.amount &&
        !t.isDeleted &&
        (t.groupId || t.isContinuous)
      );
      if (alreadyExists) return;
    }

    const tempId = 'temp-' + Date.now();
    const optimisticTx = { 
      ...txToInsert, 
      id: tempId, 
      userId: effectiveUserId, 
      space: activeSpace,
      created_at: new Date().toISOString()
    } as Transaction;

    setTransactions(prev => [optimisticTx, ...prev]);

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{ ...txToInsert, userId: effectiveUserId, space: activeSpace }])
        .select()
        .single();
      
      if (error) throw error;
      setTransactions(prev => prev.map(tx => tx.id === tempId ? data : tx));
      updateActivity('update');
    } catch (error) {
      setTransactions(prev => prev.filter(tx => tx.id !== tempId));
      throw error;
    }
  };

  const addTransactions = async (txs: Omit<Transaction, 'id'>[]) => {
    if (!user) return;
    
    const baseTime = Date.now();
    
    // Filter out transactions that already exist (only for recurrent ones)
    const uniqueTxs = txs.filter(newTx => {
      const isRecurrent = !!(newTx.groupId || (newTx as any).isContinuous);
      if (!isRecurrent) return true;

      return !transactions.some(t => 
        t.description === newTx.description && 
        t.date === newTx.date && 
        t.walletId === newTx.walletId && 
        t.amount === newTx.amount &&
        !t.isDeleted &&
        (t.groupId || t.isContinuous)
      );
    });

    if (uniqueTxs.length === 0) return;

    const txsToInsert = uniqueTxs.map((t, index) => {
      const tx = { 
        ...t, 
        userId: effectiveUserId, 
        space: activeSpace,
        created_at: new Date(baseTime + (txs.length - index)).toISOString()
      } as any;

      const wallet = rawWallets.find(w => w.id === tx.walletId);
      
      if (wallet?.type === 'credit_card') {
        tx.isPaid = true;
        if (!tx.invoiceMonth || !tx.invoiceYear) {
          const dateToUse = new Date(tx.date + 'T12:00:00');
          const period = getInvoicePeriod(wallet.closingDay || 5, wallet.dueDay || 15, dateToUse);
          tx.invoiceMonth = period.due.getUTCMonth() + 1;
          tx.invoiceYear = period.due.getUTCFullYear();
        }
      }
      if (tx.isPaid && !tx.paidDate) {
        tx.paidDate = new Date().toISOString().split('T')[0];
      }
      delete tx.id;
      delete tx.category;
      delete tx.wallet;
      return tx;
    });

    const tempIds = txs.map(() => 'temp-' + Math.random().toString(36).substr(2, 9));
    const optimisticTxs = txsToInsert.map((t, i) => ({ 
      ...t, 
      id: tempIds[i],
      created_at: t.created_at
    } as Transaction));
    
    setTransactions(prev => [...optimisticTxs, ...prev]);

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert(txsToInsert)
        .select();
      
      if (error) throw error;
      
      setTransactions(prev => {
        const filtered = prev.filter(tx => !tempIds.includes(tx.id));
        return [...(data || []), ...filtered];
      });
      updateActivity('update');
    } catch (error) {
      setTransactions(prev => prev.filter(tx => !tempIds.includes(tx.id)));
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    const originalTxs = [...transactions];
    
    setTransactions(prev => prev.filter(tx => tx.id !== id));

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    
    if (error) {
      setTransactions(originalTxs);
      throw error;
    }
    updateActivity('update');
  };

  const updateTransaction = async (id: string, updatedTx: Partial<Transaction>) => {
    let txToUpdate = { ...updatedTx };
    
    const currentTx = transactions.find(t => t.id === id);
    if (txToUpdate.walletId || txToUpdate.date) {
      const walletId = txToUpdate.walletId || currentTx?.walletId;
      const date = txToUpdate.date || currentTx?.date;
      
      const wallet = rawWallets.find(w => w.id === walletId);
      if (wallet?.type === 'credit_card') {
        txToUpdate.isPaid = true;
        if (!txToUpdate.invoiceMonth && date) {
          const period = getInvoicePeriod(wallet.closingDay || 5, wallet.dueDay || 15, new Date(date));
          txToUpdate.invoiceMonth = period.due.getUTCMonth() + 1;
          txToUpdate.invoiceYear = period.due.getUTCFullYear();
        }
      }
    }

    if ('isPaid' in txToUpdate) {
      if (txToUpdate.isPaid && !currentTx?.isPaid && !txToUpdate.paidDate) {
        txToUpdate.paidDate = new Date().toISOString().split('T')[0];
      } else if (txToUpdate.isPaid === false) {
        (txToUpdate as any).paidDate = null;
      }
    }

    const originalTxs = [...transactions];
    
    setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, ...txToUpdate } as Transaction : tx));

    try {
      const { data, error } = await supabase
        .from('transactions')
        .update(txToUpdate)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      setTransactions(prev => prev.map(tx => tx.id === id ? data : tx));
    } catch (error) {
      setTransactions(originalTxs);
      throw error;
    }
    updateActivity('update');
  };

  const addCategory = async (c: Omit<Category, 'id'>) => {
    if (!effectiveUserId) return;
    
    const tempId = 'temp-' + Date.now();
    const optimisticCat = { ...c, id: tempId, userId: effectiveUserId, space: activeSpace, isActive: true } as Category;
    setCategories(prev => [...prev, optimisticCat]);

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ ...c, userId: effectiveUserId, space: activeSpace, isActive: true }])
        .select()
        .single();
      
      if (error) throw error;
      setCategories(prev => prev.map(cat => cat.id === tempId ? data : cat));
      updateActivity('update');
    } catch (err) {
      setCategories(prev => prev.filter(cat => cat.id !== tempId));
      throw err;
    }
  };

  const toggleCategoryActive = async (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;
    const { data, error } = await supabase
      .from('categories')
      .update({ isActive: !cat.isActive })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    setCategories(prev => prev.map(c => c.id === id ? data : c));
    updateActivity('update');
  };

  const updateCategory = async (id: string, updatedCat: Partial<Category>) => {
    const { data, error } = await supabase
      .from('categories')
      .update(updatedCat)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    setCategories(prev => prev.map(c => c.id === id ? data : c));
    updateActivity('update');
  };

    const deleteCategory = async (id: string) => {
      // Verificar se a categoria ou qualquer uma de suas subcategorias tem transações
      const subcategoryIds = categories.filter(c => c.parentId === id).map(c => c.id);
      const allTargetIds = [id, ...subcategoryIds];
      const hasTransactions = transactions.some(tx => allTargetIds.includes(tx.categoryId));
      
      if (hasTransactions) {
        // Se houver transações (nela ou em subcategorias), arquivamos
        const { error } = await supabase
          .from('categories')
          .update({ isDeleted: true, isActive: false })
          .eq('id', id);
        if (error) throw error;

        // Também arquivamos as subcategorias para manter consistência
        if (subcategoryIds.length > 0) {
          await supabase
            .from('categories')
            .update({ isDeleted: true, isActive: false })
            .in('id', subcategoryIds);
        }

        // ATUALIZAÇÃO: Em vez de filter, usamos map para manter no estado com a flag isDeleted
        setCategories(prev => prev.map(c => 
          (c.id === id || c.parentId === id) 
            ? { ...c, isDeleted: true, isActive: false } 
            : c
        ));
      } else {
        // Se não houver nada, excluímos fisicamente
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', id);
        if (error) throw error;
        
        setCategories(prev => prev.filter(c => c.id !== id && c.parentId !== id));
      }
      
      updateActivity('update');
    };

  const addWallet = async (w: Omit<Wallet, 'id'>) => {
    if (!effectiveUserId) return;
    
    const tempId = 'temp-' + Date.now();
    const optimisticWallet = { ...w, id: tempId, userId: effectiveUserId, space: activeSpace, balance: w.initialBalance || 0 } as Wallet;
    setRawWallets(prev => [...prev, optimisticWallet]);

    try {
      const { data, error } = await supabase
        .from('wallets')
        .insert([{ ...w, userId: effectiveUserId, space: activeSpace }])
        .select()
        .single();
      
      if (error) throw error;
      setRawWallets(prev => prev.map(wal => wal.id === tempId ? data : wal));
      updateActivity('update');
    } catch (err) {
      setRawWallets(prev => prev.filter(wal => wal.id !== tempId));
      throw err;
    }
  };

  const updateWallet = async (id: string, updatedWallet: Partial<Wallet>) => {
    setRawWallets(prev => prev.map(w => w.id === id ? { ...w, ...updatedWallet } as Wallet : w));

    const { data, error } = await supabase
      .from('wallets')
      .update(updatedWallet)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    setRawWallets(prev => prev.map(w => w.id === id ? data : w));
    updateActivity('update');
  };

   const toggleWalletActive = async (id: string) => {
     const wal = rawWallets.find(w => w.id === id);
     if (!wal) return;

     setRawWallets(prev => prev.map(w => w.id === id ? { ...w, isActive: !w.isActive } : w));

     const { data, error } = await supabase
       .from('wallets')
       .update({ isActive: !wal.isActive })
       .eq('id', id)
       .select()
       .single();
     
     if (error) throw error;
     setRawWallets(prev => prev.map(w => w.id === id ? data : w));
     updateActivity('update');
   };
 
   const deleteWallet = async (id: string) => {
     const hasTransactions = transactions.some(tx => tx.walletId === id || tx.toWalletId === id);
     
     if (hasTransactions) {
       const { error } = await supabase
         .from('wallets')
         .update({ isDeleted: true, isActive: false })
         .eq('id', id);
       if (error) throw error;

       // ATUALIZAÇÃO: Mantemos no estado com isDeleted para preservar histórico
       setRawWallets(prev => prev.map(w => w.id === id ? { ...w, isDeleted: true, isActive: false } : w));
     } else {
       const { error } = await supabase
         .from('wallets')
         .delete()
         .eq('id', id);
       if (error) throw error;

       setRawWallets(prev => prev.filter(w => w.id !== id));
     }
     
     updateActivity('update');
   };

  const updateActivity = async (type: 'access' | 'update') => {
    if (!user) return;
    
    const now = Date.now();
    if (type === 'access' && now - lastActivityUpdate.current < 5 * 60 * 1000) {
      return;
    }

    lastActivityUpdate.current = now;
    const key = type === 'access' ? 'last_access' : 'last_update';
    
    try {
      await supabase.auth.updateUser({
        data: { [key]: new Date().toISOString() }
      });
    } catch (err) {
      console.warn('Erro ao atualizar atividade:', err);
    }
  };

  const seedCategories = async (space: 'personal' | 'business', targetUserId?: string) => {
    const userId = targetUserId || effectiveUserId;
    if (!userId) return;
    try {
      const seedData = INITIAL_CATEGORIES_TEMPLATE.map(c => ({ 
        ...c, 
        userId: userId, 
        space: space 
      }));

      
      const { data, error } = await supabase
        .from('categories')
        .insert(seedData)
        .select();
      
      if (error) throw error;
      
      // Se o espaço semeado for o ativo e for para o próprio usuário, atualiza o estado local
      if (!targetUserId && space === activeSpace) {
        setCategories(data || []);
      }
    } catch (err) {
      console.error('Erro ao semear categorias:', err);
      throw err;
    }
  };

  const addEquityAsset = async (asset: Omit<EquityAsset, 'id' | 'user_id' | 'created_at'>) => {
    const tempId = 'temp-' + Math.random().toString(36).substr(2, 9);
    const newAsset = { 
      ...asset, 
      id: tempId, 
      user_id: effectiveUserId, 
      created_at: new Date().toISOString() 
    } as EquityAsset;

    setEquityAssets(prev => [newAsset, ...prev]);

    try {
      const { data, error } = await supabase
        .from('equity_assets')
        .insert([{
          user_id: effectiveUserId,
          space: activeSpace,
          name: asset.name,
          initial_value: asset.initial_value,
          registration_date: asset.registration_date,
          observation: asset.observation
        }])
        .select()
        .single();

      if (error) throw error;
      setEquityAssets(prev => prev.map(a => a.id === tempId ? data : a));
      updateActivity('update');
    } catch (err) {
      setEquityAssets(prev => prev.filter(a => a.id !== tempId));
      throw err;
    }
  };

  const updateEquityAsset = async (id: string, asset: Partial<EquityAsset>) => {
    setEquityAssets(prev => prev.map(a => a.id === id ? { ...a, ...asset } : a));

    const { data, error } = await supabase
      .from('equity_assets')
      .update(asset)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    setEquityAssets(prev => prev.map(a => a.id === id ? data : a));
    updateActivity('update');
  };

  const deleteEquityAsset = async (id: string) => {
    // Primeiro remove o histórico
    await supabase.from('equity_history').delete().eq('asset_id', id);
    
    const { error } = await supabase
      .from('equity_assets')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setEquityAssets(prev => prev.filter(a => a.id !== id));
    setEquityHistory(prev => prev.filter(h => h.asset_id !== id));
    updateActivity('update');
  };

  const updateEquityValue = async (assetId: string, monthYear: string, value: number, observation: string) => {
    const { data, error } = await supabase
      .from('equity_history')
      .upsert({
        asset_id: assetId,
        month_year: monthYear,
        value: value,
        observation: observation
      }, {
        onConflict: 'asset_id, month_year'
      })
      .select()
      .single();

    if (error) throw error;
    
    setEquityHistory(prev => {
      const filtered = prev.filter(h => !(h.asset_id === assetId && h.month_year === monthYear));
      return [...filtered, data];
    });
    updateActivity('update');
  };

  const deleteEquityValue = async (id: string) => {
    const { error } = await supabase
      .from('equity_history')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setEquityHistory(prev => prev.filter(h => h.id !== id));
    updateActivity('update');
  };

  const addDebt = async (debt: any) => {
    const tempId = 'temp-' + Math.random().toString(36).substr(2, 9);
    const newDebt = { 
      ...debt, 
      id: tempId, 
      user_id: effectiveUserId, 
      created_at: new Date().toISOString() 
    };

    setDebts(prev => [newDebt, ...prev]);

    try {
      const { data, error } = await supabase
        .from('debts')
        .insert([{
          user_id: effectiveUserId,
          space: activeSpace,
          name: debt.name,
          total_value: debt.total_value,
          monthly_payment: debt.monthly_payment,
          installments_count: debt.installments_count,
          interest_rate: debt.interest_rate,
          due_date: debt.due_date,
          observation: debt.observation,
          status: debt.status || 'active'
        }])
        .select()
        .single();

      if (error) throw error;
      setDebts(prev => prev.map(a => a.id === tempId ? data : a));
      updateActivity('update');
    } catch (err) {
      setDebts(prev => prev.filter(a => a.id !== tempId));
      throw err;
    }
  };

  const updateDebt = async (id: string, debt: any) => {
    setDebts(prev => prev.map(a => a.id === id ? { ...a, ...debt } : a));

    const { data, error } = await supabase
      .from('debts')
      .update(debt)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    setDebts(prev => prev.map(a => a.id === id ? data : a));
    updateActivity('update');
  };

  const deleteDebt = async (id: string) => {
    await supabase.from('debt_history').delete().eq('debt_id', id);
    
    const { error } = await supabase
      .from('debts')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setDebts(prev => prev.filter(a => a.id !== id));
    setDebtHistory(prev => prev.filter(h => h.debt_id !== id));
    updateActivity('update');
  };

  const updateDebtValue = async (debtId: string, monthYear: string, value: number, observation: string) => {
    const { data, error } = await supabase
      .from('debt_history')
      .upsert({
        debt_id: debtId,
        month_year: monthYear,
        value: value,
        observation: observation
      }, {
        onConflict: 'debt_id,month_year'
      })
      .select()
      .single();

    if (error) throw error;
    
    setDebtHistory(prev => {
      const filtered = prev.filter(h => !(h.debt_id === debtId && h.month_year === monthYear));
      return [...filtered, data];
    });
    updateActivity('update');
  };

  const deleteDebtValue = async (id: string) => {
    const { error } = await supabase
      .from('debt_history')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setDebtHistory(prev => prev.filter(h => h.id !== id));
    updateActivity('update');
  };

  const addNonRecurringExpense = async (expense: Omit<NonRecurringExpense, 'id' | 'user_id' | 'created_at'>) => {
    const tempId = 'temp-' + Math.random().toString(36).substr(2, 9);
    const newExpense = { 
      ...expense, 
      id: tempId, 
      user_id: effectiveUserId, 
      created_at: new Date().toISOString() 
    } as NonRecurringExpense;

    setNonRecurringExpenses(prev => [newExpense, ...prev]);

    try {
      const { data, error } = await supabase
        .from('non_recurring_expenses')
        .insert([{
          user_id: effectiveUserId,
          space: activeSpace,
          description: expense.description,
          amount: expense.amount,
          frequency_months: expense.frequency_months,
          in_budget: expense.in_budget,
          identification_date: expense.identification_date,
          budget_entry_date: expense.budget_entry_date
        }])
        .select()
        .single();

      if (error) throw error;
      setNonRecurringExpenses(prev => prev.map(a => a.id === tempId ? data : a));
      updateActivity('update');
    } catch (err) {
      setNonRecurringExpenses(prev => prev.filter(a => a.id !== tempId));
      throw err;
    }
  };

  const updateNonRecurringExpense = async (id: string, expense: Partial<NonRecurringExpense>) => {
    setNonRecurringExpenses(prev => prev.map(a => a.id === id ? { ...a, ...expense } : a));

    const { data, error } = await supabase
      .from('non_recurring_expenses')
      .update(expense)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    setNonRecurringExpenses(prev => prev.map(a => a.id === id ? data : a));
    updateActivity('update');
  };

  const deleteNonRecurringExpense = async (id: string) => {
    const { error } = await supabase
      .from('non_recurring_expenses')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setNonRecurringExpenses(prev => prev.filter(a => a.id !== id));
    updateActivity('update');
  };

  return (
    <FinanceContext.Provider value={{
      transactions, categories, wallets, activeSpace, theme, loading,
      setActiveSpace, toggleTheme, addTransaction, addTransactions, addCategory, addWallet, deleteTransaction, updateTransaction,
      toggleCategoryActive, updateCategory, deleteCategory, updateWallet, toggleWalletActive, deleteWallet, updateActivity,
      includeCategoryLimits, setIncludeCategoryLimits, seedCategories,
      orderedCards, orderedAccounts,
      initializedSpaces,
      overdueServices,
      hasAcknowledgedOverdue,
      acknowledgeOverdue,
      tasks,
      setGlobalTasks,
      equityAssets,
      equityHistory,
      addEquityAsset,
      updateEquityAsset,
      deleteEquityAsset,
      updateEquityValue,
      deleteEquityValue,
      debts,
      debtHistory,
      addDebt,
      updateDebt,
      deleteDebt,
      updateDebtValue,
      deleteDebtValue,
      nonRecurringExpenses,
      addNonRecurringExpense,
      updateNonRecurringExpense,
      deleteNonRecurringExpense,
      saveWalletOrder: async (cards: string[], accounts: string[]) => {
        if (!user) return;
        
        // Atualizar estado local imediatamente para UX suave
        setOrderedCards(cards);
        setOrderedAccounts(accounts);

        const cardsKey = `wallet_order_${activeSpace}_cards`;
        const accountsKey = `wallet_order_${activeSpace}_accounts`;
        
        try {
          const { error } = await supabase.auth.updateUser({
            data: { 
              [cardsKey]: cards,
              [accountsKey]: accounts
            }
          });
          if (error) throw error;
        } catch (err) {
          console.error('Erro ao salvar ordenação:', err);
        }
      }
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within FinanceProvider');
  return context;
};
