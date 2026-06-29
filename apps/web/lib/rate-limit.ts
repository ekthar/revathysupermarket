/**
 * In-process rate limiter — LOCAL DEVELOPMENT FALLBACK ONLY.
 * This does NOT work in serverless environments (each invocation is stateless).
 * Production MUST use the distributed Redis rate limiter.
 */
const MAX_BUCKETS = 10_000;
const buckets = new Map<string, { count: number; resetAt: number }>();

function evictStaleBuckets() {
  if (buckets.size <= MAX_BUCKETS) return;
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
    if (buckets.size <= MAX_BUCKETS * 0.8) break;
  }
}

export function rateLimit(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    evictStaleBuckets();
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, remaining: limit - 1 };
  }

  bucket.count += 1;
  return { limited: bucket.count > limit, remaining: Math.max(0, limit - bucket.count) };
}
