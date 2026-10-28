import { toUser, updateName } from '@/server/accounts';
import { getCurrentSession } from '@/server/session';
import { handle, HttpError, json, readJsonBody, requireSession, requireString } from '@/server/http';

// Current user, or { user: null } when not logged in (not an error for the login screen).
export async function GET(request: Request) {
  return handle(request, async () => {
    const session = await getCurrentSession();
    return json({ user: session ? toUser(session.account) : null });
  });
}

// Update own display name.
export async function PATCH(request: Request) {
  return handle(request, async () => {
    const session = await requireSession();
    const body = await readJsonBody(request);
    const name = requireString(body.name, 'Nama', { min: 1, max: 100 });

    const updated = await updateName(session.account.login_id, name);
    if (!updated) throw new HttpError(404, 'Akun tidak ditemukan.');
    return json({ user: toUser(updated) });
  });
}
