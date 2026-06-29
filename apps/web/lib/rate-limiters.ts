/**
 * Named rate limiters using @upstash/ratelimit with sliding window algorithm.
 * 
 * Each limiter targets a specific route category with appropriate thresholds.
 * Falls back to in-memory rate limiting when Redis is unavailable.
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createHash } from "crypto";
import { rateLimit as localRateLimit } from "@/lib/rate-limit";

// Matches @upstash/ratelimit's Duration type: `${number} ${unit}`
type Duration = `${number} ${"ms" | "s" | "m" | "h" | "d"}`;

// ─── Redis client (singleton) ────────────────────────────────────────────────

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return Redis.fromEnv();
}

// ─── Limiter factory ─────────────────────────────────────────────────────────

function createLimiter(limit: number, window: Duration, prefix: string): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    analytics: process.env.NODE_ENV === "production",
    prefix,
  });
}

// ─── Named limiters (as specified) ───────────────────────────────────────────

export const limiters = {
  /** Auth endpoints: login, signup — 5 requests per 1 minute */
  auth: createLimiter(5, "1 m", "rl:auth"),
  /** OTP requests — 3 per 10 minutes */
  otp: createLimiter(3, "10 m", "rl:otp"),
  /** Checkout and order creation — 10 per 1 minute */
  checkout: createLimiter(10, "1 m", "rl:co"),
  /** General API reads — 60 per 1 minute */
  api: createLimiter(60, "1 m", "rl:api"),
  /** Write operations (POST/PUT/PATCH/DELETE) — 20 per 1 minute */
  write: createLimiter(20, "1 m", "rl:w"),
  /** Admin panel — 120 per 1 minute */
  admin: createLimiter(120, "1 m", "rl:adm"),
};

// ─── Limiter config for fallback ─────────────────────────────────────────────

const limiterConfigs = {
  auth: { limit: 5, windowMs: 60_000 },
  otp: { limit: 3, windowMs: 600_000 },
  checkout: { limit: 10, windowMs: 60_000 },
  api: { limit: 60, windowMs: 60_000 },
  write: { limit: 20, windowMs: 60_000 },
  admin: { limit: 120, windowMs: 60_000 },
} as const;

export type LimiterName = keyof typeof limiters;

// ─── Key hashing ─────────────────────────────────────────────────────────────

export function hashKey(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

// ─── Rate limit check ────────────────────────────────────────────────────────

export interface RateLimitResult {
  limited: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check a named limiter against a key (typically userId or hashed IP).
 * Returns structured result with limit/remaining/reset for response headers.
 */
export async function checkRateLimit(
  name: LimiterName,
  key: string
): Promise<RateLimitResult> {
  const limiter = limiters[name];
  const config = limiterConfigs[name];
  const hashedKey = hashKey(key);

  if (!limiter) {
    // Fallback to in-memory when Redis unavailable
    const local = localRateLimit(`${name}:${hashedKey}`, config.limit, config.windowMs);
    return {
      limited: local.limited,
      limit: config.limit,
      remaining: local.remaining,
      reset: Date.now() + config.windowMs,
    };
  }

  try {
    const result = await limiter.limit(hashedKey);
    return {
      limited: !result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch {
    // Redis error — degrade gracefully to in-memory
    const local = localRateLimit(`${name}:${hashedKey}`, config.limit, config.windowMs);
    return {
      limited: local.limited,
      limit: config.limit,
      remaining: local.remaining,
      reset: Date.now() + config.windowMs,
    };
  }
}

// ─── Resolve rate limit key from request ─────────────────────────────────────

export function resolveRateLimitKey(
  userId: string | undefined | null,
  request: Request
): string {
  if (userId) return `uid:${userId}`;
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "anonymous";
  return `ip:${ip}`;
}

// ─── Route → limiter mapping ─────────────────────────────────────────────────

export function getLimiterForRoute(
  pathname: string,
  method: string
): LimiterName {
  // OTP endpoint
  if (pathname.includes("/auth/otp") || pathname.includes("/auth/send-otp")) {
    return "otp";
  }
  // Auth endpoints
  if (pathname.startsWith("/api/auth")) {
    return "auth";
  }
  // Checkout and order creation
  if (
    pathname.startsWith("/api/checkout") ||
    (pathname.startsWith("/api/orders") && method === "POST")
  ) {
    return "checkout";
  }
  // Admin endpoints
  if (pathname.startsWith("/api/admin")) {
    return "admin";
  }
  // Write operations
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return "write";
  }
  // Default: general API reads
  return "api";
}
