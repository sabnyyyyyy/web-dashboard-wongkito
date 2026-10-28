// Server-side password hashing with scrypt (Node built-in).
// Kept free of Next/`server-only` imports so scripts/db-setup.mts can reuse it.
// Stored format: scrypt$<N>$<r>$<p>$<salt hex>$<hash hex>

import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const SALT_BYTES = 16;

const deriveKey = (password: string, salt: Buffer, N: number, r: number, p: number): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, { N, r, p, maxmem: 64 * 1024 * 1024 }, (err, key) =>
      err ? reject(err) : resolve(key)
    );
  });

export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(SALT_BYTES);
  const key = await deriveKey(password, salt, SCRYPT_N, SCRYPT_R, SCRYPT_P);
  return ['scrypt', SCRYPT_N, SCRYPT_R, SCRYPT_P, salt.toString('hex'), key.toString('hex')].join('$');
};

export const verifyPassword = async (password: string, stored: string): Promise<boolean> => {
  const [algorithm, n, r, p, saltHex, hashHex] = stored.split('$');
  if (algorithm !== 'scrypt' || !saltHex || !hashHex) return false;

  const expected = Buffer.from(hashHex, 'hex');
  const actual = await deriveKey(password, Buffer.from(saltHex, 'hex'), Number(n), Number(r), Number(p));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};

// A real hash of a random password, used to spend the same time on unknown login IDs
// so response timing doesn't reveal which IDs exist.
let dummyHash: Promise<string> | null = null;
export const getDummyHash = (): Promise<string> => (dummyHash ??= hashPassword(randomBytes(16).toString('hex')));

// Temporary password handed out on reset or first setup, e.g. "wk-7Hq2xP9a".
export const generateTempPassword = (): string => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  // 256 % 56 != 0 → reject bytes in the biased tail so every character is equally likely.
  const limit = 256 - (256 % alphabet.length);
  let result = '';
  while (result.length < 10) {
    for (const byte of randomBytes(16)) {
      if (byte < limit && result.length < 10) result += alphabet[byte % alphabet.length];
    }
  }
  return 'wk-' + result;
};
