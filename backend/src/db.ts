import pg from 'pg';

// One connection pool for the whole server process.
let pool: pg.Pool | null = null;

export const getPool = (): pg.Pool => {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL belum di-set. Salin backend/.env.example ke backend/.env lalu isi koneksi PostgreSQL.');
  }
  pool = new pg.Pool({ connectionString, max: 10 });
  pool.on('error', (err) => console.error('[db] idle client error', err.message));
  return pool;
};

export const query = <T extends pg.QueryResultRow>(text: string, params: unknown[] = []) =>
  getPool().query<T>(text, params);

export const withTransaction = async <T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> => {
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

export const testConnection = async (): Promise<void> => {
  await query('SELECT 1');
};

export const closePool = async (): Promise<void> => {
  await pool?.end();
  pool = null;
};

// Postgres error code for unique_violation.
export const isUniqueViolation = (err: unknown): boolean =>
  typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505';
