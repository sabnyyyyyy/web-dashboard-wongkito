
'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';
import { User } from '@/types';

const API_URL = 'http://localhost:5000';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
login: (
  email: string,
  password: string,
  rememberMe?: boolean,
  expectedRole?: 'superadmin' | 'kasir'
) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  demoLogin: (role: 'superadmin' | 'kasir') => void;
}

interface BackendUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'superadmin';
}

interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: BackendUser;
}

interface MeResponse {
  success: boolean;
  user?: {
    id: number;
    email: string;
    role: 'admin' | 'superadmin';
  };
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

function saveSession(
  user: User,
  token: string,
  rememberMe: boolean
) {
  const targetStorage = rememberMe ? localStorage : sessionStorage;
  const otherStorage = rememberMe ? sessionStorage : localStorage;

  otherStorage.removeItem('wongkito_user');
  otherStorage.removeItem('wongkito_token');

  targetStorage.setItem('wongkito_user', JSON.stringify(user));
  targetStorage.setItem('wongkito_token', token);
}

function clearSession() {
  localStorage.removeItem('wongkito_user');
  localStorage.removeItem('wongkito_token');
  sessionStorage.removeItem('wongkito_user');
  sessionStorage.removeItem('wongkito_token');
}

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const token =
        localStorage.getItem('wongkito_token') ||
        sessionStorage.getItem('wongkito_token');

      if (!token) {
        if (!cancelled) {
          clearSession();
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Sesi login tidak valid atau sudah berakhir.');
        }

        const data: MeResponse = await response.json();

        if (!data.success || !data.user) {
          throw new Error('Data sesi tidak valid.');
        }

        const savedUser = localStorage.getItem('wongkito_user')
          || sessionStorage.getItem('wongkito_user');

        if (!savedUser) {
          throw new Error('Data pengguna tidak ditemukan.');
        }

        const parsedUser = JSON.parse(savedUser) as User;


const frontendRole =
  data.user.role === 'superadmin' ? 'superadmin' : 'kasir';

if (
  String(parsedUser.id) !== String(data.user.id) ||
  parsedUser.email !== data.user.email ||
  parsedUser.role !== frontendRole
) {
  throw new Error('Data pengguna tidak sesuai dengan token.');
}


        if (!cancelled) {
          setUser(parsedUser);
        }
      } catch {
        clearSession();

        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

const login: AuthContextType['login'] = async (
  email,
  password,
  rememberMe = false,
  expectedRole
) => {
  
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data: LoginResponse = await response.json();

      if (!response.ok || !data.success || !data.token || !data.user) {
        return {
          success: false,
          message: data.message || 'Login gagal. Periksa email dan password.',
        };
      }

const backendUser = data.user;

const actualRole =
  backendUser.role === 'superadmin' ? 'superadmin' : 'kasir';

if (expectedRole && actualRole !== expectedRole) {
  return {
    success: false,
    message:
      expectedRole === 'superadmin'
        ? 'Login ditolak. Akun ini bukan Owner Admin.'
        : 'Login ditolak. Akun ini bukan Kasir.',
  };
}

const activeUser: User = {

  id: String(backendUser.id),
  name: backendUser.name,
  email: backendUser.email,
  role: backendUser.role === 'superadmin' ? 'superadmin' : 'kasir',
  avatar: '',
  shift: backendUser.role === 'superadmin' ? 'Owner Shift' : 'Kasir Shift',
};

      saveSession(activeUser, data.token, rememberMe);
      setUser(activeUser);

      return { success: true };
    } catch {
      return {
        success: false,
        message: 'Tidak dapat terhubung ke backend. Pastikan server berjalan di localhost:5000.',
      };
    }
  };

  const demoLogin: AuthContextType['demoLogin'] = () => {
    return;
  };

  const logout = () => {
    clearSession();
    setUser(null);
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
