import { randomUUID } from 'node:crypto';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { testConnection } from './db.js';
import attendanceRoutes from './routes/attendance.routes.js';
import authRoutes from './routes/auth.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import menuRoutes from './routes/menu.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import orderRoutes from './routes/order.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import teamRoutes from './routes/team.routes.js';
import { HttpError } from './utils/http.js';
import { logError, logInfo, logWarn } from './utils/logger.js';

const PORT = Number(process.env.PORT || 4000);
const FRONTEND_URLS = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);

const app = express();

app.disable('x-powered-by');
// The frontend (Next.js) forwards /api/* from the same machine; trust it for the client IP (rate limit).
app.set('trust proxy', 'loopback');

app.use(cors({ origin: FRONTEND_URLS, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Request ID + one structured log line per API request (see docs/LOGGING.md).
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  const requestId = randomUUID();
  const startTime = Date.now();
  res.setHeader('X-Request-Id', requestId);
  res.setHeader('Cache-Control', 'no-store');

  res.on('finish', () => {
    const meta = {
      requestId,
      method: req.method,
      pathname: req.originalUrl.split('?')[0],
      status: res.statusCode,
      durationMs: Date.now() - startTime,
      userId: res.locals.session?.account.login_id ?? null,
    };
    if (res.statusCode >= 500) logError('Unexpected server error', { ...meta, errorCode: res.locals.errorCode, errorName: res.locals.errorName });
    else if (res.statusCode >= 400) logWarn('HTTP error', { ...meta, errorCode: `HTTP_${res.statusCode}`, errorName: 'HttpError' });
    else logInfo('Request completed', meta);
  });
  next();
});

// CSRF defence on top of SameSite=Lax cookies: browsers always send Origin on cross-site writes.
app.use('/api', (req: Request, _res: Response, next: NextFunction) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
  const origin = req.get('origin');
  if (!origin || FRONTEND_URLS.includes(origin)) return next();
  try {
    const host = req.get('x-forwarded-host') ?? req.get('host');
    if (new URL(origin).host === host) return next();
  } catch {
    // Malformed Origin header → rejected below.
  }
  next(new HttpError(403, 'Permintaan ditolak.'));
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', teamRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/stock', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Backend check
app.get('/', (_req, res) => {
  res.json({ message: 'Backend Warkop Wong Kito berjalan.' });
});

// Database check
app.get('/api/health/db', async (_req, res) => {
  await testConnection();
  res.json({ message: 'Koneksi database berhasil.' });
});

app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Endpoint tidak ditemukan.')));

// Every error ends here and goes out as { error: '<pesan>' }.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    res.set(err.headers).status(err.status).json({ error: err.message });
    return;
  }
  // Malformed JSON body from express.json().
  if (typeof err === 'object' && err !== null && (err as { type?: string }).type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Format data tidak valid.' });
    return;
  }
  if (typeof err === 'object' && err !== null && (err as { type?: string }).type === 'entity.too.large') {
    res.status(413).json({ error: 'Data yang dikirim terlalu besar.' });
    return;
  }

  res.locals.errorName = err instanceof Error ? err.name : 'Unknown';
  if (err instanceof Error && err.message.startsWith('DATABASE_URL')) {
    res.locals.errorCode = 'DB_CONFIG';
    res.status(503).json({ error: 'Server belum terhubung ke database.' });
    return;
  }
  const code = typeof err === 'object' && err !== null ? (err as { code?: string }).code : undefined;
  if (code === 'ECONNREFUSED' || code === '28P01' || code === '3D000') {
    res.locals.errorCode = 'DB_CONNECTION';
    res.status(503).json({ error: 'Server tidak bisa terhubung ke database.' });
    return;
  }

  res.locals.errorCode = 'INTERNAL_ERROR';
  console.error(err);
  res.status(500).json({ error: 'Terjadi kesalahan di server. Coba lagi.' });
});

app.listen(PORT, () => {
  console.log(`Backend berjalan di http://localhost:${PORT}`);
});
