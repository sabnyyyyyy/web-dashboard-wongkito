import { getSettings, parseSettings, saveSettings } from '@/server/settings';
import { handle, json, readJsonBody, requireOwner, requireSession } from '@/server/http';

// Any logged-in staff: receipts and the POS tax use these.
export async function GET(request: Request) {
  return handle(request, async () => {
    await requireSession();
    return json({ settings: await getSettings() });
  });
}

// Owner only: replace the store settings.
export async function PUT(request: Request) {
  return handle(request, async () => {
    await requireOwner('Hanya Owner yang boleh mengubah pengaturan toko.');
    const settings = await saveSettings(parseSettings(await readJsonBody(request)));
    return json({ settings });
  });
}
