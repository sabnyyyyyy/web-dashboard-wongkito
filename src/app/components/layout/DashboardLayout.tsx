'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp, DashboardTab } from '@/context/AppContext';
import {
  Coffee,
  LayoutGrid,
  ShoppingBag,
  Package,
  CalendarCheck,
  Users2,
  Clock,
  Bell,
  User as UserIcon,
  LogOut,
  Search,
  Calendar,
  Menu as MenuIcon,
  X,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout, demoLogin } = useAuth();
  const {
    activeTab,
    setActiveTab,
    orders,
    stockItems,
    notifications,
    unreadCount,
    markAllNotificationsAsRead,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [searchHeader, setSearchHeader] = useState('');

  const isOwner = user?.role === 'superadmin';

  // Owner Sidebar Navigation matching 2nd photo exactly:
  // Dashboard -> Pesanan -> Stok -> Absensi -> Team -> Riwayat -> Notifikasi -> Profile
  const ownerNavItems: { id: DashboardTab; label: string; icon: any; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'orders', label: 'Pesanan', icon: ShoppingBag, badge: orders.filter(o => o.status === 'pending').length },
    { id: 'inventory', label: 'Stok', icon: Package, badge: stockItems.filter(s => s.currentStock <= s.minStock).length },
    { id: 'attendance', label: 'Absensi', icon: CalendarCheck },
    { id: 'team', label: 'Team', icon: Users2 },
    { id: 'reports', label: 'Riwayat', icon: Clock },
    { id: 'notifications', label: 'Notifikasi', icon: Bell, badge: unreadCount },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  // Kasir Sidebar Navigation (Matching photo items + Kasir POS)
  const cashierNavItems: { id: DashboardTab; label: string; icon: any; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'pos', label: 'Kasir POS', icon: ShoppingBag },
    { id: 'orders', label: 'Pesanan', icon: ShoppingBag, badge: orders.filter(o => o.status === 'pending').length },
    { id: 'inventory', label: 'Stok', icon: Package, badge: stockItems.filter(s => s.currentStock <= s.minStock).length },
    { id: 'attendance', label: 'Absensi', icon: CalendarCheck },
    { id: 'reports', label: 'Riwayat', icon: Clock },
    { id: 'notifications', label: 'Notifikasi', icon: Bell, badge: unreadCount },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  const currentNavItems = isOwner ? ownerNavItems : cashierNavItems;

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#242424] flex font-sans">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-[#F1F1EF] shrink-0 sticky top-0 h-screen z-30 justify-between p-5">
        <div>
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 px-1 mb-7">
            <div className="w-10 h-10 rounded-[12px] bg-[#242424] flex items-center justify-center shadow-sm shrink-0">
              <Coffee className="w-5 h-5 text-[#FFB21A]" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="font-black text-xs md:text-sm tracking-tight text-[#242424] uppercase font-serif leading-tight">
                WARKOP WONG KITO
              </h1>
              <span className="text-[9px] text-[#737373] font-bold tracking-wider uppercase block mt-0.5">
                {isOwner ? 'PANEL OPERASIONAL' : 'PANEL KASIR'}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {currentNavItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id || (isOwner && activeTab === 'overview' && item.id === 'dashboard');

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[12px] text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'wkm-gradient-bg text-white shadow-sm'
                      : 'text-[#525252] hover:bg-[#F1F1EF] hover:text-[#242424]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" strokeWidth={active ? 2.5 : 2} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                        active ? 'bg-white text-[#F47C0B]' : 'bg-[#FFF7E8] text-[#F47C0B] border border-[#FFB21A]/40'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Logout / Keluar Button matching 2nd photo */}
        <div className="pt-4 border-t border-[#F1F1EF]">
          <button
            onClick={logout}
            className="w-full py-2.5 px-4 bg-white hover:bg-[#F1F1EF] text-[#525252] hover:text-[#242424] font-bold text-xs rounded-[12px] border border-[#F1F1EF] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4 text-[#737373]" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative bg-white w-64 h-full p-5 flex flex-col justify-between z-10 wkm-modal-shadow">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#F1F1EF] mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-[8px] bg-[#242424] flex items-center justify-center">
                    <Coffee className="w-4 h-4 text-[#FFB21A]" />
                  </div>
                  <span className="font-black text-xs text-[#242424] uppercase">Wong Kito</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-5 h-5 text-[#737373]" />
                </button>
              </div>

              <nav className="space-y-1.5">
                {currentNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[8px] text-xs font-bold ${
                        active ? 'wkm-gradient-bg text-white' : 'text-[#525252]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            <button
              onClick={logout}
              className="w-full py-2 bg-[#F1F1EF] text-[#525252] font-bold text-xs rounded-[8px] flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      )}

      {/* MAIN BODY AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* TOP NAVBAR */}
        <header className="bg-transparent px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          {/* Left: Search Bar */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-[8px] bg-white border border-[#F1F1EF] text-[#525252]"
            >
              <MenuIcon className="w-5 h-5" />
            </button>

            {/* Search Input: Q Cari anggota, peran... or Q Cari order ID... */}
            <div className="relative w-full">
              <input
                type="text"
                value={searchHeader}
                onChange={(e) => setSearchHeader(e.target.value)}
                placeholder={activeTab === 'team' ? 'Cari anggota, peran...' : 'Cari order ID / item...'}
                className="w-full pl-9 pr-4 py-2 bg-[#F1F1EF] border border-[#F1F1EF] rounded-[20px] text-xs text-[#242424] placeholder:text-[#737373] focus:outline-none focus:bg-white focus:border-[#F47C0B] transition-all"
              />
              <Search className="w-3.5 h-3.5 text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Right: Date, Notification Bell, Profile */}
          <div className="flex items-center gap-3 md:gap-4 shrink-0">
            {/* Date: 📅 Rabu, 16 Sep 2026 */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#737373] font-medium">
              <Calendar className="w-3.5 h-3.5 text-[#737373]" />
              <span>
                {new Intl.DateTimeFormat('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                }).format(new Date())}
              </span>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifDropdown(!showNotifDropdown);
                  setShowProfileDropdown(false);
                }}
                className="p-2 rounded-full hover:bg-[#F1F1EF] text-[#525252] relative transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#F47C0B] text-white text-[8px] font-black rounded-full flex items-center justify-center">
                  1
                </span>
              </button>

              {/* Notification Popover */}
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-[12px] wkm-modal-shadow border border-[#F1F1EF] p-3 z-50 animate-fade-in text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[#F1F1EF] mb-2">
                    <span className="font-bold text-[#242424]">Notifikasi</span>
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-[10px] text-[#F47C0B] font-semibold hover:underline"
                    >
                      Tandai Dibaca
                    </button>
                  </div>
                  <div className="space-y-2">
                    {notifications.slice(0, 3).map((n) => (
                      <div key={n.id} className="p-2 bg-[#FAFAF9] rounded-[8px] border border-[#F1F1EF]">
                        <div className="font-bold text-[#242424] text-[11px]">{n.title}</div>
                        <div className="text-[10px] text-[#525252]">{n.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar & Name */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileDropdown(!showProfileDropdown);
                  setShowNotifDropdown(false);
                }}
                className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-[#F1F1EF] transition-colors cursor-pointer"
              >
                <span className="text-xs font-bold text-[#242424] hidden sm:block">
                  {user?.name?.split(' ')[0] || 'Bang'}
                </span>
                <div className="w-7 h-7 rounded-full bg-[#242424] text-white text-xs font-bold flex items-center justify-center overflow-hidden border border-[#F1F1EF]">
                  <img
                    src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={user?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </button>

              {/* Profile Dropdown */}
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-[12px] wkm-modal-shadow border border-[#F1F1EF] p-2 z-50 animate-fade-in text-xs">
                  <div className="p-2 border-b border-[#F1F1EF] mb-1">
                    <p className="font-bold text-[#242424]">{user?.name}</p>
                    <p className="text-[10px] text-[#F47C0B] font-bold uppercase">{user?.role === 'superadmin' ? 'Owner Admin' : 'Kasir'}</p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        demoLogin(isOwner ? 'kasir' : 'superadmin');
                        setShowProfileDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-[8px] hover:bg-[#F1F1EF] font-medium text-[#525252] flex items-center justify-between"
                    >
                      <span>Ganti ke: {isOwner ? 'Kasir' : 'Owner Admin'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setShowProfileDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-[8px] hover:bg-[#F1F1EF] font-medium text-[#525252]"
                    >
                      Edit Profil
                    </button>
                  </div>

                  <div className="pt-1 border-t border-[#F1F1EF]">
                    <button
                      onClick={logout}
                      className="w-full text-left px-3 py-2 rounded-[8px] hover:bg-red-50 font-bold text-red-600 flex items-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar (Logout)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-4 md:px-8 md:pb-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};
