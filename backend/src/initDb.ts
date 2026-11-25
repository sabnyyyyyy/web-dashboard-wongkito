// Creates/updates the database tables, fills empty tables with starter data and makes sure an
// Owner account exists.
//
//   npm run init-db       → apply schema; create OWN-001 if there is no owner yet
//   npm run reset-owner   → set a new temporary password for OWN-001 (forgot password)
//
// Reads DATABASE_URL from backend/.env. Generated passwords are printed once and never stored in plain text.

import pg from 'pg';
import { generateTempPassword, hashPassword } from './utils/password-hash.js';
import { INITIAL_MENU, INITIAL_STOCKS, INITIAL_STORE_SETTINGS } from './utils/seed-data.js';

const OWNER_ID = 'OWN-001';
const OWNER_NAME = 'Owner Warkop Wong Kito';

const SCHEMA = `
-- Staff accounts & sessions for the Wong Kito dashboard.
-- Idempotent: safe to run on every \`npm run init-db\`.

CREATE TABLE IF NOT EXISTS staff_accounts (
  -- Role is derived from the prefix: OWN-xxx = Owner, KSR-xxx = Kasir.
  login_id        TEXT PRIMARY KEY CHECK (login_id ~ '^(OWN|KSR)-[0-9]{3,}$'),
  name            TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  phone           TEXT NOT NULL DEFAULT '' CHECK (char_length(phone) <= 30),
  shift           TEXT NOT NULL DEFAULT '' CHECK (char_length(shift) <= 50),
  status          TEXT NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Nonaktif')),
  avatar_url      TEXT,
  password_hash   TEXT NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only the SHA-256 of the session token is stored; the raw token lives in the httpOnly cookie.
CREATE TABLE IF NOT EXISTS staff_sessions (
  token_hash TEXT PRIMARY KEY,
  login_id   TEXT NOT NULL REFERENCES staff_accounts (login_id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS staff_sessions_login_id_idx ON staff_sessions (login_id);
CREATE INDEX IF NOT EXISTS staff_sessions_expires_at_idx ON staff_sessions (expires_at);

-- ---------------------------------------------------------------------------
-- Store data: menu, raw-material stock, orders, settings.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS menu_items (
  id           TEXT PRIMARY KEY DEFAULT ('m-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
  name         TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  category     TEXT NOT NULL CHECK (category IN ('kopi', 'non-kopi', 'makanan', 'cemilan', 'signature')),
  price        INTEGER NOT NULL CHECK (price >= 0),
  cost_price   INTEGER NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
  description  TEXT NOT NULL DEFAULT '' CHECK (char_length(description) <= 500),
  image        TEXT NOT NULL DEFAULT '' CHECK (char_length(image) <= 1000),
  is_available BOOLEAN NOT NULL DEFAULT true,
  -- Portions left; selling through the POS reduces it.
  stock        INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  popular      BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_items (
  id             TEXT PRIMARY KEY DEFAULT ('stk-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
  name           TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  category       TEXT NOT NULL DEFAULT '' CHECK (char_length(category) <= 50),
  unit           TEXT NOT NULL CHECK (char_length(unit) BETWEEN 1 AND 30),
  current_stock  NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  min_stock      NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
  cost_per_unit  INTEGER NOT NULL DEFAULT 0 CHECK (cost_per_unit >= 0),
  supplier       TEXT NOT NULL DEFAULT '' CHECK (char_length(supplier) <= 100),
  last_restocked DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS stock_items_name_idx ON stock_items (lower(name));

CREATE TABLE IF NOT EXISTS orders (
  id               TEXT PRIMARY KEY DEFAULT ('ord-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
  order_number     TEXT NOT NULL UNIQUE,
  customer_name    TEXT NOT NULL CHECK (char_length(customer_name) BETWEEN 1 AND 100),
  table_number     TEXT CHECK (char_length(table_number) <= 30),
  order_type       TEXT NOT NULL CHECK (order_type IN ('dine_in', 'takeaway', 'delivery')),
  -- Snapshot of what was sold (name, price, notes), so later menu edits don't rewrite history.
  items            JSONB NOT NULL,
  subtotal         INTEGER NOT NULL CHECK (subtotal >= 0),
  tax              INTEGER NOT NULL CHECK (tax >= 0),
  discount         INTEGER NOT NULL CHECK (discount >= 0),
  total            INTEGER NOT NULL CHECK (total >= 0),
  payment_method   TEXT NOT NULL CHECK (payment_method IN ('cash', 'qris', 'transfer', 'debit')),
  payment_status   TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid', 'unpaid')),
  amount_paid      INTEGER NOT NULL CHECK (amount_paid >= 0),
  change_amount    INTEGER NOT NULL DEFAULT 0 CHECK (change_amount >= 0),
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'accepted', 'processing', 'ready', 'completed', 'cancelled')),
  notes            TEXT NOT NULL DEFAULT '' CHECK (char_length(notes) <= 500),
  cashier_login_id TEXT REFERENCES staff_accounts (login_id) ON DELETE SET NULL,
  cashier_name     TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);

-- Single row (id is always true) holding the StoreSettings object.
CREATE TABLE IF NOT EXISTS store_settings (
  id         BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
  data       JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Attendance: one row per staff member per day (Asia/Jakarta date).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS attendance (
  id         TEXT PRIMARY KEY DEFAULT ('att-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
  login_id   TEXT NOT NULL REFERENCES staff_accounts (login_id) ON DELETE CASCADE,
  work_date  DATE NOT NULL,
  check_in   TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_out  TIMESTAMPTZ CHECK (check_out IS NULL OR check_out >= check_in),
  status     TEXT NOT NULL CHECK (status IN ('Hadir', 'Terlambat')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (login_id, work_date)
);

CREATE INDEX IF NOT EXISTS attendance_work_date_idx ON attendance (work_date DESC);
`;

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
    console.error('DATABASE_URL belum di-set. Salin backend/.env.example ke backend/.env lalu isi koneksi PostgreSQL.');
    process.exit(1);
  }

  const resetOwner = process.argv.includes('--reset-owner');
  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    await client.query(SCHEMA);
    console.log('✓ Tabel akun, sesi, menu, stok, pesanan, pengaturan & absensi siap.');
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
  const code = (err as { code?: string } | null)?.code;
  const message =
    code === 'ECONNREFUSED'
      ? 'PostgreSQL tidak bisa dihubungi. Pastikan server database sudah jalan dan DATABASE_URL benar.'
      : err instanceof Error && err.message
        ? err.message
        : String(code ?? err);
  console.error('Gagal setup database:', message);
  process.exit(1);
});
