import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '@/types';
import { mockSendOTP, mockVerifyOTP, saveSession, loadSession, clearSession } from '@/services/auth';
import { loadData, saveData, STORAGE_KEYS } from '@/services/storage';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  sendOTP: (contact: string) => Promise<void>;
  verifyOTP: (contact: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    (async () => {
      const phone = await loadSession();
      if (phone) {
        const profile = await loadData<UserProfile>(STORAGE_KEYS.PROFILE);
        if (profile) { setUser(profile); setIsAuthenticated(true); }
      }
      setIsLoading(false);
    })();
  }, []);

  const sendOTP = async (contact: string) => {
    await mockSendOTP(contact);
  };

  const verifyOTP = async (contact: string, otp: string) => {
    const profile = await mockVerifyOTP(contact, otp);
    await saveSession(contact);
    setUser(profile);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await clearSession();
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (patch: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...patch };
    await saveData(STORAGE_KEYS.PROFILE, updated);
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, sendOTP, verifyOTP, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
