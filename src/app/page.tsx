'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/app/_context/AuthContext';
import { useApp } from '@/app/_context/AppContext';
import { LoginPage } from '@/app/_components/auth/LoginPage';
import { DashboardLayout } from '@/app/_components/layout/DashboardLayout';
import { OwnerDashboardView } from '@/app/_components/dashboard/OwnerDashboardView';
import { PosView } from '@/app/_components/pos/PosView';
import { OrdersView } from '@/app/_components/orders/OrdersView';
import { MenuView } from '@/app/_components/menu/MenuView';
import { InventoryView } from '@/app/_components/inventory/InventoryView';
import { ReportsView } from '@/app/_components/reports/ReportsView';
import { AttendanceView } from '@/app/_components/attendance/AttendanceView';
import { TeamView } from '@/app/_components/team/TeamView';
import { ProfileView } from '@/app/_components/profile/ProfileView';
import { SettingsView } from '@/app/_components/settings/SettingsView';
import { NotificationsView } from '@/app/_components/notifications/NotificationsView';
import { ReceiptModal } from '@/app/_components/common/ReceiptModal';
import { canAccessTab } from '@/lib/access';

export default function Home() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { activeTab, setActiveTab } = useApp();

  const isTabAllowed = canAccessTab(user?.role, activeTab);

  // Send the user back to the dashboard when the current tab is not allowed for their role
  // (e.g. a kasir logging in right after the owner was on Team).
  useEffect(() => {
    if (user && !isTabAllowed) setActiveTab('dashboard');
  }, [user, isTabAllowed, setActiveTab]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center text-white font-sans">
        <div className="w-8 h-8 border-4 border-[#F47C0B] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs tracking-wider uppercase font-semibold text-stone-300">
          Memuat Warkop Wong Kito...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderActiveView = () => {
    if (!isTabAllowed) return <OwnerDashboardView />;

    switch (activeTab) {
      case 'dashboard':
      case 'overview':
        return <OwnerDashboardView />;
      case 'pos':
        return <PosView />;
      case 'orders':
        return <OrdersView />;
      case 'inventory':
        return <InventoryView />;
      case 'attendance':
        return <AttendanceView />;
      case 'team':
        return <TeamView />;
      case 'reports':
        return <ReportsView />;
      case 'notifications':
        return <NotificationsView />;
      case 'profile':
        return <ProfileView />;
      case 'menu':
        return <MenuView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <OwnerDashboardView />;
    }
  };

  return (
    <DashboardLayout>
      {renderActiveView()}
      <ReceiptModal />
    </DashboardLayout>
  );
}
