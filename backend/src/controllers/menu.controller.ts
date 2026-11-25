import type { Request, Response } from 'express';
import { query } from '../db.js';
import { isOwner, sessionOf } from '../middleware/auth.middleware.js';
import { HttpError, param, readBody, requireBoolean, requireNumber, requireOneOf, requireString } from '../utils/http.js';
import type { MenuItem } from '../utils/types.js';

export const MENU_CATEGORIES = ['kopi', 'non-kopi', 'makanan', 'cemilan', 'signature'] as const;

export interface MenuRow {
  id: string;
  name: string;
  category: MenuItem['category'];
  price: number;
  cost_price: number;
  description: string;
  image: string;
  is_available: boolean;
  stock: number;
  popular: boolean;
}

export const MENU_COLUMNS = 'id, name, category, price, cost_price, description, image, is_available, stock, popular';

export const toMenuItem = (row: MenuRow): MenuItem => ({
  id: row.id,
  name: row.name,
  category: row.category,
  price: row.price,
  costPrice: row.cost_price,
  description: row.description,
  image: row.image,
  isAvailable: row.is_available,
  stock: row.stock,
  popular: row.popular,
});

type MenuInput = Omit<MenuItem, 'id'>;

// Validates a full menu item body (create and edit both send every field).
const parseMenuInput = (body: Record<string, unknown>): MenuInput => ({
  name: requireString(body.name, 'Nama menu', { min: 1, max: 100 }),
  category: requireOneOf(body.category, MENU_CATEGORIES, 'Kategori'),
  price: requireNumber(body.price, 'Harga jual'),
  costPrice: requireNumber(body.costPrice ?? 0, 'Harga modal'),
  description: requireString(body.description ?? '', 'Deskripsi', { max: 500 }),
  image: requireString(body.image ?? '', 'URL gambar', { max: 1000 }),
  isAvailable: requireBoolean(body.isAvailable ?? true, 'Status tersedia'),
  stock: requireNumber(body.stock ?? 0, 'Stok porsi'),
  popular: requireBoolean(body.popular ?? false, 'Status populer'),
});

const menuValues = (input: MenuInput) => [
  input.name,
  input.category,
  input.price,
  input.costPrice,
  input.description,
  input.image,
  input.isAvailable,
  input.stock,
  input.popular ?? false,
];

// GET /api/menu — the Owner sees everything; kasir only what can be sold.
export const listMenu = async (_req: Request, res: Response) => {
  const onlyAvailable = !isOwner(sessionOf(res));
  const { rows } = await query<MenuRow>(
    `SELECT ${MENU_COLUMNS} FROM menu_items ${onlyAvailable ? 'WHERE is_available' : ''} ORDER BY created_at, name`
  );
  res.json({ menu: rows.map(toMenuItem) });
};

// POST /api/menu (Owner)
export const createMenu = async (req: Request, res: Response) => {
  const input = parseMenuInput(readBody(req));
  const { rows } = await query<MenuRow>(
    `INSERT INTO menu_items (name, category, price, cost_price, description, image, is_available, stock, popular)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING ${MENU_COLUMNS}`,
    menuValues(input)
  );
  res.status(201).json({ item: toMenuItem(rows[0]) });
};

// PUT /api/menu/:id (Owner)
export const updateMenu = async (req: Request, res: Response) => {
  const input = parseMenuInput(readBody(req));
  const { rows } = await query<MenuRow>(
    `UPDATE menu_items
        SET name = $2, category = $3, price = $4, cost_price = $5, description = $6, image = $7,
            is_available = $8, stock = $9, popular = $10, updated_at = now()
      WHERE id = $1
      RETURNING ${MENU_COLUMNS}`,
    [param(req, 'id'), ...menuValues(input)]
  );
  if (!rows[0]) throw new HttpError(404, 'Menu tidak ditemukan.');
  res.json({ item: toMenuItem(rows[0]) });
};

// DELETE /api/menu/:id (Owner) — soft delete: the item is switched off, past orders keep their copy.
export const deleteMenu = async (req: Request, res: Response) => {
  const { rowCount } = await query('UPDATE menu_items SET is_available = false, updated_at = now() WHERE id = $1', [
    param(req, 'id'),
  ]);
  if (!rowCount) throw new HttpError(404, 'Menu tidak ditemukan.');
  res.status(204).end();
};
