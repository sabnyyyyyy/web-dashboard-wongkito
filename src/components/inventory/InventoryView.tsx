'use client';

import React, { useState } from 'react';
import { playChime } from '@/utils/format';
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Plus,
  Save,
  ArrowLeft,
  X,
} from 'lucide-react';

interface StockRow {
  id: string;
  name: string;
  category: 'Bahan Utama' | 'Bahan Pembantu' | 'Kemasan';
  currentStock: number;
  unit: string;
  minStock: string;
  status: 'TERSEDIA' | 'MENIPIS' | 'HABIS';
}

const INITIAL_STOCK_ITEMS: StockRow[] = [
  {
    id: 'stk-1',
    name: 'Kopi Arabika Gayo',
    category: 'Bahan Utama',
    currentStock: 0,
    unit: 'Kg',
    minStock: '2 Kg',
    status: 'HABIS',
  },
  {
    id: 'stk-2',
    name: 'Fresh Milk',
    category: 'Bahan Utama',
    currentStock: 2,
    unit: 'Liter',
    minStock: '5 Liter',
    status: 'MENIPIS',
  },
  {
    id: 'stk-3',
    name: 'Gula Pasir Tebu',
    category: 'Bahan Pembantu',
    currentStock: 0,
    unit: 'Kg',
    minStock: '3 Kg',
    status: 'HABIS',
  },
  {
    id: 'stk-4',
    name: 'Kopi Robusta Lahat',
    category: 'Bahan Utama',
    currentStock: 8,
    unit: 'Kg',
    minStock: '3 Kg',
    status: 'TERSEDIA',
  },
  {
    id: 'stk-5',
    name: 'Susu Kental Manis',
    category: 'Bahan Utama',
    currentStock: 14,
    unit: 'Kaleng',
    minStock: '4 Kaleng',
    status: 'TERSEDIA',
  },
  {
    id: 'stk-6',
    name: 'Teh Celup Melati',
    category: 'Bahan Utama',
    currentStock: 5,
    unit: 'Pack',
    minStock: '2 Pack',
    status: 'TERSEDIA',
  },
];

