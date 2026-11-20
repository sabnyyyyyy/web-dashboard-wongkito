import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { query } from './db';
import { AccountRow, ACCOUNT_COLUMNS } from './accounts';

// Database-backed sessions: the cookie holds a random token, the database holds its SHA-256.
// Deleting rows (logout, deactivation, password reset) revokes access immediately.

const SESSION_COOKIE = 'wk_session';
const REMEMBER_ME_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_MS = 12 * 60 * 60 * 1000;

const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

export interface CurrentSession {
  tokenHash: string;
  account: AccountRow;
}

export const createSession = async (loginId: string, rememberMe: boolean): Promise<void> => {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + (rememberMe ? REMEMBER_ME_MS : SESSION_MS));

  // Housekeeping: drop expired sessions whenever a new one is created.
  await query('DELETE FROM staff_sessions WHERE expires_at < now()');
  await query('INSERT INTO staff_sessions (token_hash, login_id, expires_at) VALUES ($1, $2, $3)', [
    hashToken(token),
    loginId,
    expiresAt,
  ]);

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    // Without "Ingat saya" it's a browser-session cookie; the server still enforces the 12h expiry.
    ...(rememberMe ? { expires: expiresAt } : {}),
  });
};

// The logged-in, still-active account for this request, or null.
export const getCurrentSession = async (): Promise<CurrentSession | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const { rows } = await query<AccountRow>(
    `SELECT ${ACCOUNT_COLUMNS.map((c) => `a.${c}`).join(', ')}
       FROM staff_sessions s
       JOIN staff_accounts a ON a.login_id = s.login_id
      WHERE s.token_hash = $1 AND s.expires_at > now() AND a.status = 'Aktif'`,
    [tokenHash]
  );
  return rows[0] ? { tokenHash, account: rows[0] } : null;
};

export const destroyCurrentSession = async (): Promise<void> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) await query('DELETE FROM staff_sessions WHERE token_hash = $1', [hashToken(token)]);
  cookieStore.delete(SESSION_COOKIE);
};

export const revokeSessions = async (loginId: string, exceptTokenHash?: string): Promise<void> => {
  await query('DELETE FROM staff_sessions WHERE login_id = $1 AND token_hash IS DISTINCT FROM $2', [
    loginId,
    exceptTokenHash ?? null,
  ]);
};
