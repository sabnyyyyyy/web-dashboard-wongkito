// Creates/updates the database tables and makes sure an Owner account exists.
//
//   npm run db:setup         → apply schema; create OWN-001 if there is no owner yet
//   npm run db:reset-owner   → set a new temporary password for OWN-001 (forgot password)
//
// Reads DATABASE_URL from .env.local. Generated passwords are printed once and never stored in plain text.

import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { generateTempPassword, hashPassword } from '../src/server/password-hash.ts';
import { INITIAL_MENU, INITIAL_STOCKS, INITIAL_STORE_SETTINGS } from '../src/server/seed-data.ts';

const OWNER_ID = 'OWN-001';
const OWNER_NAME = 'Owner Warkop Wong Kito';

const isEmpty = async (client: pg.Client, table: string) =>
  (await client.query(`SELECT 1 FROM ${table} LIMIT 1`)).rowCount === 0;

// Fills menu, stock and settings with the starter data, but only tables that are still empty,
// so re-running setup never overwrites what the owner has changed.
const seedStoreData = async (client: pg.Client) => {
  if (await isEmpty(client, 'menu_items')) {
    for (const m of INITIAL_MENU) {
      await client.query(
        `INSERT INTO menu_items (name, category, price, cost_price, description, image, is_available, stock, popular)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [m.name, m.category, m.price, m.costPrice, m.description, m.image, m.isAvailable, m.stock, m.popular ?? false]
      );
    }
    console.log(`✓ ${INITIAL_MENU.length} menu awal ditambahkan.`);
  }

  if (await isEmpty(client, 'stock_items')) {
    for (const s of INITIAL_STOCKS) {
      await client.query(
        `INSERT INTO stock_items (name, category, unit, current_stock, min_stock, cost_per_unit, supplier, last_restocked)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE)`,
        [s.name, s.category, s.unit, s.currentStock, s.minStock, s.costPerUnit, s.supplier]
      );
    }
    console.log(`✓ ${INITIAL_STOCKS.length} bahan baku awal ditambahkan.`);
  }

  if (await isEmpty(client, 'store_settings')) {
    await client.query('INSERT INTO store_settings (id, data) VALUES (true, $1)', [JSON.stringify(INITIAL_STORE_SETTINGS)]);
    console.log('✓ Pengaturan toko awal dibuat.');
  }
};

const main = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL belum di-set. Salin .env.example ke .env.local lalu isi koneksi PostgreSQL.');
    process.exit(1);
  }

  const resetOwner = process.argv.includes('--reset-owner');
  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    const schema = await readFile(new URL('../src/server/schema.sql', import.meta.url), 'utf8');
    await client.query(schema);
    console.log('✓ Tabel akun, sesi, menu, stok, pesanan & pengaturan siap.');
    await seedStoreData(client);

    const { rows } = await client.query<{ login_id: string }>(
      `SELECT login_id FROM staff_accounts WHERE login_id LIKE 'OWN-%'`
    );

    if (rows.length > 0 && !resetOwner) {
      console.log(`✓ Akun owner sudah ada (${rows.map((r) => r.login_id).join(', ')}). Tidak ada yang diubah.`);
      return;
    }

    const password = generateTempPassword();
    const passwordHash = await hashPassword(password);
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO staff_accounts (login_id, name, shift, password_hash)
       VALUES ($1, $2, 'Full Time', $3)
       ON CONFLICT (login_id) DO UPDATE
         SET password_hash = EXCLUDED.password_hash, status = 'Aktif',
             failed_attempts = 0, locked_until = NULL, updated_at = now()`,
      [OWNER_ID, OWNER_NAME, passwordHash]
    );
    // A reset must also kick out any existing sessions of the owner.
    await client.query('DELETE FROM staff_sessions WHERE login_id = $1', [OWNER_ID]);
    await client.query('COMMIT');

    console.log('');
    console.log(resetOwner ? '✓ Password owner di-reset.' : '✓ Akun owner dibuat.');
    console.log(`   ID login : ${OWNER_ID}`);
    console.log(`   Password : ${password}`);
    console.log('   Simpan password ini sekarang — tidak akan ditampilkan lagi. Ganti lewat menu Profile setelah login.');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
};

main().catch((err) => {
  console.error('Gagal setup database:', err instanceof Error ? err.message : err);
  process.exit(1);
});
