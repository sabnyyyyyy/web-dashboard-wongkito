import type { Request, Response } from 'express';
import { query } from '../db.js';

// Sales figures for the dashboard and reports, computed from the orders table (Asia/Jakarta days).
// Cancelled orders are left out of every number except the cancellation count.

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const TOP_MENU_LIMIT = 5;

// Order date in Jakarta time, and today's date in Jakarta time.
const ORDER_DAY = `(o.created_at AT TIME ZONE 'Asia/Jakarta')::date`;
const TODAY = `(now() AT TIME ZONE 'Asia/Jakarta')::date`;

// Gross profit of one order: (selling price − cost price) × quantity for every item, minus the discount.
const ORDER_PROFIT = `(
  SELECT COALESCE(SUM(((i->'menuItem'->>'price')::int - COALESCE((i->'menuItem'->>'costPrice')::int, 0))
                      * (i->>'quantity')::int), 0)
    FROM jsonb_array_elements(o.items) i
) - o.discount`;

// GET /api/dashboard/summary
export const getSummary = async (_req: Request, res: Response) => {
  const [today, hourly, weekly, topMenu] = await Promise.all([
    query<{ sales: string; orders: number; cancelled: number }>(
      `SELECT COALESCE(SUM(o.total) FILTER (WHERE o.status <> 'cancelled'), 0) AS sales,
              (COUNT(*) FILTER (WHERE o.status <> 'cancelled'))::int AS orders,
              (COUNT(*) FILTER (WHERE o.status = 'cancelled'))::int AS cancelled
         FROM orders o
        WHERE ${ORDER_DAY} = ${TODAY}`
    ),
    query<{ hour: number; total: string; orders: number }>(
      `SELECT h AS hour, COALESCE(SUM(o.total), 0) AS total, COUNT(o.id)::int AS orders
         FROM generate_series(0, 23) h
         LEFT JOIN orders o
           ON o.status <> 'cancelled'
          AND ${ORDER_DAY} = ${TODAY}
          AND extract(hour FROM o.created_at AT TIME ZONE 'Asia/Jakarta') = h
        GROUP BY h ORDER BY h`
    ),
    query<{ day: string; sales: string; profit: string; orders: number }>(
      `SELECT to_char(d, 'YYYY-MM-DD') AS day,
              COALESCE(SUM(x.total), 0) AS sales,
              COALESCE(SUM(x.profit), 0) AS profit,
              COUNT(x.total)::int AS orders
         FROM generate_series(${TODAY} - 6, ${TODAY}, interval '1 day') d
         LEFT JOIN (
           SELECT ${ORDER_DAY} AS day, o.total, ${ORDER_PROFIT} AS profit
             FROM orders o
            WHERE o.status <> 'cancelled' AND o.created_at > now() - interval '8 days'
         ) x ON x.day = d::date
        GROUP BY d ORDER BY d`
    ),
    query<{ name: string; quantity: string; revenue: string }>(
      `SELECT i->'menuItem'->>'name' AS name,
              SUM((i->>'quantity')::int) AS quantity,
              SUM((i->'menuItem'->>'price')::int * (i->>'quantity')::int) AS revenue
         FROM orders o, jsonb_array_elements(o.items) i
        WHERE o.status <> 'cancelled' AND ${ORDER_DAY} > ${TODAY} - 7
        GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT $1`,
      [TOP_MENU_LIMIT]
    ),
  ]);

  const t = today.rows[0];
  const sales = Number(t.sales);
  res.json({
    today: {
      sales,
      orders: t.orders,
      averageOrder: t.orders > 0 ? Math.round(sales / t.orders) : 0,
      cancelled: t.cancelled,
    },
    // Today per hour, e.g. { hour: '08:00', total: 180000, orders: 8 }.
    hourly: hourly.rows.map((r) => ({
      hour: `${String(r.hour).padStart(2, '0')}:00`,
      total: Number(r.total),
      orders: r.orders,
    })),
    // Last 7 days, oldest first, e.g. { day: 'Senin', date: '2026-11-23', sales, profit, orders }.
    weekly: weekly.rows.map((r) => ({
      day: DAY_NAMES[new Date(`${r.day}T00:00:00Z`).getUTCDay()],
      date: r.day,
      sales: Number(r.sales),
      profit: Number(r.profit),
      orders: r.orders,
    })),
    // Best sellers of the last 7 days.
    topMenu: topMenu.rows.map((r) => ({ name: r.name, quantity: Number(r.quantity), revenue: Number(r.revenue) })),
  });
};
