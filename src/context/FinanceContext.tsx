import React, { createContext, useContext, useEffect, useState } from 'react';
import { Transaction, Budget, Goal } from '@/types';
import { Category } from '@/constants/categories';
import { loadData, saveData, STORAGE_KEYS } from '@/services/storage';

interface FinanceContextType {
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  customCategories: Category[];
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  editTransaction: (id: string, patch: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addBudget: (b: Omit<Budget, 'id'>) => Promise<void>;
  editBudget: (id: string, patch: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  addGoal: (g: Omit<Goal, 'id' | 'createdAt'>) => Promise<void>;
  editGoal: (id: string, patch: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addToGoal: (goalId: string, amount: number) => Promise<void>;
  addCustomCategory: (c: Omit<Category, 'id'>) => Promise<void>;
  deleteCustomCategory: (id: string) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType>(null!);

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [customCategories, setCustomCategories] = useState<Category[]>([]);

  useEffect(() => {
    (async () => {
      const t = await loadData<Transaction[]>(STORAGE_KEYS.TRANSACTIONS);
      const b = await loadData<Budget[]>(STORAGE_KEYS.BUDGETS);
      const g = await loadData<Goal[]>(STORAGE_KEYS.GOALS);
      const cc = await loadData<Category[]>(STORAGE_KEYS.CUSTOM_CATEGORIES);
      if (t) setTransactions(t);
      if (b) setBudgets(b);
      if (g) setGoals(g);
      if (cc) setCustomCategories(cc);
    })();
  }, []);

  const persist = async (key: string, data: unknown) => saveData(key, data);

  const addTransaction = async (t: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newT: Transaction = { ...t, id: genId(), createdAt: new Date().toISOString() };
    const updated = [newT, ...transactions];
    setTransactions(updated);
    await persist(STORAGE_KEYS.TRANSACTIONS, updated);
  };

  const editTransaction = async (id: string, patch: Partial<Transaction>) => {
    const updated = transactions.map((t) => (t.id === id ? { ...t, ...patch } : t));
    setTransactions(updated);
    await persist(STORAGE_KEYS.TRANSACTIONS, updated);
  };

  const deleteTransaction = async (id: string) => {
    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);
    await persist(STORAGE_KEYS.TRANSACTIONS, updated);
  };

  const addBudget = async (b: Omit<Budget, 'id'>) => {
    const newB: Budget = { ...b, id: genId() };
    const updated = [...budgets, newB];
    setBudgets(updated);
    await persist(STORAGE_KEYS.BUDGETS, updated);
  };

  const editBudget = async (id: string, patch: Partial<Budget>) => {
    const updated = budgets.map((b) => (b.id === id ? { ...b, ...patch } : b));
    setBudgets(updated);
    await persist(STORAGE_KEYS.BUDGETS, updated);
  };

  const deleteBudget = async (id: string) => {
    const updated = budgets.filter((b) => b.id !== id);
    setBudgets(updated);
    await persist(STORAGE_KEYS.BUDGETS, updated);
  };

  const addGoal = async (g: Omit<Goal, 'id' | 'createdAt'>) => {
    const newG: Goal = { ...g, id: genId(), createdAt: new Date().toISOString() };
    const updated = [...goals, newG];
    setGoals(updated);
    await persist(STORAGE_KEYS.GOALS, updated);
  };

  const editGoal = async (id: string, patch: Partial<Goal>) => {
    const updated = goals.map((g) => (g.id === id ? { ...g, ...patch } : g));
    setGoals(updated);
    await persist(STORAGE_KEYS.GOALS, updated);
  };

  const deleteGoal = async (id: string) => {
    const updated = goals.filter((g) => g.id !== id);
    setGoals(updated);
    await persist(STORAGE_KEYS.GOALS, updated);
  };

  const addToGoal = async (goalId: string, amount: number) => {
    const updated = goals.map((g) =>
      g.id === goalId ? { ...g, savedAmount: Math.min(g.savedAmount + amount, g.targetAmount) } : g
    );
    setGoals(updated);
    await persist(STORAGE_KEYS.GOALS, updated);
  };

  const addCustomCategory = async (c: Omit<Category, 'id'>) => {
    const newC: Category = { ...c, id: 'custom_' + genId() };
    const updated = [...customCategories, newC];
    setCustomCategories(updated);
    await persist(STORAGE_KEYS.CUSTOM_CATEGORIES, updated);
  };

  const deleteCustomCategory = async (id: string) => {
    const updated = customCategories.filter((c) => c.id !== id);
    setCustomCategories(updated);
    await persist(STORAGE_KEYS.CUSTOM_CATEGORIES, updated);
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions, budgets, goals, customCategories,
        addTransaction, editTransaction, deleteTransaction,
        addBudget, editBudget, deleteBudget,
        addGoal, editGoal, deleteGoal, addToGoal,
        addCustomCategory, deleteCustomCategory,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export const useFinance = () => useContext(FinanceContext);
