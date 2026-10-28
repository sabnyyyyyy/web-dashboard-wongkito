import 'server-only';
import { AccountStatus } from '@/types';
import { getCurrentSession, CurrentSession } from './session';
import { roleFromLoginId } from '@/lib/access';

const NO_STORE = { 'Cache-Control': 'no-store' };

export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(data, { status, headers: { ...NO_STORE, ...headers } });

export const apiError = (status: number, message: string, headers: Record<string, string> = {}) =>
  json({ error: message }, status, headers);

export const noContent = () => new Response(null, { status: 204, headers: NO_STORE });

// Thrown inside a handler to short-circuit with a specific HTTP response.
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

// Wraps a route handler: same-origin check for writes, typed errors → JSON, unknown errors → 500.
export const handle = async (request: Request, fn: () => Promise<Response>): Promise<Response> => {
  try {
    if (request.method !== 'GET' && !isSameOrigin(request)) {
      throw new HttpError(403, 'Permintaan ditolak.');
    }
    return await fn();
  } catch (err) {
    if (err instanceof HttpError) return apiError(err.status, err.message);
    if (err instanceof Error && err.message.startsWith('DATABASE_URL')) {
      console.error('[api]', err.message);
      return apiError(503, 'Server belum terhubung ke database.');
    }
    console.error('[api] unexpected error', err);
    return apiError(500, 'Terjadi kesalahan di server. Coba lagi.');
  }
};

// CSRF defence on top of SameSite=Lax cookies: browsers always send Origin on cross-site writes.
const isSameOrigin = (request: Request): boolean => {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
};

export const requireSession = async (): Promise<CurrentSession> => {
  const session = await getCurrentSession();
  if (!session) throw new HttpError(401, 'Sesi berakhir. Silakan login ulang.');
  return session;
};

export const requireOwner = async (message = 'Hanya Owner yang boleh mengelola akun.'): Promise<CurrentSession> => {
  const session = await requireSession();
  if (roleFromLoginId(session.account.login_id) !== 'superadmin') {
    throw new HttpError(403, message);
  }
  return session;
};

export const readJsonBody = async (request: Request): Promise<Record<string, unknown>> => {
  try {
    const body = await request.json();
    if (body && typeof body === 'object' && !Array.isArray(body)) return body as Record<string, unknown>;
  } catch {}
  throw new HttpError(400, 'Format data tidak valid.');
};

// --- Field validators: return the cleaned value or throw a 400 with a readable message. ---

export const requireString = (value: unknown, label: string, { min = 0, max = 200, trim = true } = {}): string => {
  if (typeof value !== 'string') throw new HttpError(400, `${label} wajib diisi.`);
  const cleaned = trim ? value.trim() : value;
  if (cleaned.length < min) throw new HttpError(400, `${label} wajib diisi.`);
  if (cleaned.length > max) throw new HttpError(400, `${label} maksimal ${max} karakter.`);
  return cleaned;
};

export const requireNumber = (
  value: unknown,
  label: string,
  { min = 0, max = 1_000_000_000, integer = true } = {}
): number => {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n)) throw new HttpError(400, `${label} harus berupa angka.`);
  if (integer && !Number.isInteger(n)) throw new HttpError(400, `${label} harus bilangan bulat.`);
  if (n < min || n > max) throw new HttpError(400, `${label} harus di antara ${min} dan ${max}.`);
  return n;
};

export const requireBoolean = (value: unknown, label: string): boolean => {
  if (typeof value !== 'boolean') throw new HttpError(400, `${label} tidak valid.`);
  return value;
};

export const requireOneOf = <T extends string>(value: unknown, options: readonly T[], label: string): T => {
  if (typeof value === 'string' && (options as readonly string[]).includes(value)) return value as T;
  throw new HttpError(400, `${label} tidak valid.`);
};

export const requireStatus = (value: unknown): AccountStatus => {
  if (value === 'Aktif' || value === 'Nonaktif') return value;
  throw new HttpError(400, 'Status tidak valid.');
};

export const clientIp = (request: Request): string =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
