'use client';

import React, { useState } from 'react';
import { useApp } from '@/app/_context/AppContext';
import { useAuth } from '@/app/_context/AuthContext';
import { Order } from '@/types';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export const OwnerDashboardView: React.FC = () => {
  const { orders, stockItems, setActiveTab, setLastCompletedOrder, setShowReceiptModal } = useApp();
  const { user } = useAuth();
  const [attendanceMsg, setAttendanceMsg] = useState<string>('');

  const handleAbsen = (type: 'masuk' | 'pulang') => {
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setAttendanceMsg(`Absen ${type === 'masuk' ? 'Masuk' : 'Pulang'} berhasil dicatat pada ${time} WIB`);
    setTimeout(() => setAttendanceMsg(''), 4000);
  };

  // Orders placed today (Asia/Jakarta calendar day, which is what the shop works by).
  const todayKey = (iso: string) => new Date(iso).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' });
  const today = todayKey(new Date().toISOString());
  const todaysOrders = orders.filter((o) => todayKey(o.createdAt) === today);
  const countStatus = (...statuses: Order['status'][]) => orders.filter((o) => statuses.includes(o.status)).length;
  const newCount = countStatus('pending');
  const processingCount = countStatus('accepted', 'processing');
  const readyCount = countStatus('ready');

  const lowStock = stockItems.filter((s) => s.currentStock <= s.minStock);

  const STATUS_BADGE: Record<Order['status'], { label: string; className: string }> = {
    pending: { label: 'BARU', className: 'text-blue-600 border border-blue-400 bg-blue-50' },
    accepted: { label: 'DITERIMA', className: 'text-blue-600 border border-blue-400 bg-blue-50' },
    processing: { label: 'DIPROSES', className: 'text-[#F47C0B] border border-[#F47C0B] bg-[#FFF7E8]' },
    ready: { label: 'SIAP DIAMBIL', className: 'text-stone-700 border border-stone-300 bg-stone-100' },
    completed: { label: 'SELESAI', className: 'text-stone-500 border border-stone-200 bg-[#F1F1EF]' },
    cancelled: { label: 'BATAL', className: 'text-red-600 border border-red-200 bg-red-50' },
  };
  const ORDER_TYPE: Record<Order['orderType'], string> = { dine_in: 'Dine-in', takeaway: 'Take Away', delivery: 'Delivery' };

  // Latest orders still being worked on (orders come from the server newest first).
  const activeOrders = orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled');
  const sampleOrders = activeOrders.slice(0, 3).map((o) => ({
    id: o.orderNumber,
    customer: o.customerName,
    item: o.items.map((ci) => `${ci.menuItem.name} x${ci.quantity}`).join(', '),
    type: ORDER_TYPE[o.orderType],
    status: STATUS_BADGE[o.status].label,
    statusClass: STATUS_BADGE[o.status].className,
    rawOrder: o,
  }));

  // Empty items first, then the ones closest to running out.
  const stockAlerts = [...lowStock]
    .sort((a, b) => a.currentStock / (a.minStock || 1) - b.currentStock / (b.minStock || 1))
    .slice(0, 3)
    .map((s) =>
      s.currentStock <= 0
        ? { name: s.name, stock: `${s.currentStock} ${s.unit}`, status: 'HABIS', statusClass: 'text-red-700 bg-red-100 border border-red-200' }
        : { name: s.name, stock: `${s.currentStock} ${s.unit}`, status: 'MENIPIS', statusClass: 'text-[#F47C0B] bg-[#FFF7E8] border border-[#FFB21A]/50' }
    );

  return (
    <div className="space-y-6">
      {/* Title Header: 24px section spacing */}
      <div>
        <h1 className="text-xl md:text-2xl font-black text-[#242424] tracking-tight uppercase font-sans">
          DASHBOARD
        </h1>
        <p className="text-xs text-[#525252] italic mt-0.5 font-sans">
          &ldquo;Pantau aktivitas operasional Warkop Wong Kito hari ini.&rdquo;
        </p>
      </div>

      {attendanceMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-[8px] flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{attendanceMsg}</span>
        </div>
      )}

      {/* 6 Horizontal Stat Cards: Radius 12px, Card Shadow, Spacing 12px */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1 */}
        <div className="bg-white rounded-[12px] p-4 border border-[#F1F1EF] wkm-card-shadow flex flex-col justify-between">
          <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">
            PESANAN HARI INI
          </span>
          <div className="my-2">
            <span className="text-2xl font-black text-[#242424]">{todaysOrders.length}</span>
          </div>
          <span className="text-[10px] text-[#737373]">Total masuk</span>
        </div>

        {/* Card 2 (Blue Highlight) */}
        <div className="bg-white rounded-[12px] p-4 border-2 border-blue-400 wkm-card-shadow flex flex-col justify-between">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
            PESANAN BARU
          </span>
          <div className="my-2">
            <span className="text-2xl font-black text-blue-600">{newCount}</span>
          </div>
          <span className="text-[10px] text-blue-500 font-medium">Perlu konfirmasi</span>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-[12px] p-4 border border-[#F1F1EF] wkm-card-shadow flex flex-col justify-between">
          <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">
            DIPROSES
          </span>
          <div className="my-2">
            <span className="text-2xl font-black text-[#242424]">{processingCount}</span>
          </div>
          <span className="text-[10px] text-[#737373]">Dalam antrian bar</span>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-[12px] p-4 border border-[#F1F1EF] wkm-card-shadow flex flex-col justify-between">
          <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">
            SIAP DIAMBIL
          </span>
          <div className="my-2">
            <span className="text-2xl font-black text-[#242424]">{readyCount}</span>
          </div>
          <span className="text-[10px] text-[#737373]">Counter pick-up</span>
        </div>

        {/* Card 5 (Red Highlight) */}
        <div className="bg-white rounded-[12px] p-4 border-2 border-red-300 wkm-card-shadow flex flex-col justify-between">
          <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
            STOK MENIPIS
          </span>
          <div className="my-2">
            <span className="text-2xl font-black text-red-600">{lowStock.length}</span>
          </div>
          <span className="text-[10px] text-red-500 font-medium">Perlu restock segera</span>
        </div>

        {/* Card 6 */}
        <div className="bg-white rounded-[12px] p-4 border border-[#F1F1EF] wkm-card-shadow flex flex-col justify-between">
          <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">
            KEHADIRAN
          </span>
          <div className="my-2">
            <span className="text-xl font-black text-emerald-600">Hadir</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">Aktif bertugas</span>
        </div>
      </div>

      {/* Shortcut Row: Radius 8px on buttons, 12px on bar, 8px spacing */}
      <div className="bg-white p-3 md:p-3.5 rounded-[12px] border border-[#F1F1EF] wkm-card-shadow flex flex-wrap items-center gap-2 md:gap-3 text-xs">
        <span className="text-[#525252] font-semibold mr-1">Shortcut:</span>

        <button
          onClick={() => setActiveTab('orders')}
          className="px-4 py-2 bg-[#242424] hover:bg-black text-white font-bold rounded-[8px] transition-all cursor-pointer shadow-xs"
        >
          Lihat Pesanan
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className="px-4 py-2 bg-white hover:bg-[#F1F1EF] text-[#525252] hover:text-[#242424] font-bold border border-[#F1F1EF] rounded-[8px] transition-all cursor-pointer"
        >
          Update Stok
        </button>

        <button
          onClick={() => handleAbsen('masuk')}
          className="px-4 py-2 bg-white hover:bg-[#F1F1EF] text-[#525252] hover:text-[#242424] font-bold border border-[#F1F1EF] rounded-[8px] transition-all cursor-pointer"
        >
          Absen Masuk
        </button>

        <button
          onClick={() => handleAbsen('pulang')}
          className="px-4 py-2 bg-white hover:bg-[#F1F1EF] text-[#525252] hover:text-[#242424] font-bold border border-[#F1F1EF] rounded-[8px] transition-all cursor-pointer"
        >
          Absen Pulang
        </button>
      </div>

      {/* 2-Column Grid: Left (Pesanan Terbaru) & Right (Peringatan Stok & AI Insight) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Pesanan Terbaru (7 Cols) -> Radius 16px, wkm-card-shadow */}
        <div className="lg:col-span-7 bg-white rounded-[16px] p-5 md:p-6 border border-[#F1F1EF] wkm-card-shadow flex flex-col justify-between min-h-[420px]">
          <div>
            <h2 className="font-extrabold text-sm md:text-base text-[#242424] mb-4 font-sans">
              Pesanan Terbaru
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FFF7E8] text-[#737373] font-bold uppercase text-[10px] tracking-wider rounded-[8px]">
                    <th className="py-2.5 px-3 rounded-l-[8px]">ORDER ID</th>
                    <th className="py-2.5 px-3">CUSTOMER</th>
                    <th className="py-2.5 px-3">ITEM</th>
                    <th className="py-2.5 px-3">TYPE</th>
                    <th className="py-2.5 px-3">STATUS</th>
                    <th className="py-2.5 px-3 text-center rounded-r-[8px]">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F1EF]">
                  {sampleOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 px-3 text-center text-[#737373]">
                        Belum ada pesanan aktif.
                      </td>
                    </tr>
                  )}
                  {sampleOrders.map((row) => (
                    <tr key={row.id} className="hover:bg-[#FAFAF9] transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-[#242424]">{row.id}</td>
                      <td className="py-3 px-3 font-semibold text-[#242424]">{row.customer}</td>
                      <td className="py-3 px-3 text-[#525252]">{row.item}</td>
                      <td className="py-3 px-3 text-[#525252]">{row.type}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-black uppercase tracking-wider ${row.statusClass}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => {
                            if (row.rawOrder) {
                              setLastCompletedOrder(row.rawOrder);
                              setShowReceiptModal(true);
                            }
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-[#F1F1EF] border border-[#F1F1EF] text-[#525252] hover:text-[#242424] text-[10px] font-bold rounded-[8px] transition-colors cursor-pointer"
                        >
                          DETAIL
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer of Table */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#F1F1EF] text-xs">
            <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">
              MENAMPILKAN {sampleOrders.length} DARI {activeOrders.length} PESANAN AKTIF
            </span>
            <button
              onClick={() => setActiveTab('orders')}
              className="px-3 py-1.5 bg-white hover:bg-[#F1F1EF] border border-[#F1F1EF] text-[#525252] hover:text-[#242424] font-bold rounded-[8px] text-xs flex items-center gap-1 cursor-pointer transition-all"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#F47C0B]" />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Peringatan Stok & AI Insight (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Box 1: Peringatan Stok -> Radius 16px, wkm-card-shadow */}
          <div className="bg-white rounded-[16px] p-5 border border-[#F1F1EF] wkm-card-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-extrabold text-sm md:text-base text-[#242424] font-sans">
                Peringatan Stok
              </h2>
              <button
                onClick={() => setActiveTab('inventory')}
                className="px-3 py-1 bg-white hover:bg-[#F1F1EF] border border-[#F1F1EF] text-[#525252] hover:text-[#242424] text-xs font-bold rounded-[8px] transition-all cursor-pointer"
              >
                Kelola Stok
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FFF7E8] text-[#737373] font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2 px-3 rounded-l-[8px]">ITEM</th>
                    <th className="py-2 px-3">STOCK</th>
                    <th className="py-2 px-3 text-right rounded-r-[8px]">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F1EF]">
                  {stockAlerts.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-4 px-3 text-center text-[#737373]">
                        Semua stok aman.
                      </td>
                    </tr>
                  )}
                  {stockAlerts.map((stk, idx) => (
                    <tr key={idx} className="hover:bg-[#FAFAF9]">
                      <td className="py-2.5 px-3 font-semibold text-[#242424]">{stk.name}</td>
                      <td className="py-2.5 px-3 text-[#525252] font-medium">{stk.stock}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={`px-2 py-0.5 rounded-[20px] text-[9px] font-black uppercase ${stk.statusClass}`}>
                          {stk.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Box 2: AI Ringkasan Harian -> Highlight Background: Cream #FFF7E8, Radius 16px */}
          <div className="bg-[#FFF7E8] rounded-[16px] p-5 border border-[#FFB21A]/30">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[#F47C0B] text-xs">★</span>
              <h3 className="font-extrabold text-xs text-[#F47C0B] uppercase tracking-wider font-sans">
                AI RINGKASAN HARIAN
              </h3>
            </div>
            <p className="text-[11px] text-[#525252] italic mb-3">
              &ldquo;Ringkasan operasional hari ini.&rdquo;
            </p>

            <div className="bg-white rounded-[12px] p-3.5 border border-[#F1F1EF] text-xs text-[#242424] leading-relaxed wkm-card-shadow space-y-2">
              <p>
                <strong className="text-[#242424]">AI Insight:</strong> Perkiraan jam sibuk pada <strong className="text-[#F47C0B]">12:00 – 13:30</strong>. Stok Fresh Milk disarankan restock sebelum jam makan siang. Rata-rata waktu penyajian saat ini: <strong>4.2 menit</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
