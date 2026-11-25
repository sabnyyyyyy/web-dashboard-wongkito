import type { Request, Response } from 'express';
import { query } from '../db.js';
import { HttpError, readBody, requireNumber, requirePhone, requireString } from '../utils/http.js';
import type { StoreSettings } from '../utils/types.js';

const parseSettings = (body: Record<string, unknown>): StoreSettings => ({
  storeName: requireString(body.storeName, 'Nama toko', { min: 1, max: 100 }),
  tagline: requireString(body.tagline ?? '', 'Tagline', { max: 200 }),
  address: requireString(body.address ?? '', 'Alamat', { max: 300 }),
  phone: requirePhone(body.phone),
  taxRate: requireNumber(body.taxRate ?? 0, 'Pajak (%)', { min: 0, max: 100, integer: false }),
  serviceChargeRate: requireNumber(body.serviceChargeRate ?? 0, 'Service charge (%)', { min: 0, max: 100, integer: false }),
  receiptHeader: requireString(body.receiptHeader ?? '', 'Header nota', { max: 500, trim: false }),
  receiptFooter: requireString(body.receiptFooter ?? '', 'Footer nota', { max: 500, trim: false }),
  wifiPassword: requireString(body.wifiPassword ?? '', 'Password WiFi', { max: 100 }),
  openHours: requireString(body.openHours ?? '', 'Jam buka', { max: 100 }),
});

// GET /api/settings — any logged-in staff: receipts and the POS tax use these.
export const getSettings = async (_req: Request, res: Response) => {
  const { rows } = await query<{ data: StoreSettings }>('SELECT data FROM store_settings WHERE id');
  if (!rows[0]) throw new HttpError(503, 'Pengaturan toko belum dibuat. Jalankan npm run init-db di folder backend.');
  res.json({ settings: rows[0].data });
};

// PUT /api/settings (Owner) — replaces the store settings.
export const updateSettings = async (req: Request, res: Response) => {
  const settings = parseSettings(readBody(req));
  const { rows } = await query<{ data: StoreSettings }>(
    `INSERT INTO store_settings (id, data) VALUES (true, $1)
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
     RETURNING data`,
    [JSON.stringify(settings)]
  );
  res.json({ settings: rows[0].data });
};
