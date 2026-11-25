import type { Request, Response } from 'express';
import { isUniqueViolation, query } from '../db.js';
import { isOwner, sessionOf } from '../middleware/auth.middleware.js';
import { ROLE_LABEL, roleFromLoginId } from '../utils/access.js';
import { HttpError, optionalDate } from '../utils/http.js';
import type { AttendanceRecord } from '../utils/types.js';

// Staff attendance: one row per person per day (Asia/Jakarta), with check-in and check-out time.
// Kasir see and record their own attendance; the Owner sees everyone's.

// Minutes after the shift start before a check-in counts as "Terlambat".
const LATE_GRACE_MINUTES = 15;
const DEFAULT_RANGE_DAYS = 30;

interface AttendanceRow {
  id: string;
  login_id: string;
  staff_name: string;
  avatar_url: string | null;
  work_date: string;
  check_in: string;
  check_out: string | null;
  duration_minutes: number | null;
  status: AttendanceRecord['status'];
}

const SELECT_ATTENDANCE = `
  SELECT t.id, t.login_id, a.name AS staff_name, a.avatar_url,
         to_char(t.work_date, 'YYYY-MM-DD') AS work_date,
         to_char(t.check_in AT TIME ZONE 'Asia/Jakarta', 'HH24:MI') AS check_in,
         to_char(t.check_out AT TIME ZONE 'Asia/Jakarta', 'HH24:MI') AS check_out,
         (extract(epoch FROM (t.check_out - t.check_in)) / 60)::int AS duration_minutes,
         t.status
    FROM attendance t
    JOIN staff_accounts a ON a.login_id = t.login_id`;

const toRecord = (row: AttendanceRow): AttendanceRecord & { loginId: string; durationMinutes: number | null } => {
  const role = roleFromLoginId(row.login_id);
  return {
    id: row.id,
    loginId: row.login_id,
    staffName: row.staff_name,
    role: role ? ROLE_LABEL[role] : '',
    date: row.work_date,
    checkInTime: row.check_in,
    ...(row.check_out ? { checkOutTime: row.check_out } : {}),
    durationMinutes: row.duration_minutes,
    status: row.status,
    ...(row.avatar_url ? { avatar: row.avatar_url } : {}),
  };
};

// "Pagi (07.00–15.00)" → 420 (minutes after midnight); null when the shift has no time in it.
const shiftStartMinutes = (shift: string): number | null => {
  const match = /(\d{1,2})[.:](\d{2})/.exec(shift);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

const jakartaMinutesNow = (): number => {
  const [h, m] = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
    .format(new Date())
    .split(':')
    .map(Number);
  return h * 60 + m;
};

// GET /api/attendance?from=YYYY-MM-DD&to=YYYY-MM-DD — default: the last 30 days.
export const listAttendance = async (req: Request, res: Response) => {
  const session = sessionOf(res);
  const from = optionalDate(req.query.from, 'Tanggal awal');
  const to = optionalDate(req.query.to, 'Tanggal akhir');

  const params: unknown[] = [from, to, DEFAULT_RANGE_DAYS];
  let where = `WHERE t.work_date >= COALESCE($1::date, (now() AT TIME ZONE 'Asia/Jakarta')::date - $3::int)
                 AND t.work_date <= COALESCE($2::date, (now() AT TIME ZONE 'Asia/Jakarta')::date)`;
  if (!isOwner(session)) {
    params.push(session.account.login_id);
    where += ` AND t.login_id = $${params.length}`;
  }

  const { rows } = await query<AttendanceRow>(`${SELECT_ATTENDANCE} ${where} ORDER BY t.work_date DESC, t.check_in DESC`, params);
  res.json({ attendance: rows.map(toRecord) });
};

// GET /api/attendance/today — own record for today, or null.
export const todayAttendance = async (_req: Request, res: Response) => {
  const { account } = sessionOf(res);
  const { rows } = await query<AttendanceRow>(
    `${SELECT_ATTENDANCE} WHERE t.login_id = $1 AND t.work_date = (now() AT TIME ZONE 'Asia/Jakarta')::date`,
    [account.login_id]
  );
  res.json({ attendance: rows[0] ? toRecord(rows[0]) : null });
};

// POST /api/attendance/check-in — once per day. Late when more than 15 minutes after the shift start.
export const checkIn = async (_req: Request, res: Response) => {
  const { account } = sessionOf(res);
  const start = shiftStartMinutes(account.shift);
  const status = start !== null && jakartaMinutesNow() > start + LATE_GRACE_MINUTES ? 'Terlambat' : 'Hadir';

  try {
    const { rows: inserted } = await query<{ id: string }>(
      `INSERT INTO attendance (login_id, work_date, status)
       VALUES ($1, (now() AT TIME ZONE 'Asia/Jakarta')::date, $2)
       RETURNING id`,
      [account.login_id, status]
    );
    const { rows } = await query<AttendanceRow>(`${SELECT_ATTENDANCE} WHERE t.id = $1`, [inserted[0].id]);
    res.status(201).json({ attendance: toRecord(rows[0]) });
  } catch (err) {
    if (isUniqueViolation(err)) throw new HttpError(409, 'Kamu sudah absen masuk hari ini.');
    throw err;
  }
};

// POST /api/attendance/check-out — closes today's record.
export const checkOut = async (_req: Request, res: Response) => {
  const { account } = sessionOf(res);
  const { rows: current } = await query<{ id: string; check_out: Date | null }>(
    `SELECT id, check_out FROM attendance
      WHERE login_id = $1 AND work_date = (now() AT TIME ZONE 'Asia/Jakarta')::date`,
    [account.login_id]
  );
  if (!current[0]) throw new HttpError(409, 'Kamu belum absen masuk hari ini.');
  if (current[0].check_out) throw new HttpError(409, 'Kamu sudah absen pulang hari ini.');

  await query('UPDATE attendance SET check_out = now(), updated_at = now() WHERE id = $1', [current[0].id]);
  const { rows } = await query<AttendanceRow>(`${SELECT_ATTENDANCE} WHERE t.id = $1`, [current[0].id]);
  res.json({ attendance: toRecord(rows[0]) });
};
