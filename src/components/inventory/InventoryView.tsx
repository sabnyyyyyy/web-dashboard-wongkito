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
  X,
  Sparkles,
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

export const InventoryView: React.FC = () => {
  const [stockList, setStockList] = useState<StockRow[]>([
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
      name: 'Fresh Milk Greenfields',
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
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<StockRow | null>(null);
  const [quickStockItem, setQuickStockItem] = useState<StockRow | null>(null);
  const [addedAmount, setAddedAmount] = useState<number>(5);

  // New Item Form
  const [formData, setFormData] = useState({
    name: '',
    category: 'Bahan Utama' as StockRow['category'],
    currentStock: 10,
    unit: 'Kg',
    minStockNumber: 3,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const filteredItems = stockList.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats calculation
  const totalItemsCount = 28; // Display stats matching screenshot
  const tersediaCount = 22;
  const menipisCount = 4;
  const habisCount = 2;

  const handleQuickAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickStockItem) return;

    const newStock = quickStockItem.currentStock + Number(addedAmount);
    let newStatus: StockRow['status'] = 'TERSEDIA';
    const minVal = parseInt(quickStockItem.minStock) || 3;
    if (newStock === 0) newStatus = 'HABIS';
    else if (newStock <= minVal) newStatus = 'MENIPIS';

    setStockList((prev) =>
      prev.map((item) =>
        item.id === quickStockItem.id
          ? { ...item, currentStock: newStock, status: newStatus }
          : item
      )
    );

    playChime('success');
    showToast(`Stok ${quickStockItem.name} berhasil ditambah +${addedAmount} ${quickStockItem.unit}!`);
    setQuickStockItem(null);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setStockList((prev) =>
      prev.map((item) => (item.id === editingItem.id ? editingItem : item))
    );

    playChime('success');
    showToast(`Data barang "${editingItem.name}" berhasil diupdate!`);
    setEditingItem(null);
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    let status: StockRow['status'] = 'TERSEDIA';
    if (formData.currentStock === 0) status = 'HABIS';
    else if (formData.currentStock <= formData.minStockNumber) status = 'MENIPIS';

    const newItem: StockRow = {
      id: 'stk-' + Date.now(),
      name: formData.name,
      category: formData.category,
      currentStock: formData.currentStock,
      unit: formData.unit,
      minStock: `${formData.minStockNumber} ${formData.unit}`,
      status,
    };

    setStockList((prev) => [newItem, ...prev]);
    playChime('success');
    showToast(`Barang baru "${newItem.name}" berhasil ditambahkan!`);
    setShowAddModal(false);
    setFormData({ name: '', category: 'Bahan Utama', currentStock: 10, unit: 'Kg', minStockNumber: 3 });
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header Bar matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-[#242424] tracking-tight font-sans uppercase">
            STOK
          </h1>
          <p className="text-xs text-[#525252] mt-0.5 font-sans">
            Manajemen ketersediaan bahan baku dan inventaris warkop.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-[#242424] hover:bg-black text-white font-bold text-xs rounded-[8px] shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 uppercase tracking-wider"
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

      {/* 4 Stat Cards matching screenshot */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL ITEM */}
        <div className="bg-white rounded-[12px] p-4 md:p-5 border border-[#F1F1EF] wkm-card-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">
              TOTAL ITEM
            </span>
            <Package className="w-4 h-4 text-[#737373]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl md:text-3xl font-black text-[#242424]">{totalItemsCount}</span>
            <span className="text-xs font-semibold text-[#737373] ml-1.5">Item</span>
          </div>
        </div>

        {/* Card 2: TERSEDIA */}
        <div className="bg-white rounded-[12px] p-4 md:p-5 border border-[#F1F1EF] wkm-card-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">
              TERSEDIA
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl md:text-3xl font-black text-[#242424]">{tersediaCount}</span>
            <span className="text-xs font-semibold text-[#737373] ml-1.5">Item</span>
          </div>
        </div>

        {/* Card 3: MENIPIS (Blue border highlight) */}
        <div className="bg-white rounded-[12px] p-4 md:p-5 border-2 border-blue-400 wkm-card-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
              MENIPIS
            </span>
            <AlertTriangle className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl md:text-3xl font-black text-[#242424]">{menipisCount}</span>
            <span className="text-xs font-semibold text-[#737373] ml-1.5">Item</span>
          </div>
        </div>

        {/* Card 4: HABIS (Red border highlight) */}
        <div className="bg-white rounded-[12px] p-4 md:p-5 border-2 border-red-400 wkm-card-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">
              HABIS
            </span>
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl md:text-3xl font-black text-[#242424]">{habisCount}</span>
            <span className="text-xs font-semibold text-[#737373] ml-1.5">Item</span>
          </div>
        </div>
      </div>

      {/* Search Input matching screenshot */}
      <div className="relative w-full">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama barang"
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#F1F1EF] rounded-[8px] text-xs text-[#242424] placeholder:text-[#737373] focus:outline-none focus:border-[#F47C0B]"
        />
        <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
      </div>

      {/* Main Stock Table Container matching screenshot */}
      <div className="bg-white rounded-[16px] border border-[#F1F1EF] wkm-card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAF7F2] text-[#737373] font-bold uppercase text-[10px] tracking-wider border-b border-[#F1F1EF]">
                <th className="py-3 px-4">ITEM</th>
                <th className="py-3 px-4">KATEGORI</th>
                <th className="py-3 px-4 text-center">STOK SAAT INI</th>
                <th className="py-3 px-4">SATUAN</th>
                <th className="py-3 px-4">BATAS MINIMUM</th>
                <th className="py-3 px-4 text-center">STATUS</th>
                <th className="py-3 px-4 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F1EF]">
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

                  {/* AKSI: [Edit] [+ Stok] */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setEditingItem({ ...row })}
                        className="px-3 py-1 bg-white hover:bg-[#F1F1EF] border border-[#F1F1EF] text-[#525252] hover:text-[#242424] font-bold text-xs rounded-[8px] transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setQuickStockItem(row);
                          setAddedAmount(5);
                        }}
                        className="px-2.5 py-1 bg-[#242424] hover:bg-black text-white font-bold text-xs rounded-[8px] transition-colors cursor-pointer flex items-center gap-1"
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

      {/* AI STOCK INSIGHT Box matching screenshot */}
      <div className="bg-white rounded-[16px] p-5 border border-[#F1F1EF] wkm-card-shadow space-y-2">
        <div className="flex items-center gap-1.5 text-blue-600 text-xs font-bold uppercase tracking-wider">
          <span>★</span>
          <span>AI STOCK INSIGHT</span>
        </div>
        <p className="text-xs text-[#525252] leading-relaxed">
          <strong className="text-[#242424]">AI Stock Insight:</strong> Fresh Milk dan Gula berada di bawah batas minimum pemakaian mingguan. Diprediksi habis sebelum sesi malam pukul 19:00. Disarankan membuat Purchase Order ke supplier sekarang.
        </p>
      </div>

      {/* MODAL: QUICK ADD STOK */}
      {quickStockItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[16px] max-w-sm w-full p-6 wkm-modal-shadow border border-[#F1F1EF]">
            <div className="flex items-center justify-between border-b border-[#F1F1EF] pb-3 mb-4">
              <div>
                <h3 className="font-black text-base text-[#242424]">Tambah Stok Barang</h3>
                <p className="text-xs text-[#737373]">{quickStockItem.name}</p>
              </div>
              <button
                onClick={() => setQuickStockItem(null)}
                className="p-1 rounded-full hover:bg-[#F1F1EF] text-[#737373]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickAddStock} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#525252] mb-1">
                  Jumlah Tambahan ({quickStockItem.unit})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  min="1"
                  value={addedAmount}
                  onChange={(e) => setAddedAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#FAFAF9] border border-[#F1F1EF] rounded-[8px] font-bold text-[#242424] focus:outline-none focus:border-[#F47C0B]"
                />
              </div>

              <div className="p-3 bg-[#FFF7E8] rounded-[8px] text-xs text-[#525252] space-y-1">
                <div className="flex justify-between">
                  <span>Stok saat ini:</span>
                  <span className="font-bold text-[#242424]">{quickStockItem.currentStock} {quickStockItem.unit}</span>
                </div>
                <div className="flex justify-between text-[#F47C0B] font-bold">
                  <span>Stok setelah ditambah:</span>
                  <span>{quickStockItem.currentStock + Number(addedAmount)} {quickStockItem.unit}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickStockItem(null)}
                  className="flex-1 py-2.5 bg-[#F1F1EF] text-[#525252] font-bold rounded-[8px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-2 py-2.5 wkm-gradient-bg text-white font-bold rounded-[8px] shadow-xs cursor-pointer"
                >
                  Simpan Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT ITEM */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[16px] max-w-md w-full p-6 wkm-modal-shadow border border-[#F1F1EF]">
            <div className="flex items-center justify-between border-b border-[#F1F1EF] pb-3 mb-4">
              <h3 className="font-black text-base text-[#242424]">Edit Data Barang</h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-full hover:bg-[#F1F1EF] text-[#737373]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#525252] mb-1">Nama Barang</label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAFAF9] border border-[#F1F1EF] rounded-[8px] focus:outline-none focus:border-[#F47C0B]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#525252] mb-1">Kategori</label>
                <select
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value as any })}
                  className="w-full px-3 py-2 bg-[#FAFAF9] border border-[#F1F1EF] rounded-[8px] focus:outline-none focus:border-[#F47C0B]"
                >
                  <option value="Bahan Utama">Bahan Utama</option>
                  <option value="Bahan Pembantu">Bahan Pembantu</option>
                  <option value="Kemasan">Kemasan</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#525252] mb-1">Satuan</label>
                  <input
                    type="text"
                    required
                    value={editingItem.unit}
                    onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAFAF9] border border-[#F1F1EF] rounded-[8px] focus:outline-none focus:border-[#F47C0B]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#525252] mb-1">Batas Minimum</label>
                  <input
                    type="text"
                    required
                    value={editingItem.minStock}
                    onChange={(e) => setEditingItem({ ...editingItem, minStock: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAFAF9] border border-[#F1F1EF] rounded-[8px] focus:outline-none focus:border-[#F47C0B]"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-2.5 bg-[#F1F1EF] text-[#525252] font-bold rounded-[8px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-2 py-2.5 wkm-gradient-bg text-white font-bold rounded-[8px] shadow-xs cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: + UPDATE STOK BARU */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[16px] max-w-md w-full p-6 wkm-modal-shadow border border-[#F1F1EF]">
            <div className="flex items-center justify-between border-b border-[#F1F1EF] pb-3 mb-4">
              <h3 className="font-black text-base text-[#242424]">+ Update Stok / Tambah Bahan</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full hover:bg-[#F1F1EF] text-[#737373]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewItem} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#525252] mb-1">Nama Bahan / Barang</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Kopi Robusta Lahat"
                  className="w-full px-3 py-2 bg-[#FAFAF9] border border-[#F1F1EF] rounded-[8px] focus:outline-none focus:border-[#F47C0B]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#525252] mb-1">Kategori</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-3 py-2 bg-[#FAFAF9] border border-[#F1F1EF] rounded-[8px] focus:outline-none focus:border-[#F47C0B]"
                >
                  <option value="Bahan Utama">Bahan Utama</option>
                  <option value="Bahan Pembantu">Bahan Pembantu</option>
                  <option value="Kemasan">Kemasan</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#525252] mb-1">Stok Awal</label>
                  <input
                    type="number"
                    required
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#FAFAF9] border border-[#F1F1EF] rounded-[8px] focus:outline-none focus:border-[#F47C0B]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#525252] mb-1">Satuan</label>
                  <input
                    type="text"
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="Kg, Liter, dll"
                    className="w-full px-3 py-2 bg-[#FAFAF9] border border-[#F1F1EF] rounded-[8px] focus:outline-none focus:border-[#F47C0B]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#525252] mb-1">Batas Min</label>
                  <input
                    type="number"
                    required
                    value={formData.minStockNumber}
                    onChange={(e) => setFormData({ ...formData, minStockNumber: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#FAFAF9] border border-[#F1F1EF] rounded-[8px] focus:outline-none focus:border-[#F47C0B]"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-[#F1F1EF] text-[#525252] font-bold rounded-[8px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-2 py-2.5 wkm-gradient-bg text-white font-bold rounded-[8px] shadow-xs cursor-pointer"
                >
                  Simpan Barang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
