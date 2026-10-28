'use client';

import React, { useState } from 'react';
import { AccountStatus, StaffAccount } from '@/types';
import { useAuth } from '@/app/_context/AuthContext';
import { MIN_PASSWORD_LENGTH } from '@/lib/password';
import { playChime } from '@/app/_utils/format';
import {
  Plus,
  KeyRound,
  CheckCircle2,
  X,
  Copy,
  AlertTriangle,
} from 'lucide-react';

const SHIFT_OPTIONS = ['Pagi (07.00–15.00)', 'Siang (12.00–20.00)', 'Malam (17.00–01.00)'];

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'KS';

// Shown once after creating an account or resetting a password.
interface CredentialNotice {
  title: string;
  name: string;
  loginId: string;
  password?: string;
}

export const TeamView: React.FC = () => {
  const { kasirAccounts: members, nextKasirLoginId, createKasirAccount, updateKasirAccount, resetKasirPassword } =
    useAuth();

  const [filter, setFilter] = useState<'Semua' | AccountStatus>('Semua');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffAccount | null>(null);
  const [credentialNotice, setCredentialNotice] = useState<CredentialNotice | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for Add
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    shift: SHIFT_OPTIONS[0],
    password: '',
  });

  const totalCount = members.length;
  const activeCount = members.filter((m) => m.status === 'Aktif').length;
  const inactiveCount = members.filter((m) => m.status === 'Nonaktif').length;

  const filteredMembers = members.filter((m) => filter === 'Semua' || m.status === filter);

  const closeAddModal = () => {
    setShowAddModal(false);
    setFormError('');
    setFormData({ name: '', phone: '', shift: SHIFT_OPTIONS[0], password: '' });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    try {
      const created = await createKasirAccount(formData);
      playChime('success');
      closeAddModal();
      setCredentialNotice({
        title: 'Akun Kasir Dibuat',
        name: created.name,
        loginId: created.loginId,
        password: formData.password,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal membuat akun.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    setFormError('');
    setIsSubmitting(true);
    try {
      const updated = await updateKasirAccount(editingMember.loginId, editingMember);
      playChime('success');
      setEditingMember(null);
      showToast(`Data kasir "${updated.name}" berhasil diperbarui.`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan perubahan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (member: StaffAccount) => {
    if (!window.confirm(`Reset password ${member.name} (${member.loginId})? Password lama tidak bisa dipakai lagi.`)) {
      return;
    }
    try {
      const tempPassword = await resetKasirPassword(member.loginId);
      playChime('alert');
      setCredentialNotice({
        title: 'Password Kasir Di-reset',
        name: member.name,
        loginId: member.loginId,
        password: tempPassword,
      });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal reset password.');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => showToast(`${label} berhasil disalin ke clipboard!`))
      .catch(() => showToast(`Gagal menyalin ${label.toLowerCase()}.`));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & CTA Button matching photo */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-[#242424] tracking-tight font-sans">
            Team
          </h1>
          <p className="text-xs text-[#525252] mt-0.5">
            Kelola akun kasir warkop: buat akun, atur shift, dan nonaktifkan kalau sudah tidak bertugas.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 wkm-gradient-bg hover:opacity-95 text-white font-bold text-xs rounded-[8px] shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Buat akun kasir</span>
        </button>
      </div>

      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-[8px] flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 3 Stat Cards matching photo: Total kasir, Aktif, Nonaktif */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total kasir */}
        <div className="bg-white rounded-[12px] p-4 md:p-5 border border-[#F1F1EF] wkm-card-shadow flex flex-col justify-between">
          <span className="text-[11px] font-bold text-[#737373]">
            Total kasir
          </span>
          <div className="mt-2">
            <span className="text-2xl md:text-3xl font-black text-[#242424]">{totalCount}</span>
          </div>
        </div>

        {/* Card 2: Aktif */}
        <div className="bg-white rounded-[12px] p-4 md:p-5 border border-[#F1F1EF] wkm-card-shadow flex flex-col justify-between">
          <span className="text-[11px] font-bold text-[#737373]">
            Aktif
          </span>
          <div className="mt-2">
            <span className="text-2xl md:text-3xl font-black text-[#242424]">{activeCount}</span>
          </div>
        </div>

        {/* Card 3: Nonaktif */}
        <div className="bg-white rounded-[12px] p-4 md:p-5 border border-[#F1F1EF] wkm-card-shadow flex flex-col justify-between">
          <span className="text-[11px] font-bold text-[#737373]">
            Nonaktif
          </span>
          <div className="mt-2">
            <span className="text-2xl md:text-3xl font-black text-[#242424]">{inactiveCount}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs: [Semua (black pill)] [Aktif] [Nonaktif] */}
      <div className="flex items-center gap-2">
        {(['Semua', 'Aktif', 'Nonaktif'] as const).map((tab) => {
          const active = filter === tab;
          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-[20px] text-xs font-bold transition-all cursor-pointer ${
                active
                  ? 'bg-[#242424] text-white'
                  : 'bg-white text-[#525252] hover:bg-[#F1F1EF] border border-[#F1F1EF]'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Main Team Table: Radius 16px, Border #F1F1EF */}
      <div className="bg-white rounded-[16px] border border-[#F1F1EF] wkm-card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAF7F2] text-[#737373] font-bold uppercase text-[10px] tracking-wider border-b border-[#F1F1EF]">
                <th className="py-3 px-4">Kasir</th>
                <th className="py-3 px-4">Shift</th>
                <th className="py-3 px-4">ID Login</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F1EF]">
              {filteredMembers.map((member) => (
                <tr key={member.loginId} className="hover:bg-[#FAFAF9] transition-colors">
                  {/* Kasir: Avatar Initials + Name + Phone */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#F1F1EF] text-[#525252] font-black text-xs flex items-center justify-center shrink-0 border border-stone-200">
                        {getInitials(member.name)}
                      </div>
                      <div>
                        <div className="font-extrabold text-xs text-[#242424]">{member.name}</div>
                        <div className="text-[10px] text-[#737373] mt-0.5">{member.phone}</div>
                      </div>
                    </div>
                  </td>

                  {/* Shift */}
                  <td className="py-3.5 px-4 text-[#525252] font-medium">
                    {member.shift}
                  </td>

                  {/* ID Login */}
                  <td className="py-3.5 px-4 font-mono font-bold text-[#242424]">
                    {member.loginId}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4">
                    {member.status === 'Aktif' ? (
                      <span className="px-2.5 py-0.5 rounded-[20px] text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Aktif
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-[20px] text-[10px] font-bold bg-[#F1F1EF] text-[#737373] border border-stone-200">
                        Nonaktif
                      </span>
                    )}
                  </td>

                  {/* Action Buttons: [Edit] [Reset sandi] */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setFormError('');
                          setEditingMember({ ...member });
                        }}
                        className="px-3 py-1 bg-white hover:bg-[#F1F1EF] border border-[#F1F1EF] text-[#525252] hover:text-[#242424] font-bold text-xs rounded-[8px] transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleResetPassword(member)}
                        className="px-3 py-1 bg-white hover:bg-[#F1F1EF] border border-[#F1F1EF] text-[#525252] hover:text-[#242424] font-bold text-xs rounded-[8px] transition-colors cursor-pointer"
                      >
                        Reset sandi
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer Text matching photo: "Kasir hanya bisa membuka Pesanan dan Absensi." */}
        <div className="p-4 border-t border-[#F1F1EF] bg-[#FAFAF9]">
          <p className="text-[11px] text-[#737373] italic">
            ID login KSR-… otomatis mendapat akses Kasir: tidak bisa membuka Team, Menu, dan Pengaturan. Akun nonaktif tidak bisa login.
          </p>
        </div>
      </div>

      {/* MODAL: BUAT AKUN KASIR */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[16px] max-w-md w-full p-6 wkm-modal-shadow border border-[#F1F1EF]">
            <div className="flex items-center justify-between border-b border-[#F1F1EF] pb-3 mb-4">
              <h3 className="font-black text-base text-[#242424]">Buat Akun Kasir Baru</h3>
              <button
                onClick={closeAddModal}
                aria-label="Tutup"
                className="p-1 rounded-full hover:bg-[#F1F1EF] text-[#737373]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              {formError && <FormError message={formError} />}

              <div>
                <label className="block font-bold text-[#525252] mb-1">ID Login (otomatis)</label>
                <div className="w-full px-3 py-2 bg-[#F1F1EF] border border-[#F1F1EF] rounded-[8px] font-mono font-bold text-[#242424]">
                  {nextKasirLoginId}
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#525252] mb-1">Nama Lengkap Kasir</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Siti Aisyah"
                  className="w-full px-3 py-2 bg-[#FAFAF9] border border-[#F1F1EF] rounded-[8px] focus:outline-none focus:border-[#F47C0B]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#525252] mb-1">Nomor WhatsApp / HP</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 0857 3333 4400"
                  className="w-full px-3 py-2 bg-[#FAFAF9] border border-[#F1F1EF] rounded-[8px] focus:outline-none focus:border-[#F47C0B]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#525252] mb-1">Shift Kerja</label>
                <select
                  value={formData.shift}
                  onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAFAF9] border border-[#F1F1EF] rounded-[8px] focus:outline-none focus:border-[#F47C0B]"
                >
                  {SHIFT_OPTIONS.map((shift) => (
                    <option key={shift} value={shift}>
                      {shift}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#525252] mb-1">Password Awal</label>
                <input
                  type="password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={`Min ${MIN_PASSWORD_LENGTH} karakter`}
                  className="w-full px-3 py-2 bg-[#FAFAF9] border border-[#F1F1EF] rounded-[8px] focus:outline-none focus:border-[#F47C0B]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="flex-1 py-2.5 bg-[#F1F1EF] text-[#525252] font-bold rounded-[8px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-2 py-2.5 wkm-gradient-bg text-white font-bold rounded-[8px] shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan & Buat Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT KASIR */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[16px] max-w-md w-full p-6 wkm-modal-shadow border border-[#F1F1EF]">
            <div className="flex items-center justify-between border-b border-[#F1F1EF] pb-3 mb-4">
              <h3 className="font-black text-base text-[#242424]">Edit Data Kasir</h3>
              <button
                onClick={() => setEditingMember(null)}
                aria-label="Tutup"
                className="p-1 rounded-full hover:bg-[#F1F1EF] text-[#737373]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              {formError && <FormError message={formError} />}

              <div>
                <label className="block font-bold text-[#525252] mb-1">ID Login</label>
                <div className="w-full px-3 py-2 bg-[#F1F1EF] border border-[#F1F1EF] rounded-[8px] font-mono font-bold text-[#242424]">
                  {editingMember.loginId}
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#525252] mb-1">Nama Kasir</label>
                <input
                  type="text"
                  required
                  value={editingMember.name}
                  onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAFAF9] border border-[#F1F1EF] rounded-[8px] focus:outline-none focus:border-[#F47C0B]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#525252] mb-1">Nomor WhatsApp / HP</label>
                <input
                  type="text"
                  required
                  value={editingMember.phone}
                  onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAFAF9] border border-[#F1F1EF] rounded-[8px] focus:outline-none focus:border-[#F47C0B]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#525252] mb-1">Shift Kerja</label>
                <select
                  value={editingMember.shift}
                  onChange={(e) => setEditingMember({ ...editingMember, shift: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAFAF9] border border-[#F1F1EF] rounded-[8px] focus:outline-none focus:border-[#F47C0B]"
                >
                  {SHIFT_OPTIONS.map((shift) => (
                    <option key={shift} value={shift}>
                      {shift}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#525252] mb-1">Status Keaktifan</label>
                <select
                  value={editingMember.status}
                  onChange={(e) => setEditingMember({ ...editingMember, status: e.target.value as AccountStatus })}
                  className="w-full px-3 py-2 bg-[#FAFAF9] border border-[#F1F1EF] rounded-[8px] focus:outline-none focus:border-[#F47C0B]"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="flex-1 py-2.5 bg-[#F1F1EF] text-[#525252] font-bold rounded-[8px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-2 py-2.5 wkm-gradient-bg text-white font-bold rounded-[8px] shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREDENTIALS (after create / reset) */}
      {credentialNotice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[16px] max-w-sm w-full p-6 wkm-modal-shadow border border-[#F1F1EF] text-center">
            <div className="w-12 h-12 rounded-[12px] bg-[#FFF7E8] text-[#F47C0B] flex items-center justify-center mx-auto mb-3">
              <KeyRound className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-base text-[#242424] mb-1">{credentialNotice.title}</h3>
            <p className="text-xs text-[#525252] mb-4">
              Berikan data login ini ke <strong>{credentialNotice.name}</strong>:
            </p>

            <div className="space-y-2 mb-3 text-left">
              <CredentialRow label="ID Login" value={credentialNotice.loginId} onCopy={copyToClipboard} />
              {credentialNotice.password && (
                <CredentialRow label="Password" value={credentialNotice.password} onCopy={copyToClipboard} />
              )}
            </div>

            <p className="text-[11px] text-[#737373] mb-4">
              Password tidak akan ditampilkan lagi. Minta kasir menggantinya di menu Profile setelah login.
            </p>

            <button
              onClick={() => setCredentialNotice(null)}
              className="w-full py-2.5 bg-[#242424] hover:bg-black text-white font-bold text-xs rounded-[8px]"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const FormError: React.FC<{ message: string }> = ({ message }) => (
  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-[8px] flex items-start gap-2">
    <AlertTriangle className="w-4 h-4 shrink-0" />
    <span>{message}</span>
  </div>
);

const CredentialRow: React.FC<{ label: string; value: string; onCopy: (value: string, label: string) => void }> = ({
  label,
  value,
  onCopy,
}) => (
  <div>
    <span className="block text-[10px] font-bold uppercase tracking-wider text-[#737373] mb-1">{label}</span>
    <div className="p-3 bg-[#FFF7E8] border border-[#FFB21A]/40 rounded-[8px] font-mono font-black text-sm text-[#F47C0B] flex items-center justify-between">
      <span>{value}</span>
      <button
        onClick={() => onCopy(value, label)}
        className="p-1 hover:bg-white rounded text-[#525252]"
        title={`Salin ${label.toLowerCase()}`}
        aria-label={`Salin ${label.toLowerCase()}`}
      >
        <Copy className="w-4 h-4" />
      </button>
    </div>
  </div>
);
