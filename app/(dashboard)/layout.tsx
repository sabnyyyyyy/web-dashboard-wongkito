'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/app/components/layout/DashboardLayout';
import { ReceiptModal } from '@/app/components/ui/ReceiptModal';

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center text-white font-sans">
        <div className="w-8 h-8 border-4 border-[#F47C0B] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs tracking-wider uppercase font-semibold text-stone-300">
          Memuat Warkop Wong Kito...
        </p>
      </div>
    );
  }

  return (
    <DashboardLayout>
      {children}
      <ReceiptModal />
    </DashboardLayout>
  );
}
