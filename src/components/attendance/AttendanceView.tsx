'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { playChime } from '@/utils/format';
import { UserCheck, Clock, Calendar, CheckCircle2, AlertCircle, Search, User } from 'lucide-react';

export const AttendanceView: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([
    {
      id: 'att-1',
      name: 'Bang Hendra (Owner)',
      role: 'Owner Admin',
      date: '16 Sep 2026',
      checkIn: '07:45 WIB',
      checkOut: '-',
      status: 'Hadir',
      statusClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    {
      id: 'att-2',
      name: 'Siti Rahma',
      role: 'Kasir Shift Pagi',
      date: '16 Sep 2026',
      checkIn: '07:55 WIB',
      checkOut: '-',
      status: 'Hadir',
      statusClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    {
      id: 'att-3',
      name: 'Rian Pratama',
      role: 'Barista',
      date: '16 Sep 2026',
      checkIn: '08:15 WIB',
      checkOut: '-',
      status: 'Terlambat',
      statusClass: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    {
      id: 'att-4',
      name: 'Dinda Ayu',
      role: 'Kitchen Helper',
      date: '16 Sep 2026',
      checkIn: '-',
      checkOut: '-',
      status: 'Izin',
      statusClass: 'bg-stone-100 text-stone-700 border-stone-300',
    },
  ]);

  const [notification, setNotification] = useState('');

  const handleCheckIn = () => {
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    setNotification(`Absen Masuk ${user?.name} berhasil dicatat pada ${time}!`);
    playChime('success');
    setTimeout(() => setNotification(''), 4000);
  };

  const handleCheckOut = () => {
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    setNotification(`Absen Pulang ${user?.name} berhasil dicatat pada ${time}!`);
    playChime('success');
    setTimeout(() => setNotification(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-neutral-900 tracking-tight font-sans">
            Absensi & Kehadiran Karyawan
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Presensi harian barista, kasir, dan staf dapur Warkop Wong Kito.
          </p>
        </div>

        {/* Quick Check-in / Check-out */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCheckIn}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Absen Masuk</span>
          </button>
          <button
            onClick={handleCheckOut}
            className="px-4 py-2 bg-stone-800 hover:bg-neutral-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Absen Pulang</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Attendance Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Nama Staf</th>
                <th className="py-3.5 px-4">Posisi / Role</th>
                <th className="py-3.5 px-4">Tanggal</th>
                <th className="py-3.5 px-4">Jam Masuk</th>
                <th className="py-3.5 px-4">Jam Pulang</th>
                <th className="py-3.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-stone-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-neutral-900">{r.name}</td>
                  <td className="py-3.5 px-4 text-stone-600">{r.role}</td>
                  <td className="py-3.5 px-4 text-stone-500">{r.date}</td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-neutral-800">{r.checkIn}</td>
                  <td className="py-3.5 px-4 font-mono text-stone-500">{r.checkOut}</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${r.statusClass}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
