import React, { createContext, useContext, useEffect, useState } from 'react';
import { Transaction, Budget, Goal } from '@/types';
import { Category } from '@/constants/categories';
import { apiFetch } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

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

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [customCategories, setCustomCategories] = useState<Category[]>([]);

  useEffect(() => {
    (async () => {
      if (!isAuthenticated) {
        setTransactions([]);
        setBudgets([]);
        setGoals([]);
        setCustomCategories([]);
        return;
      }
      const [t, b, g, cc] = await Promise.all([
        apiFetch<Transaction[]>('/transactions'),
        apiFetch<Budget[]>('/budgets'),
        apiFetch<Goal[]>('/goals'),
        apiFetch<Category[]>('/categories/custom'),
      ]);
      setTransactions(t);
      setBudgets(b);
      setGoals(g);
      setCustomCategories(cc);
    })();
  }, [isAuthenticated]);

  const addTransaction = async (t: Omit<Transaction, 'id' | 'createdAt'>) => {
    const created = await apiFetch<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(t) });
    setTransactions((prev) => [created, ...prev]);
  };

  const editTransaction = async (id: string, patch: Partial<Transaction>) => {
    const updated = await apiFetch<Transaction>(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
    setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
  };

  const deleteTransaction = async (id: string) => {
    await apiFetch<void>(`/transactions/${id}`, { method: 'DELETE' });
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const addBudget = async (b: Omit<Budget, 'id'>) => {
    const created = await apiFetch<Budget>('/budgets', { method: 'POST', body: JSON.stringify(b) });
    setBudgets((prev) => [...prev, created]);
  };

  const editBudget = async (id: string, patch: Partial<Budget>) => {
    const updated = await apiFetch<Budget>(`/budgets/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
    setBudgets((prev) => prev.map((b) => (b.id === id ? updated : b)));
  };

  const deleteBudget = async (id: string) => {
    await apiFetch<void>(`/budgets/${id}`, { method: 'DELETE' });
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  };

  const addGoal = async (g: Omit<Goal, 'id' | 'createdAt'>) => {
    const created = await apiFetch<Goal>('/goals', { method: 'POST', body: JSON.stringify(g) });
    setGoals((prev) => [...prev, created]);
  };

  const editGoal = async (id: string, patch: Partial<Goal>) => {
    const updated = await apiFetch<Goal>(`/goals/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
    setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
  };

  const deleteGoal = async (id: string) => {
    await apiFetch<void>(`/goals/${id}`, { method: 'DELETE' });
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const addToGoal = async (goalId: string, amount: number) => {
    const updated = await apiFetch<Goal>(`/goals/${goalId}/contribute`, { method: 'POST', body: JSON.stringify({ amount }) });
    setGoals((prev) => prev.map((g) => (g.id === goalId ? updated : g)));
  };

  const addCustomCategory = async (c: Omit<Category, 'id'>) => {
    const created = await apiFetch<Category>('/categories/custom', { method: 'POST', body: JSON.stringify(c) });
    setCustomCategories((prev) => [...prev, created]);
  };

  const deleteCustomCategory = async (id: string) => {
    await apiFetch<void>(`/categories/custom/${id}`, { method: 'DELETE' });
    setCustomCategories((prev) => prev.filter((c) => c.id !== id));
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
