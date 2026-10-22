'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { MenuItem, MenuCategory } from '@/types';
import { formatRupiah, playChime } from '@/utils/format';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Sparkles,
  DollarSign,
  Coffee,
  Image as ImageIcon,
  X,
} from 'lucide-react';

export const MenuView: React.FC = () => {
  const { menuItems, addMenuItem, updateMenuItem, deleteMenuItem, toggleMenuAvailability } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'kopi' as MenuItem['category'],
    price: 15000,
    costPrice: 7000,
    description: '',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&auto=format&fit=crop&q=80',
    stock: 50,
    isAvailable: true,
    popular: false,
  });

  const filteredMenu = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'kopi',
      price: 15000,
      costPrice: 7000,
      description: '',
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&auto=format&fit=crop&q=80',
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
      costPrice: item.costPrice,
      description: item.description,
      image: item.image,
      stock: item.stock,
      isAvailable: item.isAvailable,
      popular: !!item.popular,
    });
    setShowModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateMenuItem(editingItem.id, formData);
    } else {
      addMenuItem(formData);
    }
    playChime('success');
    setShowModal(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus menu "${name}"?`)) {
      deleteMenuItem(id);
      playChime('alert');
    }
  };

  const marginProfit = formData.price - formData.costPrice;
  const marginPercent = formData.price > 0 ? Math.round((marginProfit / formData.price) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-neutral-900 tracking-tight font-sans">
            Katalog Menu & Harga
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Kelola menu kopi, minuman, kuliner khas Wong Kito, dan stok siap saji.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-60">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari menu..."
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-[#F95700]"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-[#F95700] hover:bg-[#E04E00] text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-500/25 flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Menu</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'Semua Menu' },
          { id: 'signature', label: 'Signature Wong Kito' },
          { id: 'kopi', label: 'Kopi Nusantara' },
          { id: 'non-kopi', label: 'Non-Kopi' },
          { id: 'makanan', label: 'Makanan Berat' },
          { id: 'cemilan', label: 'Camilan & Roti' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === tab.id
                ? 'bg-[#2C1810] text-amber-400 shadow-sm'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Menu Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredMenu.map((item) => {
          const margin = item.price - item.costPrice;
          const marginPct = Math.round((margin / item.price) * 100);

          return (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                {/* Image */}
                <div className="h-40 w-full relative bg-stone-100">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  
                  {item.popular && (
                    <span className="absolute top-3 left-3 px-2 py-0.5 bg-amber-400 text-stone-900 text-[10px] font-black rounded-full shadow flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> Best Seller
                    </span>
                  )}

                  {/* Availability Badge */}
                  <button
                    onClick={() => toggleMenuAvailability(item.id)}
                    className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold shadow cursor-pointer transition-all ${
                      item.isAvailable
                        ? 'bg-emerald-600 text-white'
                        : 'bg-red-600 text-white'
                    }`}
                  >
                    {item.isAvailable ? 'Tersedia' : 'Habis'}
                  </button>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-[#F95700] uppercase tracking-wider">
                      {item.category}
                    </span>
                    <span className="text-[11px] font-medium text-stone-500">
                      Stok: <strong className="text-neutral-800">{item.stock}</strong>
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-neutral-900 line-clamp-1">
                    {item.name}
                  </h3>
                  <p className="text-[11px] text-stone-500 line-clamp-2 mt-1 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Financial Metrics */}
                  <div className="mt-3 pt-3 border-t border-stone-100 grid grid-cols-2 gap-2 text-xs bg-stone-50 p-2 rounded-xl">
                    <div>
                      <span className="text-[10px] text-stone-400 block">Harga Jual</span>
                      <span className="font-extrabold text-neutral-900">{formatRupiah(item.price)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 block">Margin Untung</span>
                      <span className="font-bold text-emerald-700">+{marginPct}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-0 flex gap-2">
                <button
                  onClick={() => handleOpenEditModal(item)}
                  className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(item.id, item.name)}
                  className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors cursor-pointer"
                  title="Hapus Menu"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: ADD / EDIT MENU */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <h3 className="font-black text-lg text-neutral-900">
                {editingItem ? 'Edit Menu' : 'Tambah Menu Baru'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full hover:bg-stone-100 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Nama Menu</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Kopi Tarik Wong Kito"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#F95700]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#F95700]"
                  >
                    <option value="signature">Signature Wong Kito</option>
                    <option value="kopi">Kopi</option>
                    <option value="non-kopi">Non-Kopi</option>
                    <option value="makanan">Makanan</option>
                    <option value="cemilan">Cemilan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Stok Porsi</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#F95700]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold text-neutral-900 focus:outline-none focus:border-[#F95700]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Harga Modal / HPP (Rp)</label>
                  <input
                    type="number"
                    required
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-600 focus:outline-none focus:border-[#F95700]"
                  />
                </div>
              </div>

              {/* Profit Calculation preview */}
              <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] text-emerald-800 flex justify-between">
                <span>Estimasi Keuntungan Bersih:</span>
                <span className="font-bold">{formatRupiah(marginProfit)} (+{marginPercent}%)</span>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Deskripsi & Racikan</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Keterangan bahan dan cita rasa..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#F95700]"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">URL Foto Menu</label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#F95700]"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.popular}
                    onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                    className="rounded text-[#F95700] focus:ring-[#F95700]"
                  />
                  <span className="font-medium text-stone-700">Tandai Best Seller</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="rounded text-[#F95700] focus:ring-[#F95700]"
                  />
                  <span className="font-medium text-stone-700">Status Tersedia</span>
                </label>
              </div>

              <div className="flex gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-2 py-2.5 bg-[#F95700] hover:bg-[#E04E00] text-white font-bold rounded-xl shadow cursor-pointer uppercase tracking-wider"
                >
                  Simpan Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
