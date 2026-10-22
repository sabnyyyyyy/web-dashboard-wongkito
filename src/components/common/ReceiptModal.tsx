'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { formatRupiah, formatDateTime } from '@/utils/format';
import { Printer, Download, X, CheckCircle2, Coffee } from 'lucide-react';

export const ReceiptModal: React.FC = () => {
  const { showReceiptModal, setShowReceiptModal, lastCompletedOrder, settings } = useApp();

  if (!showReceiptModal || !lastCompletedOrder) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <span className="font-bold text-sm">Transaksi Berhasil!</span>
          </div>
          <button
            onClick={() => setShowReceiptModal(false)}
            className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Body (Printable area) */}
        <div className="p-6 overflow-y-auto flex-1 bg-stone-50 print:bg-white print:p-0">
          <div
            id="thermal-receipt"
            className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 text-neutral-800 text-xs font-mono max-w-[320px] mx-auto"
          >
            {/* Store Brand */}
            <div className="text-center border-b border-dashed border-neutral-300 pb-3 mb-3">
              <div className="flex justify-center mb-1">
                <Coffee className="w-5 h-5 text-amber-900" />
              </div>
              <h2 className="font-bold text-sm tracking-wide text-neutral-900 font-sans">
                {settings.storeName}
              </h2>
              <p className="text-[10px] text-neutral-500 mt-0.5 whitespace-pre-line leading-tight">
                {settings.address}
              </p>
              <p className="text-[10px] text-neutral-500">Telp: {settings.phone}</p>
            </div>

            {/* Order Meta */}
            <div className="space-y-1 text-[11px] border-b border-dashed border-neutral-300 pb-3 mb-3">
              <div className="flex justify-between">
                <span className="text-neutral-500">No. Nota:</span>
                <span className="font-semibold text-neutral-800">{lastCompletedOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Waktu:</span>
                <span>{formatDateTime(lastCompletedOrder.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Kasir / Staf:</span>
                <span>{lastCompletedOrder.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Pelanggan:</span>
                <span className="font-medium">{lastCompletedOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Tipe Pesanan:</span>
                <span className="uppercase font-semibold text-orange-700">
                  {lastCompletedOrder.orderType === 'dine_in'
                    ? `Dine-In (${lastCompletedOrder.tableNumber || 'Meja'})`
                    : lastCompletedOrder.orderType === 'takeaway'
                    ? 'Takeaway'
                    : 'Delivery'}
                </span>
              </div>
            </div>

            {/* Order Items Table */}
            <div className="border-b border-dashed border-neutral-300 pb-3 mb-3">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-stone-200 text-neutral-500">
                    <th className="pb-1 font-medium">Menu</th>
                    <th className="pb-1 text-center font-medium">Qty</th>
                    <th className="pb-1 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {lastCompletedOrder.items.map((ci, idx) => (
                    <tr key={idx} className="py-1">
                      <td className="py-1.5 pr-1">
                        <div className="font-semibold text-neutral-900 leading-snug">
                          {ci.menuItem.name}
                        </div>
                        <div className="text-[10px] text-neutral-500">
                          @ {formatRupiah(ci.menuItem.price)}
                        </div>
                        {ci.notes && (
                          <div className="text-[10px] text-amber-700 italic">
                            *{ci.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-1.5 text-center align-top font-bold">
                        {ci.quantity}
                      </td>
                      <td className="py-1.5 text-right align-top font-semibold">
                        {formatRupiah(ci.menuItem.price * ci.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations */}
            <div className="space-y-1.5 text-[11px] border-b border-dashed border-neutral-300 pb-3 mb-3">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal:</span>
                <span>{formatRupiah(lastCompletedOrder.subtotal)}</span>
              </div>
              {lastCompletedOrder.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Diskon Promo:</span>
                  <span>- {formatRupiah(lastCompletedOrder.discount)}</span>
                </div>
              )}
              {lastCompletedOrder.tax > 0 && (
                <div className="flex justify-between text-neutral-600">
                  <span>Pajak (PB1 10%):</span>
                  <span>{formatRupiah(lastCompletedOrder.tax)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-neutral-900 pt-1 border-t border-stone-200">
                <span>TOTAL:</span>
                <span className="text-[#F95700]">{formatRupiah(lastCompletedOrder.total)}</span>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="space-y-1 text-[11px] border-b border-dashed border-neutral-300 pb-3 mb-3">
              <div className="flex justify-between">
                <span className="text-neutral-500">Metode Bayar:</span>
                <span className="font-semibold uppercase">{lastCompletedOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Bayar (Diterima):</span>
                <span>{formatRupiah(lastCompletedOrder.amountPaid)}</span>
              </div>
              <div className="flex justify-between font-semibold text-neutral-900">
                <span className="text-neutral-500">Kembalian:</span>
                <span>{formatRupiah(lastCompletedOrder.change)}</span>
              </div>
            </div>

            {/* Footer / Wifi */}
            <div className="text-center text-[10px] text-neutral-500 space-y-1">
              <p className="whitespace-pre-line leading-relaxed font-sans">
                {settings.receiptFooter}
              </p>
              <p className="font-bold tracking-widest text-[9px] pt-1 text-neutral-400">
                *** LUNAS ***
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-stone-100 border-t border-stone-200 flex items-center justify-between gap-2">
          <button
            onClick={() => setShowReceiptModal(false)}
            className="px-4 py-2.5 bg-white border border-stone-300 text-stone-700 text-xs font-semibold rounded-xl hover:bg-stone-50 transition-colors"
          >
            Tutup
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-[#F95700] hover:bg-[#E04E00] text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Struk</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
