import { ORDER_STATUSES, updateOrderStatus } from '@/server/orders';
import { handle, json, readJsonBody, requireOneOf, requireSession } from '@/server/http';

// Kitchen flow: { status: 'accepted' | 'processing' | 'ready' | 'completed' | 'cancelled' }.
export async function PATCH(request: Request, ctx: RouteContext<'/api/orders/[id]'>) {
  return handle(request, async () => {
    await requireSession();
    const { id } = await ctx.params;
    const body = await readJsonBody(request);
    const order = await updateOrderStatus(id, requireOneOf(body.status, ORDER_STATUSES, 'Status pesanan'));
    return json({ order });
  });
}