export const InventoryView: React.FC = () => {
  const [stockList, setStockList] = useState<StockRow[]>(INITIAL_STOCK_ITEMS);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Update Stock Form View state
  const [isUpdateFormOpen, setIsUpdateFormOpen] = useState(false);
  const [selectedItemToEdit, setSelectedItemToEdit] = useState<StockRow | null>(null);

  // Form State matching screenshot
  const [formData, setFormData] = useState({
    name: 'Fresh Milk',
    category: 'Bahan Utama' as StockRow['category'],
    currentStock: 2,
    unit: 'Liter',
  });

  // Check if opened from notification or external action
  React.useEffect(() => {
    const itemToEdit = localStorage.getItem('open_update_stock_item');
    if (itemToEdit) {
      localStorage.removeItem('open_update_stock_item');
      const found = stockList.find((s) => s.name.toLowerCase().includes(itemToEdit.toLowerCase()));
      if (found) {
        setSelectedItemToEdit(found);
        setFormData({
          name: found.name,
          category: found.category,
          currentStock: found.currentStock,
          unit: found.unit,
        });
      }
      setIsUpdateFormOpen(true);
    }
  }, [stockList]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleOpenUpdateForm = (item?: StockRow) => {
    if (item) {
      setSelectedItemToEdit(item);
      setFormData({
        name: item.name,
        category: item.category,
        currentStock: item.currentStock,
        unit: item.unit,
      });
    } else {
      // Default to Fresh Milk matching screenshot
      const freshMilk = stockList.find((s) => s.name.toLowerCase().includes('fresh milk'));
      if (freshMilk) {
        setSelectedItemToEdit(freshMilk);
        setFormData({
          name: freshMilk.name,
          category: freshMilk.category,
          currentStock: freshMilk.currentStock,
          unit: freshMilk.unit,
        });
      } else {
        setSelectedItemToEdit(null);
        setFormData({
          name: 'Fresh Milk',
          category: 'Bahan Utama',
          currentStock: 2,
          unit: 'Liter',
        });
      }
    }
    setIsUpdateFormOpen(true);
  };

  const handleSaveStock = (e: React.FormEvent) => {
    e.preventDefault();

    let newStatus: StockRow['status'] = 'TERSEDIA';
    if (formData.currentStock === 0) newStatus = 'HABIS';
    else if (formData.currentStock <= 5) newStatus = 'MENIPIS';

    if (selectedItemToEdit) {
      // Update existing item
      setStockList((prev) =>
        prev.map((item) =>
          item.id === selectedItemToEdit.id
            ? {
                ...item,
                name: formData.name,
                category: formData.category,
                currentStock: formData.currentStock,
                unit: formData.unit,
                status: newStatus,
              }
            : item
        )
      );
      showToast(`Stok "${formData.name}" berhasil diperbarui!`);
    } else {
      // Create or update by name
      const existing = stockList.find(
        (s) => s.name.toLowerCase() === formData.name.toLowerCase()
      );
      if (existing) {
        setStockList((prev) =>
          prev.map((item) =>
            item.id === existing.id
              ? {
                  ...item,
                  category: formData.category,
                  currentStock: formData.currentStock,
                  unit: formData.unit,
                  status: newStatus,
                }
              : item
          )
        );
        showToast(`Stok "${formData.name}" berhasil diperbarui!`);
      } else {
        const newItem: StockRow = {
          id: 'stk-' + Date.now(),
          name: formData.name,
          category: formData.category,
          currentStock: formData.currentStock,
          unit: formData.unit,
          minStock: `5 ${formData.unit}`,
          status: newStatus,
        };
        setStockList((prev) => [newItem, ...prev]);
        showToast(`Item "${formData.name}" berhasil ditambahkan!`);
      }
    }

    playChime('success');
    setIsUpdateFormOpen(false);
  };

  const filteredItems = stockList.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats calculation
  const totalItemsCount = 28;
  const tersediaCount = stockList.filter((s) => s.status === 'TERSEDIA').length + 18;
  const menipisCount = stockList.filter((s) => s.status === 'MENIPIS').length + 3;
  const habisCount = stockList.filter((s) => s.status === 'HABIS').length + 1;

  // RENDER UPDATE STOK FORM (Matching user screenshot)
  if (isUpdateFormOpen) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Header matching screenshot */}
        <div>
          <h1 className="text-xl md:text-2xl font-black text-[#242424] tracking-tight uppercase">
            UPDATE STOK
          </h1>
          <p className="text-xs md:text-sm text-[#737373] mt-1 font-normal">
            Masukkan data pembaruan kuantitas dan spesifikasi bahan baku.
          </p>
        </div>

        {/* Card Form container matching screenshot */}
        <div className="bg-[#FAFAF9] rounded-[16px] border border-[#E5E7EB] p-6 md:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <form onSubmit={handleSaveStock} className="space-y-5">
            {/* Nama Barang * */}
            <div>
              <label className="block text-xs font-bold text-[#374151] mb-2">
                Nama Barang <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Fresh Milk"
                className="w-full px-3.5 py-2.5 bg-white border border-[#D1D5DB] rounded-[6px] text-xs text-[#242424] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#F47C0B] transition-all"
              />
            </div>

            {/* Kategori * */}
            <div>
              <label className="block text-xs font-bold text-[#374151] mb-2">
                Kategori <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as StockRow['category'] })
                  }
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D1D5DB] rounded-[6px] text-xs text-[#242424] focus:outline-none focus:border-[#F47C0B] transition-all appearance-none cursor-pointer"
                >
                  <option value="Bahan Utama">Bahan Utama</option>
                  <option value="Bahan Pembantu">Bahan Pembantu</option>
                  <option value="Kemasan">Kemasan</option>
                </select>
                <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#737373] text-[10px]">
                  ▼
                </div>
              </div>
            </div>

            {/* Grid 2 Kolom: Jumlah Stok Saat Ini * & Satuan * */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#374151] mb-2">
                  Jumlah Stok Saat Ini <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.currentStock}
                  onChange={(e) =>
                    setFormData({ ...formData, currentStock: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D1D5DB] rounded-[6px] text-xs text-[#242424] focus:outline-none focus:border-[#F47C0B] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] mb-2">
                  Satuan <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D1D5DB] rounded-[6px] text-xs text-[#242424] focus:outline-none focus:border-[#F47C0B] transition-all appearance-none cursor-pointer"
                  >
                    <option value="Liter">Liter</option>
                    <option value="Kg">Kg</option>
                    <option value="Kaleng">Kaleng</option>
                    <option value="Pack">Pack</option>
                    <option value="Pcs">Pcs</option>
                    <option value="Botol">Botol</option>
                    <option value="Gram">Gram</option>
                  </select>
                  <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#737373] text-[10px]">
                    ▼
                  </div>
                </div>
              </div>
            </div>

            {/* Divider line matching screenshot */}
            <div className="w-full h-px bg-[#E5E7EB] pt-1" />

            {/* Buttons: Simpan Stok & Batal */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#F47C0B] hover:bg-[#EA580C] text-white font-bold text-xs rounded-[8px] flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
              >
                <Save className="w-4 h-4 text-white" />
                <span>Simpan Stok</span>
              </button>

              <button
                type="button"
                onClick={() => setIsUpdateFormOpen(false)}
                className="px-5 py-2.5 bg-white hover:bg-stone-50 border border-[#D1D5DB] text-[#525252] font-semibold text-xs rounded-[8px] transition-all cursor-pointer"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // RENDER STOCK TABLE VIEW
  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-[#242424] tracking-tight uppercase">
            STOK
          </h1>
          <p className="text-xs text-[#525252] mt-0.5">
            Manajemen ketersediaan bahan baku dan inventaris warkop.
          </p>
        </div>

        <button
          onClick={() => handleOpenUpdateForm()}
          className="px-4 py-2.5 bg-[#F47C0B] hover:bg-[#EA580C] text-white font-bold text-xs rounded-[8px] shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" />
          <span>+ UPDATE STOK</span>
        </button>
      </div>

      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-[8px] flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL ITEM */}
        <div className="bg-white rounded-[12px] p-4 md:p-5 border border-[#F1F1EF] wkm-card-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">
              TOTAL ITEM
            </span>
            <Package className="w-4 h-4 text-[#737373]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl md:text-3xl font-black text-[#242424]">
              {totalItemsCount}
            </span>
            <span className="text-xs font-semibold text-[#737373] ml-1.5">Item</span>
          </div>
        </div>

        {/* TERSEDIA */}
        <div className="bg-white rounded-[12px] p-4 md:p-5 border border-[#F1F1EF] wkm-card-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">
              TERSEDIA
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl md:text-3xl font-black text-[#242424]">
              {tersediaCount}
            </span>
            <span className="text-xs font-semibold text-[#737373] ml-1.5">Item</span>
          </div>
        </div>

        {/* MENIPIS */}
        <div className="bg-white rounded-[12px] p-4 md:p-5 border-2 border-blue-400 wkm-card-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
              MENIPIS
            </span>
            <AlertTriangle className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl md:text-3xl font-black text-[#242424]">
              {menipisCount}
            </span>
            <span className="text-xs font-semibold text-[#737373] ml-1.5">Item</span>
          </div>
        </div>

        {/* HABIS */}
        <div className="bg-white rounded-[12px] p-4 md:p-5 border-2 border-red-400 wkm-card-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">
              HABIS
            </span>
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl md:text-3xl font-black text-[#242424]">
              {habisCount}
            </span>
            <span className="text-xs font-semibold text-[#737373] ml-1.5">Item</span>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative w-full">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama barang"
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E5E7EB] rounded-[8px] text-xs text-[#242424] placeholder:text-[#737373] focus:outline-none focus:border-[#F47C0B]"
        />
        <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
      </div>

      {/* Main Stock Table */}
      <div className="bg-white rounded-[16px] border border-[#E5E7EB] wkm-card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAF7F2] text-[#737373] font-bold uppercase text-[10px] tracking-wider border-b border-[#E5E7EB]">
                <th className="py-3 px-4">ITEM</th>
                <th className="py-3 px-4">KATEGORI</th>
                <th className="py-3 px-4 text-center">STOK SAAT INI</th>
                <th className="py-3 px-4">SATUAN</th>
                <th className="py-3 px-4">BATAS MINIMUM</th>
                <th className="py-3 px-4 text-center">STATUS</th>
                <th className="py-3 px-4 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredItems.map((row) => (
                <tr key={row.id} className="hover:bg-[#FAFAF9] transition-colors">
                  {/* ITEM */}
                  <td className="py-3.5 px-4 font-bold text-[#242424]">
                    {row.name}
                  </td>

                  {/* KATEGORI */}
                  <td className="py-3.5 px-4 text-[#525252]">
                    {row.category}
                  </td>

                  {/* STOK SAAT INI */}
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`text-sm font-black ${
                        row.status === 'HABIS'
                          ? 'text-red-600'
                          : row.status === 'MENIPIS'
                          ? 'text-blue-600'
                          : 'text-[#242424]'
                      }`}
                    >
                      {row.currentStock}
                    </span>
                  </td>

                  {/* SATUAN */}
                  <td className="py-3.5 px-4 text-[#525252]">
                    {row.unit}
                  </td>

                  {/* BATAS MINIMUM */}
                  <td className="py-3.5 px-4 text-[#525252]">
                    {row.minStock}
                  </td>

                  {/* STATUS */}
                  <td className="py-3.5 px-4 text-center">
                    {row.status === 'HABIS' ? (
                      <span className="px-2.5 py-0.5 rounded-[20px] text-[10px] font-bold text-red-600 bg-red-50 border border-red-200">
                        HABIS
                      </span>
                    ) : row.status === 'MENIPIS' ? (
                      <span className="px-2.5 py-0.5 rounded-[20px] text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200">
                        MENIPIS
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-[20px] text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                        TERSEDIA
                      </span>
                    )}
                  </td>

                  {/* AKSI */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleOpenUpdateForm(row)}
                        className="px-3 py-1 bg-white hover:bg-[#F1F1EF] border border-[#D1D5DB] text-[#525252] hover:text-[#242424] font-bold text-xs rounded-[6px] transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleOpenUpdateForm(row)}
                        className="px-2.5 py-1 bg-[#242424] hover:bg-black text-white font-bold text-xs rounded-[6px] transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Stok</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI STOCK INSIGHT Box */}
      <div className="bg-white rounded-[16px] p-5 border border-[#E5E7EB] wkm-card-shadow space-y-2">
        <div className="flex items-center gap-1.5 text-blue-600 text-xs font-bold uppercase tracking-wider">
          <span>★</span>
          <span>AI STOCK INSIGHT</span>
        </div>
        <p className="text-xs text-[#525252] leading-relaxed">
          <strong className="text-[#242424]">AI Stock Insight:</strong> Fresh Milk dan Gula berada di bawah batas minimum pemakaian mingguan. Diprediksi habis sebelum sesi malam pukul 19:00. Disarankan membuat Purchase Order ke supplier sekarang.
        </p>
      </div>
    </div>
  );
};
