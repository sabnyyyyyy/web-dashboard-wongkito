// Data fetching that runs on the Next.js server (Server Components and Server Actions only;
// it uses next/headers, so importing it from a Client Component fails the build).
// The browser still calls /api/* through the rewrite in next.config.ts; these helpers talk to
// the Express backend directly, server to server.

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Order, StoreInfo } from '@/types';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';

// Must match SESSION_COOKIE in backend/src/utils/session.ts.
const SESSION_COOKIE = 'wk_session';

// Cache tag for the public store info; the Settings page clears it after the Owner saves.
export const STORE_INFO_TAG = 'store-info';

// Cached on the Next.js server: at most one backend request per 5 minutes for every visitor of
// the login page, and refreshed at once when the Owner saves new settings (updateTag).
export const getStoreInfo = async (): Promise<StoreInfo | null> => {
  try {
    const res = await fetch(`${BACKEND_URL}/api/settings/public`, {
      next: { revalidate: 300, tags: [STORE_INFO_TAG] },
    });
    if (!res.ok) return null;
    return ((await res.json()) as { store: StoreInfo }).store;
  } catch {
    // Backend down: the login page still renders, just without the store details.
    return null;
  }
};

// Server-side rendering of per-user data: forwards the visitor's session cookie to the backend.
// Never cached, since every user (and every new order) gives a different answer.
export const getOrdersForSession = async (): Promise<Order[]> => {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!session) redirect('/login');

  const res = await fetch(`${BACKEND_URL}/api/orders`, {
    headers: { Cookie: `${SESSION_COOKIE}=${encodeURIComponent(session)}` },
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error(`Gagal memuat riwayat pesanan dari server (${res.status}).`);
  return ((await res.json()) as { orders: Order[] }).orders;
};
