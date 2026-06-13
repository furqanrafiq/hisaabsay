export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  note: string;
  date: string;
  fixed?: boolean;
  overspendReason?: string;
  currency: string;
  accountId: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  month: string;
  currency: string;
  accountId: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string;
  emoji: string;
  monthlyContribution?: number;
  currency: string;
  createdAt: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  currency: string;
  notificationsEnabled: boolean;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export interface Account {
  id: string;
  name: string;
  bank: string;
  currency: string;
  openingBalance: number;
  emoji: string;
  color: string;
  archived: boolean;
  createdAt: string;
}
