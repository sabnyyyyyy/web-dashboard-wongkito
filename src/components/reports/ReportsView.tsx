'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatRupiah } from '@/utils/format';
import {
  Search,
  Receipt,
  X,
  Printer,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  ShoppingBag,
} from 'lucide-react';

export interface HistoryOrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface HistoryOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  totalItem: number;
  totalBayar: number;
  tanggalWaktu: string;
  status: 'Selesai' | 'Dibatalkan';
  paymentMethod: string;
  items: HistoryOrderItem[];
  notes?: string;
}

// Initial orders matching screenshot exactly on Page 1
const INITIAL_HISTORY_ORDERS: HistoryOrder[] = [
  // Page 1 (Matching screenshot exactly)
  {
    id: 'WK-001',
    orderNumber: 'WK-001',
    customerName: 'Dian Pratiwi',
    totalItem: 3,
    totalBayar: 42000,
    tanggalWaktu: '16 Sep 2026, 09:40',
    status: 'Selesai',
    paymentMethod: 'QRIS',
    items: [
      { name: 'Kopi Susu Aren', qty: 1, price: 18000 },
      { name: 'Americano Ice', qty: 1, price: 15000 },
      { name: 'Roti Bakar Cokelat', qty: 1, price: 9000 },
    ],
  },
  {
    id: 'WK-002',
    orderNumber: 'WK-002',
    customerName: 'Ahmad Faisal',
    totalItem: 1,
    totalBayar: 18000,
    tanggalWaktu: '16 Sep 2026, 09:15',
    status: 'Selesai',
    paymentMethod: 'Cash',
    items: [{ name: 'Kopi Susu Aren', qty: 1, price: 18000 }],
  },
  {
    id: 'WK-003',
    orderNumber: 'WK-003',
    customerName: 'Rina Gunawan',
    totalItem: 4,
    totalBayar: 65000,
    tanggalWaktu: '16 Sep 2026, 08:50',
    status: 'Dibatalkan',
    paymentMethod: 'Cash',
    items: [
      { name: 'Pempek Kapal Selam', qty: 1, price: 25000 },
      { name: 'Pempek Lenjer', qty: 2, price: 20000 },
      { name: 'Es Teh Manis', qty: 1, price: 20000 },
    ],
    notes: 'Pelanggan membatalkan pesanan karena buru-buru.',
  },
  {
    id: 'WK-004',
    orderNumber: 'WK-004',
    customerName: 'Kevin Sanjaya',
    totalItem: 2,
    totalBayar: 30000,
    tanggalWaktu: '15 Sep 2026, 21:10',
    status: 'Selesai',
    paymentMethod: 'QRIS',
    items: [
      { name: 'Kopi Tarik', qty: 1, price: 15000 },
      { name: 'Pisang Goreng Crispy', qty: 1, price: 15000 },
    ],
  },
  {
    id: 'WK-1016',
    orderNumber: 'WK-1016',
    customerName: 'Maya Indah',
    totalItem: 2,
    totalBayar: 28000,
    tanggalWaktu: '15 Sep 2026, 20:30',
    status: 'Selesai',
    paymentMethod: 'QRIS',
    items: [
      { name: 'Kopi O Dingin', qty: 1, price: 12000 },
      { name: 'Singkong Keju', qty: 1, price: 16000 },
    ],
  },
  // Page 2 Mock Data
  {
    id: 'WK-1015',
    orderNumber: 'WK-1015',
    customerName: 'Bagus Pratama',
    totalItem: 3,
    totalBayar: 45000,
    tanggalWaktu: '15 Sep 2026, 19:45',
    status: 'Selesai',
    paymentMethod: 'Cash',
    items: [
      { name: 'Mie Tumis Wong Kito', qty: 1, price: 22000 },
      { name: 'Kopi Susu Aren', qty: 1, price: 18000 },
      { name: 'Kerupuk Ikan Palembang', qty: 1, price: 5000 },
    ],
  },
  {
    id: 'WK-1014',
    orderNumber: 'WK-1014',
    customerName: 'Siti Rahma',
    totalItem: 2,
    totalBayar: 32000,
    tanggalWaktu: '15 Sep 2026, 18:20',
    status: 'Selesai',
    paymentMethod: 'QRIS',
    items: [
      { name: 'Pempek Kulit Crispy', qty: 2, price: 24000 },
      { name: 'Es Teh Manis', qty: 1, price: 8000 },
    ],
  },
  {
    id: 'WK-1013',
    orderNumber: 'WK-1013',
    customerName: 'Doni Saputra',
    totalItem: 1,
    totalBayar: 15000,
    tanggalWaktu: '15 Sep 2026, 17:10',
    status: 'Selesai',
    paymentMethod: 'Cash',
    items: [{ name: 'Kopi Hitam Robusta', qty: 1, price: 15000 }],
  },
  {
    id: 'WK-1012',
    orderNumber: 'WK-1012',
    customerName: 'Anisa Putri',
    totalItem: 2,
    totalBayar: 36000,
    tanggalWaktu: '15 Sep 2026, 16:05',
    status: 'Selesai',
    paymentMethod: 'QRIS',
    items: [
      { name: 'Kopi Susu Regal', qty: 1, price: 20000 },
      { name: 'Roti Bakar Keju', qty: 1, price: 16000 },
    ],
  },
  {
    id: 'WK-1011',
    orderNumber: 'WK-1011',
    customerName: 'Hendra Wijaya',
    totalItem: 3,
    totalBayar: 52000,
    tanggalWaktu: '15 Sep 2026, 15:00',
    status: 'Selesai',
    paymentMethod: 'Cash',
    items: [
      { name: 'Nasi Goreng Kampung', qty: 1, price: 25000 },
      { name: 'Telur Dadar', qty: 1, price: 7000 },
      { name: 'Es Jeruk Peras', qty: 1, price: 20000 },
    ],
  },
  // Page 3 Mock Data
  {
    id: 'WK-1010',
    orderNumber: 'WK-1010',
    customerName: 'Farhan Maulana',
    totalItem: 2,
    totalBayar: 34000,
    tanggalWaktu: '15 Sep 2026, 13:40',
    status: 'Selesai',
    paymentMethod: 'QRIS',
    items: [
      { name: 'Kopi Susu Pandan', qty: 1, price: 19000 },
      { name: 'Pisang Coklat Lumer', qty: 1, price: 15000 },
    ],
  },
  {
    id: 'WK-1009',
    orderNumber: 'WK-1009',
    customerName: 'Dewi Lestari',
    totalItem: 1,
    totalBayar: 20000,
    tanggalWaktu: '15 Sep 2026, 12:15',
    status: 'Selesai',
    paymentMethod: 'Cash',
    items: [{ name: 'Es Coklat Klasik', qty: 1, price: 20000 }],
  },
  {
    id: 'WK-1008',
    orderNumber: 'WK-1008',
    customerName: 'Rizky Ramadhan',
    totalItem: 4,
    totalBayar: 68000,
    tanggalWaktu: '15 Sep 2026, 11:30',
    status: 'Selesai',
    paymentMethod: 'QRIS',
    items: [
      { name: 'Pempek Campur Komplit', qty: 1, price: 35000 },
      { name: 'Kopi Susu Aren', qty: 2, price: 36000 },
    ],
  },
];

