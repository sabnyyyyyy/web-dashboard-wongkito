import type { Request } from 'express';
import type { AccountStatus } from './types.js';
import { validatePhone } from './phone.js';

// Thrown anywhere in a controller to answer with a specific status and an Indonesian message.
// The error handler in server.ts turns it into { error: message }.
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public headers: Record<string, string> = {}
  ) {
    super(message);
  }
}

// The parsed JSON body as a plain object (express.json() already rejected malformed JSON).
export const readBody = (req: Request): Record<string, unknown> => {
  const body: unknown = req.body;
  if (body && typeof body === 'object' && !Array.isArray(body)) return body as Record<string, unknown>;
  throw new HttpError(400, 'Format data tidak valid.');
};

// Route parameter as a string (Express types allow string | string[]).
export const param = (req: Request, name: string): string => {
  const value = req.params[name];
  return Array.isArray(value) ? value[0] : (value ?? '');
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

// Optional phone number: '' when left empty, otherwise digits (+ and separators allowed).
export const requirePhone = (value: unknown, label = 'Nomor telepon'): string => {
  const phone = requireString(value ?? '', label, { max: 30 });
  const invalid = validatePhone(phone);
  if (invalid) throw new HttpError(400, invalid);
  return phone;
};

export const requireStatus = (value: unknown): AccountStatus => {
  if (value === 'Aktif' || value === 'Nonaktif') return value;
  throw new HttpError(400, 'Status tidak valid.');
};

// Optional YYYY-MM-DD query value.
export const optionalDate = (value: unknown, label: string): string | null => {
  if (value === undefined || value === '') return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))) return value;
  throw new HttpError(400, `${label} harus berformat YYYY-MM-DD.`);
};
