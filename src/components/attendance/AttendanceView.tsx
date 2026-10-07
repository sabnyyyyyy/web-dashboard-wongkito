'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { playChime } from '@/utils/format';
import { LogIn, LogOut, CheckCircle2 } from 'lucide-react';

interface AttendanceLog {
  no: string;
  tanggal: string;
  jamMasuk: string;
  jamPulang: string;
  durasiKerja: string;
  status: 'Hadir' | 'Terlambat' | 'Libur' | 'Izin';
  isLate?: boolean;
}

const INITIAL_LOGS_PAGE_1: AttendanceLog[] = [
  {
    no: '01',
    tanggal: '16 Sep 2026',
    jamMasuk: '08:02 WIB',
    jamPulang: '17:05 WIB',
    durasiKerja: '9 Jam 3 Menit',
    status: 'Hadir',
  },
  {
    no: '02',
    tanggal: '15 Sep 2026',
    jamMasuk: '08:17 WIB',
    jamPulang: '17:02 WIB',
    durasiKerja: '8 Jam 45 Menit',
    status: 'Terlambat',
    isLate: true,
  },
  {
    no: '03',
    tanggal: '14 Sep 2026',
    jamMasuk: '07:58 WIB',
    jamPulang: '17:10 WIB',
    durasiKerja: '9 Jam 12 Menit',
    status: 'Hadir',
  },
  {
    no: '04',
    tanggal: '13 Sep 2026',
    jamMasuk: '08:00 WIB',
    jamPulang: '16:55 WIB',
    durasiKerja: '8 Jam 55 Menit',
    status: 'Hadir',
  },
  {
    no: '05',
    tanggal: '12 Sep 2026',
    jamMasuk: '-- : --',
    jamPulang: '-- : --',
    durasiKerja: '--',
    status: 'Libur',
  },
];

const INITIAL_LOGS_PAGE_2: AttendanceLog[] = [
  {
    no: '06',
    tanggal: '11 Sep 2026',
    jamMasuk: '08:01 WIB',
    jamPulang: '17:00 WIB',
    durasiKerja: '8 Jam 59 Menit',
    status: 'Hadir',
  },
  {
    no: '07',
    tanggal: '10 Sep 2026',
    jamMasuk: '08:05 WIB',
    jamPulang: '17:15 WIB',
    durasiKerja: '9 Jam 10 Menit',
    status: 'Hadir',
  },
  {
    no: '08',
    tanggal: '09 Sep 2026',
    jamMasuk: '07:55 WIB',
    jamPulang: '17:00 WIB',
    durasiKerja: '9 Jam 5 Menit',
    status: 'Hadir',
  },
  {
    no: '09',
    tanggal: '08 Sep 2026',
    jamMasuk: '08:00 WIB',
    jamPulang: '17:05 WIB',
    durasiKerja: '9 Jam 5 Menit',
    status: 'Hadir',
  },
  {
    no: '10',
    tanggal: '07 Sep 2026',
    jamMasuk: '-- : --',
    jamPulang: '-- : --',
    durasiKerja: '--',
    status: 'Libur',
  },
];

const INITIAL_LOGS_PAGE_3: AttendanceLog[] = [
  {
    no: '11',
    tanggal: '06 Sep 2026',
    jamMasuk: '08:04 WIB',
    jamPulang: '17:00 WIB',
    durasiKerja: '8 Jam 56 Menit',
    status: 'Hadir',
  },
  {
    no: '12',
    tanggal: '05 Sep 2026',
    jamMasuk: '08:00 WIB',
    jamPulang: '17:00 WIB',
    durasiKerja: '9 Jam 0 Menit',
    status: 'Hadir',
  },
  {
    no: '13',
    tanggal: '04 Sep 2026',
    jamMasuk: '07:50 WIB',
    jamPulang: '17:10 WIB',
    durasiKerja: '9 Jam 20 Menit',
    status: 'Hadir',
  },
  {
    no: '14',
    tanggal: '03 Sep 2026',
    jamMasuk: '08:00 WIB',
    jamPulang: '17:00 WIB',
    durasiKerja: '9 Jam 0 Menit',
    status: 'Hadir',
  },
  {
    no: '15',
    tanggal: '02 Sep 2026',
    jamMasuk: '-- : --',
    jamPulang: '-- : --',
    durasiKerja: '--',
    status: 'Libur',
  },
];

