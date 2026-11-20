import { destroyCurrentSession } from '@/backend/session';
import { handle, noContent } from '@/backend/http';

export async function POST(request: Request) {
  return handle(request, async () => {
    await destroyCurrentSession();
    return noContent();
  });
}
