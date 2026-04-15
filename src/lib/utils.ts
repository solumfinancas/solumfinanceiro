import {type ClassValue, clsx} from 'clsx';
import {twMerge} from 'tailwind-merge';
import { Transaction, Category } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  const normalizedValue = Math.abs(value) < 0.01 ? 0 : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(normalizedValue);
}

export function formatDate(date: Date | string) {
  const d = new Date(date);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

export function getCategorySpend(
  categoryId: string, 
  transactions: Transaction[], 
  categories: Category[], 
  month: number | 'all', 
  year: number, 
  paymentFilter: 'all' | 'paid' | 'pending' = 'all'
) {
  const relevantIds = [categoryId, ...categories.filter(c => c.parentId === categoryId).map(c => c.id)];
  
  return transactions
    .filter(t => {
      const d = new Date(t.date);
      const mMatch = month === 'all' || (d.getUTCMonth() + 1) === month;
      const yMatch = d.getUTCFullYear() === year;
      const pMatch = paymentFilter === 'all' || (paymentFilter === 'paid' ? t.isPaid : !t.isPaid);
      return relevantIds.includes(t.categoryId) && mMatch && yMatch && t.type === 'expense' && pMatch;
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getCategoryBalance(
  categoryId: string, 
  transactions: Transaction[], 
  categories: Category[], 
  month: number | 'all', 
  year: number, 
  paymentFilter: 'all' | 'paid' | 'pending' = 'all'
) {
  const relevantIds = [categoryId, ...categories.filter(c => c.parentId === categoryId).map(c => c.id)];

  return transactions
    .filter(t => {
      const d = new Date(t.date);
      const mMatch = month === 'all' || (d.getUTCMonth() + 1) === month;
      const yMatch = d.getUTCFullYear() === year;
      const pMatch = paymentFilter === 'all' || (paymentFilter === 'paid' ? t.isPaid : !t.isPaid);
      return relevantIds.includes(t.categoryId) && mMatch && yMatch && pMatch;
    })
    .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
}

export function checkBudgetThreshold(currentSpend: number, limit: number): '75' | '100' | null {
  if (!limit || limit <= 0) return null;
  const percentage = (currentSpend / limit) * 100;
  if (percentage >= 100) return '100';
  if (percentage >= 75) return '75';
  return null;
}

// Helper para normalizar datas para comparação segura (YYYY-MM-DD em UTC)
function normalizeToDateString(date: Date) {
  return date.toISOString().split('T')[0];
}

export function getOpenInvoicePeriod(closingDay: number, dueDay: number, date: Date = new Date()) {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const day = d.getUTCDate();

  let cycleStart: Date;
  let cycleEnd: Date;
  let dueDate: Date;

  // A fatura aberta é a que ainda NÃO fechou.
  // Se hoje > fechamento, a fatura aberta é a do PRÓXIMO mês.
  
  if (day > closingDay) {
    cycleStart = new Date(Date.UTC(year, month, closingDay + 1));
    cycleEnd = new Date(Date.UTC(year, month + 1, closingDay, 23, 59, 59));
    const dueMonth = dueDay < closingDay ? month + 2 : month + 1;
    dueDate = new Date(Date.UTC(year, dueMonth, dueDay));
  } else {
    cycleStart = new Date(Date.UTC(year, month - 1, closingDay + 1));
    cycleEnd = new Date(Date.UTC(year, month, closingDay, 23, 59, 59));
    const dueMonth = dueDay < closingDay ? month + 1 : month;
    dueDate = new Date(Date.UTC(year, dueMonth, dueDay));
  }

  return { start: cycleStart, end: cycleEnd, due: dueDate };
}

export function getInvoicePeriod(closingDay: number, dueDay: number, date: Date = new Date()) {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const day = d.getUTCDate();

  // Se o dia da compra for após o fechamento, pertence à fatura do próximo ciclo
  let refMonth = month;
  if (day > closingDay) {
    refMonth++;
  }

  // Normalizar mês/ano (handle viradas de ano)
  const refDate = new Date(Date.UTC(year, refMonth, 1));
  const targetMonth = refDate.getUTCMonth();
  const targetYear = refDate.getUTCFullYear();

  // O ciclo de compras termina no dia do fechamento
  const cycleEnd = new Date(Date.UTC(targetYear, targetMonth, closingDay, 23, 59, 59));
  // O ciclo começa no dia seguinte ao fechamento do mês anterior
  const cycleStart = new Date(Date.UTC(targetYear, targetMonth - 1, closingDay + 1));

  // O vencimento depende se o dia de vencimento é menor que o de fechamento (vence no mês seguinte)
  const dueMonthOffset = dueDay < closingDay ? 1 : 0;
  const dueDate = new Date(Date.UTC(targetYear, targetMonth + dueMonthOffset, dueDay));

  return { start: cycleStart, end: cycleEnd, due: dueDate };
}

export function getInvoiceAmount(transactions: Transaction[], walletId: string, period: { start: Date, end: Date, due: Date }) {
  const startStr = normalizeToDateString(period.start);
  const endStr = normalizeToDateString(period.end);

  const amount = transactions
    .filter(t => {
      if (t.walletId !== walletId) return false;
      if (t.type !== 'expense' && t.type !== 'planned' && t.type !== 'income') return false;

      if (t.invoiceMonth && t.invoiceYear) {
        return t.invoiceMonth === (period.due.getUTCMonth() + 1) && 
               t.invoiceYear === period.due.getUTCFullYear();
      }

      const txDateStr = typeof t.date === 'string' ? t.date.split('T')[0] : normalizeToDateString(new Date(t.date));
      return txDateStr >= startStr && txDateStr <= endStr;
    })
    .reduce((sum, t) => sum + (t.type === 'income' ? -t.amount : t.amount), 0);

  // Check if it's paid
  const payments = transactions.filter(t => 
    t.toWalletId === walletId && 
    t.invoiceMonth === (period.due.getUTCMonth() + 1) && 
    t.invoiceYear === period.due.getUTCFullYear() &&
    t.description.toLowerCase().includes('fatura')
  );
  
  const paidSum = payments.reduce((sum, t) => sum + t.amount, 0);
  const isLastPaid = amount <= 0 || paidSum >= (amount - 0.01); // 0 amount or fully paid
  const status = new Date() > period.end ? 'closed' : 'open';

  return {
    amount,
    status,
    isLastPaid,
    paidSum
  };
}

export function getInvoicePayments(cardId: string, transactions: Transaction[], month: number, year: number) {
  return transactions.filter(t => 
    t.toWalletId === cardId && 
    t.invoiceMonth === month && 
    t.invoiceYear === year &&
    t.description.toLowerCase().includes('fatura')
  );
}

export function getAvailableYears(transactions: Transaction[]) {
  const years = new Set<number>();
  years.add(new Date().getFullYear());
  
  transactions.forEach(t => {
    // Ano da data real
    const d = new Date(t.date + 'T12:00:00Z');
    if (!isNaN(d.getTime())) {
      years.add(d.getUTCFullYear());
    }
    // Ano da fatura (para cartões)
    if (t.invoiceYear) {
      years.add(t.invoiceYear);
    }
  });
  
  return Array.from(years).sort((a, b) => b - a);
}
