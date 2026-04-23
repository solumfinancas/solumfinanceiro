import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Transaction, Category, Wallet, ProfileType } from './types';
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
  updateActivity: (type: 'access' | 'update') => Promise<void>;
  includeCategoryLimits: boolean;
  setIncludeCategoryLimits: (v: boolean) => void;
  seedCategories: (space: 'personal' | 'business') => Promise<void>;
  orderedCards: string[];
  orderedAccounts: string[];
  saveWalletOrder: (cards: string[], accounts: string[]) => Promise<void>;
  initializedSpaces: ('personal' | 'business')[];
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
  const { user, viewingUserId, viewingProfile } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
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
  const isFetchingData = React.useRef(false);
  const lastActivityUpdate = React.useRef<number>(0);
 
  const effectiveUserId = viewingUserId || user?.id;
  const storageId = user?.id;

  const fetchData = useCallback(async () => {
    if (!user || !effectiveUserId || !isSpaceInitialized || isFetchingData.current) {
      // Se não há requisitos ou já está buscando, não bloqueia a tela infinitamente
      if (!isFetchingData.current) setLoading(false);
      return;
    }
    
    isFetchingData.current = true;
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
      setCategories(finalCats);

      // 2. Carteiras
      const { data: wals, error: walErr } = await supabase
        .from('wallets')
        .select('*')
        .eq('userId', effectiveUserId)
        .eq('space', activeSpace)
        .order('created_at');
      if (walErr) throw walErr;
      const fetchedWallets = wals || [];
      setWallets(fetchedWallets);

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
      setTransactions(txs || []);

    } catch (err) {
      console.error('Erro ao buscar dados:', err);
    } finally {
      setLoading(false);
      isFetchingData.current = false;
    }
  }, [user, effectiveUserId, activeSpace, isSpaceInitialized]);

  const currentMetadata = viewingProfile ? viewingProfile.user_metadata : user?.user_metadata;
  const initializedSpaces = (currentMetadata?.initialized_spaces || []) as ('personal' | 'business')[];

  // Sync activeSpace with user's primary_space or auto-select if only 1 exists
  useEffect(() => {
    if (user && !isSpaceInitialized) {
      if (initializedSpaces.length === 1) {
        setActiveSpace(initializedSpaces[0]);
      } 
      // Removido auto-seleção de primary_space se houver > 1 para forçar o seletor
      setIsSpaceInitialized(true);
    }
  }, [user, isSpaceInitialized, initializedSpaces]);

  useEffect(() => {
    if (isSpaceInitialized) {
      fetchData();
    }
    // Removido updateActivity automático para evitar loop infinito com AuthContext
  }, [fetchData, isSpaceInitialized]);

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

  // Recalcular saldo das carteiras localmente quando transações mudam
  // (O banco de dados é a fonte da verdade, mas o cálculo em tempo real ajuda na UX)
  useEffect(() => {
    setWallets(prevWallets => {
      let changed = false;
      const newWallets = prevWallets.map(w => {
        const txSum = transactions.reduce((sum, t) => {
          let balanceChange = 0;
          const isCreditCard = w.type === 'credit_card';
          
          // For bank/cash accounts, only paid transactions count towards the balance
          // For credit cards, any purchase (expense/planned) consumes the limit immediately
          const isExpenseType = t.type === 'expense' || t.type === 'planned' || t.type === 'provision';
          const isIncomeType = t.type === 'income';

          const shouldCountExpense = isCreditCard ? isExpenseType : (t.isPaid !== false && isExpenseType);
          const shouldCountIncome = isCreditCard ? isIncomeType : (t.isPaid !== false && isIncomeType);

          if (t.walletId === w.id) {
            if (shouldCountIncome) balanceChange += t.amount;
            if (shouldCountExpense) balanceChange -= t.amount;
            if (t.type === 'transfer') balanceChange -= t.amount;
          }

          // Payments TO the card or transfers TO the account
          const isInvoicePayment = t.description.toLowerCase().includes('pagamento de fatura');
          if ((t.type === 'transfer' || t.type === 'provision' || (isCreditCard && isInvoicePayment)) && t.toWalletId === w.id) {
            balanceChange += t.amount;
          }

          return sum + balanceChange;
        }, 0);
        
        const calculatedBalance = (w.initialBalance || 0) + txSum;
        if (w.balance !== calculatedBalance) {
          changed = true;
          return { ...w, balance: calculatedBalance };
        }
        return w;
      });
      return changed ? newWallets : prevWallets;
    });
  }, [transactions, wallets]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    if (!user) return;
    
    let txToInsert = { ...t };
    
    // Auto-calculate invoice for credit cards
    const wallet = wallets.find(w => w.id === txToInsert.walletId);
    if (wallet?.type === 'credit_card') {
      txToInsert.isPaid = true; // Credit card expenses are always "paid" from the limit perspective
      
      // Sempre define invoiceMonth/Year para cartões, calculando a partir da data se não vier no modal
      if (!txToInsert.invoiceMonth || !txToInsert.invoiceYear) {
        const period = getInvoicePeriod(wallet.closingDay || 5, wallet.dueDay || 15, new Date(txToInsert.date + 'T12:00:00'));
        txToInsert.invoiceMonth = period.due.getUTCMonth() + 1;
        txToInsert.invoiceYear = period.due.getUTCFullYear();
      }
    }
    // Auto-calculate paidDate if marked as paid on creation AND not manually provided
    if (txToInsert.isPaid && !txToInsert.paidDate) {
      txToInsert.paidDate = new Date().toISOString().split('T')[0];
    }

    const tempId = 'temp-' + Date.now();
    const optimisticTx = { 
      ...txToInsert, 
      id: tempId, 
      userId: effectiveUserId, 
      space: activeSpace,
      created_at: new Date().toISOString()
    } as Transaction;

    
    // Optimistic Update
    setTransactions(prev => [optimisticTx, ...prev]);
    
    // Background updateActivity
    updateActivity('update');

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{ ...txToInsert, userId: effectiveUserId, space: activeSpace }])
        .select()

        .single();
      
      if (error) throw error;
      // Replace temp with real data
      setTransactions(prev => prev.map(tx => tx.id === tempId ? data : tx));
    } catch (error) {
      // Rollback
      setTransactions(prev => prev.filter(tx => tx.id !== tempId));
      throw error;
    }
  };

  const addTransactions = async (txs: Omit<Transaction, 'id'>[]) => {
    if (!user) return;
    
    // Usamos um timestamp base e adicionamos milissegundos baseados na ordem inversa
    // para que o primeiro item da planilha (index 0) tenha o maior created_at
    // e apareça no topo na ordenação DESC.
    const baseTime = Date.now();
    const txsToInsert = txs.map((t, index) => {
      const tx = { 
        ...t, 
        userId: effectiveUserId, 
        space: activeSpace,
        created_at: new Date(baseTime + (txs.length - index)).toISOString()
      } as any;

      const wallet = wallets.find(w => w.id === tx.walletId);
      
      if (wallet?.type === 'credit_card') {
        tx.isPaid = true;
        if (!tx.invoiceMonth || !tx.invoiceYear) {
          const dateToUse = new Date(tx.date + 'T12:00:00');
          const period = getInvoicePeriod(wallet.closingDay || 5, wallet.dueDay || 15, dateToUse);
          tx.invoiceMonth = period.due.getUTCMonth() + 1;
          tx.invoiceYear = period.due.getUTCFullYear();
        }
      }
      // Auto-calculate paidDate if marked as paid AND not manually provided (bulk)
      if (tx.isPaid && !tx.paidDate) {
        tx.paidDate = new Date().toISOString().split('T')[0];
      }
      delete tx.id;
      return tx;
    });

    const tempIds = txs.map(() => 'temp-' + Math.random().toString(36).substr(2, 9));
    const optimisticTxs = txsToInsert.map((t, i) => ({ 
      ...t, 
      id: tempIds[i],
      created_at: t.created_at // Já definimos o created_at com os micro-incrementos acima
    } as Transaction));
    
    setTransactions(prev => [...optimisticTxs, ...prev]);
    updateActivity('update');

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
    } catch (error) {
      setTransactions(prev => prev.filter(tx => !tempIds.includes(tx.id)));
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    const originalTxs = [...transactions];
    
    // Optimistic Update
    setTransactions(prev => prev.filter(tx => tx.id !== id));
    updateActivity('update');

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    
    if (error) {
      setTransactions(originalTxs); // Rollback
      throw error;
    }
  };

  const updateTransaction = async (id: string, updatedTx: Partial<Transaction>) => {
    let txToUpdate = { ...updatedTx };
    
    // Auto-calculate invoice for credit cards if logic needs update
    const currentTx = transactions.find(t => t.id === id);
    if (txToUpdate.walletId || txToUpdate.date) {
      const walletId = txToUpdate.walletId || currentTx?.walletId;
      const date = txToUpdate.date || currentTx?.date;
      
      const wallet = wallets.find(w => w.id === walletId);
      if (wallet?.type === 'credit_card') {
        txToUpdate.isPaid = true;
        if (!txToUpdate.invoiceMonth && date) {
          const period = getInvoicePeriod(wallet.closingDay || 5, wallet.dueDay || 15, new Date(date));
          txToUpdate.invoiceMonth = period.due.getUTCMonth() + 1;
          txToUpdate.invoiceYear = period.due.getUTCFullYear();
        }
      }
    }

    // Handle paidDate logic: set when marked as paid (if not provided), clear when marked as pending
    if ('isPaid' in txToUpdate) {
      if (txToUpdate.isPaid && !currentTx?.isPaid && !txToUpdate.paidDate) {
        txToUpdate.paidDate = new Date().toISOString().split('T')[0];
      } else if (txToUpdate.isPaid === false) {
        (txToUpdate as any).paidDate = null;
      }
    }

    const originalTxs = [...transactions];
    
    // Optimistic Update
    setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, ...txToUpdate } as Transaction : tx));
    updateActivity('update');

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
      setTransactions(originalTxs); // Rollback
      throw error;
    }
  };

  const addCategory = async (c: Omit<Category, 'id'>) => {
    if (!effectiveUserId) return;
    updateActivity('update');
    const { data, error } = await supabase
      .from('categories')
      .insert([{ ...c, userId: effectiveUserId, space: activeSpace, isActive: true }])
      .select()

      .single();
    
    if (error) throw error;
    setCategories(prev => [...prev, data]);
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
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    setCategories(prev => prev.filter(c => c.id !== id));
    updateActivity('update');
  };

  const addWallet = async (w: Omit<Wallet, 'id'>) => {
    if (!effectiveUserId) return;
    updateActivity('update');
    const { data, error } = await supabase
      .from('wallets')
      .insert([{ ...w, userId: effectiveUserId, space: activeSpace }])
      .select()

      .single();
    
    if (error) throw error;
    setWallets(prev => [...prev, data]);
  };

  const updateWallet = async (id: string, updatedWallet: Partial<Wallet>) => {
    const { data, error } = await supabase
      .from('wallets')
      .update(updatedWallet)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    setWallets(prev => prev.map(w => w.id === id ? data : w));
    updateActivity('update');
  };

  const toggleWalletActive = async (id: string) => {
    const wal = wallets.find(w => w.id === id);
    if (!wal) return;
    const { data, error } = await supabase
      .from('wallets')
      .update({ isActive: !wal.isActive })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    setWallets(prev => prev.map(w => w.id === id ? data : w));
    updateActivity('update');
  };

  const updateActivity = async (type: 'access' | 'update') => {
    if (!user) return;
    
    const now = Date.now();
    // Throttle: no máximo uma atualização a cada 5 minutos para 'access'
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

  const seedCategories = async (space: 'personal' | 'business') => {
    if (!effectiveUserId) return;
    try {
      const seedData = INITIAL_CATEGORIES_TEMPLATE.map(c => ({ 
        ...c, 
        userId: effectiveUserId, 
        space: space 
      }));

      
      const { data, error } = await supabase
        .from('categories')
        .insert(seedData)
        .select();
      
      if (error) throw error;
      
      // Se o espaço semeado for o ativo, atualiza o estado local
      if (space === activeSpace) {
        setCategories(data || []);
      }
    } catch (err) {
      console.error('Erro ao semear categorias:', err);
      throw err;
    }
  };

  return (
    <FinanceContext.Provider value={{
      transactions, categories, wallets, activeSpace, theme, loading,
      setActiveSpace, toggleTheme, addTransaction, addTransactions, addCategory, addWallet, deleteTransaction, updateTransaction,
      toggleCategoryActive, updateCategory, deleteCategory, updateWallet, toggleWalletActive, updateActivity,
      includeCategoryLimits, setIncludeCategoryLimits, seedCategories,
      orderedCards, orderedAccounts,
      initializedSpaces,
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
