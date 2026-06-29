/**
 * Idempotency key support via Upstash Redis.
 * 
 * Order creation accepts an `Idempotency-Key` header.
 * The key is stored in Redis for 24 hours to prevent duplicate order submissions.
 */
import { Redis } from "@upstash/redis";

const IDEMPOTENCY_TTL_SECONDS = 86400; // 24 hours
const IDEMPOTENCY_PREFIX = "msm:idempotency:";

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return Redis.fromEnv();
}

export interface IdempotencyResult {
  isDuplicate: boolean;
  cachedResponse?: string;
}

/**
 * Check if an idempotency key has been used before.
 * Returns the cached response if it exists.
 */
export async function checkIdempotencyKey(key: string): Promise<IdempotencyResult> {
  const redis = getRedis();
  if (!redis) {
    // Without Redis, cannot enforce idempotency — allow request through
    return { isDuplicate: false };
  }

  try {
    const cached = await redis.get<string>(`${IDEMPOTENCY_PREFIX}${key}`);
    if (cached) {
      return { isDuplicate: true, cachedResponse: cached };
    }
    return { isDuplicate: false };
  } catch {
    // Redis error — allow request through rather than blocking
    return { isDuplicate: false };
  }
}

/**
 * Store a response for an idempotency key (called after successful order creation).
 */
export async function storeIdempotencyResponse(
  key: string,
  response: string
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(`${IDEMPOTENCY_PREFIX}${key}`, response, {
      ex: IDEMPOTENCY_TTL_SECONDS,
    });
  } catch {
    // Non-critical — log and continue
    console.warn(`Failed to store idempotency key: ${key}`);
  }
}

/**
 * Validate the Idempotency-Key header format.
 * Must be a non-empty string, max 256 characters.
 */
export function validateIdempotencyKey(key: string | null): string | null {
  if (!key) return null;
  const trimmed = key.trim();
  if (trimmed.length === 0 || trimmed.length > 256) return null;
  return trimmed;
}
