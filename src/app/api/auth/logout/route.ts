import { destroyCurrentSession } from '@/server/session';
import { handle, noContent } from '@/server/http';

export async function POST(request: Request) {
  return handle(request, async () => {
    await destroyCurrentSession();
    return noContent();
  });
}
