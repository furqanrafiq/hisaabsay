export interface Category {
  id: string;
  name: string;
  icon: string;
  emoji: string;
  color: string;
  type: 'expense' | 'income' | 'both';
}

export const CATEGORIES: Category[] = [
  { id: 'food',          name: 'Food & Dining',  icon: 'food',             emoji: '🍔', color: '#FF6B6B', type: 'expense' },
  { id: 'transport',     name: 'Transport',      icon: 'car',              emoji: '🚗', color: '#4ECDC4', type: 'expense' },
  { id: 'shopping',      name: 'Shopping',       icon: 'shopping',         emoji: '🛍️', color: '#45B7D1', type: 'expense' },
  { id: 'health',        name: 'Health',         icon: 'heart-pulse',      emoji: '💊', color: '#96CEB4', type: 'expense' },
  { id: 'entertainment', name: 'Entertainment',  icon: 'television-play',  emoji: '🎬', color: '#FFEAA7', type: 'expense' },
  { id: 'education',     name: 'Education',      icon: 'school',           emoji: '📚', color: '#DDA0DD', type: 'expense' },
  { id: 'utilities',     name: 'Bills & Utilities', icon: 'lightning-bolt', emoji: '⚡', color: '#98D8C8', type: 'expense' },
  { id: 'rent',          name: 'Rent',           icon: 'home',             emoji: '🏠', color: '#F0A500', type: 'expense' },
  { id: 'travel',        name: 'Travel',         icon: 'airplane',         emoji: '✈️', color: '#74B9FF', type: 'expense' },
  { id: 'personal',      name: 'Personal',       icon: 'account',          emoji: '🧴', color: '#A29BFE', type: 'expense' },
  { id: 'gifts',         name: 'Gifts',          icon: 'gift',             emoji: '🎁', color: '#FD79A8', type: 'expense' },
  { id: 'other',         name: 'Other',          icon: 'dots-horizontal',  emoji: '💫', color: '#B2BEC3', type: 'both' },
  { id: 'salary',        name: 'Salary',         icon: 'briefcase',        emoji: '💰', color: '#00B894', type: 'income' },
  { id: 'freelance',     name: 'Freelance',      icon: 'laptop',           emoji: '💻', color: '#0984E3', type: 'income' },
  { id: 'business',      name: 'Business',       icon: 'store',            emoji: '🏢', color: '#6C5CE7', type: 'income' },
  { id: 'investment',    name: 'Investment',     icon: 'chart-line',       emoji: '📈', color: '#00CEC9', type: 'income' },
];

export const getCategoryById = (id: string) =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES.find((c) => c.id === 'other')!;
