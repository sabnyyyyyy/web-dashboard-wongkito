'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatRupiah } from '@/utils/format';
import { WEEKLY_SALES_DATA } from '@/data/mockData';
import {
  DollarSign,
  Download,
  Calendar,
  TrendingUp,
  Percent,
  CheckCircle,
  FileSpreadsheet,
  Wallet,
  Receipt,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

export const ReportsView: React.FC = () => {
  const { orders } = useApp();
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('week');
  const [cashDrawerStart, setCashDrawerStart] = useState(250000); // Rp 250.000 modal awal kasir

  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const totalDiscount = orders.reduce((sum, o) => sum + o.discount, 0);
  const totalCashSales = orders.filter((o) => o.paymentMethod === 'cash').reduce((s, o) => s + o.total, 0);
  const totalQrisSales = orders.filter((o) => o.paymentMethod === 'qris').reduce((s, o) => s + o.total, 0);
  const totalTransferSales = orders.filter((o) => o.paymentMethod === 'transfer' || o.paymentMethod === 'debit').reduce((s, o) => s + o.total, 0);

  const totalCashInDrawer = cashDrawerStart + totalCashSales;

  const handleExportCSV = () => {
    const headers = ['No Nota', 'Pelanggan', 'Tipe', 'Metode Bayar', 'Total', 'Waktu'];
    const rows = orders.map((o) => [
      o.orderNumber,
      `"${o.customerName}"`,
      o.orderType,
      o.paymentMethod,
      o.total,
      o.createdAt,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laporan-penjualan-wongkito-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-neutral-900 tracking-tight font-sans">
            Laporan Penjualan & Rekap Shift
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Analisis omzet penjualan, laba bersih, dan perhitungan laci kasir warkop.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-stone-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setTimeRange('today')}
              className={`px-3 py-1.5 rounded-lg transition-all ${timeRange === 'today' ? 'bg-white shadow text-neutral-900' : 'text-stone-500'}`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setTimeRange('week')}
              className={`px-3 py-1.5 rounded-lg transition-all ${timeRange === 'week' ? 'bg-white shadow text-neutral-900' : 'text-stone-500'}`}
            >
              7 Hari Terakhir
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1.5 rounded-lg transition-all ${timeRange === 'month' ? 'bg-white shadow text-neutral-900' : 'text-stone-500'}`}
            >
              Bulan Ini
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
            Total Penjualan Kotor (Gross)
          </span>
          <div className="text-2xl font-black text-neutral-900">
            {formatRupiah(totalSales + 24500000)}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            +18.4% pertumbuhan mingguan
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
            Estimasi Laba Bersih (Net)
          </span>
          <div className="text-2xl font-black text-emerald-600">
            {formatRupiah(Math.round((totalSales + 24500000) * 0.58))}
          </div>
          <span className="text-[11px] text-stone-500 mt-1 block">
            Margin keuntungan warkop ~58%
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
            Total Diskon Diberikan
          </span>
          <div className="text-2xl font-black text-orange-600">
            {formatRupiah(totalDiscount + 420000)}
          </div>
          <span className="text-[11px] text-stone-500 mt-1 block">
            Promo voucher & potongan harga
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
            Total Cup & Porsi Terjual
          </span>
          <div className="text-2xl font-black text-neutral-900">
            1,480 <span className="text-xs font-normal text-stone-400">Porsi</span>
          </div>
          <span className="text-[11px] text-stone-500 mt-1 block">
            Kopi Robusta & Pempek mendominasi
          </span>
        </div>
      </div>

      {/* Weekly Trend Chart */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-black text-base text-neutral-900 tracking-tight font-sans">
              Perbandingan Omzet vs Laba Bersih Mingguan
            </h3>
            <p className="text-xs text-stone-500">Rekap 7 hari operasional warkop</p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={WEEKLY_SALES_DATA} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <XAxis dataKey="day" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#888888"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `Rp${val / 1000000}M`}
              />
              <Tooltip
                formatter={(val: unknown) => [formatRupiah(Number(val) || 0), '']}
                contentStyle={{ backgroundColor: '#1A1A1A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="sales" name="Total Penjualan" fill="#F95700" radius={[6, 6, 0, 0]} />
              <Bar dataKey="profit" name="Laba Bersih" fill="#2C1810" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Shift Closure & Cash Drawer Reconciliation Card */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-stone-100">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#F95700] flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-base text-neutral-900 tracking-tight font-sans">
              Rekap Tutup Buku Kasir (End of Shift)
            </h3>
            <p className="text-xs text-stone-500">
              Validasi kesesuaian uang kas fisik di laci mesin kasir sebelum pergantian staf.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
            <span className="text-[11px] text-stone-500 font-bold block mb-1">Modal Awal Kasir (Pagi)</span>
            <input
              type="number"
              value={cashDrawerStart}
              onChange={(e) => setCashDrawerStart(Number(e.target.value))}
              className="w-full text-base font-black bg-white px-3 py-1.5 border border-stone-200 rounded-lg text-neutral-900 focus:outline-none focus:border-[#F95700]"
            />
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
            <span className="text-[11px] text-stone-500 font-bold block mb-1">Total Kas Masuk Tunai</span>
            <div className="text-base font-black text-emerald-700 mt-1">
              +{formatRupiah(totalCashSales)}
            </div>
            <span className="text-[10px] text-stone-400">Dari pesanan tunai</span>
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
            <span className="text-[11px] text-stone-500 font-bold block mb-1">Total QRIS / Bank Transfer</span>
            <div className="text-base font-black text-blue-700 mt-1">
              {formatRupiah(totalQrisSales + totalTransferSales)}
            </div>
            <span className="text-[10px] text-stone-400">Masuk langsung ke rekening</span>
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
            <span className="text-[11px] text-amber-800 font-bold block mb-1">Target Kas Fisik di Laci</span>
            <div className="text-xl font-black text-[#F95700] mt-1">
              {formatRupiah(totalCashInDrawer)}
            </div>
            <span className="text-[10px] text-amber-700 font-semibold">Uang fisik wajib cocok!</span>
          </div>
        </div>
      </div>
    </div>
  );
};
