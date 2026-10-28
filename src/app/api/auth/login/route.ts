import { attemptLogin, toUser } from '@/server/accounts';
import { createSession } from '@/server/session';
import { apiError, clientIp, handle, json, readJsonBody, requireString } from '@/server/http';
import { consumeRateLimit } from '@/server/rate-limit';
import { normalizeLoginId, roleFromLoginId } from '@/lib/access';
import { MAX_PASSWORD_LENGTH } from '@/lib/password';

const IP_LIMIT = 30;
const IP_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  return handle(request, async () => {
    const limit = consumeRateLimit(`login:${clientIp(request)}`, IP_LIMIT, IP_WINDOW_MS);
    if (!limit.allowed) {
      return apiError(429, `Terlalu banyak percobaan login. Coba lagi dalam ${limit.retryAfterSeconds} detik.`, {
        'Retry-After': String(limit.retryAfterSeconds),
      });
    }

    const body = await readJsonBody(request);
    const loginId = normalizeLoginId(requireString(body.loginId, 'ID login', { min: 1, max: 20 }));
    const password = requireString(body.password, 'Password', { min: 1, max: MAX_PASSWORD_LENGTH, trim: false });
    const rememberMe = body.rememberMe === true;

    if (!roleFromLoginId(loginId)) {
      return apiError(400, 'Format ID login tidak dikenal. Contoh: OWN-001 atau KSR-001.');
    }

    const result = await attemptLogin(loginId, password);
    if (!result.ok) {
      switch (result.reason) {
        case 'locked':
          return apiError(423, `Terlalu banyak percobaan gagal. Coba lagi dalam ${result.retryAfterSeconds} detik.`, {
            'Retry-After': String(result.retryAfterSeconds),
          });
        case 'inactive':
          return apiError(403, 'Akun ini sedang dinonaktifkan. Hubungi Owner.');
        default:
          return apiError(401, 'ID login atau password salah.');
      }
    }

    await createSession(result.account.login_id, rememberMe);
    return json({ user: toUser(result.account) });
  });
}
