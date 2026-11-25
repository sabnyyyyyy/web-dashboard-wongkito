import type { Request, Response } from 'express';
import { query } from '../db.js';
import { isOwner, sessionOf } from '../middleware/auth.middleware.js';

// Notifications are computed from the current data (no table to keep in sync):
//   - raw materials at or below their minimum (stock_items)
//   - menu items with only a few portions left (menu_items)
//   - orders waiting for the kitchen, and orders ready to be picked up (last 24 hours)

const LOW_PORTIONS = 5;
const ORDER_WINDOW_HOURS = 24;

interface Notification {
  id: string;
  category: 'order' | 'stock';
  level: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  createdAt: string;
  targetTab: 'orders' | 'inventory' | 'menu' | null;
}

const formatQty = (value: string): string => String(Number(value));

// GET /api/notifications
export const listNotifications = async (_req: Request, res: Response) => {
  const owner = isOwner(sessionOf(res));

  const [stock, menu, orders] = await Promise.all([
    query<{ id: string; name: string; unit: string; current_stock: string; min_stock: string; updated_at: Date }>(
      `SELECT id, name, unit, current_stock, min_stock, updated_at FROM stock_items
        WHERE current_stock <= min_stock ORDER BY current_stock / NULLIF(min_stock, 0) NULLS FIRST, name`
    ),
    query<{ id: string; name: string; stock: number; updated_at: Date }>(
      `SELECT id, name, stock, updated_at FROM menu_items WHERE is_available AND stock <= $1 ORDER BY stock, name`,
      [LOW_PORTIONS]
    ),
    query<{ id: string; order_number: string; status: string; customer_name: string; items_count: number; created_at: Date }>(
      `SELECT id, order_number, status, customer_name, jsonb_array_length(items) AS items_count, created_at
         FROM orders
        WHERE status IN ('pending', 'ready') AND created_at > now() - make_interval(hours => $1)
        ORDER BY created_at DESC`,
      [ORDER_WINDOW_HOURS]
    ),
  ]);

  const notifications: Notification[] = [
    ...orders.rows.map((o): Notification => ({
      id: `order-${o.id}-${o.status}`,
      category: 'order',
      level: 'info',
      title: o.status === 'pending' ? 'Pesanan Baru Masuk' : 'Pesanan Siap Diambil',
      description:
        o.status === 'pending'
          ? `Pesanan ${o.order_number} (${o.customer_name}, ${o.items_count} item) menunggu diproses.`
          : `Pesanan ${o.order_number} (${o.customer_name}) sudah siap diambil.`,
      createdAt: o.created_at.toISOString(),
      targetTab: 'orders',
    })),
    ...stock.rows.map((s): Notification => {
      const empty = Number(s.current_stock) <= 0;
      return {
        id: `stock-${s.id}`,
        category: 'stock',
        level: empty ? 'critical' : 'warning',
        title: empty ? 'Stok Bahan Habis' : 'Peringatan Stok Menipis',
        description: `${s.name} tersisa ${formatQty(s.current_stock)} ${s.unit} (batas minimum ${formatQty(s.min_stock)} ${s.unit}).`,
        createdAt: s.updated_at.toISOString(),
        targetTab: 'inventory',
      };
    }),
    ...menu.rows.map((m): Notification => ({
      id: `menu-${m.id}`,
      category: 'stock',
      level: m.stock === 0 ? 'critical' : 'warning',
      title: m.stock === 0 ? 'Menu Habis' : 'Porsi Menu Hampir Habis',
      description: m.stock === 0 ? `${m.name} sudah habis.` : `${m.name} tinggal ${m.stock} porsi.`,
      createdAt: m.updated_at.toISOString(),
      // Only the Owner can open the menu page.
      targetTab: owner ? 'menu' : null,
    })),
  ];

  notifications.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ notifications });
};
