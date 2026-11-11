import { parseStockInput, updateStockItem } from '@/server/stock';
import { handle, json, readJsonBody, requireOwner } from '@/server/http';

// Owner only: add, reduce or edit a raw-material item.
export async function PUT(request: Request, ctx: RouteContext<'/api/stock/[id]'>) {
  return handle(request, async () => {
    await requireOwner('Hanya Owner yang boleh mengubah stok.');
    const { id } = await ctx.params;
    const item = await updateStockItem(id, parseStockInput(await readJsonBody(request)));
    return json({ item });
  });
}
