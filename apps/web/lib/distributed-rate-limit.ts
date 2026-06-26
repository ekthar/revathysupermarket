import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { rateLimit as localRateLimit } from "@/lib/rate-limit";
import { createHash } from "crypto";

const redisLimiters = new Map<string, Ratelimit>();
let fallbackWarningLogged = false;

function enforceLocalFallback(key: string, limit: number, windowSeconds: number) {
  const local = localRateLimit(`fallback:${hashRateLimitKey(key)}`, limit, windowSeconds * 1000);
  return {
    limited: local.limited,
    remaining: local.remaining,
    reset: Date.now() + windowSeconds * 1000,
    unavailable: true
  };
}

function warnAboutFallback() {
  if (fallbackWarningLogged) return;
  fallbackWarningLogged = true;
  console.warn("Distributed rate limiting is unavailable; using the in-process fallback.");
}

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
  let limiter: Ratelimit | null;
  try {
    limiter = getLimiter(limit, windowSeconds);
  } catch {
    warnAboutFallback();
    return enforceLocalFallback(key, limit, windowSeconds);
  }
  if (!limiter) {
    warnAboutFallback();
    return enforceLocalFallback(key, limit, windowSeconds);
  }
  try {
    const result = await limiter.limit(hashRateLimitKey(key));
    return { limited: !result.success, remaining: result.remaining, reset: result.reset, unavailable: false };
  } catch {
    warnAboutFallback();
    return enforceLocalFallback(key, limit, windowSeconds);
  }
}

export function rateLimitResponse(reset: number) {
  if (reset === 0) {
    return NextResponse.json(
      { error: "Security rate limiting is temporarily unavailable. Please try again shortly.", code: "RATE_LIMIT_UNAVAILABLE", detail: process.env.NODE_ENV === "production" ? "Server security configuration requires attention." : "Configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN, or run outside production for local fallback." },
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
