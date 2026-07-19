/**
 * Distributed Rate Limiting — ioredis sliding window
 * ═══════════════════════════════════════════════════
 *
 * Uses Redis sorted sets for a sliding window rate limiter.
 * Falls back to in-memory rate limiting if Redis is unavailable.
 *
 * Algorithm: Sorted set with timestamps as scores.
 * - ZREMRANGEBYSCORE to remove expired entries
 * - ZCARD to count current window
 * - ZADD to add new request
 * - EXPIRE to auto-cleanup
 */

import { getRedis } from "@/lib/redis";
import { rateLimit as localRateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { createHash } from "crypto";

let fallbackWarningLogged = false;

function warnAboutFallback() {
  if (fallbackWarningLogged) return;
  fallbackWarningLogged = true;
  console.warn("[rate-limit] Redis unavailable; using in-process fallback (does NOT work in serverless).");
}

function enforceLocalFallback(key: string, limit: number, windowSeconds: number) {
  const local = localRateLimit(`fallback:${hashRateLimitKey(key)}`, limit, windowSeconds * 1000);
  return {
    limited: local.limited,
    remaining: local.remaining,
    reset: Date.now() + windowSeconds * 1000,
    unavailable: true,
  };
}

/**
 * Enforce a rate limit using Redis sliding window.
 * Falls back to in-memory if Redis is unavailable.
 */
export async function enforceRateLimit(key: string, limit: number, windowSeconds = 60) {
  const redis = getRedis();

  if (!redis) {
    warnAboutFallback();
    return enforceLocalFallback(key, limit, windowSeconds);
  }

  const hashedKey = `msm:ratelimit:${hashRateLimitKey(key)}`;
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  try {
    // Remove expired entries, count current, add new entry — all in a pipeline
    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(hashedKey, 0, windowStart);
    pipeline.zcard(hashedKey);
    pipeline.zadd(hashedKey, now, `${now}:${Math.random().toString(36).slice(2, 8)}`);
    pipeline.expire(hashedKey, windowSeconds + 1);

    const results = await pipeline.exec();

    // results[1] is ZCARD result: [error, count]
    const count = (results?.[1]?.[1] as number) ?? 0;
    const limited = count >= limit;
    const remaining = Math.max(0, limit - count);

    return {
      limited,
      remaining,
      reset: now + windowSeconds * 1000,
      unavailable: false,
    };
  } catch (error) {
    console.error("[rate-limit] Redis error, falling back:", error);
    warnAboutFallback();
    return enforceLocalFallback(key, limit, windowSeconds);
  }
}

export function rateLimitResponse(reset: number) {
  if (reset === 0) {
    return NextResponse.json(
      {
        error: "Security rate limiting is temporarily unavailable. Please try again shortly.",
        code: "RATE_LIMIT_UNAVAILABLE",
      },
      { status: 503, headers: { "Retry-After": "30" } }
    );
  }
  const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  return NextResponse.json(
    { error: "Too many requests. Please try again shortly.", code: "RATE_LIMITED" },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}

export function hashRateLimitKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
