import { createKasirAccount, listKasirAccounts } from '@/server/accounts';
import { handle, HttpError, json, readJsonBody, requireOwner, requireString } from '@/server/http';
import { validateNewPassword } from '@/lib/password';

// Owner only: list kasir accounts.
export async function GET(request: Request) {
  return handle(request, async () => {
    await requireOwner();
    return json({ accounts: await listKasirAccounts() });
  });
}

// Owner only: create a kasir account. The login ID (KSR-xxx) is assigned by the server.
export async function POST(request: Request) {
  return handle(request, async () => {
    await requireOwner();
    const body = await readJsonBody(request);
    const name = requireString(body.name, 'Nama kasir', { min: 1, max: 100 });
    const phone = requireString(body.phone ?? '', 'Nomor HP', { max: 30 });
    const shift = requireString(body.shift ?? '', 'Shift', { max: 50 });
    const password = requireString(body.password, 'Password', { min: 1, max: 1000, trim: false });

    const invalid = validateNewPassword(password);
    if (invalid) throw new HttpError(400, invalid);

    const account = await createKasirAccount({ name, phone, shift }, password);
    return json({ account }, 201);
  });
}
