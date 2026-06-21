import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { rateLimit as localRateLimit } from "@/lib/rate-limit";

const redisLimiters = new Map<string, Ratelimit>();

function getLimiter(limit: number, windowSeconds: number) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  const configKey = `${limit}:${windowSeconds}`;
  if (!redisLimiters.has(configKey)) {
    redisLimiters.set(configKey, new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      analytics: false,
      prefix: `msm:ratelimit:${configKey}`
    }));
  }
  return redisLimiters.get(configKey)!;
}

export async function enforceRateLimit(key: string, limit: number, windowSeconds = 60) {
  const limiter = getLimiter(limit, windowSeconds);
  if (!limiter) {
    const local = localRateLimit(key, limit, windowSeconds * 1000);
    return { limited: local.limited, remaining: local.remaining, reset: Date.now() + windowSeconds * 1000 };
  }
  const result = await limiter.limit(key);
  return { limited: !result.success, remaining: result.remaining, reset: result.reset };
}

export function rateLimitResponse(reset: number) {
  const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  return NextResponse.json(
    { error: "Too many requests. Please try again shortly.", code: "RATE_LIMITED" },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}
