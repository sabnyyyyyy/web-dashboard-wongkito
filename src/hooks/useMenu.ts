'use client';

import { useCache } from '@/hooks/useCache';
import { api } from '@/utils/api';
import type { MenuItem } from '@/types';

// Menu data is private (session cookie) and account-scoped in the SWR cache.
// A null key disables fetching until the user has a session.
export const menuKey = (loginId: string | null) => (loginId ? (['menu', loginId] as const) : null);

const fetchMenu = async (): Promise<MenuItem[]> => {
  const { menu } = await api<{ menu: MenuItem[] }>('/api/menu');
  return menu;
};

export const useMenu = (loginId: string | null) => useCache<MenuItem[]>(menuKey(loginId), fetchMenu);
