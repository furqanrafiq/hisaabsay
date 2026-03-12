import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '@/types';
import { sendOTP as apiSendOTP, verifyOTP as apiVerifyOTP, logout as apiLogout } from '@/services/auth';
import { apiFetch } from '@/services/api';
import { getAuthToken } from '@/services/token';

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
      const token = await getAuthToken();
      if (token) {
        try {
          const profile = await apiFetch<UserProfile>('/profile');
          setUser(profile);
          setIsAuthenticated(true);
        } catch {
          await apiLogout();
        }
      }
      setIsLoading(false);
    })();
  }, []);

  const sendOTP = async (contact: string) => {
    await apiSendOTP(contact);
  };

  const verifyOTP = async (contact: string, otp: string) => {
    const profile = await apiVerifyOTP(contact, otp);
    setUser(profile);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (patch: Partial<UserProfile>) => {
    if (!user) return;
    const updated = await apiFetch<UserProfile>('/profile', {
      method: 'PATCH',
      body: JSON.stringify({ ...user, ...patch }),
    });
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, sendOTP, verifyOTP, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
