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
