import 'server-only';
import { Pool, PoolClient } from 'pg';

// One pool per server process. In dev, hot reload re-evaluates modules, so keep it on globalThis.
const globalForDb = globalThis as unknown as { wongkitoPool?: Pool };

const createPool = (): Pool => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL belum di-set. Salin .env.example ke .env.local lalu isi koneksi PostgreSQL.');
  }
  const pool = new Pool({ connectionString, max: 10 });
  pool.on('error', (err) => console.error('[db] idle client error', err.message));
  return pool;
};

export const getPool = (): Pool => (globalForDb.wongkitoPool ??= createPool());

export const query = <T extends object>(text: string, params: unknown[] = []) => getPool().query<T>(text, params);

export const withTransaction = async <T>(fn: (client: PoolClient) => Promise<T>): Promise<T> => {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// Postgres error code for unique_violation.
export const isUniqueViolation = (err: unknown): boolean =>
  typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505';
