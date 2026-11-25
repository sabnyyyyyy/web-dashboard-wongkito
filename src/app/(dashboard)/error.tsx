'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

// Special file: an error in one dashboard page (e.g. the backend failing while Riwayat loads on
// the server) shows this card in place of the page, while the sidebar keeps working.
export default function DashboardError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error('[dashboard] error boundary', error);
  }, [error]);

  return (
    <div role="alert" className="max-w-md mx-auto mt-16 bg-white rounded-[16px] p-6 border border-red-200 wkm-card-shadow text-center">
      <div className="w-12 h-12 mx-auto mb-3 rounded-[12px] bg-red-50 text-red-600 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h2 className="text-sm font-bold text-[#242424]">Halaman ini gagal dimuat</h2>
      <p className="mt-1 text-xs text-[#737373]">{error.message || 'Terjadi kesalahan. Coba lagi sebentar.'}</p>
      <button
        onClick={() => retry()}
        className="mt-5 px-5 py-2 wkm-gradient-bg wkm-gradient-bg-hover text-white text-xs font-bold uppercase tracking-wider rounded-[8px] cursor-pointer"
      >
        Coba Lagi
      </button>
    </div>
  );
}