export const ReportsView: React.FC = () => {
  const { setShowReceiptModal, setLastCompletedOrder } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedOrder, setSelectedOrder] = useState<HistoryOrder | null>(null);

  const itemsPerPage = 5;

  // Filter based on search term
  const filteredOrders = INITIAL_HISTORY_ORDERS.filter((order) => {
    const matchId = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchName = order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchId || matchName;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const displayedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePrintReceipt = (order: HistoryOrder) => {
    setLastCompletedOrder({
      id: order.id,
      orderNumber: '#' + order.orderNumber,
      customerName: order.customerName,
      items: order.items.map((it, idx) => ({
        menuItem: {
          id: `${order.id}-${idx}`,
          name: it.name,
          category: 'kopi',
          price: it.price,
          costPrice: Math.round(it.price * 0.5),
          description: '',
          image: '',
          isAvailable: true,
          stock: 10,
        },
        quantity: it.qty,
      })),
      orderType: 'takeaway',
      subtotal: order.totalBayar,
      tax: 0,
      discount: 0,
      total: order.totalBayar,
      amountPaid: order.totalBayar,
      change: 0,
      paymentMethod: (order.paymentMethod.toLowerCase() === 'qris' ? 'qris' : 'cash') as any,
      paymentStatus: 'paid',
      status: order.status === 'Selesai' ? 'completed' : 'cancelled',
      createdAt: order.tanggalWaktu,
      cashierName: 'Budi (Kasir)',
    });
    setShowReceiptModal(true);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-black text-[#242424] tracking-tight uppercase">
          RIWAYAT
        </h1>
        <p className="text-xs md:text-sm text-[#737373] mt-1 font-normal italic">
          &ldquo;Arsip seluruh log transaksi pesanan dan log presensi operasional.&rdquo;
        </p>
      </div>

      {/* Tab: Riwayat Pesanan */}
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 px-3.5 py-1.5 rounded-[8px] border border-[#F47C0B]/60 bg-[#FFF7E8]/70 text-[#F47C0B] text-xs font-bold shadow-2xs">
          <Receipt className="w-3.5 h-3.5 text-[#F47C0B]" />
          <span>Riwayat Pesanan</span>
        </button>
      </div>

      {/* Search Input Box */}
      <div className="w-full">
        <div className="relative w-full bg-[#F5F5F4]/60 p-2 md:p-2.5 rounded-[10px] border border-[#E5E7EB]">
          <div className="relative w-full">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nomor order ID atau nama customer..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-[6px] text-xs text-[#242424] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#F47C0B] transition-all"
            />
            <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[10px] border border-[#E5E7EB] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F5F4] border-b border-[#E5E7EB] text-[#525252] text-[10px] md:text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4 md:px-5 font-bold">ORDER ID</th>
                <th className="py-3 px-4 md:px-5 font-bold">CUSTOMER</th>
                <th className="py-3 px-4 md:px-5 font-bold">TOTAL ITEM</th>
                <th className="py-3 px-4 md:px-5 font-bold">TOTAL BAYAR</th>
                <th className="py-3 px-4 md:px-5 font-bold">TANGGAL & WAKTU</th>
                <th className="py-3 px-4 md:px-5 font-bold text-center">STATUS</th>
                <th className="py-3 px-4 md:px-5 font-bold text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-xs">
              {displayedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-500 text-xs">
                    Tidak ada riwayat transaksi yang cocok dengan pencarian &ldquo;{searchTerm}&rdquo;.
                  </td>
                </tr>
              ) : (
                displayedOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-stone-50/70 transition-colors"
                  >
                    {/* Order ID */}
                    <td className="py-3.5 px-4 md:px-5 font-bold text-[#F47C0B]">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="hover:underline text-left cursor-pointer"
                      >
                        {order.orderNumber}
                      </button>
                    </td>

                    {/* Customer Name */}
                    <td className="py-3.5 px-4 md:px-5 font-medium text-[#242424]">
                      {order.customerName}
                    </td>

                    {/* Total Item */}
                    <td className="py-3.5 px-4 md:px-5 text-[#525252]">
                      {order.totalItem} {order.totalItem > 1 ? 'Items' : 'Item'}
                    </td>

                    {/* Total Bayar */}
                    <td className="py-3.5 px-4 md:px-5 font-semibold text-[#242424]">
                      {formatRupiah(order.totalBayar).replace(',00', '')}
                    </td>

                    {/* Tanggal & Waktu */}
                    <td className="py-3.5 px-4 md:px-5 text-[#737373] text-[11px]">
                      {order.tanggalWaktu}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 md:px-5 text-center">
                      {order.status === 'Selesai' ? (
                        <span className="inline-block border border-emerald-300 bg-emerald-50 text-emerald-600 rounded-[4px] px-2.5 py-0.5 text-[10px] md:text-[11px] font-semibold">
                          Selesai
                        </span>
                      ) : (
                        <span className="inline-block border border-red-300 bg-red-50 text-red-600 rounded-[4px] px-2.5 py-0.5 text-[10px] md:text-[11px] font-semibold">
                          Dibatalkan
                        </span>
                      )}
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 md:px-5 text-center">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="border border-[#D1D5DB] text-[#4B5563] hover:bg-stone-100 hover:text-[#242424] rounded-[4px] px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer"
                      >
                        DETAIL
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Footer & Pagination Card */}
      <div className="bg-white rounded-[10px] border border-[#E5E7EB] p-3.5 px-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#525252] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        {/* Left Stats */}
        <div className="flex items-center gap-3 text-[11px] md:text-xs font-medium flex-wrap">
          <span>
            Total Transaksi Selesai: <strong className="text-[#242424] font-bold">48 Pesanan</strong>
          </span>
          <span className="text-[#D1D5DB]">|</span>
          <span>
            Total Omzet: <strong className="text-[#242424] font-bold">Rp1.420.000</strong>
          </span>
        </div>

        {/* Right Pagination */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[#737373] mr-1 text-[11px]">Halaman</span>

          {[1, 2, 3].map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`px-2.5 py-1 rounded-[4px] text-xs font-bold transition-colors cursor-pointer ${
                currentPage === pageNum
                  ? 'bg-[#1C1C1E] text-white'
                  : 'border border-[#D1D5DB] text-[#525252] hover:bg-stone-50'
              }`}
            >
              {pageNum}
            </button>
          ))}
        </div>
      </div>

      {/* ORDER DETAIL MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[16px] max-w-md w-full p-5 md:p-6 shadow-xl border border-[#E5E7EB] space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F1EF]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-[#242424]">
                    Detail Pesanan #{selectedOrder.orderNumber}
                  </span>
                  {selectedOrder.status === 'Selesai' ? (
                    <span className="border border-emerald-300 bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-[4px]">
                      Selesai
                    </span>
                  ) : (
                    <span className="border border-red-300 bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-[4px]">
                      Dibatalkan
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#737373] mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {selectedOrder.tanggalWaktu}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-[#737373] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Payment Meta */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-stone-50 rounded-[8px] text-xs border border-[#E5E7EB]">
              <div>
                <span className="text-[10px] text-[#737373] block">Nama Pelanggan:</span>
                <span className="font-bold text-[#242424] flex items-center gap-1 mt-0.5">
                  <User className="w-3.5 h-3.5 text-[#F47C0B]" />
                  {selectedOrder.customerName}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#737373] block">Metode Pembayaran:</span>
                <span className="font-bold text-[#242424] mt-0.5 block uppercase">
                  {selectedOrder.paymentMethod}
                </span>
              </div>
            </div>

            {/* Itemized List */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#242424] flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-[#737373]" />
                Rincian Item ({selectedOrder.totalItem} Item):
              </span>
              <div className="border border-[#E5E7EB] rounded-[8px] p-3 space-y-2 max-h-48 overflow-y-auto">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-[#525252]">
                      {item.qty}x {item.name}
                    </span>
                    <span className="font-semibold text-[#242424]">
                      {formatRupiah(item.price * item.qty).replace(',00', '')}
                    </span>
                  </div>
                ))}

                {selectedOrder.notes && (
                  <div className="pt-2 border-t border-[#F1F1EF] text-[11px] text-red-500 italic">
                    Catatan: {selectedOrder.notes}
                  </div>
                )}
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center pt-2 border-t border-[#F1F1EF]">
              <span className="text-xs font-bold text-[#525252]">Total Tagihan:</span>
              <span className="text-base font-black text-[#F47C0B]">
                {formatRupiah(selectedOrder.totalBayar).replace(',00', '')}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  handlePrintReceipt(selectedOrder);
                  setSelectedOrder(null);
                }}
                className="flex-1 py-2 bg-[#1C1C1E] hover:bg-black text-white text-xs font-bold rounded-[8px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Ulang Struk</span>
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-[#525252] text-xs font-bold rounded-[8px] transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
