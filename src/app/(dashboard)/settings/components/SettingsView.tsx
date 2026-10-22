'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { playChime } from '@/utils/format';
import {
  Store,
  Printer,
  Wifi,
  Percent,
  Save,
  CheckCircle2,
  Coffee,
  MapPin,
  Phone,
  Clock,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings } = useApp();
  const [formState, setFormState] = useState({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formState);
    playChime('success');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-neutral-900 tracking-tight font-sans">
            Pengaturan Warkop & Struk
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Konfigurasi profil warkop, printer kasir, tarif pajak, dan password WiFi struk.
          </p>
        </div>

        {savedSuccess && (
          <div className="px-3.5 py-1.5 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-1.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Pengaturan Berhasil Disimpan!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Profil Warkop */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
            <Store className="w-5 h-5 text-[#F95700]" />
            <h3 className="font-bold text-sm text-neutral-900 font-sans">
              Identitas & Informasi Warkop
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Nama Usaha / Warkop</label>
              <input
                type="text"
                required
                value={formState.storeName}
                onChange={(e) => setFormState({ ...formState, storeName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#F95700]"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Slogan / Tagline</label>
              <input
                type="text"
                value={formState.tagline}
                onChange={(e) => setFormState({ ...formState, tagline: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#F95700]"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">No. Kontak / WhatsApp Kasir</label>
              <input
                type="text"
                value={formState.phone}
                onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#F95700]"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Jam Operasional</label>
              <input
                type="text"
                value={formState.openHours}
                onChange={(e) => setFormState({ ...formState, openHours: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#F95700]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-stone-700 mb-1">Alamat Lengkap Warkop</label>
              <textarea
                rows={2}
                value={formState.address}
                onChange={(e) => setFormState({ ...formState, address: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#F95700]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Format Struk & WiFi */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
            <Printer className="w-5 h-5 text-[#F95700]" />
            <h3 className="font-bold text-sm text-neutral-900 font-sans">
              Format Header, Footer Struk & Promo WiFi
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Header Struk Thermal</label>
              <textarea
                rows={3}
                value={formState.receiptHeader}
                onChange={(e) => setFormState({ ...formState, receiptHeader: e.target.value })}
                className="w-full font-mono text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#F95700]"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Footer Struk & Ucapan</label>
              <textarea
                rows={3}
                value={formState.receiptFooter}
                onChange={(e) => setFormState({ ...formState, receiptFooter: e.target.value })}
                className="w-full font-mono text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#F95700]"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Password Free WiFi Pengunjung</label>
              <input
                type="text"
                value={formState.wifiPassword || ''}
                onChange={(e) => setFormState({ ...formState, wifiPassword: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#F95700]"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Tarif Pajak PB1 Resto (%)</label>
              <input
                type="number"
                value={formState.taxRate}
                onChange={(e) => setFormState({ ...formState, taxRate: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#F95700]"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-[#F95700] hover:bg-[#E04E00] text-white font-bold text-xs md:text-sm rounded-2xl shadow-lg shadow-orange-500/25 flex items-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan Pengaturan</span>
          </button>
        </div>
      </form>
    </div>
  );
};
