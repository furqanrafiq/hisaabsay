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
  createdAt: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  month: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string;
  emoji: string;
  monthlyContribution?: number;
  createdAt: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  currency: string;
  notificationsEnabled: boolean;
}
