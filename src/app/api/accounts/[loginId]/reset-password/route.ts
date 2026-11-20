import { resetKasirPassword } from '@/backend/accounts';
import { revokeSessions } from '@/backend/session';
import { handle, HttpError, json, requireOwner } from '@/backend/http';
import { normalizeLoginId } from '@/shared/access';

// Owner only: replace a kasir's password with a temporary one and log them out everywhere.
export async function POST(request: Request, ctx: RouteContext<'/api/accounts/[loginId]/reset-password'>) {
  return handle(request, async () => {
    await requireOwner();
    const loginId = normalizeLoginId((await ctx.params).loginId);

    const tempPassword = await resetKasirPassword(loginId);
    if (!tempPassword) throw new HttpError(404, 'Akun kasir tidak ditemukan.');

    await revokeSessions(loginId);
    return json({ tempPassword });
  });
}
