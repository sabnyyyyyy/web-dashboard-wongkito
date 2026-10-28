'use client';

import React, { useState } from 'react';
import { useAuth } from '@/app/_context/AuthContext';
import { playChime } from '@/app/_utils/format';
import { ROLE_LABEL } from '@/lib/access';
import { MIN_PASSWORD_LENGTH } from '@/lib/password';
import { Save, CheckCircle2, KeyRound, AlertTriangle } from 'lucide-react';

const EMPTY_PASSWORD_FORM = { current: '', next: '', confirm: '' };

export const ProfileView: React.FC = () => {
  const { user, updateOwnName, changeOwnPassword } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [saved, setSaved] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    const res = await updateOwnName(name);
    if (!res.success) {
      setProfileError(res.message || 'Gagal menyimpan profil.');
      return;
    }
    setSaved(true);
    playChime('success');
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSaved(false);
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordError('Konfirmasi password baru tidak sama.');
      return;
    }

    setIsChangingPassword(true);
    const res = await changeOwnPassword(passwordForm.current, passwordForm.next);
    setIsChangingPassword(false);

    if (!res.success) {
      setPasswordError(res.message || 'Gagal mengganti password.');
      return;
    }
    setPasswordForm(EMPTY_PASSWORD_FORM);
    setPasswordSaved(true);
    playChime('success');
    setTimeout(() => setPasswordSaved(false), 3000);
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
              {user ? ROLE_LABEL[user.role] : ''}
            </span>
          </div>
        </div>

        {saved && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Profil berhasil diperbarui!</span>
          </div>
        )}

        {profileError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{profileError}</span>
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
            <label className="block font-bold text-stone-700 mb-1">ID Login</label>
            <input
              type="text"
              disabled
              value={user?.loginId || ''}
              className="w-full px-3.5 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-stone-500 font-mono font-semibold cursor-not-allowed"
            />
            <p className="text-[11px] text-stone-400 mt-1">ID login dibuat oleh Owner dan menentukan hak akses akun.</p>
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">Role Akun</label>
            <input
              type="text"
              disabled
              value={user?.role === 'superadmin' ? 'Owner Admin (Akses Penuh)' : 'Kasir (Tanpa akses Team, Menu & Pengaturan)'}
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
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[#F95700]" />
          <h3 className="font-extrabold text-sm text-neutral-900">Ganti Password</h3>
        </div>

        {passwordSaved && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Password berhasil diganti!</span>
          </div>
        )}

        {passwordError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
          <div>
            <label htmlFor="current-password" className="block font-bold text-stone-700 mb-1">Password Saat Ini</label>
            <input
              id="current-password"
              type="password"
              required
              autoComplete="current-password"
              value={passwordForm.current}
              onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#F95700]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="new-password" className="block font-bold text-stone-700 mb-1">Password Baru</label>
              <input
                id="new-password"
                type="password"
                required
                minLength={MIN_PASSWORD_LENGTH}
                autoComplete="new-password"
                placeholder={`Min ${MIN_PASSWORD_LENGTH} karakter`}
                value={passwordForm.next}
                onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#F95700]"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block font-bold text-stone-700 mb-1">Ulangi Password Baru</label>
              <input
                id="confirm-password"
                type="password"
                required
                minLength={MIN_PASSWORD_LENGTH}
                autoComplete="new-password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#F95700]"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-5 py-2.5 bg-[#242424] hover:bg-black text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{isChangingPassword ? 'Menyimpan...' : 'Ganti Password'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
