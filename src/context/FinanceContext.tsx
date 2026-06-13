import React, { createContext, useContext, useEffect, useState } from 'react';
import { Transaction, Budget, Goal, Currency, Account } from '@/types';
import { Category } from '@/constants/categories';
import { apiFetch } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { STORAGE_KEYS, loadData, saveData } from '@/services/storage';

const DEFAULT_CURRENCY = 'PKR';

interface FinanceContextType {
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  customCategories: Category[];
  currencies: Currency[];
  accounts: Account[];
  activeCurrency: string;
  setActiveCurrency: (code: string) => void;
  activeAccountId: string | null;
  setActiveAccountId: (id: string | null) => void;
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
  addCustomCategory: (c: Omit<Category, 'id'>) => Promise<Category>;
  deleteCustomCategory: (id: string) => Promise<void>;
  addAccount: (a: Omit<Account, 'id' | 'createdAt'>) => Promise<Account>;
  editAccount: (id: string, patch: Partial<Account>) => Promise<Account>;
  deleteAccount: (id: string) => Promise<void>;
  reassignAccountTransactions: (fromId: string, toId: string) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType>(null!);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeCurrency, setActiveCurrencyState] = useState<string>(DEFAULT_CURRENCY);
  const [activeAccountId, setActiveAccountIdState] = useState<string | null>(null);

  // useEffect(() => { logout(); }, []);

  useEffect(() => {
    (async () => {
      if (!isAuthenticated) {
        setTransactions([]);
        setBudgets([]);
        setGoals([]);
        setCustomCategories([]);
        setCurrencies([]);
        setAccounts([]);
        setActiveCurrencyState(DEFAULT_CURRENCY);
        setActiveAccountIdState(null);
        return;
      }
      try {
        const [t, b, g, cc, cur, acc, savedCur, savedAcc] = await Promise.all([
          apiFetch<Transaction[]>('/transactions'),
          apiFetch<Budget[]>('/budgets'),
          apiFetch<Goal[]>('/goals'),
          apiFetch<Category[]>('/categories/custom'),
          apiFetch<Currency[]>('/currencies'),
          apiFetch<Account[]>('/accounts'),
          loadData<string>(STORAGE_KEYS.ACTIVE_CURRENCY),
          loadData<string>(STORAGE_KEYS.ACTIVE_ACCOUNT),
        ]);
        setTransactions(t ?? []);
        setBudgets(b ?? []);
        setGoals(g ?? []);
        setCustomCategories(cc ?? []);
        setCurrencies(cur ?? []);
        setAccounts(acc ?? []);
        const valid = (cur ?? []).some((c) => c.code === savedCur);
        const resolvedCurrency = valid && savedCur ? savedCur : DEFAULT_CURRENCY;
        setActiveCurrencyState(resolvedCurrency);
        const validAcc = savedAcc && (acc ?? []).some((a) => a.id === savedAcc && a.currency === resolvedCurrency);
        setActiveAccountIdState(validAcc ? savedAcc! : null);
      } catch (e) {
        console.error('[FinanceContext] Failed to load data:', e);
      }
    })();
  }, [isAuthenticated]);

  const setActiveCurrency = (code: string) => {
    setActiveCurrencyState(code);
    saveData(STORAGE_KEYS.ACTIVE_CURRENCY, code);
    // Clear active account if it doesn't belong to the newly selected currency.
    const stillValid = accounts.some((a) => a.id === activeAccountId && a.currency === code);
    if (!stillValid) {
      setActiveAccountIdState(null);
      saveData(STORAGE_KEYS.ACTIVE_ACCOUNT, '');
    }
  };

  const setActiveAccountId = (id: string | null) => {
    setActiveAccountIdState(id);
    saveData(STORAGE_KEYS.ACTIVE_ACCOUNT, id ?? '');
  };

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
    return created;
  };

  const deleteCustomCategory = async (id: string) => {
    await apiFetch<void>(`/categories/custom/${id}`, { method: 'DELETE' });
    setCustomCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const addAccount = async (a: Omit<Account, 'id' | 'createdAt'>) => {
    const created = await apiFetch<Account>('/accounts', { method: 'POST', body: JSON.stringify(a) });
    setAccounts((prev) => [...prev, created]);
    return created;
  };

  const editAccount = async (id: string, patch: Partial<Account>) => {
    const updated = await apiFetch<Account>(`/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
    setAccounts((prev) => prev.map((a) => (a.id === id ? updated : a)));
    return updated;
  };

  const deleteAccount = async (id: string) => {
    await apiFetch<void>(`/accounts/${id}`, { method: 'DELETE' });
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    if (activeAccountId === id) setActiveAccountId(null);
  };

  const reassignAccountTransactions = async (fromId: string, toId: string) => {
    await apiFetch<{ status: string }>(`/accounts/${fromId}/reassign`, {
      method: 'POST',
      body: JSON.stringify({ toAccountId: toId }),
    });
    setTransactions((prev) => prev.map((t) => (t.accountId === fromId ? { ...t, accountId: toId } : t)));
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions, budgets, goals, customCategories,
        currencies, accounts,
        activeCurrency, setActiveCurrency,
        activeAccountId, setActiveAccountId,
        addTransaction, editTransaction, deleteTransaction,
        addBudget, editBudget, deleteBudget,
        addGoal, editGoal, deleteGoal, addToGoal,
        addCustomCategory, deleteCustomCategory,
        addAccount, editAccount, deleteAccount, reassignAccountTransactions,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export const useFinance = () => useContext(FinanceContext);
