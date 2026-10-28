import 'server-only';

// Fixed-window, in-memory limiter. Good enough for a single server instance; with several
// instances (serverless), each keeps its own counts — per-account lockout in the DB still applies.

interface Window {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Window>();

export const consumeRateLimit = (
  key: string,
  limit: number,
  windowMs: number
): { allowed: true } | { allowed: false; retryAfterSeconds: number } => {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) {
      for (const [k, w] of buckets) if (w.resetAt <= now) buckets.delete(k);
    }
    return { allowed: true };
  }

  if (current.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) };
  }
  current.count++;
  return { allowed: true };
};
