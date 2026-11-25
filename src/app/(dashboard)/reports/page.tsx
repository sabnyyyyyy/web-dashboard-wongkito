import { getOrdersForSession } from '@/lib/server/backend';
import { ReportsView } from '@/views/reports/ReportsView';

// Server-side rendering: the order history is fetched on the Next.js server for every request,
// with the visitor's own session cookie. While it loads, (dashboard)/loading.tsx is shown; if the
// backend fails, (dashboard)/error.tsx takes over.
export default async function ReportsPage() {
  const orders = await getOrdersForSession();
  return <ReportsView orders={orders} />;
}
