import type { Request, Response } from 'express';
import { query } from '../db.js';
import { sessionOf } from '../middleware/auth.middleware.js';
import { normalizeLoginId, roleFromLoginId } from '../utils/access.js';
import { HttpError, readBody, requireString } from '../utils/http.js';
import { MAX_PASSWORD_LENGTH, validateNewPassword } from '../utils/password.js';
import { getDummyHash, hashPassword, verifyPassword } from '../utils/password-hash.js';
import { consumeRateLimit } from '../utils/rate-limit.js';
import {
  ACCOUNT_COLUMNS,
  type AccountRow,
  createSession,
  destroyCurrentSession,
  findAccount,
  getCurrentSession,
  revokeSessions,
  toUser,
} from '../utils/session.js';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 60;
const LOGIN_IP_LIMIT = 30;
const LOGIN_IP_WINDOW_MS = 10 * 60 * 1000;

type LoginResult =
  | { ok: true; account: AccountRow }
  | { ok: false; reason: 'invalid' | 'inactive' }
  | { ok: false; reason: 'locked'; retryAfterSeconds: number };

const attemptLogin = async (loginId: string, password: string): Promise<LoginResult> => {
  const account = await findAccount(loginId);
  if (!account) {
    // Spend the same time as a real check so timing doesn't reveal which IDs exist.
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

// POST /api/auth/login  { loginId, password, rememberMe }
export const login = async (req: Request, res: Response) => {
  const limit = consumeRateLimit(`login:${req.ip ?? 'unknown'}`, LOGIN_IP_LIMIT, LOGIN_IP_WINDOW_MS);
  if (!limit.allowed) {
    throw new HttpError(429, `Terlalu banyak percobaan login. Coba lagi dalam ${limit.retryAfterSeconds} detik.`, {
      'Retry-After': String(limit.retryAfterSeconds),
    });
  }

  const body = readBody(req);
  const loginId = normalizeLoginId(requireString(body.loginId, 'ID login', { min: 1, max: 20 }));
  const password = requireString(body.password, 'Password', { min: 1, max: MAX_PASSWORD_LENGTH, trim: false });
  const rememberMe = body.rememberMe === true;

  if (!roleFromLoginId(loginId)) {
    throw new HttpError(400, 'Format ID login tidak dikenal. Contoh: OWN-001 atau KSR-001.');
  }

  const result = await attemptLogin(loginId, password);
  if (!result.ok) {
    switch (result.reason) {
      case 'locked':
        throw new HttpError(423, `Terlalu banyak percobaan gagal. Coba lagi dalam ${result.retryAfterSeconds} detik.`, {
          'Retry-After': String(result.retryAfterSeconds),
        });
      case 'inactive':
        throw new HttpError(403, 'Akun ini sedang dinonaktifkan. Hubungi Owner.');
      default:
        throw new HttpError(401, 'ID login atau password salah.');
    }
  }

  await createSession(res, result.account.login_id, rememberMe);
  res.json({ user: toUser(result.account) });
};

// POST /api/auth/logout
export const logout = async (req: Request, res: Response) => {
  await destroyCurrentSession(req, res);
  res.status(204).end();
};

// GET /api/auth/me — current user, or { user: null } when not logged in (not an error for the login screen).
export const me = async (req: Request, res: Response) => {
  const session = await getCurrentSession(req);
  if (session) res.locals.session = session;
  res.json({ user: session ? toUser(session.account) : null });
};

// PATCH /api/auth/me  { name } — update own display name.
export const updateMe = async (req: Request, res: Response) => {
  const { account } = sessionOf(res);
  const name = requireString(readBody(req).name, 'Nama', { min: 1, max: 100 });

  const { rows } = await query<AccountRow>(
    `UPDATE staff_accounts SET name = $2, updated_at = now() WHERE login_id = $1
     RETURNING ${ACCOUNT_COLUMNS.join(', ')}`,
    [account.login_id, name]
  );
  if (!rows[0]) throw new HttpError(404, 'Akun tidak ditemukan.');
  res.json({ user: toUser(rows[0]) });
};

// POST /api/auth/password  { currentPassword, newPassword }
// Other devices are logged out; this one stays signed in.
export const changePassword = async (req: Request, res: Response) => {
  const session = sessionOf(res);
  // Stops a hijacked session from brute-forcing the current password.
  const limit = consumeRateLimit(`password:${session.account.login_id}`, 10, 10 * 60 * 1000);
  if (!limit.allowed) {
    throw new HttpError(429, `Terlalu banyak percobaan. Coba lagi dalam ${limit.retryAfterSeconds} detik.`);
  }

  const body = readBody(req);
  const currentPassword = requireString(body.currentPassword, 'Password saat ini', {
    min: 1,
    max: MAX_PASSWORD_LENGTH,
    trim: false,
  });
  const newPassword = requireString(body.newPassword, 'Password baru', { min: 1, max: 1000, trim: false });

  const invalid = validateNewPassword(newPassword);
  if (invalid) throw new HttpError(400, invalid);

  if (!(await verifyPassword(currentPassword, session.account.password_hash))) {
    throw new HttpError(400, 'Password saat ini salah.');
  }

  await query('UPDATE staff_accounts SET password_hash = $2, updated_at = now() WHERE login_id = $1', [
    session.account.login_id,
    await hashPassword(newPassword),
  ]);
  await revokeSessions(session.account.login_id, session.tokenHash);
  res.status(204).end();
};
