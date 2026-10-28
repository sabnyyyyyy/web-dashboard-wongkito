'use client';

import React, { useState } from 'react';
import { useApp } from '@/app/_context/AppContext';
import { formatDateTime, formatRupiah, playChime } from '@/app/_utils/format';
import { MenuItem, Order, OrderStatus } from '@/types';
import {
  Search,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Printer,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';

interface CustomOrderItem {
  name: string;
  notes?: string;
  qty: number;
  price: number;
  icon?: string;
}

type CustomOrderStatus = 'BARU' | 'DITERIMA' | 'DIPROSES' | 'SIAP DIAMBIL' | 'SELESAI' | 'BATAL';

interface CustomOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  items: CustomOrderItem[];
  orderType: 'TAKE AWAY' | 'DINE-IN' | 'DELIVERY';
  total: number;
  subtotal: number;
  paymentMethod: 'QRIS' | 'Tunai' | 'Transfer' | 'Debit';
  paymentStatus: 'Paid' | 'Unpaid';
  status: CustomOrderStatus;
  orderTime: string;
  customerNote?: string;
  step: 1 | 2 | 3 | 4;
}

// Kitchen labels used on this page ↔ statuses stored on the server.
const STATUS_LABEL: Record<OrderStatus, CustomOrderStatus> = {
  pending: 'BARU',
  accepted: 'DITERIMA',
  processing: 'DIPROSES',
  ready: 'SIAP DIAMBIL',
  completed: 'SELESAI',
  cancelled: 'BATAL',
};
const STATUS_FROM_LABEL = Object.fromEntries(
  Object.entries(STATUS_LABEL).map(([status, label]) => [label, status])
) as Record<CustomOrderStatus, OrderStatus>;

const STEP: Record<CustomOrderStatus, CustomOrder['step']> = {
  BARU: 1,
  DITERIMA: 1,
  DIPROSES: 2,
  'SIAP DIAMBIL': 3,
  SELESAI: 4,
  BATAL: 1,
};

const ORDER_TYPE_LABEL: Record<Order['orderType'], CustomOrder['orderType']> = {
  dine_in: 'DINE-IN',
  takeaway: 'TAKE AWAY',
  delivery: 'DELIVERY',
};

const PAYMENT_LABEL: Record<Order['paymentMethod'], CustomOrder['paymentMethod']> = {
  cash: 'Tunai',
  qris: 'QRIS',
  transfer: 'Transfer',
  debit: 'Debit',
};

const CATEGORY_ICON: Record<MenuItem['category'], string> = {
  kopi: '☕',
  'non-kopi': '🧋',
  makanan: '🍛',
  cemilan: '🍌',
  signature: '⭐',
};

const toCustomOrder = (order: Order): CustomOrder => {
  const status = STATUS_LABEL[order.status];
  const note = [order.tableNumber, order.notes].filter(Boolean).join(' • ');
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    items: order.items.map((ci) => ({
      name: ci.menuItem.name,
      notes: ci.notes || undefined,
      qty: ci.quantity,
      price: ci.menuItem.price * ci.quantity,
      icon: CATEGORY_ICON[ci.menuItem.category],
    })),
    orderType: ORDER_TYPE_LABEL[order.orderType],
    subtotal: order.subtotal,
    total: order.total,
    paymentMethod: PAYMENT_LABEL[order.paymentMethod],
    paymentStatus: order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid',
    status,
    orderTime: formatDateTime(order.createdAt),
    ...(note ? { customerNote: note } : {}),
    step: STEP[status],
  };
};

