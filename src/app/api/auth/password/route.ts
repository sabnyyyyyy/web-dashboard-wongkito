import { setPassword } from '@/server/accounts';
import { verifyPassword } from '@/server/password-hash';
import { revokeSessions } from '@/server/session';
import { handle, HttpError, noContent, readJsonBody, requireSession, requireString } from '@/server/http';
import { consumeRateLimit } from '@/server/rate-limit';
import { MAX_PASSWORD_LENGTH, validateNewPassword } from '@/lib/password';

// Change own password. Other devices are logged out; this one stays signed in.
export async function POST(request: Request) {
  return handle(request, async () => {
    const session = await requireSession();
    // Stops a hijacked session from brute-forcing the current password.
    const limit = consumeRateLimit(`password:${session.account.login_id}`, 10, 10 * 60 * 1000);
    if (!limit.allowed) {
      throw new HttpError(429, `Terlalu banyak percobaan. Coba lagi dalam ${limit.retryAfterSeconds} detik.`);
    }
    const body = await readJsonBody(request);
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

    await setPassword(session.account.login_id, newPassword);
    await revokeSessions(session.account.login_id, session.tokenHash);
    return noContent();
  });
}
