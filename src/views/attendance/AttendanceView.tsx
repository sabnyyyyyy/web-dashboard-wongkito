'use client';

import React, { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, History, LogIn, LogOut, Pencil, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAttendance, useAttendanceCorrections } from '@/hooks/useAttendance';
import { useToast } from '@/hooks/useToast';
import { formatDisplayDate, formatDuration, formatTime, STATUS_LABEL, todayDateInput } from '@/lib/attendance';
import { playChime } from '@/utils/format';
import type { AttendanceCorrection, AttendanceRecord, AttendanceStatus } from '@/types';

const PAGE_SIZE = 5;

type CorrectionForm = {
  checkInTime: string;
  checkOutTime: string;
  status: AttendanceStatus;
  reason: string;
};

const messageOf = (err: unknown): string => (err instanceof Error ? err.message : 'Terjadi kesalahan. Coba lagi.');

export const AttendanceView: React.FC = () => {
  const { user } = useAuth();
  const isOwner = user?.role === 'superadmin';
  const today = todayDateInput();

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [employee, setEmployee] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | AttendanceStatus>('Semua');
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<AttendanceRecord | null>(null);
  const [showCorrection, setShowCorrection] = useState(false);
  const [correction, setCorrection] = useState<CorrectionForm>({
    checkInTime: '',
    checkOutTime: '',
    status: 'Hadir',
    reason: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastVariant, setToastVariant] = useState<'success' | 'error'>('success');

  const { toastMessage, showToast } = useToast();

  const invalidRange = !!from && !!to && from > to;
  const activeFrom = isOwner && !invalidRange ? from || null : null;
  const activeTo = isOwner && !invalidRange ? to || null : null;

  const { attendance, today: myToday, isLoading, error, checkIn, checkOut, correctAttendance } = useAttendance({
    from: activeFrom,
    to: activeTo,
  });
  // Separate SWR key so the "today" cards never follow the table's date filter.
  const { attendance: todaySummary, isLoading: todaySummaryLoading } = useAttendance({
    from: isOwner ? today : null,
    to: isOwner ? today : null,
  });
  const { corrections, isLoading: correctionsLoading, error: correctionsError } = useAttendanceCorrections(
    isOwner ? selected?.id ?? null : null
  );

  const filtered = useMemo(() => {
    let rows = attendance;
    if (isOwner) {
      const keyword = employee.trim().toLowerCase();
      if (keyword) {
        rows = rows.filter(
          (row) =>
            row.staffName.toLowerCase().includes(keyword) || row.loginId.toLowerCase().includes(keyword)
        );
      }
      if (statusFilter !== 'Semua') rows = rows.filter((row) => row.status === statusFilter);
    }
    return rows;
  }, [attendance, employee, isOwner, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const displayedLogs = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const columnCount = isOwner ? 8 : 7;

  const hadirCount = todaySummary.filter((row) => row.status === 'Hadir').length;
  const terlambatCount = todaySummary.filter((row) => row.status === 'Terlambat').length;

  const statusPresensi: 'BELUM ABSEN' | 'HADIR' | 'TERLAMBAT' | 'SELESAI' = !myToday
    ? 'BELUM ABSEN'
    : myToday.checkOutTime
      ? 'SELESAI'
      : myToday.status === 'Terlambat'
        ? 'TERLAMBAT'
        : 'HADIR';

  const notifySuccess = (message: string) => {
    setToastVariant('success');
    showToast(message);
  };
  const notifyError = (message: string) => {
    setToastVariant('error');
    showToast(message);
  };

  const handleAbsenMasuk = async () => {
    if (hasCheckedIn) return;
    try {
      playChime('click');
      await checkIn();
      playChime('success');
      notifySuccess('Absen Masuk berhasil dicatat.');
    } catch (err) {
      playChime('alert');
      notifyError(messageOf(err));
    }
  };

  const hasCheckedIn = !!myToday;
  const hasCheckedOut = !!myToday?.checkOutTime;

  const handleAbsenPulang = async () => {
    if (!hasCheckedIn || hasCheckedOut) return;
    try {
      playChime('click');
      await checkOut();
      playChime('success');
      notifySuccess('Absen Pulang berhasil dicatat.');
    } catch (err) {
      playChime('alert');
      notifyError(messageOf(err));
    }
  };

  const openDetail = (row: AttendanceRecord) => {
    setSelected(row);
    setCorrection({
      checkInTime: row.checkInTime,
      checkOutTime: row.checkOutTime ?? '',
      status: row.status,
      reason: '',
    });
    setFormError('');
    setShowCorrection(false);
  };

  const submitCorrection = async () => {
    if (!selected) return;
    const reason = correction.reason.trim();
    if (!reason) {
      setFormError('Alasan koreksi wajib diisi.');
      return;
    }
    if (correction.checkOutTime && correction.checkInTime && correction.checkOutTime < correction.checkInTime) {
      setFormError('Waktu check-out tidak boleh lebih awal dari check-in.');
      return;
    }

    const body: { checkInTime?: string; checkOutTime?: string; status?: AttendanceStatus; reason: string } = { reason };
    if (correction.checkInTime && correction.checkInTime !== selected.checkInTime) {
      body.checkInTime = correction.checkInTime;
    }
    if (correction.checkOutTime && correction.checkOutTime !== selected.checkOutTime) {
      body.checkOutTime = correction.checkOutTime;
    }
    if (correction.status !== selected.status) body.status = correction.status;
    if (Object.keys(body).length === 1) {
      setFormError('Tidak ada data yang diubah.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      const updated = await correctAttendance(selected.id, body);
      setSelected(updated);
      setShowCorrection(false);
      playChime('success');
      notifySuccess('Koreksi absensi berhasil disimpan.');
    } catch (err) {
      playChime('alert');
      setFormError(messageOf(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFilters = () => {
    setFrom('');
    setTo('');
    setEmployee('');
    setStatusFilter('Semua');
    setCurrentPage(1);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#1C1C1E] text-white px-4 py-2.5 rounded-[10px] text-xs font-bold flex items-center gap-2 shadow-lg animate-fade-in">
          {toastVariant === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
          <span>{toastMessage}</span>
        </div>
      )}

      <div>
        <h1 className="text-xl md:text-2xl font-black text-[#242424] tracking-tight uppercase">ABSENSI</h1>
        <p className="text-xs md:text-sm text-[#737373] mt-1 font-normal">
          {isOwner
            ? 'Pantau dan koreksi presensi seluruh karyawan Warkop Wong Kito.'
            : 'Pencatatan presensi masuk dan pulang kerja karyawan.'}
        </p>
      </div>

      {/* KEHADIRAN HARI INI */}
      <div className="bg-white rounded-[10px] border border-[#E5E7EB] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-5">
        <div>
          <h2 className="font-bold text-xs md:text-sm text-[#242424] uppercase tracking-wider">KEHADIRAN HARI INI</h2>
          <div className="w-full h-px bg-[#E5E7EB] mt-3" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-3 bg-white rounded-[6px] border border-[#E5E7EB] space-y-0.5">
            <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block">TANGGAL</span>
            <div className="font-bold text-xs md:text-sm text-[#242424] leading-tight">{formatDisplayDate(today)}</div>
            <span className="text-[10px] text-[#737373] block">Asia/Jakarta</span>
          </div>

          <div className="p-3 bg-white rounded-[6px] border border-[#E5E7EB] space-y-0.5">
            <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block">SHIFT KERJA</span>
            <div className="font-bold text-xs md:text-sm text-[#242424] leading-tight">
              {isOwner ? 'Seluruh Karyawan' : user?.shift || 'Shift tidak ditentukan'}
            </div>
            <span className="text-[10px] text-[#737373] block">{isOwner ? 'Data dari server' : 'Dari akun Anda'}</span>
          </div>

          <div className="p-3 bg-white rounded-[6px] border border-[#E5E7EB] space-y-0.5">
            <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block">STATUS PRESENSI</span>
            <div>
              <span className="inline-block border border-emerald-300 text-emerald-600 bg-emerald-50 rounded-[4px] px-2 py-0.5 text-[10px] font-bold uppercase leading-tight">
                {isOwner ? 'VIEW ONLY' : statusPresensi}
              </span>
            </div>
            <span className="text-[10px] text-[#737373] block">
              {isOwner ? 'Owner hanya melihat & mengoreksi' : 'Toleransi keterlambatan 15 menit'}
            </span>
          </div>

          <div className="p-3 bg-white rounded-[6px] border border-[#E5E7EB] space-y-0.5">
            <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block">JAM MASUK</span>
            <div className="font-bold text-xs md:text-sm text-[#242424] leading-tight">
              {isOwner ? `${hadirCount} Hadir` : formatTime(myToday?.checkInTime)}
            </div>
            <span className="text-[10px] text-[#737373] block">
              {(isOwner ? todaySummaryLoading : isLoading) ? 'Memuat...' : 'Dari server'}
            </span>
          </div>

          <div className="p-3 bg-white rounded-[6px] border border-[#E5E7EB] space-y-0.5">
            <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block">JAM PULANG</span>
            <div className="font-bold text-xs md:text-sm text-[#242424] leading-tight">
              {isOwner ? `${terlambatCount} Terlambat` : formatTime(myToday?.checkOutTime)}
            </div>
            <span className="text-[10px] text-[#737373] block">{isOwner ? 'Hari ini, sesuai data' : 'Dari server'}</span>
          </div>
        </div>

        {isOwner ? (
          <p className="text-[11px] text-[#737373]">
            Owner tidak dapat melakukan check-in/check-out. Gunakan tombol detail pada riwayat untuk mengoreksi data.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={handleAbsenMasuk}
              disabled={hasCheckedIn}
              className={`px-4 py-2 rounded-[6px] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                !hasCheckedIn
                  ? 'bg-[#F47C0B] hover:bg-[#EA580C] text-white shadow-2xs cursor-pointer'
                  : 'bg-[#F1F1EF] text-[#9CA3AF] border border-[#E5E7EB] cursor-not-allowed'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>ABSEN MASUK</span>
            </button>

            <button
              onClick={handleAbsenPulang}
              disabled={!hasCheckedIn || hasCheckedOut}
              className={`px-4 py-2 rounded-[6px] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                hasCheckedIn && !hasCheckedOut
                  ? 'bg-[#1C1C1E] hover:bg-black text-white shadow-2xs cursor-pointer'
                  : 'bg-[#EAEAEA] text-[#9CA3AF] cursor-not-allowed border border-transparent'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ABSEN PULANG</span>
            </button>
          </div>
        )}
      </div>

      {/* RIWAYAT ABSENSI */}
      <div className="space-y-3">
        <h2 className="font-bold text-xs md:text-sm text-[#242424] uppercase tracking-wider">RIWAYAT ABSENSI</h2>

        {isOwner && (
          <div className="bg-white rounded-[10px] border border-[#E5E7EB] p-4 flex flex-wrap items-end gap-3 text-xs">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">DARI</span>
              <input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className="px-2.5 py-1.5 border border-[#E5E7EB] rounded-[6px] text-xs text-[#242424]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">SAMPAI</span>
              <input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className="px-2.5 py-1.5 border border-[#E5E7EB] rounded-[6px] text-xs text-[#242424]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">KARYAWAN</span>
              <input
                type="text"
                value={employee}
                onChange={(event) => setEmployee(event.target.value)}
                placeholder="Nama atau ID login"
                className="px-2.5 py-1.5 border border-[#E5E7EB] rounded-[6px] text-xs text-[#242424] w-44"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">STATUS</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as 'Semua' | AttendanceStatus)}
                className="px-2.5 py-1.5 border border-[#E5E7EB] rounded-[6px] text-xs text-[#242424]"
              >
                <option value="Semua">Semua</option>
                <option value="Hadir">Hadir</option>
                <option value="Terlambat">Terlambat</option>
              </select>
            </label>
            <button
              onClick={resetFilters}
              className="px-3 py-1.5 border border-[#E5E7EB] rounded-[6px] text-[10px] font-bold text-[#525252] uppercase cursor-pointer hover:bg-stone-50"
            >
              RESET
            </button>
            {invalidRange && (
              <span className="text-[10px] font-bold text-red-600">Tanggal awal tidak boleh setelah tanggal akhir.</span>
            )}
          </div>
        )}

        <div className="bg-white rounded-[10px] border border-[#E5E7EB] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5F5F4] border-b border-[#E5E7EB] text-[#525252] text-[10px] md:text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 md:px-5 font-bold w-14">#</th>
                  {isOwner && <th className="py-3 px-4 md:px-5 font-bold">NAMA KARYAWAN</th>}
                  <th className="py-3 px-4 md:px-5 font-bold">TANGGAL</th>
                  <th className="py-3 px-4 md:px-5 font-bold">JAM MASUK</th>
                  <th className="py-3 px-4 md:px-5 font-bold">JAM PULANG</th>
                  <th className="py-3 px-4 md:px-5 font-bold">DURASI KERJA</th>
                  <th className="py-3 px-4 md:px-5 font-bold">STATUS</th>
                  {isOwner && <th className="py-3 px-4 md:px-5 font-bold">AKSI</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-xs">
                {isLoading && (
                  <tr>
                    <td colSpan={columnCount} className="py-6 px-5 text-center text-[#737373]">
                      Memuat data absensi...
                    </td>
                  </tr>
                )}
                {!isLoading && error && (
                  <tr>
                    <td colSpan={columnCount} className="py-6 px-5 text-center text-red-600">
                      {messageOf(error)}
                    </td>
                  </tr>
                )}
                {!isLoading && !error && displayedLogs.length === 0 && (
                  <tr>
                    <td colSpan={columnCount} className="py-6 px-5 text-center text-[#737373]">
                      Tidak ada data absensi.
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  !error &&
                  displayedLogs.map((log, index) => (
                    <tr key={log.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3.5 px-4 md:px-5 text-[#737373] font-medium">
                        {String((page - 1) * PAGE_SIZE + index + 1).padStart(2, '0')}
                      </td>
                      {isOwner && (
                        <td className="py-3.5 px-4 md:px-5 font-bold text-[#242424]">
                          {log.staffName}
                          <span className="block text-[10px] font-normal text-[#737373]">{log.loginId}</span>
                        </td>
                      )}
                      <td className="py-3.5 px-4 md:px-5 font-bold text-[#242424]">{formatDisplayDate(log.date)}</td>
                      <td className="py-3.5 px-4 md:px-5 font-semibold text-[#242424]">{formatTime(log.checkInTime)}</td>
                      <td className="py-3.5 px-4 md:px-5 text-[#525252]">{formatTime(log.checkOutTime)}</td>
                      <td className="py-3.5 px-4 md:px-5 text-[#525252]">{formatDuration(log.durationMinutes)}</td>
                      <td className="py-3.5 px-4 md:px-5">
                        <span
                          className={`inline-block rounded-[4px] px-2.5 py-0.5 text-[10px] font-semibold border ${
                            log.status === 'Hadir'
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-600'
                              : 'border-red-300 bg-red-50 text-red-600'
                          }`}
                        >
                          {STATUS_LABEL[log.status]}
                        </span>
                      </td>
                      {isOwner && (
                        <td className="py-3.5 px-4 md:px-5">
                          <button
                            onClick={() => openDetail(log)}
                            className="px-2.5 py-1 bg-white hover:bg-[#F5F5F4] border border-[#E5E7EB] text-[#525252] hover:text-[#242424] text-[10px] font-bold rounded-[6px] cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            DETAIL
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white border-t border-[#E5E7EB] p-3 px-4 md:px-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">
              TAMPILKAN {displayedLogs.length} DARI {filtered.length} LOG PRESENSI
            </span>
            <div className="flex items-center gap-1.5 text-xs">
              <button
                disabled={page === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="px-2.5 py-0.5 text-[10px] font-bold border border-[#D1D5DB] rounded-[4px] text-[#737373] hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed uppercase transition-colors cursor-pointer"
              >
                &laquo; SEBELUMNYA
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-2 py-0.5 rounded-[4px] text-xs font-bold transition-colors cursor-pointer ${
                    page === pageNum ? 'bg-[#1C1C1E] text-white' : 'border border-[#D1D5DB] text-[#525252] hover:bg-stone-50'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              <button
                disabled={page === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className="px-2.5 py-0.5 text-[10px] font-bold border border-[#D1D5DB] rounded-[4px] text-[#737373] hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed uppercase transition-colors cursor-pointer"
              >
                SELANJUTNYA &raquo;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rekap */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#F5F5F4]/70 rounded-[10px] border border-[#E5E7EB] p-4 space-y-1">
          <span className="text-[10px] font-bold text-[#525252] uppercase tracking-wider block">INFORMASI</span>
          <p className="text-xs text-[#737373]">
            Waktu absensi ditentukan oleh server. {isOwner ? 'Koreksi Owner selalu dicatat dalam riwayat.' : 'Kasir hanya dapat mengabsen dirinya sendiri.'}
          </p>
        </div>
        <div className="bg-[#F5F5F4]/70 rounded-[10px] border border-[#E5E7EB] p-4 space-y-1.5">
          <span className="text-[10px] font-bold text-[#525252] uppercase tracking-wider block">REKAP</span>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#525252]">Total Hadir:</span>
              <span className="font-bold text-[#242424]">{filtered.filter((row) => row.status === 'Hadir').length} Hari</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#525252]">Total Terlambat:</span>
              <span className="font-bold text-red-600">{filtered.filter((row) => row.status === 'Terlambat').length} Kali</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detail + koreksi (Owner only) */}
      {isOwner && selected && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-[12px] max-w-lg w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-[#242424] uppercase tracking-wider">DETAIL ABSENSI</h2>
              <button onClick={() => setSelected(null)} className="text-[#737373] hover:text-[#242424] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="block text-[10px] font-bold text-[#737373] uppercase">Karyawan</span>
                <span className="font-semibold text-[#242424]">{selected.staffName}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-[#737373] uppercase">Login ID</span>
                <span className="font-mono text-[#242424]">{selected.loginId}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-[#737373] uppercase">Tanggal</span>
                <span className="text-[#242424]">{formatDisplayDate(selected.date)}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-[#737373] uppercase">Status</span>
                <span className="text-[#242424]">{STATUS_LABEL[selected.status]}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-[#737373] uppercase">Jam Masuk</span>
                <span className="text-[#242424]">{formatTime(selected.checkInTime)}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-[#737373] uppercase">Jam Pulang</span>
                <span className="text-[#242424]">{formatTime(selected.checkOutTime)}</span>
              </div>
            </div>

            <div className="border-t border-[#E5E7EB] pt-3 space-y-2">
              <h3 className="text-[10px] font-bold text-[#737373] uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" /> RIWAYAT KOREKSI
              </h3>
              {correctionsLoading && <p className="text-xs text-[#737373]">Memuat riwayat...</p>}
              {!correctionsLoading && correctionsError && (
                <p className="text-xs text-red-600">{messageOf(correctionsError)}</p>
              )}
              {!correctionsLoading && !correctionsError && corrections.length === 0 && (
                <p className="text-xs text-[#737373]">Belum ada koreksi.</p>
              )}
              {corrections.map((item: AttendanceCorrection) => (
                <div key={item.id} className="bg-[#FAFAF9] rounded-[8px] p-2.5 text-[11px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#242424]">{item.correctedBy}</span>
                    <span className="text-[#737373]">{item.correctedAt} WIB</span>
                  </div>
                  <p className="text-[#525252]">
                    {formatTime(item.before.checkInTime)} → {formatTime(item.after.checkInTime)} ·{' '}
                    {formatTime(item.before.checkOutTime)} → {formatTime(item.after.checkOutTime)} ·{' '}
                    {STATUS_LABEL[item.before.status]} → {STATUS_LABEL[item.after.status]}
                  </p>
                  <p className="text-[#737373] italic">Alasan: {item.reason}</p>
                </div>
              ))}
            </div>

            {!showCorrection ? (
              <button
                onClick={() => setShowCorrection(true)}
                className="w-full px-4 py-2 bg-[#F47C0B] hover:bg-[#EA580C] text-white font-bold rounded-[8px] text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" /> KOREKSI DATA
              </button>
            ) : (
              <div className="border-t border-[#E5E7EB] pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-[#737373] uppercase">Check-in</span>
                    <input
                      type="time"
                      value={correction.checkInTime}
                      onChange={(event) => setCorrection((prev) => ({ ...prev, checkInTime: event.target.value }))}
                      className="px-2.5 py-1.5 border border-[#E5E7EB] rounded-[6px] text-xs"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-[#737373] uppercase">Check-out</span>
                    <input
                      type="time"
                      value={correction.checkOutTime}
                      onChange={(event) => setCorrection((prev) => ({ ...prev, checkOutTime: event.target.value }))}
                      className="px-2.5 py-1.5 border border-[#E5E7EB] rounded-[6px] text-xs"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-[#737373] uppercase">Status</span>
                    <select
                      value={correction.status}
                      onChange={(event) =>
                        setCorrection((prev) => ({ ...prev, status: event.target.value as AttendanceStatus }))
                      }
                      className="px-2.5 py-1.5 border border-[#E5E7EB] rounded-[6px] text-xs"
                    >
                      <option value="Hadir">Hadir</option>
                      <option value="Terlambat">Terlambat</option>
                    </select>
                  </label>
                </div>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[#737373] uppercase">Alasan Koreksi (wajib)</span>
                  <textarea
                    value={correction.reason}
                    onChange={(event) => setCorrection((prev) => ({ ...prev, reason: event.target.value }))}
                    rows={3}
                    className="px-2.5 py-1.5 border border-[#E5E7EB] rounded-[6px] text-xs"
                    placeholder="Contoh: salah input jam masuk sesuai bukti absensi"
                  />
                </label>
                {formError && <p className="text-xs text-red-600">{formError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCorrection(false)}
                    className="px-3 py-2 border border-[#E5E7EB] rounded-[8px] text-xs font-bold text-[#525252] cursor-pointer"
                  >
                    BATAL
                  </button>
                  <button
                    onClick={submitCorrection}
                    disabled={isSubmitting}
                    className="px-3 py-2 bg-[#1C1C1E] hover:bg-black text-white font-bold rounded-[8px] text-xs cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? 'MENYIMPAN...' : 'SIMPAN KOREKSI'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
