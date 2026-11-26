'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useSWRConfig } from 'swr';
import { useAuth } from '@/context/AuthContext';
import { useCache } from '@/hooks/useCache';
import { ApiError, api } from '@/utils/api';
import type { AttendanceCorrection, AttendanceRecord, AttendanceStatus } from '@/types';

// All attendance keys live in the same global SWR cache used by useMenu/useStock.
// The loginId is part of every key so data can never be shared between accounts.
export const attendanceKey = (loginId: string | null, from: string | null, to: string | null) =>
  loginId ? (['attendance', loginId, from, to] as const) : null;

export const attendanceTodayKey = (loginId: string | null) => (loginId ? (['attendance-today', loginId] as const) : null);

export const attendanceCorrectionKey = (loginId: string | null, attendanceId: string | null) =>
  loginId && attendanceId ? (['attendance-corrections', loginId, attendanceId] as const) : null;

const isAttendanceCacheKey = (key: unknown): boolean =>
  Array.isArray(key) && (key[0] === 'attendance' || key[0] === 'attendance-today' || key[0] === 'attendance-corrections');

// SWR stores keys as serialized strings in its global cache. The original array is kept as
// the internal `_k` field, so match against that and delete with the real cache key string.
type CacheEntryWithKey = { _k?: unknown };
const originalKeyOf = (cache: { get(key: string): unknown }, cacheKey: string): unknown =>
  (cache.get(cacheKey) as CacheEntryWithKey | undefined)?._k;
const isStaleAccountEntry = (cache: { get(key: string): unknown }, cacheKey: string, staleLoginId: string): boolean => {
  const original = originalKeyOf(cache, cacheKey);
  return isAttendanceCacheKey(original) && Array.isArray(original) && original[1] === staleLoginId;
};

const listPath = (from: string | null, to: string | null): string => {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const query = params.toString();
  return query ? `/api/attendance?${query}` : '/api/attendance';
};

export interface AttendanceCorrectionInput {
  checkInTime?: string;
  checkOutTime?: string;
  status?: AttendanceStatus;
  reason: string;
}

export const useAttendance = ({ from = null, to = null }: { from?: string | null; to?: string | null } = {}) => {
  const { user, logout } = useAuth();
  const loginId = user?.loginId ?? null;
  const { cache, mutate: mutateGlobal } = useSWRConfig();

  const path = listPath(from, to);
  const fetchList = useCallback(async () => (await api<{ attendance: AttendanceRecord[] }>(path)).attendance, [path]);
  const fetchToday = useCallback(async () => (await api<{ attendance: AttendanceRecord | null }>('/api/attendance/today')).attendance, []);

  const list = useCache<AttendanceRecord[]>(attendanceKey(loginId, from, to), fetchList);
  const today = useCache<AttendanceRecord | null>(attendanceTodayKey(loginId), fetchToday);

  const previousLoginId = useRef<string | null>(null);
  useEffect(() => {
    const staleLoginId = previousLoginId.current;
    previousLoginId.current = loginId;
    if (!staleLoginId || staleLoginId === loginId) return;
    // Account switch: delete the previous account's attendance entries from the SWR cache.
    // Deleting with the cache key string returned by keys() is valid for this SWR version.
    for (const cacheKey of cache.keys()) {
      if (isStaleAccountEntry(cache, cacheKey, staleLoginId)) cache.delete(cacheKey);
    }
  }, [cache, loginId]);

  const handledUnauthorizedLoginId = useRef<string | null>(null);
  useEffect(() => {
    if (!loginId) {
      handledUnauthorizedLoginId.current = null;
      return;
    }
    const unauthorized =
      (list.error instanceof ApiError && list.error.status === 401) ||
      (today.error instanceof ApiError && today.error.status === 401);
    if (!unauthorized || handledUnauthorizedLoginId.current === loginId) return;
    handledUnauthorizedLoginId.current = loginId;
    void logout();
  }, [list.error, loginId, logout, today.error]);

  const handleError = useCallback(
    (err: unknown): never => {
      if (err instanceof ApiError && err.status === 401) void logout();
      throw err;
    },
    [logout]
  );

  const revalidateAll = useCallback(async () => {
    if (!loginId) return;
    await mutateGlobal(
      (key) => isAttendanceCacheKey(key) && Array.isArray(key) && key[1] === loginId,
      undefined,
      { revalidate: true }
    );
  }, [loginId, mutateGlobal]);

  const applyMutation = useCallback(
    async (requestPath: string, method: string, body?: unknown): Promise<AttendanceRecord> => {
      try {
        const { attendance } = await api<{ attendance: AttendanceRecord }>(requestPath, {
          method,
          ...(body === undefined ? {} : { body }),
        });
        // Only patch "today" when the mutated row belongs to the signed-in account.
        // An Owner correcting another employee must never overwrite their own card.
        if (attendance.loginId === loginId) {
          await mutateGlobal(attendanceTodayKey(loginId), attendance, { revalidate: false });
        }
        await revalidateAll();
        return attendance;
      } catch (err) {
        return handleError(err);
      }
    },
    [handleError, loginId, mutateGlobal, revalidateAll]
  );

  const checkIn = useCallback(() => applyMutation('/api/attendance/check-in', 'POST'), [applyMutation]);
  const checkOut = useCallback(() => applyMutation('/api/attendance/check-out', 'POST'), [applyMutation]);

  const correctAttendance = useCallback(
    (attendanceId: string, input: AttendanceCorrectionInput) =>
      applyMutation(`/api/attendance/${encodeURIComponent(attendanceId)}/correct`, 'PATCH', input),
    [applyMutation]
  );

  return {
    attendance: list.data ?? [],
    today: today.data ?? null,
    isLoading: list.isLoading || today.isLoading,
    isValidating: list.isValidating || today.isValidating,
    error: list.error ?? today.error ?? null,
    checkIn,
    checkOut,
    correctAttendance,
  };
};

export const useAttendanceCorrections = (attendanceId: string | null) => {
  const { user, logout } = useAuth();
  const loginId = user?.loginId ?? null;
  const fetchCorrections = useCallback(async () => {
    const id = attendanceId as string;
    const { corrections } = await api<{ corrections: AttendanceCorrection[] }>(
      `/api/attendance/${encodeURIComponent(id)}/corrections`
    );
    return corrections;
  }, [attendanceId]);

  const result = useCache<AttendanceCorrection[]>(attendanceCorrectionKey(loginId, attendanceId), fetchCorrections);

  useEffect(() => {
    if (result.error instanceof ApiError && result.error.status === 401) void logout();
  }, [result.error, logout]);

  return {
    corrections: result.data ?? [],
    isLoading: result.isLoading,
    error: result.error ?? null,
  };
};
