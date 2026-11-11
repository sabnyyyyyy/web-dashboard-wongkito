import { ORDER_STATUSES, updateOrderStatus } from '@/server/orders';
import { handle, HttpError, json, readJsonBody, requireOneOf, requireSession } from '@/server/http';
import { roleFromLoginId } from '@/lib/access';

// Kitchen flow: { status: 'accepted' | 'processing' | 'ready' | 'completed' | 'cancelled' }.
// Kasir moves orders along; only the owner may cancel one.
export async function PATCH(request: Request, ctx: RouteContext<'/api/orders/[id]'>) {
  return handle(request, async () => {
    const { account } = await requireSession();
    const { id } = await ctx.params;
    const body = await readJsonBody(request);
    const status = requireOneOf(body.status, ORDER_STATUSES, 'Status pesanan');
    if (status === 'cancelled' && roleFromLoginId(account.login_id) !== 'superadmin') {
      throw new HttpError(403, 'Hanya Owner yang boleh membatalkan transaksi.');
    }
    const order = await updateOrderStatus(id, status);
    return json({ order });
  });
}
