import { updateKasirAccount } from '@/server/accounts';
import { revokeSessions } from '@/server/session';
import { handle, HttpError, json, readJsonBody, requireOwner, requireStatus, requireString } from '@/server/http';
import { normalizeLoginId } from '@/lib/access';

// Owner only: edit a kasir's profile or (de)activate it. Deactivation logs the kasir out everywhere.
export async function PATCH(request: Request, ctx: RouteContext<'/api/accounts/[loginId]'>) {
  return handle(request, async () => {
    await requireOwner();
    const loginId = normalizeLoginId((await ctx.params).loginId);
    const body = await readJsonBody(request);

    const account = await updateKasirAccount(loginId, {
      name: requireString(body.name, 'Nama kasir', { min: 1, max: 100 }),
      phone: requireString(body.phone ?? '', 'Nomor HP', { max: 30 }),
      shift: requireString(body.shift ?? '', 'Shift', { max: 50 }),
      status: requireStatus(body.status),
    });
    if (!account) throw new HttpError(404, 'Akun kasir tidak ditemukan.');

    if (account.status === 'Nonaktif') await revokeSessions(loginId);
    return json({ account });
  });
}
