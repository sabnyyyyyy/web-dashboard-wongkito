'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { playChime } from '@/utils/format';
import { User, Mail, Shield, Save, CheckCircle2 } from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    playChime('success');
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-neutral-900 tracking-tight font-sans">
            Profil Pengguna
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Informasi akun dan hak akses pengguna Warkop Wong Kito.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-stone-100">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt={user?.name}
            className="w-16 h-16 rounded-2xl object-cover border border-stone-200 shadow-sm"
          />
          <div>
            <h3 className="font-extrabold text-base text-neutral-900">{user?.name}</h3>
            <span className="px-2.5 py-0.5 bg-orange-100 text-[#F95700] text-xs font-bold rounded-lg uppercase tracking-wider">
              {user?.role === 'superadmin' ? 'Owner Admin' : 'Kasir'}
            </span>
          </div>
        </div>

        {saved && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Profil berhasil diperbarui!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-stone-700 mb-1">Nama Lengkap</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#F95700]"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">Email / Username</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#F95700]"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">Role Akun</label>
            <input
              type="text"
              disabled
              value={user?.role === 'superadmin' ? 'Owner Admin (Akses Penuh)' : 'Kasir (Akses POS & Pesanan)'}
              className="w-full px-3.5 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-stone-500 font-semibold cursor-not-allowed"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#F95700] hover:bg-[#E04E00] text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wider"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Profil</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
