import 'server-only';
import { AccountStatus, StaffAccount, User } from '@/types';
import { generateLoginId, roleFromLoginId } from '@/lib/access';
import { isUniqueViolation, query } from './db';
import { generateTempPassword, getDummyHash, hashPassword, verifyPassword } from './password-hash';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 60;

export interface AccountRow {
  login_id: string;
  name: string;
  phone: string;
  shift: string;
  status: AccountStatus;
  avatar_url: string | null;
  password_hash: string;
  failed_attempts: number;
  locked_until: Date | null;
}

export const ACCOUNT_COLUMNS = [
  'login_id',
  'name',
  'phone',
  'shift',
  'status',
  'avatar_url',
  'password_hash',
  'failed_attempts',
  'locked_until',
] as const;

const SELECT_ACCOUNT = `SELECT ${ACCOUNT_COLUMNS.join(', ')} FROM staff_accounts`;

export const toStaffAccount = (row: AccountRow): StaffAccount => ({
  loginId: row.login_id,
  name: row.name,
  phone: row.phone,
  shift: row.shift,
  status: row.status,
  ...(row.avatar_url ? { avatar: row.avatar_url } : {}),
});

export const toUser = (row: AccountRow): User => {
  const role = roleFromLoginId(row.login_id);
  // The DB CHECK constraint guarantees a valid prefix; this guards against manual edits.
  if (!role) throw new Error(`Invalid login_id in database: ${row.login_id}`);
  return {
    loginId: row.login_id,
    name: row.name,
    role,
    shift: row.shift,
    ...(row.avatar_url ? { avatar: row.avatar_url } : {}),
  };
};

export const findAccount = async (loginId: string): Promise<AccountRow | null> => {
  const { rows } = await query<AccountRow>(`${SELECT_ACCOUNT} WHERE login_id = $1`, [loginId]);
  return rows[0] ?? null;
};

export type LoginResult =
  | { ok: true; account: AccountRow }
  | { ok: false; reason: 'invalid' | 'inactive' }
  | { ok: false; reason: 'locked'; retryAfterSeconds: number };

export const attemptLogin = async (loginId: string, password: string): Promise<LoginResult> => {
  const account = await findAccount(loginId);
  if (!account) {
    await verifyPassword(password, await getDummyHash());
    return { ok: false, reason: 'invalid' };
  }

  if (account.locked_until && account.locked_until.getTime() > Date.now()) {
    return {
      ok: false,
      reason: 'locked',
      retryAfterSeconds: Math.ceil((account.locked_until.getTime() - Date.now()) / 1000),
    };
  }

  if (!(await verifyPassword(password, account.password_hash))) {
    // Count the failure atomically; restart the count once a previous lockout has expired.
    await query(
      `UPDATE staff_accounts
          SET failed_attempts = CASE WHEN locked_until IS NOT NULL THEN 1 ELSE failed_attempts + 1 END,
              locked_until = CASE
                WHEN locked_until IS NULL AND failed_attempts + 1 >= $2 THEN now() + make_interval(secs => $3)
                ELSE NULL
              END
        WHERE login_id = $1`,
      [loginId, MAX_FAILED_ATTEMPTS, LOCKOUT_SECONDS]
    );
    return { ok: false, reason: 'invalid' };
  }

  // Only reveal "inactive" after the correct password, so it can't be used to probe accounts.
  if (account.status !== 'Aktif') return { ok: false, reason: 'inactive' };

  await query('UPDATE staff_accounts SET failed_attempts = 0, locked_until = NULL WHERE login_id = $1', [loginId]);
  return { ok: true, account };
};

export const listKasirAccounts = async (): Promise<StaffAccount[]> => {
  const { rows } = await query<AccountRow>(`${SELECT_ACCOUNT} WHERE login_id LIKE 'KSR-%' ORDER BY login_id`);
  return rows.map(toStaffAccount);
};

export interface KasirProfile {
  name: string;
  phone: string;
  shift: string;
}

export const createKasirAccount = async (profile: KasirProfile, password: string): Promise<StaffAccount> => {
  const passwordHash = await hashPassword(password);

  // Two owners creating accounts at the same moment can race for the same ID; retry on conflict.
  for (let attempt = 0; attempt < 3; attempt++) {
    const { rows: ids } = await query<{ login_id: string }>(
      `SELECT login_id FROM staff_accounts WHERE login_id LIKE 'KSR-%'`
    );
    const loginId = generateLoginId(
      'kasir',
      ids.map((r) => r.login_id)
    );
    try {
      const { rows } = await query<AccountRow>(
        `INSERT INTO staff_accounts (login_id, name, phone, shift, password_hash)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING ${ACCOUNT_COLUMNS.join(', ')}`,
        [loginId, profile.name, profile.phone, profile.shift, passwordHash]
      );
      return toStaffAccount(rows[0]);
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
    }
  }
  throw new Error('Gagal membuat ID login unik, coba lagi.');
};

export const updateKasirAccount = async (
  loginId: string,
  update: KasirProfile & { status: AccountStatus }
): Promise<StaffAccount | null> => {
  const { rows } = await query<AccountRow>(
    `UPDATE staff_accounts
        SET name = $2, phone = $3, shift = $4, status = $5, updated_at = now()
      WHERE login_id = $1 AND login_id LIKE 'KSR-%'
      RETURNING ${ACCOUNT_COLUMNS.join(', ')}`,
    [loginId, update.name, update.phone, update.shift, update.status]
  );
  return rows[0] ? toStaffAccount(rows[0]) : null;
};

// Returns the new temporary password, or null when the kasir doesn't exist.
export const resetKasirPassword = async (loginId: string): Promise<string | null> => {
  const tempPassword = generateTempPassword();
  const { rowCount } = await query(
    `UPDATE staff_accounts
        SET password_hash = $2, failed_attempts = 0, locked_until = NULL, updated_at = now()
      WHERE login_id = $1 AND login_id LIKE 'KSR-%'`,
    [loginId, await hashPassword(tempPassword)]
  );
  return rowCount ? tempPassword : null;
};

export const setPassword = async (loginId: string, newPassword: string): Promise<void> => {
  await query('UPDATE staff_accounts SET password_hash = $2, updated_at = now() WHERE login_id = $1', [
    loginId,
    await hashPassword(newPassword),
  ]);
};

export const updateName = async (loginId: string, name: string): Promise<AccountRow | null> => {
  const { rows } = await query<AccountRow>(
    `UPDATE staff_accounts SET name = $2, updated_at = now() WHERE login_id = $1
     RETURNING ${ACCOUNT_COLUMNS.join(', ')}`,
    [loginId, name]
  );
  return rows[0] ?? null;
};
