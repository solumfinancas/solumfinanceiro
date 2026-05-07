export type TransactionType = 'income' | 'expense' | 'transfer' | 'provision' | 'planned';

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  parentId?: string; // If present, it's a subcategory
  isActive?: boolean; // New: handle inactivation instead of deletion
  isDeleted?: boolean;
  limit?: number; // New: budget limit for the category
  space?: 'personal' | 'business';
}

export interface Wallet {
  id: string;
  userId: string;
  name: string;
  type: 'bank' | 'cash' | 'credit_card';
  balance: number;
  initialBalance?: number;
  color: string;
  limit?: number;
  closingDay?: number;
  dueDay?: number;
  logoUrl?: string;
  icon?: 'wallet' | 'bank' | 'piggy';
  isActive?: boolean;
  isDeleted?: boolean;
  cardLevel?: string;
  cardColor?: string;
  defaultPaymentWalletId?: string;
  walletCategory?: 'checking' | 'savings' | 'wishlist';
  observation?: string;
  space?: 'personal' | 'business';
  targetValue?: number;
  targetMonths?: number;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  categoryId: string;
  walletId: string;
  type: TransactionType;
  toWalletId?: string; // For transfers
  isPaid?: boolean; // New field for payment status
  groupId?: string; // For recurring transactions
  recurrenceNumber?: {
    current: number;
    total: number;
  };
  isContinuous?: boolean; // New: for continuous recurring transactions
  requiresRenewal?: boolean; // New: flag if continuous transaction reached end of year
  invoiceMonth?: number; // New: for manual invoice period selection
  invoiceYear?: number; // New: for manual invoice period selection
  necessity?: 'necessary' | 'unnecessary'; // New: classification of expenses
  space?: 'personal' | 'business';
  paidDate?: string; // New: capture payment date
  created_at?: string;
}

export interface ProfileType {
  id: string;
  name: string;
}

export interface EquityAsset {
  id: string;
  user_id: string;
  space: 'personal' | 'business';
  name: string;
  initial_value: number;
  registration_date: string;
  observation: string;
  created_at: string;
  ended_at?: string | null;
}

export interface EquityHistory {
  id: string;
  asset_id: string;
  month_year: string;
  value: number;
  observation: string;
  created_at: string;
}
