'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { MenuItem, MenuCategory, OrderType, PaymentMethod } from '@/types';
import { formatRupiah, playChime } from '@/utils/format';
import confetti from 'canvas-confetti';
import {
  Search,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Tag,
  CreditCard,
  QrCode,
  Banknote,
  Utensils,
  Coffee,
  Sparkles,
  Check,
  X,
  Edit3,
} from 'lucide-react';

export const PosView: React.FC = () => {
  const { user } = useAuth();
  const {
    menuItems,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    updateCartItemNotes,
    clearCart,
    cartOrderType,
    setCartOrderType,
    cartTableNumber,
    setCartTableNumber,
    cartCustomerName,
    setCartCustomerName,
    cartDiscount,
    setCartDiscount,
    settings,
    createOrder,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNoteItem, setSelectedNoteItem] = useState<{ id: string; name: string; notes: string } | null>(null);

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherError, setVoucherError] = useState('');

  // Filter menu
  const filteredMenu = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate totals
  const subtotal = cart.reduce((acc, ci) => acc + ci.menuItem.price * ci.quantity, 0);
  const tax = settings.taxRate > 0 ? Math.round((subtotal - cartDiscount) * (settings.taxRate / 100)) : 0;
  const grandTotal = Math.max(0, subtotal - cartDiscount + tax);
  const changeAmount = Math.max(0, cashGiven - grandTotal);

  const handleApplyVoucher = () => {
    const code = voucherCode.trim().toUpperCase();
    if (code === 'WONGKITO10') {
      const disc = Math.round(subtotal * 0.1);
      setCartDiscount(disc);
      setVoucherError('');
      playChime('success');
    } else if (code === 'JUMATBERKAH') {
      setCartDiscount(10000);
      setVoucherError('');
      playChime('success');
    } else if (code === 'PROMO5K') {
      setCartDiscount(5000);
      setVoucherError('');
      playChime('success');
    } else {
      setVoucherError('Kode voucher tidak valid (Coba: WONGKITO10, JUMATBERKAH, PROMO5K)');
      playChime('alert');
    }
  };

  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    setCashGiven(grandTotal);
    setShowPaymentModal(true);
  };

  const handleCompleteTransaction = () => {
    if (paymentMethod === 'cash' && cashGiven < grandTotal) {
      alert('Jumlah uang tunai kurang dari total tagihan!');
      playChime('alert');
      return;
    }

    createOrder({
      customerName: cartCustomerName || 'Pelanggan',
      tableNumber: cartOrderType === 'dine_in' ? cartTableNumber : undefined,
      orderType: cartOrderType,
      items: [...cart],
      subtotal,
      tax,
      discount: cartDiscount,
      total: grandTotal,
      paymentMethod,
      amountPaid: paymentMethod === 'cash' ? cashGiven : grandTotal,
      cashierName: user?.name || 'Kasir',
      notes: '',
    });

    playChime('success');
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#FFB21A', '#F47C0B', '#242424', '#10B981'],
      });
    } catch {
      // ignore
    }

    setShowPaymentModal(false);
  };

  const categories: { id: MenuCategory; label: string; icon: string }[] = [
    { id: 'all', label: 'Semua Menu', icon: '🍽️' },
    { id: 'signature', label: 'Signature Wong Kito', icon: '⭐' },
    { id: 'kopi', label: 'Kopi Nusantara', icon: '☕' },
    { id: 'non-kopi', label: 'Non-Kopi & Teh', icon: '🧋' },
    { id: 'makanan', label: 'Makanan Berat', icon: '🍛' },
    { id: 'cemilan', label: 'Camilan & Roti', icon: '🍟' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start">
      {/* LEFT: MENU CATALOG (8 Cols) */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        {/* Search & Category Filter (Radius 16px) */}
        <div className="bg-white p-4 md:p-5 rounded-[16px] border border-[#F1F1EF] wkm-card-shadow">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-3.5">
            {/* Search Input (Radius 20px) */}
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kopi, pempek, indomie..."
                className="w-full pl-9 pr-4 py-2 bg-[#F1F1EF] border border-[#F1F1EF] rounded-[20px] text-xs text-[#242424] placeholder:text-[#737373] focus:outline-none focus:bg-white focus:border-[#F47C0B]"
              />
              <Search className="w-3.5 h-3.5 text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#242424]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="text-xs text-[#737373] font-medium self-end sm:self-center">
              Menampilkan <span className="font-bold text-[#242424]">{filteredMenu.length}</span> menu
            </div>
          </div>

          {/* Category Chips: Radius 20px, 8px spacing */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    playChime('click');
                  }}
                  className={`px-3.5 py-1.5 rounded-[20px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    active
                      ? 'wkm-gradient-bg text-white shadow-xs'
                      : 'bg-[#F1F1EF] text-[#525252] hover:bg-stone-200'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu Grid: Radius 12px for cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredMenu.map((item) => {
            const inCart = cart.find((ci) => ci.menuItem.id === item.id);

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (item.isAvailable) {
                    addToCart(item);
                  }
                }}
                className={`bg-white rounded-[12px] p-3 border border-[#F1F1EF] wkm-card-shadow transition-all flex flex-col justify-between relative group ${
                  item.isAvailable
                    ? 'hover:border-[#FFB21A] cursor-pointer active:scale-[0.98]'
                    : 'opacity-60 cursor-not-allowed bg-[#FAFAF9]'
                }`}
              >
                {/* Popular Tag */}
                {item.popular && item.isAvailable && (
                  <span className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-[#FFF7E8] text-[#F47C0B] border border-[#FFB21A]/50 text-[9px] font-black rounded-[20px] flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" /> Best Seller
                  </span>
                )}

                {/* In Cart Badge */}
                {inCart && (
                  <span className="absolute top-2 right-2 z-10 w-5 h-5 bg-[#F47C0B] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {inCart.quantity}
                  </span>
                )}

                {/* Image: Radius 8px */}
                <div className="w-full h-28 rounded-[8px] overflow-hidden bg-[#F1F1EF] mb-2.5 relative">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                  {!item.isAvailable && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="bg-red-600 text-white font-bold text-[9px] px-2 py-0.5 rounded-[20px] uppercase">
                        Habis
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-xs text-[#242424] line-clamp-1 leading-snug group-hover:text-[#F47C0B] transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-[10px] text-[#737373] line-clamp-2 mt-0.5 leading-tight">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#F1F1EF]">
                    <span className="font-extrabold text-xs text-[#242424]">
                      {formatRupiah(item.price)}
                    </span>
                    <button
                      disabled={!item.isAvailable}
                      className="w-6 h-6 rounded-[6px] bg-[#FFF7E8] text-[#F47C0B] group-hover:bg-[#F47C0B] group-hover:text-white flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredMenu.length === 0 && (
          <div className="bg-white rounded-[16px] p-10 text-center border border-[#F1F1EF]">
            <Coffee className="w-10 h-10 text-[#737373] mx-auto mb-2" />
            <p className="font-bold text-[#242424] text-xs">Menu tidak ditemukan</p>
            <p className="text-[11px] text-[#737373] mt-0.5">
              Coba gunakan kata kunci pencarian lain.
            </p>
          </div>
        )}
      </div>

      {/* RIGHT: POS CART & BILL (4 Cols) -> Radius 16px */}
      <div className="lg:col-span-4 bg-white rounded-[16px] wkm-card-shadow border border-[#F1F1EF] p-5 flex flex-col h-[calc(100vh-120px)] sticky top-20">
        {/* Cart Header */}
        <div className="border-b border-[#F1F1EF] pb-3 mb-3">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#F47C0B]" />
              <h2 className="font-black text-sm text-[#242424] tracking-tight font-sans">
                Pesanan Baru
              </h2>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[10px] text-red-500 hover:text-red-700 font-semibold flex items-center gap-0.5 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Order Type Switcher (Radius 8px) */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-[#F1F1EF] rounded-[8px] mb-2.5">
            {(['dine_in', 'takeaway', 'delivery'] as OrderType[]).map((type) => (
              <button
                key={type}
                onClick={() => setCartOrderType(type)}
                className={`py-1 text-[11px] font-bold rounded-[6px] transition-all capitalize ${
                  cartOrderType === type
                    ? 'bg-white text-[#242424] shadow-xs'
                    : 'text-[#737373] hover:text-[#242424]'
                }`}
              >
                {type === 'dine_in' ? 'Dine In' : type === 'takeaway' ? 'Take Away' : 'Ojol'}
              </button>
            ))}
          </div>

          {/* Customer & Table (Radius 8px) */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-bold text-[#737373] uppercase">Pelanggan</label>
              <input
                type="text"
                value={cartCustomerName}
                onChange={(e) => setCartCustomerName(e.target.value)}
                placeholder="Nama Tamu"
                className="w-full px-2.5 py-1.5 bg-[#FAFAF9] border border-[#F1F1EF] rounded-[8px] text-xs text-[#242424] focus:outline-none focus:border-[#F47C0B]"
              />
            </div>
            {cartOrderType === 'dine_in' && (
              <div>
                <label className="text-[9px] font-bold text-[#737373] uppercase">No. Meja</label>
                <select
                  value={cartTableNumber}
                  onChange={(e) => setCartTableNumber(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#FAFAF9] border border-[#F1F1EF] rounded-[8px] text-xs font-semibold text-[#242424] focus:outline-none focus:border-[#F47C0B]"
                >
                  {Array.from({ length: 20 }, (_, i) => `Meja ${String(i + 1).padStart(2, '0')}`).map((tbl) => (
                    <option key={tbl} value={tbl}>
                      {tbl}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 divide-y divide-[#F1F1EF]">
          {cart.map((ci) => (
            <div key={ci.menuItem.id} className="pt-2 first:pt-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h4 className="font-bold text-xs text-[#242424] leading-tight">
                    {ci.menuItem.name}
                  </h4>
                  <div className="text-[10px] text-[#737373] mt-0.5">
                    {formatRupiah(ci.menuItem.price)}
                  </div>
                  {ci.notes && (
                    <div className="text-[9px] text-[#F47C0B] italic mt-0.5 bg-[#FFF7E8] px-1.5 py-0.5 rounded-[4px] inline-block">
                      📝 {ci.notes}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span className="font-bold text-xs text-[#242424]">
                    {formatRupiah(ci.menuItem.price * ci.quantity)}
                  </span>
                </div>
              </div>

              {/* Quantity Controls & Notes Button */}
              <div className="flex items-center justify-between mt-1.5">
                <button
                  onClick={() =>
                    setSelectedNoteItem({
                      id: ci.menuItem.id,
                      name: ci.menuItem.name,
                      notes: ci.notes || '',
                    })
                  }
                  className="text-[10px] text-[#737373] hover:text-[#242424] flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3 text-[#F47C0B]" />
                  <span>{ci.notes ? 'Ubah Catatan' : '+ Catatan'}</span>
                </button>

                <div className="flex items-center gap-1.5 bg-[#F1F1EF] rounded-[6px] p-0.5">
                  <button
                    onClick={() => updateCartQuantity(ci.menuItem.id, -1)}
                    className="w-4 h-4 rounded bg-white text-[#242424] flex items-center justify-center text-xs font-bold"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <span className="text-xs font-bold px-1 text-center min-w-3.5">{ci.quantity}</span>
                  <button
                    onClick={() => updateCartQuantity(ci.menuItem.id, 1)}
                    className="w-4 h-4 rounded bg-white text-[#242424] flex items-center justify-center text-xs font-bold"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                  <button
                    onClick={() => removeFromCart(ci.menuItem.id)}
                    className="w-4 h-4 rounded hover:bg-red-100 text-red-500 flex items-center justify-center text-xs ml-0.5"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center text-[#737373] py-8">
              <ShoppingBag className="w-8 h-8 stroke-1 mb-2 text-stone-300" />
              <p className="text-xs font-medium">Keranjang masih kosong</p>
              <p className="text-[10px] text-[#737373]">Klik menu untuk memesan</p>
            </div>
          )}
        </div>

        {/* Voucher & Bill Summary */}
        {cart.length > 0 && (
          <div className="border-t border-[#F1F1EF] pt-3 mt-2 space-y-2 bg-[#FAFAF9] -mx-5 -mb-5 p-4 rounded-b-[16px]">
            {/* Voucher Input (Radius 8px) */}
            <div className="flex gap-1.5">
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                placeholder="Kode Promo (e.g. WONGKITO10)"
                className="flex-1 px-2.5 py-1.5 bg-white border border-[#F1F1EF] rounded-[8px] text-xs uppercase font-mono text-[#242424] focus:outline-none focus:border-[#F47C0B]"
              />
              <button
                onClick={handleApplyVoucher}
                className="px-3 py-1.5 bg-[#242424] hover:bg-black text-white text-xs font-bold rounded-[8px] transition-colors cursor-pointer"
              >
                Pakai
              </button>
            </div>
            {voucherError && (
              <p className="text-[10px] text-red-500 font-medium">{voucherError}</p>
            )}

            {/* Calculations */}
            <div className="space-y-1 text-xs text-[#525252] pt-1">
              <div className="flex justify-between">
                <span>Subtotal ({cart.reduce((a, c) => a + c.quantity, 0)} item)</span>
                <span className="font-semibold text-[#242424]">{formatRupiah(subtotal)}</span>
              </div>
              {cartDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Diskon Promo</span>
                  <span>- {formatRupiah(cartDiscount)}</span>
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between">
                  <span>Pajak ({settings.taxRate}%)</span>
                  <span>{formatRupiah(tax)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-black text-[#242424] pt-1 border-t border-[#F1F1EF]">
                <span>Total Tagihan</span>
                <span className="text-[#F47C0B] text-sm">{formatRupiah(grandTotal)}</span>
              </div>
            </div>

            {/* Pay Button: PRIMARY GRADIENT */}
            <button
              onClick={handleOpenPayment}
              className="w-full py-2.5 wkm-gradient-bg text-white font-bold rounded-[8px] shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.99] text-xs uppercase tracking-wider mt-1"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Bayar &middot; {formatRupiah(grandTotal)}</span>
            </button>
          </div>
        )}
      </div>

      {/* MODAL: ITEM NOTES */}
      {selectedNoteItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[16px] p-5 max-w-sm w-full wkm-modal-shadow border border-[#F1F1EF]">
            <h3 className="font-bold text-sm text-[#242424] mb-1">
              Catatan untuk {selectedNoteItem.name}
            </h3>
            <p className="text-xs text-[#525252] mb-3">
              Contoh: Sedikit gula, es dipisah, cuko ekstra pedas.
            </p>
            <textarea
              rows={3}
              value={selectedNoteItem.notes}
              onChange={(e) =>
                setSelectedNoteItem({ ...selectedNoteItem, notes: e.target.value })
              }
              placeholder="Tulis catatan kustom barista / dapur..."
              className="w-full p-2.5 bg-[#FAFAF9] border border-[#F1F1EF] rounded-[8px] text-xs text-[#242424] focus:outline-none focus:border-[#F47C0B] mb-3"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedNoteItem(null)}
                className="px-3 py-1.5 text-xs text-[#525252] font-semibold"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  updateCartItemNotes(selectedNoteItem.id, selectedNoteItem.notes);
                  setSelectedNoteItem(null);
                }}
                className="px-4 py-1.5 wkm-gradient-bg text-white text-xs font-bold rounded-[8px]"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PAYMENT GATEWAY (Radius 16px, Modal shadow) */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[16px] max-w-md w-full p-6 wkm-modal-shadow border border-[#F1F1EF]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#F1F1EF] pb-3 mb-3">
              <div>
                <h3 className="font-black text-base text-[#242424]">Pembayaran Kasir</h3>
                <p className="text-xs text-[#525252]">
                  {cartCustomerName} &middot; {cartOrderType === 'dine_in' ? cartTableNumber : 'Takeaway'}
                </p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 rounded-full hover:bg-[#F1F1EF] text-[#737373]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Total Display: Highlight Cream #FFF7E8 */}
            <div className="p-3.5 bg-[#FFF7E8] border border-[#FFB21A]/30 rounded-[12px] text-center mb-4">
              <span className="text-[10px] font-bold text-[#F47C0B] uppercase tracking-wider">
                Total Tagihan
              </span>
              <div className="text-2xl font-black text-[#F47C0B] mt-0.5">
                {formatRupiah(grandTotal)}
              </div>
            </div>

            {/* Payment Method Tabs */}
            <div className="grid grid-cols-4 gap-1.5 mb-4">
              {[
                { id: 'cash', label: 'Tunai', icon: Banknote },
                { id: 'qris', label: 'QRIS', icon: QrCode },
                { id: 'transfer', label: 'Transfer', icon: CreditCard },
                { id: 'debit', label: 'Debit', icon: Utensils },
              ].map((m) => {
                const Icon = m.icon;
                const active = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setPaymentMethod(m.id as PaymentMethod);
                      if (m.id !== 'cash') setCashGiven(grandTotal);
                    }}
                    className={`py-2 px-1.5 rounded-[8px] text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                      active
                        ? 'wkm-gradient-bg text-white shadow-xs'
                        : 'bg-[#F1F1EF] text-[#525252] hover:bg-stone-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Content per Method */}
            {paymentMethod === 'cash' ? (
              <div className="space-y-3 mb-5 text-xs">
                <div>
                  <label className="block font-bold text-[#525252] mb-1">
                    Uang Tunai Diterima (Rp)
                  </label>
                  <input
                    type="number"
                    value={cashGiven || ''}
                    onChange={(e) => setCashGiven(Number(e.target.value))}
                    className="w-full text-base font-black px-3.5 py-2 bg-[#FAFAF9] border border-[#F1F1EF] rounded-[8px] focus:outline-none focus:border-[#F47C0B] text-[#242424]"
                  />
                </div>

                {/* Quick Cash Presets */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setCashGiven(grandTotal)}
                    className="px-2.5 py-1 bg-[#F1F1EF] hover:bg-stone-200 text-[#525252] text-xs font-bold rounded-[6px]"
                  >
                    Uang Pas
                  </button>
                  {[20000, 50000, 100000, 200000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setCashGiven(amt)}
                      className="px-2.5 py-1 bg-[#F1F1EF] hover:bg-stone-200 text-[#525252] text-xs font-bold rounded-[6px]"
                    >
                      {formatRupiah(amt)}
                    </button>
                  ))}
                </div>

                {/* Kembalian */}
                <div className="p-2.5 bg-[#F1F1EF] rounded-[8px] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#525252]">Kembalian:</span>
                  <span className={`text-sm font-black ${changeAmount >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {changeAmount >= 0 ? formatRupiah(changeAmount) : 'Uang Kurang!'}
                  </span>
                </div>
              </div>
            ) : paymentMethod === 'qris' ? (
              <div className="text-center py-3 space-y-2 mb-5 bg-[#FAFAF9] rounded-[12px] p-3 border border-[#F1F1EF]">
                <div className="w-36 h-36 bg-white p-2 rounded-[8px] mx-auto border border-[#F1F1EF] flex items-center justify-center">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=WARKOP-WONG-KITO-QRIS"
                    alt="QRIS Demo"
                    className="w-full h-full"
                  />
                </div>
                <div className="text-xs font-bold text-[#242424]">
                  Scan QRIS (BCA, GoPay, OVO, Dana)
                </div>
              </div>
            ) : (
              <div className="p-3 bg-[#FAFAF9] rounded-[8px] border border-[#F1F1EF] mb-5 space-y-1 text-xs text-[#525252]">
                <p className="font-bold text-[#242424]">Rekening Tujuan:</p>
                <p>BCA: <strong className="text-[#242424]">8850-2918-2026</strong> (a.n Warkop Wong Kito)</p>
                <p>Mandiri: <strong className="text-[#242424]">113-00-19283-11</strong></p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-2.5 bg-[#F1F1EF] text-[#525252] font-bold text-xs rounded-[8px]"
              >
                Batal
              </button>
              <button
                onClick={handleCompleteTransaction}
                className="flex-2 py-2.5 wkm-gradient-bg text-white font-bold text-xs rounded-[8px] shadow-sm flex items-center justify-center gap-1 cursor-pointer uppercase tracking-wider"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Selesaikan Transaksi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
