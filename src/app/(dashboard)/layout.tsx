'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/_context/AuthContext';
import { useApp } from '@/app/_context/AppContext';
import { DashboardLayout } from '@/app/_components/layout/DashboardLayout';
import { ReceiptModal } from '@/app/_components/common/ReceiptModal';
import { canAccessTab } from '@/lib/access';

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { activeTab } = useApp();
  const router = useRouter();

  const isTabAllowed = canAccessTab(user?.role, activeTab);

  // Logged out → login page. Logged in but on a page the role may not open
  // (e.g. a kasir typing /team) → back to the dashboard.
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) router.replace('/login');
    else if (!isTabAllowed) router.replace('/dashboard');
  }, [isLoading, isAuthenticated, isTabAllowed, router]);

  if (isLoading || !isAuthenticated || !isTabAllowed) {
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
