import 'server-only';
import type { PoolClient } from 'pg';
import { CartItem, MenuItem, Order, OrderStatus, OrderType, PaymentMethod, StoreSettings } from '@/types';
import { query, withTransaction } from './db';
import { toMenuItem } from './menu';
import { HttpError, requireNumber, requireOneOf, requireString } from './http';

export const ORDER_TYPES = ['dine_in', 'takeaway', 'delivery'] as const;
export const PAYMENT_METHODS = ['cash', 'qris', 'transfer', 'debit'] as const;
export const ORDER_STATUSES = ['pending', 'accepted', 'processing', 'ready', 'completed', 'cancelled'] as const;
const FINAL_STATUSES: readonly OrderStatus[] = ['completed', 'cancelled'];

// How many recent orders the dashboard loads.
const ORDER_LIST_LIMIT = 500;

interface OrderRow {
  id: string;
  order_number: string;
  customer_name: string;
  table_number: string | null;
  order_type: OrderType;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: 'paid' | 'unpaid';
  amount_paid: number;
  change_amount: number;
  status: OrderStatus;
  notes: string;
  cashier_name: string;
  created_at: Date;
}

const COLUMNS = `id, order_number, customer_name, table_number, order_type, items, subtotal, tax, discount, total,
  payment_method, payment_status, amount_paid, change_amount, status, notes, cashier_name, created_at`;

const toOrder = (row: OrderRow): Order => ({
  id: row.id,
  orderNumber: row.order_number,
  customerName: row.customer_name,
  ...(row.table_number ? { tableNumber: row.table_number } : {}),
  orderType: row.order_type,
  items: row.items,
  subtotal: row.subtotal,
  tax: row.tax,
  discount: row.discount,
  total: row.total,
  paymentMethod: row.payment_method,
  paymentStatus: row.payment_status,
  amountPaid: row.amount_paid,
  change: row.change_amount,
  status: row.status,
  createdAt: row.created_at.toISOString(),
  cashierName: row.cashier_name,
  ...(row.notes ? { notes: row.notes } : {}),
});

export interface NewOrderInput {
  customerName: string;
  tableNumber?: string;
  orderType: OrderType;
  items: { menuItemId: string; quantity: number; notes: string }[];
  discount: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  notes: string;
}

export const parseNewOrder = (body: Record<string, unknown>): NewOrderInput => {
  if (!Array.isArray(body.items) || body.items.length === 0) throw new HttpError(400, 'Keranjang masih kosong.');
  if (body.items.length > 100) throw new HttpError(400, 'Terlalu banyak item dalam satu pesanan.');

  const items = body.items.map((raw) => {
    const item = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    return {
      menuItemId: requireString(item.menuItemId, 'Menu', { min: 1, max: 100 }),
      quantity: requireNumber(item.quantity, 'Jumlah', { min: 1, max: 999 }),
      notes: requireString(item.notes ?? '', 'Catatan item', { max: 200 }),
    };
  });

  const orderType = requireOneOf(body.orderType, ORDER_TYPES, 'Tipe pesanan');
  const tableNumber = requireString(body.tableNumber ?? '', 'Nomor meja', { max: 30 });

  return {
    customerName: requireString(body.customerName ?? '', 'Nama pelanggan', { max: 100 }) || 'Pelanggan',
    ...(orderType === 'dine_in' && tableNumber ? { tableNumber } : {}),
    orderType,
    items,
    discount: requireNumber(body.discount ?? 0, 'Diskon'),
    paymentMethod: requireOneOf(body.paymentMethod, PAYMENT_METHODS, 'Metode pembayaran'),
    amountPaid: requireNumber(body.amountPaid ?? 0, 'Jumlah bayar'),
    notes: requireString(body.notes ?? '', 'Catatan', { max: 500 }),
  };
};

export const listOrders = async (): Promise<Order[]> => {
  const { rows } = await query<OrderRow>(`SELECT ${COLUMNS} FROM orders ORDER BY created_at DESC LIMIT $1`, [
    ORDER_LIST_LIMIT,
  ]);
  return rows.map(toOrder);
};

// Takes the portions off menu_items.stock; fails if the item is gone, switched off or sold out.
const reserveMenuItem = async (client: PoolClient, menuItemId: string, quantity: number): Promise<MenuItem> => {
  const { rows } = await client.query(
    `UPDATE menu_items SET stock = stock - $2, updated_at = now()
      WHERE id = $1 AND is_available AND stock >= $2
      RETURNING id, name, category, price, cost_price, description, image, is_available, stock, popular`,
    [menuItemId, quantity]
  );
  if (rows[0]) return toMenuItem(rows[0]);

  const { rows: existing } = await client.query<{ name: string; is_available: boolean; stock: number }>(
    'SELECT name, is_available, stock FROM menu_items WHERE id = $1',
    [menuItemId]
  );
  const item = existing[0];
  if (!item) throw new HttpError(409, 'Ada menu di keranjang yang sudah dihapus. Muat ulang halaman.');
  if (!item.is_available) throw new HttpError(409, `${item.name} sedang tidak tersedia.`);
  throw new HttpError(409, `Stok ${item.name} tinggal ${item.stock} porsi.`);
};

