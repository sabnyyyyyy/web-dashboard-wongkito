import { getStoreInfo } from '@/lib/server/backend';
import { LoginGate } from '@/views/login/LoginGate';

// Server Component: the store info comes from the Next.js data cache (see getStoreInfo), and the
// login form is rendered on the server with it, before any JavaScript runs in the browser.
export default async function LoginRoute() {
  const store = await getStoreInfo();
  return <LoginGate store={store} />;
}
