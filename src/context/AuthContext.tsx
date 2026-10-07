'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { INITIAL_USERS } from '@/data/mockData';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  demoLogin: (role: 'superadmin' | 'kasir') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check saved session in localStorage or sessionStorage
    const savedUser = localStorage.getItem('wongkito_user') || sessionStorage.getItem('wongkito_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('wongkito_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, rememberMe = false): Promise<{ success: boolean; message?: string }> => {
    // Artificial small delay for realistic UX
    await new Promise((res) => setTimeout(res, 600));

    // Normalize input
    const cleanEmail = email.trim().toLowerCase();

    // Check if user exists
    const matchedUser = INITIAL_USERS.find(
      (u) => u.email.toLowerCase() === cleanEmail || cleanEmail === 'warkopwongkito' || cleanEmail === 'admin'
    );

    // Accept default credentials or demo login
    if (
      (cleanEmail === 'warkopwongkito@gmail.com' || cleanEmail === 'admin' || cleanEmail === 'warkopwongkito') &&
      (password.length >= 4 || password === 'admin123')
    ) {
      const activeUser = matchedUser || INITIAL_USERS[0];
      setUser(activeUser);
      if (rememberMe) {
        localStorage.setItem('wongkito_user', JSON.stringify(activeUser));
      } else {
        sessionStorage.setItem('wongkito_user', JSON.stringify(activeUser));
      }
      return { success: true };
    }

    // Match any user in initial list with password >= 4
    if (matchedUser && password.length >= 4) {
      setUser(matchedUser);
      if (rememberMe) {
        localStorage.setItem('wongkito_user', JSON.stringify(matchedUser));
      } else {
        sessionStorage.setItem('wongkito_user', JSON.stringify(matchedUser));
      }
      return { success: true };
    }

    // If custom email provided, allow logging in as custom admin for flexibility
    if (cleanEmail && password.length >= 4) {
      const customUser: User = {
        id: 'u-custom',
        name: cleanEmail.split('@')[0].toUpperCase(),
        email: cleanEmail,
        role: 'superadmin',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        shift: 'Owner Shift',
      };
      setUser(customUser);
      if (rememberMe) {
        localStorage.setItem('wongkito_user', JSON.stringify(customUser));
      } else {
        sessionStorage.setItem('wongkito_user', JSON.stringify(customUser));
      }
      return { success: true };
    }

    return {
      success: false,
      message: 'Email atau password salah. (Gunakan email: warkopwongkito@gmail.com / password bebas min 4 karakter)',
    };
  };

  const demoLogin = (role: 'superadmin' | 'kasir') => {
    const targetUser = INITIAL_USERS.find((u) => u.role === role) || INITIAL_USERS[0];
    setUser(targetUser);
    localStorage.setItem('wongkito_user', JSON.stringify(targetUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('wongkito_user');
    sessionStorage.removeItem('wongkito_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        demoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
