import { createStockItem, listStock, parseStockInput } from '@/server/stock';
import { handle, json, readJsonBody, requireSession } from '@/server/http';

// Owner and kasir both manage raw-material stock.
export async function GET(request: Request) {
  return handle(request, async () => {
    await requireSession();
    return json({ stock: await listStock() });
  });
}

export async function POST(request: Request) {
  return handle(request, async () => {
    await requireSession();
    const item = await createStockItem(parseStockInput(await readJsonBody(request)));
    return json({ item }, 201);
  });
}
