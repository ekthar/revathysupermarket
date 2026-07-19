/**
 * Shared Redis Connection — ioredis TCP client
 * ═════════════════════════════════════════════
 *
 * Single shared Redis instance for all server-side code.
 * Supports standard Redis with: REDIS_HOST, REDIS_PORT, REDIS_USERNAME, REDIS_PASSWORD
 * Also supports legacy Upstash REST URL format for backward compatibility.
 *
 * Connection is lazy-initialized and reused across requests (singleton).
 */

import Redis from "ioredis";

let redisInstance: Redis | null = null;
let connectionFailed = false;

/**
 * Get a shared Redis client instance.
 * Returns null if Redis is not configured or connection failed.
 */
export function getRedis(): Redis | null {
  if (redisInstance) return redisInstance;
  if (connectionFailed) return null;

  const host = process.env.REDIS_HOST;
  const port = Number(process.env.REDIS_PORT || 6379);
  const username = process.env.REDIS_USERNAME || undefined;
  const password = process.env.REDIS_PASSWORD || undefined;

  // Also support REDIS_URL format (redis://user:pass@host:port)
  const redisUrl = process.env.REDIS_URL;

  if (!host && !redisUrl) {
    return null;
  }

  try {
    if (redisUrl) {
      redisInstance = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        enableReadyCheck: true,
        retryStrategy(times) {
          if (times > 5) return null;
          return Math.min(times * 200, 2000);
        },
      });
    } else {
      redisInstance = new Redis({
        host,
        port,
        username,
        password,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        enableReadyCheck: true,
        retryStrategy(times) {
          if (times > 5) return null;
          return Math.min(times * 200, 2000);
        },
      });
    }

    redisInstance.on("error", (err) => {
      console.error("[Redis] Connection error:", err.message);
    });

    redisInstance.on("connect", () => {
      console.log("[Redis] Connected successfully");
    });

    // Connect immediately
    redisInstance.connect().catch((err) => {
      console.error("[Redis] Initial connection failed:", err.message);
      connectionFailed = true;
      redisInstance = null;
    });

    return redisInstance;
  } catch (err) {
    console.error("[Redis] Failed to create client:", err);
    connectionFailed = true;
    return null;
  }
}

/**
 * Check if Redis is available and responding.
 */
export async function pingRedis(): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  try {
    const result = await redis.ping();
    return result === "PONG";
  } catch {
    return false;
  }
}
