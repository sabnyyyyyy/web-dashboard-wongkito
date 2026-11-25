import Image from 'next/image';
import Link from 'next/link';
import { LOGO_SRC } from '@/components/common/LoadingScreen';

// Special file: shown for any URL that doesn't exist (and when a page calls notFound()).
export default function NotFound() {
  return (
    <div className="min-h-screen w-full bg-[#1A1A1A] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#F47C0B]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="z-10 w-full max-w-[400px] bg-white rounded-[16px] p-8 text-center wkm-modal-shadow">
        <Image src={LOGO_SRC} alt="Logo Warkop Wong Kito" width={64} height={64} unoptimized className="mx-auto mb-4 rounded-full" />
        <p className="text-4xl font-black text-[#F47C0B] font-serif">404</p>
        <h1 className="mt-2 text-base font-bold text-[#242424]">Halaman tidak ditemukan</h1>
        <p className="mt-1 text-xs text-[#737373]">
          Alamat yang kamu buka tidak ada atau sudah dipindah.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block w-full py-2.5 wkm-gradient-bg wkm-gradient-bg-hover text-white text-xs font-bold uppercase tracking-wider rounded-[8px]"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
