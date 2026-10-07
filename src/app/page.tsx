'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { LoginPage } from '@/components/auth/LoginPage';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { OwnerDashboardView } from '@/components/dashboard/OwnerDashboardView';
import { PosView } from '@/components/pos/PosView';
import { OrdersView } from '@/components/orders/OrdersView';
import { MenuView } from '@/components/menu/MenuView';
import { InventoryView } from '@/components/inventory/InventoryView';
import { ReportsView } from '@/components/reports/ReportsView';
import { AttendanceView } from '@/components/attendance/AttendanceView';
import { TeamView } from '@/components/team/TeamView';
import { ProfileView } from '@/components/profile/ProfileView';
import { SettingsView } from '@/components/settings/SettingsView';
import { ReceiptModal } from '@/components/common/ReceiptModal';

export default function Home() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { activeTab } = useApp();

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

  const isOwner = user?.role === 'superadmin';

  const renderActiveView = () => {
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
