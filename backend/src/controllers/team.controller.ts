import type { Request, Response } from 'express';
import { isUniqueViolation, query } from '../db.js';
import { generateLoginId, normalizeLoginId } from '../utils/access.js';
import { HttpError, param, readBody, requirePhone, requireStatus, requireString } from '../utils/http.js';
import { validateNewPassword } from '../utils/password.js';
import { generateTempPassword, hashPassword } from '../utils/password-hash.js';
import { ACCOUNT_COLUMNS, type AccountRow, SELECT_ACCOUNT, revokeSessions, toStaffAccount } from '../utils/session.js';

// Kasir accounts, managed by the Owner (all routes sit behind requireOwner).

const parseProfile = (body: Record<string, unknown>) => ({
  name: requireString(body.name, 'Nama kasir', { min: 1, max: 100 }),
  phone: requirePhone(body.phone, 'Nomor HP'),
  shift: requireString(body.shift ?? '', 'Shift', { max: 50 }),
});

// GET /api/accounts
export const listKasir = async (_req: Request, res: Response) => {
  const { rows } = await query<AccountRow>(`${SELECT_ACCOUNT} WHERE login_id LIKE 'KSR-%' ORDER BY login_id`);
  res.json({ accounts: rows.map(toStaffAccount) });
};

// POST /api/accounts  { name, phone, shift, password } — the login ID (KSR-xxx) is assigned here.
export const createKasir = async (req: Request, res: Response) => {
  const body = readBody(req);
  const profile = parseProfile(body);
  const password = requireString(body.password, 'Password', { min: 1, max: 1000, trim: false });
  const invalid = validateNewPassword(password);
  if (invalid) throw new HttpError(400, invalid);

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
      res.status(201).json({ account: toStaffAccount(rows[0]) });
      return;
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
    }
  }
  throw new Error('Gagal membuat ID login unik, coba lagi.');
};

// PATCH /api/accounts/:loginId  { name, phone, shift, status } — deactivation logs the kasir out everywhere.
export const updateKasir = async (req: Request, res: Response) => {
  const loginId = normalizeLoginId(param(req, 'loginId'));
  const body = readBody(req);
  const profile = parseProfile(body);
  const status = requireStatus(body.status);

  const { rows } = await query<AccountRow>(
    `UPDATE staff_accounts
        SET name = $2, phone = $3, shift = $4, status = $5, updated_at = now()
      WHERE login_id = $1 AND login_id LIKE 'KSR-%'
      RETURNING ${ACCOUNT_COLUMNS.join(', ')}`,
    [loginId, profile.name, profile.phone, profile.shift, status]
  );
  if (!rows[0]) throw new HttpError(404, 'Akun kasir tidak ditemukan.');

  if (status === 'Nonaktif') await revokeSessions(loginId);
  res.json({ account: toStaffAccount(rows[0]) });
};

// POST /api/accounts/:loginId/reset-password — temporary password, kasir is logged out everywhere.
export const resetKasirPassword = async (req: Request, res: Response) => {
  const loginId = normalizeLoginId(param(req, 'loginId'));
  const tempPassword = generateTempPassword();
  const { rowCount } = await query(
    `UPDATE staff_accounts
        SET password_hash = $2, failed_attempts = 0, locked_until = NULL, updated_at = now()
      WHERE login_id = $1 AND login_id LIKE 'KSR-%'`,
    [loginId, await hashPassword(tempPassword)]
  );
  if (!rowCount) throw new HttpError(404, 'Akun kasir tidak ditemukan.');

  await revokeSessions(loginId);
  res.json({ tempPassword });
};
