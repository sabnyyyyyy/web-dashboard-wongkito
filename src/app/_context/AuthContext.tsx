'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { StaffAccount, User } from '@/types';
import { generateLoginId } from '@/lib/access';

// Auth state comes from the server (/api/auth/*, /api/accounts/*). The session lives in an
// httpOnly cookie, so nothing about the login is stored in or trusted from the browser.

export type KasirAccountInput = Pick<StaffAccount, 'name' | 'phone' | 'shift'> & { password: string };
export type KasirAccountUpdate = Pick<StaffAccount, 'name' | 'phone' | 'shift' | 'status'>;

interface AuthResult {
  success: boolean;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (loginId: string, password: string, rememberMe?: boolean) => Promise<AuthResult>;
  logout: () => Promise<void>;
  changeOwnPassword: (currentPassword: string, newPassword: string) => Promise<AuthResult>;
  updateOwnName: (name: string) => Promise<AuthResult>;
  // Owner-only account management (the server rejects these for any other role).
  kasirAccounts: StaffAccount[];
  nextKasirLoginId: string;
  createKasirAccount: (input: KasirAccountInput) => Promise<StaffAccount>;
  updateKasirAccount: (loginId: string, update: KasirAccountUpdate) => Promise<StaffAccount>;
  resetKasirPassword: (loginId: string) => Promise<string>;
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

const api = async <T,>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> => {
  let res: Response;
  try {
    res = await fetch(path, {
      method: init.method ?? 'GET',
      headers: init.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      credentials: 'same-origin',
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(0, 'Tidak bisa terhubung ke server. Cek koneksi internet.');
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.error ?? `Permintaan gagal (${res.status}).`);
  return data as T;
};

const toResult = (err: unknown): AuthResult => ({
  success: false,
  message: err instanceof Error ? err.message : 'Terjadi kesalahan.',
});

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [kasirAccounts, setKasirAccounts] = useState<StaffAccount[]>([]);

  const isOwner = user?.role === 'superadmin';

  // A 401 from any call means the session was revoked (deactivated, password reset, expired).
  const handleError = useCallback((err: unknown): never => {
    if (err instanceof ApiError && err.status === 401) setUser(null);
    throw err;
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Older client-only builds kept accounts and sessions in browser storage; clean them up.
    try {
      ['wongkito_user', 'wongkito_session', 'wongkito_accounts', 'wongkito_login_attempts'].forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
    } catch {}

    api<{ user: User | null }>('/api/auth/me')
      .then(({ user }) => !cancelled && setUser(user))
      .catch(() => !cancelled && setUser(null))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isOwner) return;
    let cancelled = false;
    api<{ accounts: StaffAccount[] }>('/api/accounts')
      .then(({ accounts }) => !cancelled && setKasirAccounts(accounts))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) setUser(null);
        console.error('[auth] gagal memuat akun kasir', err);
      });
    return () => {
      cancelled = true;
    };
  }, [isOwner]);

  const login = async (loginId: string, password: string, rememberMe = false): Promise<AuthResult> => {
    try {
      const { user } = await api<{ user: User }>('/api/auth/login', {
        method: 'POST',
        body: { loginId, password, rememberMe },
      });
      setUser(user);
      return { success: true };
    } catch (err) {
      return toResult(err);
    }
  };

  const logout = async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('[auth] logout gagal', err);
    } finally {
      setUser(null);
      setKasirAccounts([]);
    }
  };

  const changeOwnPassword = async (currentPassword: string, newPassword: string): Promise<AuthResult> => {
    try {
      await api('/api/auth/password', { method: 'POST', body: { currentPassword, newPassword } }).catch(handleError);
      return { success: true };
    } catch (err) {
      return toResult(err);
    }
  };

  const updateOwnName = async (name: string): Promise<AuthResult> => {
    try {
      const { user } = await api<{ user: User }>('/api/auth/me', { method: 'PATCH', body: { name } }).catch(
        handleError
      );
      setUser(user);
      return { success: true };
    } catch (err) {
      return toResult(err);
    }
  };

  // Preview only; the server assigns the real ID when the account is created.
  const nextKasirLoginId = useMemo(
    () =>
      generateLoginId(
        'kasir',
        kasirAccounts.map((a) => a.loginId)
      ),
    [kasirAccounts]
  );

  const createKasirAccount = async (input: KasirAccountInput): Promise<StaffAccount> => {
    const { account } = await api<{ account: StaffAccount }>('/api/accounts', { method: 'POST', body: input }).catch(
      handleError
    );
    setKasirAccounts((prev) => [...prev, account].sort((a, b) => a.loginId.localeCompare(b.loginId)));
    return account;
  };

  const updateKasirAccount = async (loginId: string, update: KasirAccountUpdate): Promise<StaffAccount> => {
    const { account } = await api<{ account: StaffAccount }>(`/api/accounts/${encodeURIComponent(loginId)}`, {
      method: 'PATCH',
      body: update,
    }).catch(handleError);
    setKasirAccounts((prev) => prev.map((a) => (a.loginId === loginId ? account : a)));
    return account;
  };

  const resetKasirPassword = async (loginId: string): Promise<string> => {
    const { tempPassword } = await api<{ tempPassword: string }>(
      `/api/accounts/${encodeURIComponent(loginId)}/reset-password`,
      { method: 'POST' }
    ).catch(handleError);
    return tempPassword;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        changeOwnPassword,
        updateOwnName,
        kasirAccounts: isOwner ? kasirAccounts : [],
        nextKasirLoginId,
        createKasirAccount,
        updateKasirAccount,
        resetKasirPassword,
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
