import { createStockItem, listStock, parseStockInput } from '@/server/stock';
import { handle, json, readJsonBody, requireOwner, requireSession } from '@/server/http';

const STOCK_OWNER_ONLY = 'Hanya Owner yang boleh mengubah stok.';

// Everyone logged in can see the stock; only the owner changes it.
export async function GET(request: Request) {
  return handle(request, async () => {
    await requireSession();
    return json({ stock: await listStock() });
  });
}

export async function POST(request: Request) {
  return handle(request, async () => {
    await requireOwner(STOCK_OWNER_ONLY);
    const item = await createStockItem(parseStockInput(await readJsonBody(request)));
    return json({ item }, 201);
  });
}
