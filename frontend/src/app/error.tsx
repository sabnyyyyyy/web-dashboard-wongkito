'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

// Special file: catches errors thrown while rendering a page outside the dashboard (e.g. /login).
// Dashboard pages have their own boundary in (dashboard)/error.tsx that keeps the sidebar.
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error('[app] error boundary', error);
  }, [error]);

  return (
    <div className="min-h-screen w-full bg-[#1A1A1A] flex items-center justify-center p-4 font-sans">
      <div role="alert" className="w-full max-w-[400px] bg-white rounded-[16px] p-8 text-center wkm-modal-shadow">
        <div className="w-12 h-12 mx-auto mb-3 rounded-[12px] bg-red-50 text-red-600 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h1 className="text-base font-bold text-[#242424]">Terjadi kesalahan</h1>
        <p className="mt-1 text-xs text-[#737373]">{error.message || 'Halaman gagal dimuat.'}</p>
        <button
          onClick={() => retry()}
          className="mt-6 w-full py-2.5 wkm-gradient-bg wkm-gradient-bg-hover text-white text-xs font-bold uppercase tracking-wider rounded-[8px] cursor-pointer"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  );
}
