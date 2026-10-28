// Creates/updates the database tables and makes sure an Owner account exists.
//
//   npm run db:setup         → apply schema; create OWN-001 if there is no owner yet
//   npm run db:reset-owner   → set a new temporary password for OWN-001 (forgot password)
//
// Reads DATABASE_URL from .env.local. Generated passwords are printed once and never stored in plain text.

import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { generateTempPassword, hashPassword } from '../src/server/password-hash.ts';

const OWNER_ID = 'OWN-001';
const OWNER_NAME = 'Owner Warkop Wong Kito';

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
    console.log('✓ Tabel staff_accounts & staff_sessions siap.');

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
