import { createMenuItem, listMenu, parseMenuInput } from '@/server/menu';
import { roleFromLoginId } from '@/lib/access';
import { handle, json, readJsonBody, requireOwner, requireSession } from '@/server/http';



const OWNER_ONLY = 'Hanya Owner yang boleh mengubah menu.';

// Any logged-in staff: the POS needs the menu.
export async function GET(request: Request) {
  return handle(request, async () => {
    const session = await requireSession();
    const role = roleFromLoginId(session.account.login_id);
    const onlyAvailable = role !== 'superadmin';
    return json({ menu: await listMenu(onlyAvailable) });
  });
}

// Owner only: add a menu item.
export async function POST(request: Request) {
  return handle(request, async () => {
    await requireOwner(OWNER_ONLY);
    const item = await createMenuItem(parseMenuInput(await readJsonBody(request)));
    return json({ item }, 201);
  });
}