// Prices, tax and change are computed here from the database, never trusted from the browser.
export const createOrder = async (input: NewOrderInput, cashier: { loginId: string; name: string }): Promise<Order> =>
  withTransaction(async (client) => {
    // Serialises order-number generation so two tills can't get the same number.
    await client.query(`SELECT pg_advisory_xact_lock(hashtext('wongkito_order_number'))`);

    const { rows: settingRows } = await client.query<{ data: StoreSettings }>('SELECT data FROM store_settings WHERE id');
    const taxRate = settingRows[0]?.data.taxRate ?? 0;

    // Same menu item twice in the cart (e.g. with different notes) → reserve the total at once.
    const totals = new Map<string, number>();
    for (const item of input.items) totals.set(item.menuItemId, (totals.get(item.menuItemId) ?? 0) + item.quantity);
    const menuById = new Map<string, MenuItem>();
    for (const [menuItemId, quantity] of totals) menuById.set(menuItemId, await reserveMenuItem(client, menuItemId, quantity));

    const items: CartItem[] = input.items.map((item) => ({
      menuItem: menuById.get(item.menuItemId)!,
      quantity: item.quantity,
      ...(item.notes ? { notes: item.notes } : {}),
    }));

    const subtotal = items.reduce((sum, ci) => sum + ci.menuItem.price * ci.quantity, 0);
    const discount = Math.min(input.discount, subtotal);
    const tax = taxRate > 0 ? Math.round((subtotal - discount) * (taxRate / 100)) : 0;
    const total = Math.max(0, subtotal - discount + tax);

    let amountPaid = total;
    if (input.paymentMethod === 'cash') {
      if (input.amountPaid < total) throw new HttpError(400, 'Jumlah uang tunai kurang dari total tagihan.');
      amountPaid = input.amountPaid;
    }

    const { rows: numberRows } = await client.query<{ prefix: string; next: number }>(
      `SELECT p.prefix, count(o.id)::int + 1 AS next
         FROM (SELECT 'WK-' || to_char(now() AT TIME ZONE 'Asia/Jakarta', 'YYYYMMDD') || '-' AS prefix) p
         LEFT JOIN orders o ON o.order_number LIKE p.prefix || '%'
        GROUP BY p.prefix`
    );
    const orderNumber = numberRows[0].prefix + String(numberRows[0].next).padStart(3, '0');

    const { rows } = await client.query<OrderRow>(
      `INSERT INTO orders (order_number, customer_name, table_number, order_type, items, subtotal, tax, discount, total,
                           payment_method, payment_status, amount_paid, change_amount, notes, cashier_login_id, cashier_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'paid', $11, $12, $13, $14, $15)
       RETURNING ${COLUMNS}`,
      [
        orderNumber,
        input.customerName,
        input.tableNumber ?? null,
        input.orderType,
        JSON.stringify(items),
        subtotal,
        tax,
        discount,
        total,
        input.paymentMethod,
        amountPaid,
        amountPaid - total,
        input.notes,
        cashier.loginId,
        cashier.name,
      ]
    );
    return toOrder(rows[0]);
  });

// Moves an order along the kitchen flow. Finished orders are frozen; cancelling gives the portions back.
export const updateOrderStatus = async (id: string, status: OrderStatus): Promise<Order> =>
  withTransaction(async (client) => {
    const { rows: current } = await client.query<{ status: OrderStatus; items: CartItem[] }>(
      'SELECT status, items FROM orders WHERE id = $1 FOR UPDATE',
      [id]
    );
    if (!current[0]) throw new HttpError(404, 'Pesanan tidak ditemukan.');
    if (FINAL_STATUSES.includes(current[0].status)) {
      throw new HttpError(409, current[0].status === 'completed' ? 'Pesanan sudah selesai.' : 'Pesanan sudah dibatalkan.');
    }

    if (status === 'cancelled') {
      for (const ci of current[0].items) {
        await client.query('UPDATE menu_items SET stock = stock + $2, updated_at = now() WHERE id = $1', [
          ci.menuItem.id,
          ci.quantity,
        ]);
      }
    }

    const { rows } = await client.query<OrderRow>(
      `UPDATE orders SET status = $2, updated_at = now() WHERE id = $1 RETURNING ${COLUMNS}`,
      [id, status]
    );
    return toOrder(rows[0]);
  });
