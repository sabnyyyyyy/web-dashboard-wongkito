import { createHash, randomBytes } from 'node:crypto';
import type { CookieOptions, Request, Response } from 'express';
import { query } from '../db.js';
import { roleFromLoginId } from './access.js';
import type { AccountStatus, StaffAccount, User } from './types.js';

// Database-backed sessions: the cookie holds a random token, the database holds its SHA-256.
// Deleting rows (logout, deactivation, password reset) revokes access immediately.

export const SESSION_COOKIE = 'wk_session';
const REMEMBER_ME_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_MS = 12 * 60 * 60 * 1000;

const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

// --- Staff account rows (shared by the auth and team controllers) ---

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

export const SELECT_ACCOUNT = `SELECT ${ACCOUNT_COLUMNS.join(', ')} FROM staff_accounts`;

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

// --- Sessions ---

export interface CurrentSession {
  tokenHash: string;
  account: AccountRow;
}

const cookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
});

export const createSession = async (res: Response, loginId: string, rememberMe: boolean): Promise<void> => {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + (rememberMe ? REMEMBER_ME_MS : SESSION_MS));

  // Housekeeping: drop expired sessions whenever a new one is created.
  await query('DELETE FROM staff_sessions WHERE expires_at < now()');
  await query('INSERT INTO staff_sessions (token_hash, login_id, expires_at) VALUES ($1, $2, $3)', [
    hashToken(token),
    loginId,
    expiresAt,
  ]);

  res.cookie(SESSION_COOKIE, token, {
    ...cookieOptions(),
    // Without "Ingat saya" it's a browser-session cookie; the server still enforces the 12h expiry.
    ...(rememberMe ? { expires: expiresAt } : {}),
  });
};

const tokenFrom = (req: Request): string | undefined => {
  const token: unknown = req.cookies?.[SESSION_COOKIE];
  return typeof token === 'string' && token ? token : undefined;
};

// The logged-in, still-active account for this request, or null.
export const getCurrentSession = async (req: Request): Promise<CurrentSession | null> => {
  const token = tokenFrom(req);
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

export const destroyCurrentSession = async (req: Request, res: Response): Promise<void> => {
  const token = tokenFrom(req);
  if (token) await query('DELETE FROM staff_sessions WHERE token_hash = $1', [hashToken(token)]);
  res.clearCookie(SESSION_COOKIE, cookieOptions());
};

export const revokeSessions = async (loginId: string, exceptTokenHash?: string): Promise<void> => {
  await query('DELETE FROM staff_sessions WHERE login_id = $1 AND token_hash IS DISTINCT FROM $2', [
    loginId,
    exceptTokenHash ?? null,
  ]);
};
