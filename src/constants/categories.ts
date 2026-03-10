export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income' | 'both';
}

export const CATEGORIES: Category[] = [
  { id: 'food', name: 'Food & Drink', icon: 'food', color: '#FF6B6B', type: 'expense' },
  { id: 'transport', name: 'Transport', icon: 'car', color: '#4ECDC4', type: 'expense' },
  { id: 'shopping', name: 'Shopping', icon: 'shopping', color: '#45B7D1', type: 'expense' },
  { id: 'health', name: 'Health', icon: 'heart-pulse', color: '#96CEB4', type: 'expense' },
  { id: 'entertainment', name: 'Entertainment', icon: 'television-play', color: '#FFEAA7', type: 'expense' },
  { id: 'education', name: 'Education', icon: 'school', color: '#DDA0DD', type: 'expense' },
  { id: 'utilities', name: 'Utilities', icon: 'lightning-bolt', color: '#98D8C8', type: 'expense' },
  { id: 'rent', name: 'Rent', icon: 'home', color: '#F0A500', type: 'expense' },
  { id: 'travel', name: 'Travel', icon: 'airplane', color: '#74B9FF', type: 'expense' },
  { id: 'personal', name: 'Personal', icon: 'account', color: '#A29BFE', type: 'expense' },
  { id: 'gifts', name: 'Gifts', icon: 'gift', color: '#FD79A8', type: 'expense' },
  { id: 'other', name: 'Other', icon: 'dots-horizontal', color: '#B2BEC3', type: 'both' },
  { id: 'salary', name: 'Salary', icon: 'briefcase', color: '#00B894', type: 'income' },
  { id: 'freelance', name: 'Freelance', icon: 'laptop', color: '#0984E3', type: 'income' },
  { id: 'business', name: 'Business', icon: 'store', color: '#6C5CE7', type: 'income' },
  { id: 'investment', name: 'Investment', icon: 'chart-line', color: '#00CEC9', type: 'income' },
];

export const getCategoryById = (id: string) =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES.find((c) => c.id === 'other')!;
