import { deleteMenuItem, parseMenuInput, updateMenuItem } from '@/server/menu';
import { handle, json, noContent, readJsonBody, requireOwner } from '@/server/http';

const OWNER_ONLY = 'Hanya Owner yang boleh mengubah menu.';

// Owner only: replace a menu item's fields.
export async function PUT(request: Request, ctx: RouteContext<'/api/menu/[id]'>) {
  return handle(request, async () => {
    await requireOwner(OWNER_ONLY);
    const { id } = await ctx.params;
    const item = await updateMenuItem(id, parseMenuInput(await readJsonBody(request)));
    return json({ item });
  });
}

// Owner only: remove a menu item. Past orders keep their own copy of it.
export async function DELETE(request: Request, ctx: RouteContext<'/api/menu/[id]'>) {
  return handle(request, async () => {
    await requireOwner(OWNER_ONLY);
    await deleteMenuItem((await ctx.params).id);
    return noContent();
  });
}
