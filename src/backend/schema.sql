-- Staff accounts & sessions for the Wong Kito dashboard.
-- Idempotent: safe to run on every `npm run db:setup`.

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
