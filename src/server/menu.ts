import 'server-only';
import { MenuItem } from '@/types';
import { query } from './db';
import { HttpError, requireBoolean, requireNumber, requireOneOf, requireString } from './http';

export const MENU_CATEGORIES = ['kopi', 'non-kopi', 'makanan', 'cemilan', 'signature'] as const;

interface MenuRow {
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

const COLUMNS = 'id, name, category, price, cost_price, description, image, is_available, stock, popular';

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

export type MenuInput = Omit<MenuItem, 'id'>;

// Validates a full menu item body (create and edit both send every field).
export const parseMenuInput = (body: Record<string, unknown>): MenuInput => ({
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

export const listMenu = async (): Promise<MenuItem[]> => {
  const { rows } = await query<MenuRow>(`SELECT ${COLUMNS} FROM menu_items ORDER BY created_at, name`);
  return rows.map(toMenuItem);
};

export const createMenuItem = async (input: MenuInput): Promise<MenuItem> => {
  const { rows } = await query<MenuRow>(
    `INSERT INTO menu_items (name, category, price, cost_price, description, image, is_available, stock, popular)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING ${COLUMNS}`,
    [
      input.name,
      input.category,
      input.price,
      input.costPrice,
      input.description,
      input.image,
      input.isAvailable,
      input.stock,
      input.popular ?? false,
    ]
  );
  return toMenuItem(rows[0]);
};

export const updateMenuItem = async (id: string, input: MenuInput): Promise<MenuItem> => {
  const { rows } = await query<MenuRow>(
    `UPDATE menu_items
        SET name = $2, category = $3, price = $4, cost_price = $5, description = $6, image = $7,
            is_available = $8, stock = $9, popular = $10, updated_at = now()
      WHERE id = $1
      RETURNING ${COLUMNS}`,
    [
      id,
      input.name,
      input.category,
      input.price,
      input.costPrice,
      input.description,
      input.image,
      input.isAvailable,
      input.stock,
      input.popular ?? false,
    ]
  );
  if (!rows[0]) throw new HttpError(404, 'Menu tidak ditemukan.');
  return toMenuItem(rows[0]);
};

export const deleteMenuItem = async (id: string): Promise<void> => {
  // Past orders keep their own snapshot of the item, so deleting it doesn't touch history.
  const { rowCount } = await query('DELETE FROM menu_items WHERE id = $1', [id]);
  if (!rowCount) throw new HttpError(404, 'Menu tidak ditemukan.');
};
