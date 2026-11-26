import type { AttendanceStatus } from '@/types';

// Formatting helpers for server-provided attendance values. All times are already Asia/Jakarta
// wall-clock strings ("HH:mm"); dates are "YYYY-MM-DD".

export const formatDisplayDate = (date: string): string => {
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return date;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
};

export const todayDateInput = (): string => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
};

export const formatTime = (time?: string | null): string => (time ? `${time} WIB` : '-- : --');

export const formatDuration = (minutes: number | null | undefined): string => {
  if (typeof minutes !== 'number' || !Number.isFinite(minutes)) return '--';
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return `${hours} Jam ${rest} Menit`;
};

export const STATUS_LABEL: Record<AttendanceStatus, string> = {
  Hadir: 'Hadir',
  Terlambat: 'Terlambat',
};

export const isAttendanceStatus = (value: string): value is AttendanceStatus =>
  value === 'Hadir' || value === 'Terlambat';
