'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { formatRupiah, formatDateTime } from '@/utils/format';
import { SALES_CHART_DATA, WEEKLY_SALES_DATA } from '@/data/mockData';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  AlertTriangle,
  ArrowUpRight,
  Coffee,
  Sparkles,
  ChevronRight,
  CreditCard,
  Clock,
  Plus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const OverviewView: React.FC = () => {
  const { user } = useAuth();
  const { orders, menuItems, stockItems, setActiveTab, setLastCompletedOrder, setShowReceiptModal } = useApp();

  // Metrics computation
  const totalRevenue = orders.reduce((sum, o) => sum + (o.paymentStatus === 'paid' ? o.total : 0), 0);
  const totalOrdersCount = orders.length;
  const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;
  const lowStockCount = stockItems.filter((s) => s.currentStock <= s.minStock).length;

  // Best sellers
  const bestSellers = menuItems.filter((m) => m.popular).slice(0, 5);

  // Payment Breakdown
  const paymentBreakdown = [
    { name: 'QRIS', value: orders.filter((o) => o.paymentMethod === 'qris').length || 2, color: '#F95700' },
    { name: 'Tunai', value: orders.filter((o) => o.paymentMethod === 'cash').length || 1, color: '#2C1810' },
    { name: 'Transfer / Debit', value: orders.filter((o) => o.paymentMethod === 'transfer' || o.paymentMethod === 'debit').length || 1, color: '#E6AF2E' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#2C1810] via-[#3E2723] to-[#1A0F0A] rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-amber-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-semibold rounded-full border border-amber-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Sistem Operasional Aktif
              </span>
              <span className="text-stone-400 text-xs">
                {new Intl.DateTimeFormat('id-ID', { dateStyle: 'full' }).format(new Date())}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black font-serif tracking-tight text-white">
              Halo, {user?.name || 'Admin'}! 👋
            </h1>
            <p className="text-stone-300 text-xs md:text-sm mt-1 max-w-xl">
              Pantau aktivitas penjualan, pesanan masuk dari meja & ojol, serta ketersediaan bahan baku kopi secara real-time.
            </p>
          </div>

          {/* Quick Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('pos')}
              className="px-5 py-3 bg-[#F95700] hover:bg-[#E04E00] text-white text-xs md:text-sm font-bold rounded-2xl shadow-lg shadow-orange-500/30 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 cursor-pointer uppercase tracking-wider"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Buka Kasir POS</span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs md:text-sm font-semibold rounded-2xl transition-all cursor-pointer flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              <span>Dapur & Bar</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Omzet */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Omzet Hari Ini
            </span>
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F95700] flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-neutral-900 tracking-tight">
            {formatRupiah(totalRevenue + 3450000)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-600">
            <ArrowUpRight className="w-4 h-4" />
            <span>+14.8% vs kemarin</span>
          </div>
        </div>

        {/* Card 2: Total Pesanan */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Total Pesanan
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-neutral-900 tracking-tight">
            {totalOrdersCount + 128} <span className="text-sm font-normal text-stone-400">Cup/Porsi</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-stone-500">
            <span>Rata-rata: {formatRupiah(avgOrderValue || 28500)} / order</span>
          </div>
        </div>

        {/* Card 3: Pelanggan Aktif */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Pelanggan Terlayani
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-neutral-900 tracking-tight">
            94 <span className="text-sm font-normal text-stone-400">Tamu</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-blue-600">
            <span>8 Meja Terisi Saat Ini</span>
          </div>
        </div>

        {/* Card 4: Peringatan Stok */}
        <div
          onClick={() => setActiveTab('inventory')}
          className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Stok Bahan Baku
            </span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${lowStockCount > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-neutral-900 tracking-tight">
            {lowStockCount > 0 ? `${lowStockCount} Perlu Restock` : 'Stok Aman'}
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-[#F95700] group-hover:underline">
            <span>Kelola inventori</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hourly Peak Sales Trend (8 Cols) */}
        <div className="lg:col-span-8 bg-white p-5 md:p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="font-black text-base text-neutral-900 tracking-tight font-sans">
                Tren Penjualan Per Jam (Peak Hours)
              </h3>
              <p className="text-xs text-stone-500">
                Puncak keramaian warkop berada di jam santai sore & malam (18:00 - 22:00)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-stone-600 font-medium">
                <span className="w-3 h-3 rounded-full bg-[#F95700]" /> Omzet (Rp)
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SALES_CHART_DATA} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F95700" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F95700" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#888888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `Rp${val / 1000}k`}
                />
                <Tooltip
                  formatter={(val: unknown) => [formatRupiah(Number(val) || 0), 'Omzet']}
                  labelFormatter={(lbl) => `Pukul ${lbl} WIB`}
                  contentStyle={{ backgroundColor: '#1A1A1A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#F95700"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#salesGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Breakdown & Summary (4 Cols) */}
        <div className="lg:col-span-4 bg-white p-5 md:p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-black text-base text-neutral-900 tracking-tight mb-1 font-sans">
              Metode Pembayaran
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Komposisi transaksi kasir hari ini
            </p>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {paymentBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1A1A1A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 mt-2 pt-3 border-t border-stone-100">
            {paymentBreakdown.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-medium text-stone-700">{item.name}</span>
                </div>
                <span className="font-bold text-neutral-900">{item.value} Transaksi</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Section: Live Orders Feed & Top Best Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Orders (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-5 md:p-6 rounded-3xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-black text-base text-neutral-900 tracking-tight font-sans">
                Pesanan Terkini
              </h3>
              <p className="text-xs text-stone-500">Aktivitas pesanan masuk & status dapur</p>
            </div>
            <button
              onClick={() => setActiveTab('orders')}
              className="text-xs font-bold text-[#F95700] hover:underline flex items-center gap-0.5"
            >
              <span>Lihat Semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-stone-100">
            {orders.slice(0, 4).map((ord) => (
              <div key={ord.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#2C1810] flex items-center justify-center font-bold text-xs">
                    {ord.orderType === 'dine_in' ? (ord.tableNumber?.replace('Meja ', 'M') || 'M01') : 'TA'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs md:text-sm text-neutral-900">{ord.customerName}</h4>
                      <span className="text-[10px] text-stone-400 font-mono">{ord.orderNumber}</span>
                    </div>
                    <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                      {ord.items.map((i) => `${i.quantity}x ${i.menuItem.name}`).join(', ')}
                    </p>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-1">
                  <span className="font-extrabold text-xs text-neutral-900">{formatRupiah(ord.total)}</span>
                  <button
                    onClick={() => {
                      setLastCompletedOrder(ord);
                      setShowReceiptModal(true);
                    }}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      ord.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : ord.status === 'ready'
                        ? 'bg-blue-100 text-blue-800'
                        : ord.status === 'processing'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-stone-100 text-stone-800'
                    }`}
                  >
                    {ord.status === 'completed'
                      ? 'Selesai'
                      : ord.status === 'ready'
                      ? 'Siap Saji'
                      : ord.status === 'processing'
                      ? 'Diracik'
                      : 'Menunggu'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Best Sellers (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-5 md:p-6 rounded-3xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-black text-base text-neutral-900 tracking-tight font-sans">
                Produk Terlaris 🔥
              </h3>
              <p className="text-xs text-stone-500">Menu favorit pelanggan Warkop Wong Kito</p>
            </div>
            <button
              onClick={() => setActiveTab('menu')}
              className="text-xs font-bold text-[#F95700] hover:underline flex items-center gap-0.5"
            >
              <span>Menu</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {bestSellers.map((item, idx) => (
              <div key={item.id} className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-stone-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${idx === 0 ? 'bg-amber-400 text-stone-900 shadow' : 'bg-stone-100 text-stone-600'}`}>
                    {idx + 1}
                  </span>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-10 h-10 rounded-lg object-cover border border-stone-200"
                  />
                  <div>
                    <h4 className="font-bold text-xs text-neutral-900 leading-snug line-clamp-1">
                      {item.name}
                    </h4>
                    <span className="text-[11px] text-stone-500">{formatRupiah(item.price)}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-[#F95700]">{(idx + 1) * 38 + 24} terjual</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
