'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Clock } from 'lucide-react';

export interface NotificationItem {
  id: string;
  category: 'order' | 'stock' | 'system';
  boxLabel: string;
  boxType: 'order' | 'stock' | 'ready' | 'system';
  title: string;
  badge: {
    label: string;
    variant: 'baru' | 'kritis' | 'selesai' | 'audit';
  };
  description: string;
  time: string;
  action: {
    label: string;
    variant: 'primary' | 'danger-outline' | 'neutral-outline' | 'disabled';
    targetTab?: 'orders' | 'inventory';
  };
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    category: 'order',
    boxLabel: 'Order',
    boxType: 'order',
    title: 'Pesanan Baru Masuk',
    badge: {
      label: 'BARU',
      variant: 'baru',
    },
    description: 'Pesanan baru #WK-001 telah masuk (Americano x1 - Take Away).',
    time: '2 menit yang lalu',
    action: {
      label: 'BUKA PESANAN',
      variant: 'primary',
      targetTab: 'orders',
    },
  },
  {
    id: 'notif-2',
    category: 'stock',
    boxLabel: 'Stok',
    boxType: 'stock',
    title: 'Peringatan Stok Menipis',
    badge: {
      label: 'KRITIS',
      variant: 'kritis',
    },
    description: 'Stok Fresh Milk berada di bawah batas minimum (Tersisa: 2 Liter, Min: 5 Liter).',
    time: '15 menit yang lalu',
    action: {
      label: 'UPDATE STOK',
      variant: 'danger-outline',
      targetTab: 'inventory',
    },
  },
  {
    id: 'notif-3',
    category: 'order',
    boxLabel: 'Ready',
    boxType: 'ready',
    title: 'Pesanan Siap Diambil',
    badge: {
      label: 'SELESAI',
      variant: 'selesai',
    },
    description: 'Pesanan #WK-002 siap diambil di counter pick-up.',
    time: '35 menit yang lalu',
    action: {
      label: 'LIHAT DETAIL',
      variant: 'neutral-outline',
      targetTab: 'orders',
    },
  },
  {
    id: 'notif-4',
    category: 'system',
    boxLabel: 'Sistem',
    boxType: 'system',
    title: 'Update Stok Berhasil',
    badge: {
      label: 'AUDIT',
      variant: 'audit',
    },
    description: 'Update stok berhasil dilakukan oleh Budi untuk item Kopi Robusta (+5 Kg).',
    time: '1 jam yang lalu',
    action: {
      label: 'LOG RECORDED',
      variant: 'disabled',
    },
  },
];

type FilterType = 'all' | 'order' | 'stock' | 'system';

