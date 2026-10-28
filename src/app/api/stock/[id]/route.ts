import { parseStockInput, updateStockItem } from '@/server/stock';
import { handle, json, readJsonBody, requireSession } from '@/server/http';

export async function PUT(request: Request, ctx: RouteContext<'/api/stock/[id]'>) {
  return handle(request, async () => {
    await requireSession();
    const { id } = await ctx.params;
    const item = await updateStockItem(id, parseStockInput(await readJsonBody(request)));
    return json({ item });
  });
}
