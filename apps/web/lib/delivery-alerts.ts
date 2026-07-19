/**
 * Utility to push real-time alerts to delivery partners via Redis.
 * Alerts are stored in Redis lists and polled by the SSE endpoint.
 * Works alongside the push notification system for comprehensive alerting.
 */

import { getRedis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";

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

/** TTL for alert keys in seconds. Alerts auto-expire after 5 minutes to handle brief reconnections. */
const ALERT_KEY_TTL_SECONDS = 300;

let fallbackWarningLogged = false;

function getDeliveryRedis() {
  const client = getRedis();
  if (!client && !fallbackWarningLogged) {
    fallbackWarningLogged = true;
    console.warn("[delivery-alerts] Redis not configured. Delivery alerts will be no-ops.");
  }
  return client;
}

/**
 * Build the Redis key for a specific partner's alert list.
 */
function partnerAlertKey(partnerId: string): string {
  return `delivery:alerts:${partnerId}`;
}

/**
 * Send a real-time alert to a specific delivery partner by pushing to their Redis list.
 * The SSE endpoint polls this list and forwards messages to the connected client.
 * Returns true if the alert was successfully enqueued; false if Redis is unavailable.
 */
export async function sendDeliveryAlert(partnerId: string, payload: AlertPayload): Promise<boolean> {
  const client = getDeliveryRedis();
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
 * Notify all active delivery partners about a new unassigned order (for pickup).
 * Uses per-partner fan-out: queries DB for all active delivery partners and
 * pushes the alert to each partner's individual Redis key. This avoids the
 * broadcast race condition where multiple SSE connections would compete for
 * the same shared broadcast key (LRANGE + DEL is non-atomic).
 */
export async function broadcastToAllDeliveryPartners(payload: AlertPayload): Promise<void> {
  const client = getDeliveryRedis();
  if (!client) return;

  try {
    // Get all active delivery partners from the database
    const partners = await prisma.user.findMany({
      where: { role: "DELIVERY_PARTNER", isActive: true },
      select: { id: true },
    });

    // Fan-out: push alert to each partner's individual key
    await Promise.all(
      partners.map((partner) => sendDeliveryAlert(partner.id, payload))
    );
  } catch (error) {
    console.error("[delivery-alerts] Failed to broadcast alert:", error);
  }
}