export const NotificationsView: React.FC = () => {
  const { setActiveTab } = useApp();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  const orderCount = DEFAULT_NOTIFICATIONS.filter((n) => n.category === 'order').length;
  const stockCount = DEFAULT_NOTIFICATIONS.filter((n) => n.category === 'stock').length;
  const systemCount = DEFAULT_NOTIFICATIONS.filter((n) => n.category === 'system').length;
  const totalCount = DEFAULT_NOTIFICATIONS.length;

  const filteredNotifications = DEFAULT_NOTIFICATIONS.filter((item) => {
    if (activeFilter === 'all') return true;
    return item.category === activeFilter;
  });

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage) || 1;
  const displayedNotifications = filteredNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleActionClick = (item: NotificationItem) => {
    if (item.action.targetTab === 'inventory') {
      localStorage.setItem('open_update_stock_item', 'Fresh Milk');
      setActiveTab('inventory');
    } else if (item.action.targetTab) {
      setActiveTab(item.action.targetTab);
    }
  };

  const getLeftBorderColor = (boxType: NotificationItem['boxType']) => {
    switch (boxType) {
      case 'order':
        return 'border-l-[4px] border-l-[#F59E0B]';
      case 'stock':
        return 'border-l-[4px] border-l-[#EF4444]';
      case 'ready':
      case 'system':
      default:
        return 'border-l-[4px] border-l-[#D1D5DB]';
    }
  };

  const getBoxStyle = (boxType: NotificationItem['boxType']) => {
    switch (boxType) {
      case 'order':
        return 'border-[#E5E7EB] bg-stone-50 text-[#D97706]';
      case 'stock':
        return 'border-red-200 bg-red-50/60 text-[#DC2626]';
      case 'ready':
      case 'system':
      default:
        return 'border-[#E5E7EB] bg-stone-50 text-[#737373]';
    }
  };

  const getBadgeStyle = (variant: NotificationItem['badge']['variant']) => {
    switch (variant) {
      case 'baru':
        return 'bg-[#F59E0B] text-white';
      case 'kritis':
        return 'bg-[#DC2626] text-white';
      case 'selesai':
        return 'bg-[#D1D5DB] text-[#374151]';
      case 'audit':
        return 'bg-[#E5E7EB] text-[#4B5563]';
      default:
        return 'bg-stone-200 text-stone-700';
    }
  };

  const renderActionButton = (item: NotificationItem) => {
    const { action } = item;

    switch (action.variant) {
      case 'primary':
        return (
          <button
            onClick={() => handleActionClick(item)}
            className="w-full sm:w-auto px-5 py-2 bg-[#1C1C1E] hover:bg-black text-white text-[11px] font-bold rounded-full tracking-wider uppercase transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            {action.label}
          </button>
        );
      case 'danger-outline':
        return (
          <button
            onClick={() => handleActionClick(item)}
            className="w-full sm:w-auto px-5 py-2 border border-[#DC2626] text-[#DC2626] hover:bg-red-50 text-[11px] font-bold rounded-full tracking-wider uppercase transition-colors cursor-pointer shrink-0"
          >
            {action.label}
          </button>
        );
      case 'neutral-outline':
        return (
          <button
            onClick={() => handleActionClick(item)}
            className="w-full sm:w-auto px-5 py-2 border border-[#D1D5DB] text-[#4B5563] hover:bg-stone-50 text-[11px] font-bold rounded-full tracking-wider uppercase transition-colors cursor-pointer shrink-0"
          >
            {action.label}
          </button>
        );
      case 'disabled':
      default:
        return (
          <div className="w-full sm:w-auto px-5 py-2 border border-[#E5E7EB] text-[#9CA3AF] text-[11px] font-bold rounded-full tracking-wider uppercase select-none shrink-0 text-center">
            {action.label}
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-xl md:text-2xl font-black text-[#242424] tracking-tight uppercase">
          NOTIFIKASI
        </h1>
        <p className="text-xs md:text-sm text-[#737373] mt-1 font-normal">
          Pemberitahuan aktivitas pesanan baru, peringatan stok, dan sistem.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            setActiveFilter('all');
            setCurrentPage(1);
          }}
          className={`px-4 py-1.5 rounded-[6px] text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-[#1C1C1E] text-white shadow-xs'
              : 'bg-[#F5F5F4] text-[#525252] border border-[#E5E5E5] hover:bg-[#EAEAEA]'
          }`}
        >
          Semua ({totalCount})
        </button>

        <button
          onClick={() => {
            setActiveFilter('order');
            setCurrentPage(1);
          }}
          className={`px-4 py-1.5 rounded-[6px] text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'order'
              ? 'bg-[#1C1C1E] text-white shadow-xs'
              : 'bg-[#F5F5F4] text-[#525252] border border-[#E5E5E5] hover:bg-[#EAEAEA]'
          }`}
        >
          Pesanan ({orderCount})
        </button>

        <button
          onClick={() => {
            setActiveFilter('stock');
            setCurrentPage(1);
          }}
          className={`px-4 py-1.5 rounded-[6px] text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'stock'
              ? 'bg-[#1C1C1E] text-white shadow-xs'
              : 'bg-[#F5F5F4] text-[#525252] border border-[#E5E5E5] hover:bg-[#EAEAEA]'
          }`}
        >
          Stok ({stockCount})
        </button>

        <button
          onClick={() => {
            setActiveFilter('system');
            setCurrentPage(1);
          }}
          className={`px-4 py-1.5 rounded-[6px] text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'system'
              ? 'bg-[#1C1C1E] text-white shadow-xs'
              : 'bg-[#F5F5F4] text-[#525252] border border-[#E5E5E5] hover:bg-[#EAEAEA]'
          }`}
        >
          Sistem ({systemCount})
        </button>
      </div>

      {/* Notification Cards List */}
      <div className="space-y-3.5">
        {displayedNotifications.length === 0 ? (
          <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-8 text-center">
            <p className="text-xs text-[#737373] font-medium">Tidak ada notifikasi pada kategori ini.</p>
          </div>
        ) : (
          displayedNotifications.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-[8px] md:rounded-[10px] border border-[#E5E7EB] p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-xs hover:border-stone-300 ${getLeftBorderColor(
                item.boxType
              )}`}
            >
              {/* Left Group: Box Badge + Information */}
              <div className="flex items-start sm:items-center gap-4">
                {/* Category Square Box */}
                <div
                  className={`w-11 h-11 md:w-12 md:h-12 rounded-[6px] border flex items-center justify-center shrink-0 font-medium text-xs ${getBoxStyle(
                    item.boxType
                  )}`}
                >
                  {item.boxLabel}
                </div>

                {/* Details */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-xs md:text-sm text-[#242424] leading-tight">
                      {item.title}
                    </h2>
                    <span
                      className={`text-[9px] md:text-[10px] font-black px-1.5 py-0.5 rounded tracking-wider uppercase leading-none ${getBadgeStyle(
                        item.badge.variant
                      )}`}
                    >
                      {item.badge.label}
                    </span>
                  </div>

                  <p className="text-xs text-[#525252] leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-1.5 text-[11px] text-[#737373] pt-0.5">
                    <Clock className="w-3.5 h-3.5 text-[#737373]" />
                    <span>{item.time}</span>
                  </div>
                </div>
              </div>

              {/* Right Action Button */}
              <div className="pt-2 sm:pt-0 sm:pl-4 self-end sm:self-center w-full sm:w-auto">
                {renderActionButton(item)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center gap-1.5 pt-2">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          className="px-3 py-1 bg-[#EAEAEA] hover:bg-[#DFDFDF] disabled:opacity-40 disabled:cursor-not-allowed text-[#525252] text-xs font-bold rounded-[4px] border border-[#D4D4D4] transition-colors cursor-pointer"
        >
          PREV
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => setCurrentPage(pageNum)}
            className={`px-3 py-1 text-xs font-bold rounded-[4px] transition-colors cursor-pointer ${
              currentPage === pageNum
                ? 'bg-[#1C1C1E] text-white'
                : 'bg-[#EAEAEA] text-[#525252] border border-[#D4D4D4] hover:bg-[#DFDFDF]'
            }`}
          >
            {pageNum}
          </button>
        ))}

        <button
          disabled={currentPage >= totalPages}
          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
          className="px-3 py-1 bg-[#EAEAEA] hover:bg-[#DFDFDF] disabled:opacity-40 disabled:cursor-not-allowed text-[#525252] text-xs font-bold rounded-[4px] border border-[#D4D4D4] transition-colors cursor-pointer"
        >
          NEXT
        </button>
      </div>
    </div>
  );
};
