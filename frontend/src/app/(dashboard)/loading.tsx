// Special file: shown inside the dashboard shell (sidebar stays) while a page renders on the
// server — e.g. Riwayat, which fetches its orders server-side (reports/page.tsx).
export default function DashboardLoading() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-8 h-8 border-4 border-[#F47C0B] border-t-transparent rounded-full animate-spin" />
      <p className="mt-3 text-xs font-semibold text-[#737373]">Memuat halaman...</p>
    </div>
  );
}
