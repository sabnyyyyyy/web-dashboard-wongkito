'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '@/app/_context/AppContext';
import { useAuth } from '@/app/_context/AuthContext';
import { MenuItem, MenuCategory } from '@/types';
import { formatRupiah, playChime } from '@/app/_utils/format';
import { Plus, Search, Edit2, X, Save } from 'lucide-react';

export const MenuView: React.FC = () => {
  const { menuItems, addMenuItem, updateMenuItem, toggleMenuAvailability } = useApp();
  const { user } = useAuth();
  const isOwner = user?.role === 'superadmin';

  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Portal & Modal State
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scrolling when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showModal]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'kopi' as MenuItem['category'],
    price: 15000,
    costPrice: 7000,
    description: '',
    image: '',
    stock: 50,
    isAvailable: true,
    popular: false,
  });

  const filteredMenu = menuItems.filter((item: MenuItem) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const availabilityFilter = isOwner ? true : item.isAvailable; // Kasir hanya melihat menu yang tersedia
    return matchesCategory && matchesSearch && availabilityFilter;
  });

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'kopi',
      price: 15000,
      costPrice: 7000,
      description: '',
      image: '',
      stock: 50,
      isAvailable: true,
      popular: false,
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price,
      costPrice: item.costPrice || 0,
      description: item.description || '',
      image: item.image || '',
      stock: item.stock || 0,
      isAvailable: item.isAvailable,
      popular: !!item.popular,
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = editingItem
      ? await updateMenuItem(editingItem.id, formData)
      : await addMenuItem(formData);
    if (!ok) return;
    playChime('success');
    setShowModal(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-[#242424] tracking-tight uppercase">
            MENU
          </h1>
          <p className="text-xs text-[#525252] mt-0.5">
            Katalog produk, minuman, dan kuliner siap saji Warkop Wong Kito.
          </p>
        </div>

        {isOwner && (
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-[#F47C0B] hover:bg-[#EA580C] text-white font-bold text-xs rounded-[8px] shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" />
            <span>TAMBAH MENU</span>
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-[12px] border border-[#E5E7EB] wkm-card-shadow">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau deskripsi menu..."
            className="w-full pl-9 pr-3.5 py-2 bg-[#FAFAF9] border border-[#E5E7EB] rounded-[8px] text-xs text-[#242424] focus:outline-none focus:border-[#F47C0B] transition-all"
          />
          <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Filter Kategori */}
        <div className="relative w-full sm:w-48 shrink-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as MenuCategory)}
            className="w-full px-3.5 py-2 bg-[#FAFAF9] border border-[#E5E7EB] rounded-[8px] text-xs text-[#242424] font-medium focus:outline-none focus:border-[#F47C0B] transition-all appearance-none cursor-pointer"
          >
            <option value="all">Semua Kategori</option>
            <option value="kopi">Kopi</option>
            <option value="non-kopi">Non-Kopi</option>
            <option value="makanan">Makanan</option>
            <option value="cemilan">Cemilan</option>
            <option value="signature">Signature</option>
          </select>
          <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#737373] text-[10px]">
            ▼
          </div>
        </div>
      </div>

      {/* Grid Menu Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMenu.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-[16px] border border-[#E5E7EB] p-4.5 wkm-card-shadow flex flex-col justify-between hover:border-[#D1D5DB] transition-all"
          >
            <div>
              {/* Category & Availability Badges */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="px-2 py-0.5 rounded-[20px] text-[10px] font-bold uppercase tracking-wider text-[#F47C0B] bg-[#FFF7E8] border border-[#FFB21A]/40">
                  {item.category}
                </span>

                {item.isAvailable ? (
                  <span className="px-2.5 py-0.5 rounded-[20px] text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                    TERSEDIA
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-[20px] text-[10px] font-bold text-red-600 bg-red-50 border border-red-200">
                    NONAKTIF
                  </span>
                )}
              </div>

              {/* Menu Info with Image if available */}
              <div className="flex gap-3 items-start my-1.5">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-14 h-14 rounded-[10px] object-cover bg-[#FAFAF9] border border-[#E5E7EB] shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : null}

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-[#242424] truncate">{item.name}</h3>
                  <p className="text-xs text-[#737373] line-clamp-2 mt-0.5 leading-relaxed">
                    {item.description || 'Tidak ada deskripsi'}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Row: Price & Actions */}
            <div className="pt-3 border-t border-[#F1F1EF] flex items-center justify-between gap-2 mt-3">
              <div>
                <span className="text-[10px] text-[#737373] block">Harga</span>
                <span className="text-sm font-black text-[#242424]">{formatRupiah(item.price)}</span>
              </div>

              {/* Action Buttons for Owner */}
              {isOwner && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="px-3 py-1 bg-white hover:bg-[#F1F1EF] border border-[#D1D5DB] text-[#525252] hover:text-[#242424] font-bold text-xs rounded-[6px] transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => toggleMenuAvailability(item.id)}
                    className={`px-2.5 py-1 font-bold text-xs rounded-[6px] transition-colors cursor-pointer border ${
                      item.isAvailable
                        ? 'bg-red-50 hover:bg-red-100 border-red-200 text-red-600'
                        : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700'
                    }`}
                  >
                    {item.isAvailable ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredMenu.length === 0 && (
          <div className="col-span-full bg-white rounded-[16px] border border-[#E5E7EB] p-12 text-center text-[#737373] text-xs">
            Tidak ada menu yang sesuai dengan pencarian atau filter.
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT MENU (Rendered via React Portal directly into body) */}
      {mounted && showModal && createPortal(
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-[16px] max-w-[520px] w-full shadow-2xl flex flex-col max-h-[90vh] border border-[#E5E7EB] overflow-hidden animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F1EF] shrink-0 bg-white">
              <h3 className="font-black text-base text-[#242424] uppercase tracking-tight">
                {editingItem ? 'Edit Menu' : 'Tambah Menu Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full hover:bg-[#F1F1EF] text-[#737373] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Scrollable Form Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#374151] mb-1">
                    Nama Menu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Kopi Tarik Wong Kito"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D1D5DB] rounded-[6px] text-xs text-[#242424] focus:outline-none focus:border-[#F47C0B] transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#374151] mb-1">
                      Kategori <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value as MenuItem['category'] })
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D1D5DB] rounded-[6px] text-xs text-[#242424] focus:outline-none focus:border-[#F47C0B] transition-all cursor-pointer"
                    >
                      <option value="signature">Signature Wong Kito</option>
                      <option value="kopi">Kopi</option>
                      <option value="non-kopi">Non-Kopi</option>
                      <option value="makanan">Makanan</option>
                      <option value="cemilan">Cemilan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#374151] mb-1">
                      Harga Jual (Rp) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D1D5DB] rounded-[6px] text-xs font-bold text-[#242424] focus:outline-none focus:border-[#F47C0B] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#374151] mb-1">Harga Modal / HPP (Rp)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D1D5DB] rounded-[6px] text-xs text-[#525252] focus:outline-none focus:border-[#F47C0B] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#374151] mb-1">Stok Porsi</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D1D5DB] rounded-[6px] text-xs text-[#242424] focus:outline-none focus:border-[#F47C0B] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#374151] mb-1">Deskripsi & Racikan</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Keterangan bahan dan cita rasa..."
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D1D5DB] rounded-[6px] text-xs text-[#242424] focus:outline-none focus:border-[#F47C0B] transition-all"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#374151] mb-1">URL Foto Menu</label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D1D5DB] rounded-[6px] text-xs text-[#242424] focus:outline-none focus:border-[#F47C0B] transition-all"
                  />
                </div>

                <div className="flex items-center gap-6 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.popular}
                      onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                      className="w-4 h-4 rounded text-[#F47C0B] focus:ring-[#F47C0B]"
                    />
                    <span className="font-medium text-[#374151]">Tandai Best Seller</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isAvailable}
                      onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                      className="w-4 h-4 rounded text-[#F47C0B] focus:ring-[#F47C0B]"
                    />
                    <span className="font-medium text-[#374151]">Status Tersedia</span>
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-[#F1F1EF] bg-white flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-white hover:bg-stone-50 border border-[#D1D5DB] text-[#525252] font-semibold text-xs rounded-[8px] transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#F47C0B] hover:bg-[#EA580C] text-white font-bold text-xs rounded-[8px] flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4 text-white" />
                  <span>Simpan Menu</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