export const OrdersView: React.FC = () => {
  const { orders, updateOrderStatus, setActiveTab, setLastCompletedOrder, setShowReceiptModal } = useApp();

  const orderList = orders.map(toCustomOrder);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'SEMUA' | 'BARU' | 'DITERIMA' | 'DIPROSES' | 'SIAP' | 'SELESAI'>('SEMUA');
  // Keep only the id, so the detail view follows status changes and background refreshes.
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const selectedOrder = orderList.find((o) => o.id === selectedOrderId) ?? null;
  const setSelectedOrder = (ord: CustomOrder | null) => setSelectedOrderId(ord?.id ?? null);
  const [toastMessage, setToastMessage] = useState('');

  const countStatus = (status: CustomOrderStatus) => orderList.filter((o) => o.status === status).length;
  const filterCounts = {
    SEMUA: orderList.length,
    BARU: countStatus('BARU'),
    DITERIMA: countStatus('DITERIMA'),
    DIPROSES: countStatus('DIPROSES'),
    SIAP: countStatus('SIAP DIAMBIL'),
    SELESAI: countStatus('SELESAI'),
  };

  const filteredOrders = orderList.filter((ord) => {
    const matchesSearch =
      ord.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.items.some((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (activeFilter === 'BARU') return matchesSearch && ord.status === 'BARU';
    if (activeFilter === 'DITERIMA') return matchesSearch && ord.status === 'DITERIMA';
    if (activeFilter === 'DIPROSES') return matchesSearch && ord.status === 'DIPROSES';
    if (activeFilter === 'SIAP') return matchesSearch && ord.status === 'SIAP DIAMBIL';
    if (activeFilter === 'SELESAI') return matchesSearch && ord.status === 'SELESAI';
    return matchesSearch;
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const orderNumberOf = (orderId: string) => orderList.find((o) => o.id === orderId)?.orderNumber ?? orderId;

  // The step comes from the status, so the second argument is only kept for the existing call sites.
  const handleUpdateStatus = async (orderId: string, newStatus: CustomOrderStatus, _nextStep: 1 | 2 | 3 | 4) => {
    if (!(await updateOrderStatus(orderId, STATUS_FROM_LABEL[newStatus]))) return;
    playChime('success');
    showToast(`Status pesanan ${orderNumberOf(orderId)} berhasil diperbarui menjadi "${newStatus}"!`);
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm(`Yakin ingin membatalkan pesanan ${orderNumberOf(orderId)}?`)) return;
    if (!(await updateOrderStatus(orderId, 'cancelled'))) return;
    playChime('alert');
    showToast(`Pesanan ${orderNumberOf(orderId)} telah dibatalkan.`);
  };

  const handlePrintReceipt = (ord: CustomOrder) => {
    const order = orders.find((o) => o.id === ord.id);
    if (!order) return;
    setLastCompletedOrder(order);
    setShowReceiptModal(true);
  };

  // Render Status Badges matching photo 1
  const renderStatusBadge = (status: CustomOrder['status']) => {
    switch (status) {
      case 'DIPROSES':
        return (
          <span className="px-2.5 py-0.5 rounded-[6px] text-[10px] font-black tracking-wider text-blue-600 bg-blue-50 border border-blue-200 uppercase">
            DIPROSES
          </span>
        );
      case 'BARU':
        return (
          <span className="px-2.5 py-0.5 rounded-[6px] text-[10px] font-black tracking-wider text-[#737373] bg-[#F1F1EF] border border-stone-200 uppercase">
            BARU
          </span>
        );
      case 'SIAP DIAMBIL':
        return (
          <span className="px-2.5 py-0.5 rounded-[6px] text-[10px] font-black tracking-wider text-stone-700 bg-stone-200 border border-stone-300 uppercase">
            SIAP DIAMBIL
          </span>
        );
      case 'SELESAI':
        return (
          <span className="px-2.5 py-0.5 rounded-[6px] text-[10px] font-black tracking-wider text-stone-500 bg-[#F1F1EF] uppercase">
            SELESAI
          </span>
        );
      case 'BATAL':
        return (
          <span className="px-2.5 py-0.5 rounded-[6px] text-[10px] font-black tracking-wider text-red-600 bg-red-50 border border-red-200 uppercase">
            BATAL
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-[6px] text-[10px] font-black tracking-wider text-stone-600 bg-stone-100 uppercase">
            {status}
          </span>
        );
    }
  };

  // -------------------------------------------------------------
  // VIEW 2: DETAIL PESANAN (Matching Photo 2)
  // -------------------------------------------------------------
  if (selectedOrder) {
    return (
      <div className="space-y-6 animate-fade-in max-w-6xl">
        {/* Breadcrumb & Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <button
              onClick={() => setSelectedOrder(null)}
              className="text-xs font-semibold text-[#525252] hover:text-[#242424] flex items-center gap-1 mb-1 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Pesanan</span>
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-[#242424] font-serif tracking-tight">
                Detail Pesanan
              </h1>
              <span className="text-sm font-normal text-[#737373] font-mono">
                Order {selectedOrder.orderNumber}
              </span>
            </div>
          </div>

          <div>
            <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 text-xs font-bold rounded-[20px] uppercase tracking-wider">
              {selectedOrder.status === 'DIPROSES' ? 'SEDANG DIPROSES' : selectedOrder.status}
            </span>
          </div>
        </div>

        {toastMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-[8px] flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Stepper Progress Bar matching photo 2 */}
        <div className="bg-white rounded-[16px] p-4 md:p-5 border border-[#F1F1EF] wkm-card-shadow">
          <div className="flex items-center justify-between relative max-w-3xl mx-auto">
            {/* Step 1: Pesanan Diterima */}
            <div className="flex items-center gap-2 z-10 bg-white pr-2">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                ✓
              </div>
              <span className="text-xs font-bold text-[#242424]">Pesanan Diterima</span>
            </div>

            <div className="flex-1 h-[2px] bg-emerald-500 -mx-1" />

            {/* Step 2: Diproses */}
            <div className="flex items-center gap-2 z-10 bg-white px-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                  selectedOrder.step >= 2 ? 'wkm-gradient-bg text-white' : 'bg-stone-100 text-[#737373]'
                }`}
              >
                2
              </div>
              <span className={`text-xs font-bold ${selectedOrder.step >= 2 ? 'text-[#242424]' : 'text-[#737373]'}`}>
                Diproses
              </span>
            </div>

            <div
              className={`flex-1 h-[2px] -mx-1 ${
                selectedOrder.step >= 3 ? 'bg-[#F47C0B]' : 'bg-[#F1F1EF]'
              }`}
            />

            {/* Step 3: Siap Diambil */}
            <div className="flex items-center gap-2 z-10 bg-white pl-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                  selectedOrder.step >= 3 ? 'wkm-gradient-bg text-white' : 'bg-stone-100 text-[#737373]'
                }`}
              >
                3
              </div>
              <span className={`text-xs font-bold ${selectedOrder.step >= 3 ? 'text-[#242424]' : 'text-[#737373]'}`}>
                Siap Diambil
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Details matching photo 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: ITEM PESANAN (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-[16px] p-5 md:p-6 border border-[#F1F1EF] wkm-card-shadow space-y-4">
            <h2 className="font-extrabold text-xs text-[#737373] uppercase tracking-wider font-sans">
              ITEM PESANAN
            </h2>

            <div className="divide-y divide-[#F1F1EF] space-y-3">
              {selectedOrder.items.map((item, idx) => (
                <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-[10px] bg-[#FFF7E8] text-[#F47C0B] flex items-center justify-center text-lg shrink-0 border border-[#FFB21A]/30">
                      {item.icon || '☕'}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#242424]">{item.name}</h4>
                      {item.notes && (
                        <p className="text-[11px] text-[#737373] mt-0.5">{item.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-4">
                    <span className="text-xs text-[#737373] font-medium">&times;{item.qty}</span>
                    <span className="font-extrabold text-sm text-[#242424] min-w-[75px] text-right">
                      {formatRupiah(item.price * item.qty)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Customer Notes Box matching photo 2 */}
            {selectedOrder.customerNote && (
              <div className="p-3.5 bg-[#FFF7E8] border border-[#FFB21A]/40 rounded-[10px] text-xs text-[#525252] leading-relaxed">
                Catatan pelanggan: &ldquo;{selectedOrder.customerNote}&rdquo;
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: INFO, PAYMENT, ACTIONS (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Box 1: INFORMASI PELANGGAN & PEMESANAN */}
            <div className="bg-white rounded-[16px] p-5 border border-[#F1F1EF] wkm-card-shadow space-y-3 text-xs">
              <h3 className="font-extrabold text-[11px] text-[#737373] uppercase tracking-wider font-sans">
                INFORMASI PELANGGAN & PEMESANAN
              </h3>

              <div className="flex justify-between py-1 border-b border-[#F1F1EF]">
                <span className="text-[#737373]">Nama pelanggan</span>
                <span className="font-bold text-[#242424]">{selectedOrder.customerName}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#F1F1EF]">
                <span className="text-[#737373]">Tipe pesanan</span>
                <span className="font-bold text-[#242424]">{selectedOrder.orderType}</span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-[#737373]">Waktu pesan</span>
                <span className="font-bold text-[#242424]">{selectedOrder.orderTime}</span>
              </div>
            </div>

            {/* Box 2: RINCIAN PEMBAYARAN */}
            <div className="bg-white rounded-[16px] p-5 border border-[#F1F1EF] wkm-card-shadow space-y-3 text-xs">
              <h3 className="font-extrabold text-[11px] text-[#737373] uppercase tracking-wider font-sans">
                RINCIAN PEMBAYARAN
              </h3>

              <div className="flex justify-between py-1 border-b border-[#F1F1EF]">
                <span className="text-[#737373]">Subtotal</span>
                <span className="font-bold text-[#242424]">{formatRupiah(selectedOrder.subtotal)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#F1F1EF]">
                <span className="text-[#737373]">Metode</span>
                <span className="font-bold text-[#242424]">{selectedOrder.paymentMethod}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#F1F1EF]">
                <span className="text-[#737373]">Status bayar</span>
                <span className="font-bold text-emerald-600">{selectedOrder.paymentStatus}</span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="font-bold text-sm text-[#242424]">Total bayar</span>
                <span className="text-xl font-black text-[#F47C0B]">{formatRupiah(selectedOrder.total)}</span>
              </div>
            </div>

            {/* Box 3: TINDAKAN */}
            <div className="bg-white rounded-[16px] p-5 border border-[#F1F1EF] wkm-card-shadow space-y-2.5 text-xs">
              <h3 className="font-extrabold text-[11px] text-[#737373] uppercase tracking-wider font-sans mb-1">
                TINDAKAN
              </h3>

              {/* Action 1: Tandai Siap Diambil / Selesai */}
              {selectedOrder.status === 'DIPROSES' ? (
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'SIAP DIAMBIL', 3)}
                  className="w-full py-3 wkm-gradient-bg hover:opacity-95 text-white font-bold rounded-[8px] shadow-xs cursor-pointer text-xs"
                >
                  Tandai Siap Diambil
                </button>
              ) : selectedOrder.status === 'SIAP DIAMBIL' ? (
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'SELESAI', 4)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-[8px] shadow-xs cursor-pointer text-xs"
                >
                  Selesaikan Pesanan
                </button>
              ) : selectedOrder.status === 'BARU' ? (
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'DIPROSES', 2)}
                  className="w-full py-3 wkm-gradient-bg hover:opacity-95 text-white font-bold rounded-[8px] shadow-xs cursor-pointer text-xs"
                >
                  Proses Pesanan Sekarang
                </button>
              ) : null}

              {/* Action 2: Cetak Struk */}
              <button
                onClick={() => handlePrintReceipt(selectedOrder)}
                className="w-full py-2.5 bg-white hover:bg-[#F1F1EF] border border-[#F1F1EF] text-[#242424] font-bold rounded-[8px] transition-colors cursor-pointer text-xs"
              >
                Cetak Struk
              </button>

              {/* Action 3: Batalkan Pesanan */}
              {selectedOrder.status !== 'SELESAI' && selectedOrder.status !== 'BATAL' && (
                <div className="text-center pt-1">
                  <button
                    onClick={() => handleCancelOrder(selectedOrder.id)}
                    className="text-xs text-red-600 font-bold hover:underline cursor-pointer"
                  >
                    Batalkan Pesanan
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 1: DAFTAR PESANAN TABLE (Matching Photo 1)
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header Bar matching photo 1 */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-[#242424] tracking-tight font-sans uppercase">
            PESANAN
          </h1>
          <p className="text-xs text-[#525252] mt-0.5 font-sans">
            Kelola alur pemesanan pelanggan yang masuk secara real-time.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('pos')}
          className="px-4 py-2.5 bg-[#242424] hover:bg-black text-white font-bold text-xs rounded-[8px] shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" />
          <span>PESANAN BARU</span>
        </button>
      </div>

      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-[8px] flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Controls Bar: Search Input (Left) + Filter Tabs (Right) matching photo 1 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full lg:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari order ID atau customer..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#F1F1EF] rounded-[8px] text-xs text-[#242424] placeholder:text-[#737373] focus:outline-none focus:border-[#F47C0B]"
          />
          <Search className="w-3.5 h-3.5 text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        {/* Filter Pills matching photo 1 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {(['SEMUA', 'BARU', 'DITERIMA', 'DIPROSES', 'SIAP', 'SELESAI'] as const).map((tab) => {
            const active = activeFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-3 py-1.5 rounded-[8px] text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-stone-100 text-[#525252] hover:bg-stone-200'
                }`}
              >
                {tab} ({filterCounts[tab]})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Table Card matching photo 1 */}
      <div className="bg-white rounded-[16px] border border-[#F1F1EF] wkm-card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAF7F2] text-[#737373] font-bold uppercase text-[10px] tracking-wider border-b border-[#F1F1EF]">
                <th className="py-3 px-4">ORDER ID</th>
                <th className="py-3 px-4">CUSTOMER</th>
                <th className="py-3 px-4">ITEMS</th>
                <th className="py-3 px-4">TYPE</th>
                <th className="py-3 px-4">TOTAL</th>
                <th className="py-3 px-4">PAYMENT</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F1EF]">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-[#FAFAF9] transition-colors">
                  {/* ORDER ID */}
                  <td className="py-3.5 px-4 font-mono font-bold text-[#242424]">
                    {ord.orderNumber}
                  </td>

                  {/* CUSTOMER */}
                  <td className="py-3.5 px-4 font-bold text-[#242424]">
                    {ord.customerName}
                  </td>

                  {/* ITEMS */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5">
                      {ord.items.map((it, idx) => (
                        <div key={idx} className={idx === 0 ? 'text-[#242424] font-medium' : 'text-[#737373] text-[11px]'}>
                          {it.name} x{it.qty}
                        </div>
                      ))}
                    </div>
                  </td>

                  {/* TYPE */}
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 bg-stone-100 text-[#525252] border border-stone-200 rounded-[6px] text-[10px] font-bold">
                      {ord.orderType}
                    </span>
                  </td>

                  {/* TOTAL */}
                  <td className="py-3.5 px-4 font-extrabold text-[#242424]">
                    {formatRupiah(ord.total)}
                  </td>

                  {/* PAYMENT: QRIS (Paid) / Cash (Unpaid) */}
                  <td className="py-3.5 px-4 text-xs">
                    <span className="font-semibold text-[#242424]">{ord.paymentMethod} </span>
                    <span
                      className={`font-bold ${
                        ord.paymentStatus === 'Paid' ? 'text-blue-600' : 'text-red-500'
                      }`}
                    >
                      ({ord.paymentStatus})
                    </span>
                  </td>

                  {/* STATUS BADGE */}
                  <td className="py-3.5 px-4">
                    {renderStatusBadge(ord.status)}
                  </td>

                  {/* ACTION: [DETAIL] */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedOrder(ord)}
                      className="px-3 py-1 bg-white hover:bg-[#F1F1EF] border border-[#F1F1EF] text-[#525252] hover:text-[#242424] font-bold text-xs rounded-[8px] transition-colors cursor-pointer"
                    >
                      DETAIL
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer & Pagination matching photo 1 */}
        <div className="p-4 border-t border-[#F1F1EF] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#737373]">
          <div>
            Menampilkan baris 1 – {filteredOrders.length} dari total 18 pesanan aktif
          </div>

          <div className="flex items-center gap-3">
            <button className="px-3 py-1 bg-white hover:bg-[#F1F1EF] border border-[#F1F1EF] rounded-[8px] font-bold text-[#525252] text-xs">
              &lt; SEBELUMNYA
            </button>
            <span className="font-medium text-[#242424]">Halaman 1 dari 4</span>
            <button className="px-3 py-1 bg-white hover:bg-[#F1F1EF] border border-[#F1F1EF] rounded-[8px] font-bold text-[#525252] text-xs">
              SELANJUTNYA &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
