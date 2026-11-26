'use client';

import useSWR, { type Fetcher, type Key, type SWRConfiguration, type SWRResponse } from 'swr';
import { ApiError } from '@/utils/api';

// Single place for the SWR options shared by the private, account-scoped caches.
// This is only a thin wrapper: data stays in SWR's own in-memory cache, not here.
export const useCache = <T,>(
  key: Key,
  fetcher: Fetcher<T>,
  options?: SWRConfiguration<T, ApiError>
): SWRResponse<T, ApiError> =>
  useSWR<T, ApiError>(key, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    revalidateIfStale: true,
    dedupingInterval: 2000,
    errorRetryCount: 2,
    // A revoked session is handled by AuthContext; do not retry it here.
    shouldRetryOnError: (error: ApiError) => error.status !== 401,
    ...options,
  });
