import 'server-only';
import { StockItem } from '@/types';
import { isUniqueViolation, query } from './db';
import { HttpError, requireNumber, requireString } from './http';

interface StockRow {
  id: string;
  name: string;
  category: string;
  unit: string;
  // NUMERIC comes back from pg as a string.
  current_stock: string;
  min_stock: string;
  cost_per_unit: number;
  supplier: string;
  last_restocked: string | null;
}

const COLUMNS =
  "id, name, category, unit, current_stock, min_stock, cost_per_unit, supplier, to_char(last_restocked, 'YYYY-MM-DD') AS last_restocked";

const toStockItem = (row: StockRow): StockItem => ({
  id: row.id,
  name: row.name,
  category: row.category,
  unit: row.unit,
  currentStock: Number(row.current_stock),
  minStock: Number(row.min_stock),
  costPerUnit: row.cost_per_unit,
  supplier: row.supplier,
  lastRestocked: row.last_restocked ?? '',
});

export type StockInput = Pick<StockItem, 'name' | 'category' | 'unit' | 'currentStock' | 'minStock' | 'costPerUnit' | 'supplier'>;

const QTY = { min: 0, max: 1_000_000, integer: false };

export const parseStockInput = (body: Record<string, unknown>): StockInput => ({
  name: requireString(body.name, 'Nama barang', { min: 1, max: 100 }),
  category: requireString(body.category ?? '', 'Kategori', { max: 50 }),
  unit: requireString(body.unit, 'Satuan', { min: 1, max: 30 }),
  currentStock: requireNumber(body.currentStock, 'Jumlah stok', QTY),
  minStock: requireNumber(body.minStock ?? 0, 'Batas minimum', QTY),
  costPerUnit: requireNumber(body.costPerUnit ?? 0, 'Harga per satuan'),
  supplier: requireString(body.supplier ?? '', 'Supplier', { max: 100 }),
});

const DUPLICATE_NAME = 'Nama barang sudah ada di daftar stok.';

export const listStock = async (): Promise<StockItem[]> => {
  const { rows } = await query<StockRow>(`SELECT ${COLUMNS} FROM stock_items ORDER BY name`);
  return rows.map(toStockItem);
};

export const createStockItem = async (input: StockInput): Promise<StockItem> => {
  try {
    const { rows } = await query<StockRow>(
      `INSERT INTO stock_items (name, category, unit, current_stock, min_stock, cost_per_unit, supplier, last_restocked)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE)
       RETURNING ${COLUMNS}`,
      [input.name, input.category, input.unit, input.currentStock, input.minStock, input.costPerUnit, input.supplier]
    );
    return toStockItem(rows[0]);
  } catch (err) {
    if (isUniqueViolation(err)) throw new HttpError(409, DUPLICATE_NAME);
    throw err;
  }
};

// Full update. An increase in quantity counts as a restock and moves last_restocked to today.
export const updateStockItem = async (id: string, input: StockInput): Promise<StockItem> => {
  try {
    const { rows } = await query<StockRow>(
      `UPDATE stock_items
          SET name = $2, category = $3, unit = $4, min_stock = $6, cost_per_unit = $7, supplier = $8,
              last_restocked = CASE WHEN $5 > current_stock THEN CURRENT_DATE ELSE last_restocked END,
              current_stock = $5, updated_at = now()
        WHERE id = $1
        RETURNING ${COLUMNS}`,
      [id, input.name, input.category, input.unit, input.currentStock, input.minStock, input.costPerUnit, input.supplier]
    );
    if (!rows[0]) throw new HttpError(404, 'Barang stok tidak ditemukan.');
    return toStockItem(rows[0]);
  } catch (err) {
    if (isUniqueViolation(err)) throw new HttpError(409, DUPLICATE_NAME);
    throw err;
  }
};
