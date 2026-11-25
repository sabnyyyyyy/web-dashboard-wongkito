'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ReceiptModal } from '@/components/common/ReceiptModal';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { canAccessTab } from '@/lib/access';

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { activeTab, isDataLoading } = useApp();
  const router = useRouter();

  const isTabAllowed = canAccessTab(user?.role, activeTab);

  // Logged out → login page. Logged in but on a page the role may not open
  // (e.g. a kasir typing /team) → back to the dashboard.
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) router.replace('/login');
    else if (!isTabAllowed) router.replace('/dashboard');
  }, [isLoading, isAuthenticated, isTabAllowed, router]);

  // Also wait for the first data load, so forms (e.g. Settings) start from the real values.
  if (isLoading || !isAuthenticated || !isTabAllowed || isDataLoading) {
    // Same screen the login page shows right after signing in, so the hand-over is seamless.
    return user ? (
      <LoadingScreen title={`Selamat datang, ${user.name}`} message="Menyiapkan dashboard..." />
    ) : (
      <LoadingScreen />
    );
  }

  return (
    <DashboardLayout>
      {children}
      <ReceiptModal />
    </DashboardLayout>
  );
}
