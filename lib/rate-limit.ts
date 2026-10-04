/**
 * Tiny in-memory sliding-window rate limiter. Per server instance, which is
 * fine for an MVP: it stops casual abuse of a public demo.
 */
declare global {
  var __freehandRateBuckets: Map<string, number[]> | undefined;
}

const buckets: Map<string, number[]> = (globalThis.__freehandRateBuckets ??= new Map());

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  const cutoff = now - windowMs;
  const hits = (buckets.get(key) ?? []).filter((t) => t > cutoff);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    const retryAfterSeconds = Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000));
    return { ok: false, remaining: 0, retryAfterSeconds };
  }
  hits.push(now);
  buckets.set(key, hits);
  // Opportunistic cleanup so the map never grows unbounded.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => t <= cutoff)) buckets.delete(k);
    }
  }
  return { ok: true, remaining: limit - hits.length, retryAfterSeconds: 0 };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
