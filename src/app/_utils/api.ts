// Browser-side JSON client for the app's own /api routes. The session rides along in the
// httpOnly cookie; errors carry the server's (Indonesian) message so the UI can show it as-is.

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export const api = async <T,>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> => {
  let res: Response;
  try {
    res = await fetch(path, {
      method: init.method ?? 'GET',
      headers: init.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      credentials: 'same-origin',
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(0, 'Tidak bisa terhubung ke server. Cek koneksi internet.');
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.error ?? `Permintaan gagal (${res.status}).`);
  return data as T;
};
