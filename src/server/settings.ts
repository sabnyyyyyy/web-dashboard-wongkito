import 'server-only';
import { StoreSettings } from '@/types';
import { query } from './db';
import { HttpError, requireNumber, requireString } from './http';

export const parseSettings = (body: Record<string, unknown>): StoreSettings => ({
  storeName: requireString(body.storeName, 'Nama toko', { min: 1, max: 100 }),
  tagline: requireString(body.tagline ?? '', 'Tagline', { max: 200 }),
  address: requireString(body.address ?? '', 'Alamat', { max: 300 }),
  phone: requireString(body.phone ?? '', 'Nomor telepon', { max: 30 }),
  taxRate: requireNumber(body.taxRate ?? 0, 'Pajak (%)', { min: 0, max: 100, integer: false }),
  serviceChargeRate: requireNumber(body.serviceChargeRate ?? 0, 'Service charge (%)', { min: 0, max: 100, integer: false }),
  receiptHeader: requireString(body.receiptHeader ?? '', 'Header nota', { max: 500, trim: false }),
  receiptFooter: requireString(body.receiptFooter ?? '', 'Footer nota', { max: 500, trim: false }),
  wifiPassword: requireString(body.wifiPassword ?? '', 'Password WiFi', { max: 100 }),
  openHours: requireString(body.openHours ?? '', 'Jam buka', { max: 100 }),
});

export const getSettings = async (): Promise<StoreSettings> => {
  const { rows } = await query<{ data: StoreSettings }>('SELECT data FROM store_settings WHERE id');
  if (!rows[0]) throw new HttpError(503, 'Pengaturan toko belum dibuat. Jalankan npm run db:setup.');
  return rows[0].data;
};

export const saveSettings = async (settings: StoreSettings): Promise<StoreSettings> => {
  const { rows } = await query<{ data: StoreSettings }>(
    `INSERT INTO store_settings (id, data) VALUES (true, $1)
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
     RETURNING data`,
    [JSON.stringify(settings)]
  );
  return rows[0].data;
};
