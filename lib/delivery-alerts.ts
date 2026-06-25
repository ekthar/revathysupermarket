/**
 * Utility to push real-time alerts to delivery partners via Redis.
 * Alerts are stored in Redis lists and polled by the SSE endpoint.
 * Works alongside the push notification system for comprehensive alerting.
 */

import { Redis } from "@upstash/redis";

type AlertPayload = {
  type: "new_order";
  order: {
    id: string;
    orderNumber: string;
    customerName: string;
    address: string;
    total: number;
  };
};

/** TTL for alert keys in seconds. Stale alerts auto-expire after this period. */
const ALERT_KEY_TTL_SECONDS = 120;

let redis: Redis | null = null;
let fallbackWarningLogged = false;

function getRedis(): Redis | null {
  if (redis) return redis;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    if (!fallbackWarningLogged) {
      fallbackWarningLogged = true;
      console.warn(
        "[delivery-alerts] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not configured. " +
          "Delivery alerts will be no-ops until Redis is available."
      );
    }
    return null;
  }
  redis = Redis.fromEnv();
  return redis;
}

/**
 * Build the Redis key for a specific partner's alert list.
 */
function partnerAlertKey(partnerId: string): string {
  return `delivery:alerts:${partnerId}`;
}

/** Redis key for broadcast alerts (all delivery partners). */
const BROADCAST_KEY = "delivery:alerts:broadcast";

/**
 * Send a real-time alert to a specific delivery partner by pushing to their Redis list.
 * The SSE endpoint polls this list and forwards messages to the connected client.
 * Returns true if the alert was successfully enqueued; false if Redis is unavailable.
 */
export async function sendDeliveryAlert(partnerId: string, payload: AlertPayload): Promise<boolean> {
  const client = getRedis();
  if (!client) return false;

  try {
    const key = partnerAlertKey(partnerId);
    const message = JSON.stringify(payload);
    await client.lpush(key, message);
    // Set/refresh expiry so stale alerts auto-clean if partner never connects
    await client.expire(key, ALERT_KEY_TTL_SECONDS);
    return true;
  } catch (error) {
    console.error("[delivery-alerts] Failed to push alert to Redis:", error);
    return false;
  }
}

/**
 * Notify all delivery partners about a new unassigned order (for pickup).
 * Pushes to the broadcast list which every connected partner polls.
 */
export async function broadcastToAllDeliveryPartners(payload: AlertPayload): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    const message = JSON.stringify(payload);
    await client.lpush(BROADCAST_KEY, message);
    await client.expire(BROADCAST_KEY, ALERT_KEY_TTL_SECONDS);
  } catch (error) {
    console.error("[delivery-alerts] Failed to broadcast alert to Redis:", error);
  }
}
