import { Transaction, Budget } from '@/types';
import { getMonthKey } from './formatDate';

export function getMonthlyTotals(transactions: Transaction[], monthKey: string) {
  const filtered = transactions.filter((t) => t.date.startsWith(monthKey));
  const income = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  return { income, expense, balance: income - expense };
}

export function calcHealthScore(income: number, expense: number): number {
  if (income === 0) return 0;
  const savingsRate = (income - expense) / income;
  return Math.max(0, Math.min(100, Math.round(savingsRate * 100)));
}

export function getHealthLabel(score: number): { label: string; color: string } {
  if (score >= 86) return { label: 'Excellent', color: '#4CAF50' };
  if (score >= 61) return { label: 'Good', color: '#F59E0B' };
  if (score >= 31) return { label: 'Fair', color: '#FF9800' };
  return { label: 'Poor', color: '#EF5350' };
}

export function getBudgetUsage(
  transactions: Transaction[],
  budgets: Budget[],
  monthKey: string,
) {
  return budgets
    .filter((b) => b.month === monthKey)
    .map((b) => {
      const spent = transactions
        .filter((t) =>
          t.type === 'expense'
          && t.category === b.category
          && t.currency === b.currency
          && t.date.startsWith(monthKey)
          && (!b.accountId || t.accountId === b.accountId),
        )
        .reduce((s, t) => s + t.amount, 0);
      const pct = b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0;
      return { ...b, spent, pct };
    });
}
