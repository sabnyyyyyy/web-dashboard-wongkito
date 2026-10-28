import { createOrder, listOrders, parseNewOrder } from '@/server/orders';
import { handle, json, readJsonBody, requireSession } from '@/server/http';

export async function GET(request: Request) {
  return handle(request, async () => {
    await requireSession();
    return json({ orders: await listOrders() });
  });
}

// Checkout from the POS. The logged-in account is recorded as the cashier.
export async function POST(request: Request) {
  return handle(request, async () => {
    const { account } = await requireSession();
    const order = await createOrder(parseNewOrder(await readJsonBody(request)), {
      loginId: account.login_id,
      name: account.name,
    });
    return json({ order }, 201);
  });
}
