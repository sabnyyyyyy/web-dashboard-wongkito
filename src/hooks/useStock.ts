'use client';

import { useCache } from '@/hooks/useCache';
import { api } from '@/utils/api';
import type { StockItem } from '@/types';

// Stock data is private (session cookie) and account-scoped in the SWR cache.
// A null key disables fetching until the user has a session.
export const stockKey = (loginId: string | null) => (loginId ? (['stock', loginId] as const) : null);

const fetchStock = async (): Promise<StockItem[]> => {
  const { stock } = await api<{ stock: StockItem[] }>('/api/stock');
  return stock;
};

export const useStock = (loginId: string | null) => useCache<StockItem[]>(stockKey(loginId), fetchStock);
