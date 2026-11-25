'use client';

import React from 'react';
import Image from 'next/image';

export const LOGO_SRC = '/logo_wkm.png';

// Full-screen loader in the login page's style. Used right after login and while the
// dashboard loads its first data, so the two steps look like one continuous screen.
export const LoadingScreen: React.FC<{ title?: string; message?: string }> = ({
  title = 'Memuat Warkop Wong Kito',
  message = 'Mohon tunggu sebentar...',
}) => (
  <div
    role="status"
    aria-live="polite"
    className="min-h-screen w-full bg-[#1A1A1A] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans"
  >
    {/* Same ambient glow as the login page */}
    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#F47C0B]/10 rounded-full blur-3xl pointer-events-none" />

    <div className="z-10 flex flex-col items-center text-center animate-fade-in">
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-[#F47C0B]/30 animate-ping" />
        {/* Served as-is (31 KB) so it matches the copy the login page preloads; the screen only
            shows for about a second, too short to wait for image optimisation. */}
        <Image
          src={LOGO_SRC}
          alt="Logo Warkop Wong Kito"
          width={80}
          height={80}
          priority
          unoptimized
          className="relative w-20 h-20 rounded-full object-contain shadow-lg shadow-black/40"
        />
      </div>

      <h1 className="text-lg md:text-xl font-black tracking-tight text-white font-serif">{title}</h1>
      <p className="text-xs text-stone-400 mt-1.5">{message}</p>

      <div className="mt-6 w-48 h-1 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full w-2/5 wkm-gradient-bg rounded-full animate-loading-bar" />
      </div>
    </div>
  </div>
);