export const AttendanceView: React.FC = () => {
  const { user } = useAuth();

  // Today attendance state
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [hasCheckedOut, setHasCheckedOut] = useState(false);
  const [checkInTime, setCheckInTime] = useState('-- : --');
  const [checkOutTime, setCheckOutTime] = useState('-- : --');
  const [statusPresensi, setStatusPresensi] = useState<'BELUM ABSEN' | 'HADIR' | 'SELESAI'>('BELUM ABSEN');
  const [toastMessage, setToastMessage] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);

  const getLogsForPage = (page: number) => {
    switch (page) {
      case 2:
        return INITIAL_LOGS_PAGE_2;
      case 3:
        return INITIAL_LOGS_PAGE_3;
      default:
        return INITIAL_LOGS_PAGE_1;
    }
  };

  const displayedLogs = getLogsForPage(currentPage);

  const handleAbsenMasuk = () => {
    if (hasCheckedIn) return;
    const now = new Date();
    const formatted = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;
    setCheckInTime(formatted);
    setHasCheckedIn(true);
    setStatusPresensi('HADIR');
    playChime('success');
    setToastMessage(`Absen Masuk berhasil dicatat (${formatted})`);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleAbsenPulang = () => {
    if (!hasCheckedIn || hasCheckedOut) return;
    const now = new Date();
    const formatted = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;
    setCheckOutTime(formatted);
    setHasCheckedOut(true);
    setStatusPresensi('SELESAI');
    playChime('success');
    setToastMessage(`Absen Pulang berhasil dicatat (${formatted})`);
    setTimeout(() => setToastMessage(''), 3500);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#1C1C1E] text-white px-4 py-2.5 rounded-[10px] text-xs font-bold flex items-center gap-2 shadow-lg animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-black text-[#242424] tracking-tight uppercase">
          ABSENSI
        </h1>
        <p className="text-xs md:text-sm text-[#737373] mt-1 font-normal">
          Pencatatan presensi masuk dan pulang kerja karyawan.
        </p>
      </div>

      {/* Card: KEHADIRAN HARI INI */}
      <div className="bg-white rounded-[10px] border border-[#E5E7EB] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-5">
        <div>
          <h2 className="font-bold text-xs md:text-sm text-[#242424] uppercase tracking-wider">
            KEHADIRAN HARI INI
          </h2>
          <div className="w-full h-px bg-[#E5E7EB] mt-3" />
        </div>

        {/* 5 Information metric boxes */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* TANGGAL */}
          <div className="p-3 bg-white rounded-[6px] border border-[#E5E7EB] space-y-0.5">
            <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block">
              TANGGAL
            </span>
            <div className="font-bold text-xs md:text-sm text-[#242424] leading-tight">
              16 September 2026
            </div>
            <span className="text-[10px] text-[#737373] block">
              Rabu (Pekan ke-38)
            </span>
          </div>

          {/* SHIFT KERJA */}
          <div className="p-3 bg-white rounded-[6px] border border-[#E5E7EB] space-y-0.5">
            <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block">
              SHIFT KERJA
            </span>
            <div className="font-bold text-xs md:text-sm text-[#242424] leading-tight">
              Shift Pagi
            </div>
            <span className="text-[10px] text-[#737373] block">
              ( 08:00 - 16:00 WIB )
            </span>
          </div>

          {/* STATUS PRESENSI */}
          <div className="p-3 bg-white rounded-[6px] border border-[#E5E7EB] space-y-0.5">
            <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block">
              STATUS PRESENSI
            </span>
            <div>
              {statusPresensi === 'BELUM ABSEN' ? (
                <span className="inline-block border border-red-300 text-red-600 bg-red-50/60 rounded-[4px] px-2 py-0.5 text-[10px] font-bold uppercase leading-tight">
                  BELUM ABSEN
                </span>
              ) : statusPresensi === 'HADIR' ? (
                <span className="inline-block border border-emerald-300 text-emerald-600 bg-emerald-50 rounded-[4px] px-2 py-0.5 text-[10px] font-bold uppercase leading-tight">
                  HADIR
                </span>
              ) : (
                <span className="inline-block border border-blue-300 text-blue-600 bg-blue-50 rounded-[4px] px-2 py-0.5 text-[10px] font-bold uppercase leading-tight">
                  SELESAI SHIFT
                </span>
              )}
            </div>
            <span className="text-[10px] text-[#737373] block">
              Toleransi s/d 08:15 WIB
            </span>
          </div>

          {/* JAM MASUK */}
          <div className="p-3 bg-white rounded-[6px] border border-[#E5E7EB] space-y-0.5">
            <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block">
              JAM MASUK
            </span>
            <div className={`font-bold text-xs md:text-sm leading-tight ${hasCheckedIn ? 'text-[#242424]' : 'text-[#737373]'}`}>
              {checkInTime}
            </div>
            <span className="text-[10px] text-[#737373] block">
              Target: 08:00 WIB
            </span>
          </div>

          {/* JAM PULANG */}
          <div className="p-3 bg-white rounded-[6px] border border-[#E5E7EB] space-y-0.5">
            <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block">
              JAM PULANG
            </span>
            <div className={`font-bold text-xs md:text-sm leading-tight ${hasCheckedOut ? 'text-[#242424]' : 'text-[#737373]'}`}>
              {checkOutTime}
            </div>
            <span className="text-[10px] text-[#737373] block">
              Target: 16:00 WIB
            </span>
          </div>
        </div>

        {/* Action Buttons: ABSEN MASUK & ABSEN PULANG */}
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
      </div>

      {/* Section: RIWAYAT ABSENSI */}
      <div className="space-y-3">
        <h2 className="font-bold text-xs md:text-sm text-[#242424] uppercase tracking-wider">
          RIWAYAT ABSENSI
        </h2>

        {/* Table Container */}
        <div className="bg-white rounded-[10px] border border-[#E5E7EB] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5F5F4] border-b border-[#E5E7EB] text-[#525252] text-[10px] md:text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 md:px-5 font-bold w-14">#</th>
                  <th className="py-3 px-4 md:px-5 font-bold">TANGGAL</th>
                  <th className="py-3 px-4 md:px-5 font-bold">JAM MASUK</th>
                  <th className="py-3 px-4 md:px-5 font-bold">JAM PULANG</th>
                  <th className="py-3 px-4 md:px-5 font-bold">DURASI KERJA</th>
                  <th className="py-3 px-4 md:px-5 font-bold">STATUS</th>
                  <th className="py-3 px-4 md:px-5 font-bold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-xs">
                {displayedLogs.map((log) => (
                  <tr key={log.no} className="hover:bg-stone-50/70 transition-colors">
                    {/* # */}
                    <td className="py-3.5 px-4 md:px-5 text-[#737373] font-medium">
                      {log.no}
                    </td>

                    {/* TANGGAL */}
                    <td className="py-3.5 px-4 md:px-5 font-bold text-[#242424]">
                      {log.tanggal}
                    </td>

                    {/* JAM MASUK */}
                    <td
                      className={`py-3.5 px-4 md:px-5 font-semibold ${
                        log.isLate ? 'text-red-600' : 'text-[#242424]'
                      }`}
                    >
                      {log.jamMasuk}
                    </td>

                    {/* JAM PULANG */}
                    <td className="py-3.5 px-4 md:px-5 text-[#525252]">
                      {log.jamPulang}
                    </td>

                    {/* DURASI KERJA */}
                    <td className="py-3.5 px-4 md:px-5 text-[#525252]">
                      {log.durasiKerja}
                    </td>

                    {/* STATUS */}
                    <td className="py-3.5 px-4 md:px-5">
                      {log.status === 'Hadir' && (
                        <span className="inline-block border border-emerald-300 bg-emerald-50 text-emerald-600 rounded-[4px] px-2.5 py-0.5 text-[10px] font-semibold">
                          Hadir
                        </span>
                      )}
                      {log.status === 'Terlambat' && (
                        <span className="inline-block border border-red-300 bg-red-50 text-red-600 rounded-[4px] px-2.5 py-0.5 text-[10px] font-semibold">
                          Terlambat
                        </span>
                      )}
                      {log.status === 'Libur' && (
                        <span className="inline-block border border-stone-300 border-dashed bg-stone-100 text-stone-500 rounded-[4px] px-2.5 py-0.5 text-[10px] font-semibold">
                          Libur
                        </span>
                      )}
                    </td>

                    {/* Empty cell to match screenshot spacing */}
                    <td className="py-3.5 px-4 md:px-5"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer: TAMPILKAN 5 DARI 30 LOG PRESENSI BULAN INI + PAGINATION */}
          <div className="bg-white border-t border-[#E5E7EB] p-3 px-4 md:px-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">
              TAMPILKAN 5 DARI 30 LOG PRESENSI BULAN INI
            </span>

            <div className="flex items-center gap-1.5 text-xs">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="px-2.5 py-0.5 text-[10px] font-bold border border-[#D1D5DB] rounded-[4px] text-[#737373] hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed uppercase transition-colors cursor-pointer"
              >
                &laquo; SEBELUMNYA
              </button>

              {[1, 2, 3].map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-2 py-0.5 rounded-[4px] text-xs font-bold transition-colors cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-[#1C1C1E] text-white'
                      : 'border border-[#D1D5DB] text-[#525252] hover:bg-stone-50'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                disabled={currentPage === 3}
                onClick={() => setCurrentPage((prev) => Math.min(3, prev + 1))}
                className="px-2.5 py-0.5 text-[10px] font-bold border border-[#D1D5DB] rounded-[4px] text-[#525252] hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed uppercase transition-colors cursor-pointer"
              >
                SELANJUTNYA &raquo;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Summary Cards: INFORMASI & REKAP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* INFORMASI */}
        <div className="bg-[#F5F5F4]/70 rounded-[10px] border border-[#E5E7EB] p-4 space-y-1">
          <span className="text-[10px] font-bold text-[#525252] uppercase tracking-wider block">
            INFORMASI
          </span>
          <p className="text-xs text-[#737373]">
            Jam masuk di atas 08:15 WIB ditandai otomatis sebagai terlambat.
          </p>
        </div>

        {/* REKAP */}
        <div className="bg-[#F5F5F4]/70 rounded-[10px] border border-[#E5E7EB] p-4 space-y-1.5">
          <span className="text-[10px] font-bold text-[#525252] uppercase tracking-wider block">
            REKAP
          </span>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#525252]">Total Kehadiran:</span>
              <span className="font-bold text-[#242424]">4 Hari</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#525252]">Total Terlambat:</span>
              <span className="font-bold text-red-600">1 Kali (17 Min)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
