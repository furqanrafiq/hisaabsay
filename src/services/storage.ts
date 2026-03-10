import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  TRANSACTIONS: '@hisaabsay/transactions',
  BUDGETS: '@hisaabsay/budgets',
  GOALS: '@hisaabsay/goals',
  PROFILE: '@hisaabsay/profile',
  SESSION: '@hisaabsay/session',
  CUSTOM_CATEGORIES: '@hisaabsay/custom_categories',
};

export async function loadData<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function saveData<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export async function removeData(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {}
}
