/**
 * EVENT PUBLISHER — Core of the event-driven real-time system.
 *
 * Architecture:
 * - All real-time events are published to Redis Streams after DB write succeeds.
 * - Events are the ONLY source of truth for the real-time delivery layer.
 * - No downstream consumer (SSE/WS) ever queries the database for updates.
 *
 * Redis Streams design:
 * - Stream per order: `stream:order:{orderId}` — status + location + ETA events
 * - Stream per user:  `stream:user:{userId}`  — notifications, order lifecycle
 * - Stream per rider: `stream:rider:{riderId}` — assignment alerts
 * - Global stream:    `stream:global:orders`   — all new orders (for admin/staff)
 *
 * Each stream entry contains:
 * - eventId: unique identifier for deduplication
 * - type: event type discriminator
 * - payload: JSON-serialized event data
 * - timestamp: server timestamp (ms since epoch)
 *
 * Streams are capped at MAXLEN ~1000 entries to bound memory usage.
 * Old events auto-evict via approximate trimming.
 */

import { getRedis } from "@/lib/redis";
import { randomUUID } from "crypto";

// ============================================================
// EVENT TYPES
// ============================================================

export type OrderStatusEvent = {
  type: "ORDER_STATUS_CHANGED";
  orderId: string;
  orderNumber: string;
  status: string;
  previousStatus?: string;
  userId?: string | null;
  timestamp: number;
};

export type RiderLocationEvent = {
  type: "RIDER_LOCATION_UPDATED";
  orderId: string;
  riderId: string;
  location: {
    latitude: number;
    longitude: number;
    heading?: number;
  };
  distanceMetres?: number | null;
  timestamp: number;
};

export type OrderAssignedEvent = {
  type: "ORDER_ASSIGNED";
  orderId: string;
  orderNumber: string;
  riderId: string;
  customerName: string;
  address: string;
  total: number;
  timestamp: number;
};

export type EtaUpdatedEvent = {
  type: "ETA_UPDATED";
  orderId: string;
  etaMinutes: number;
  timestamp: number;
};

export type NewOrderEvent = {
  type: "NEW_ORDER";
  orderId: string;
  orderNumber: string;
  customerName: string;
  address: string;
  total: number;
  timestamp: number;
};

export type RealtimeEvent =
  | OrderStatusEvent
  | RiderLocationEvent
  | OrderAssignedEvent
  | EtaUpdatedEvent
  | NewOrderEvent;

// ============================================================
// CHANNEL NAMING
// ============================================================

export const channels = {
  /** Per-order stream: all events for a specific order (status, location, ETA) */
  order: (orderId: string) => `stream:order:${orderId}`,
  /** Per-user stream: order lifecycle events for a customer */
  user: (userId: string) => `stream:user:${userId}`,
  /** Per-rider stream: assignment alerts and order updates for delivery partner */
  rider: (riderId: string) => `stream:rider:${riderId}`,
  /** Global stream: all new orders (admin/staff dashboard) */
  globalOrders: "stream:global:orders",
} as const;

// ============================================================
// REDIS CONNECTION
// ============================================================

// Uses shared connection from lib/redis.ts

// ============================================================
// PUBLISHER
// ============================================================

/** Maximum entries per stream before trimming (approximate) */
const STREAM_MAXLEN = 1000;

/** TTL for stream keys (seconds). Streams auto-expire if no new events for 1 hour. */
const STREAM_TTL_SECONDS = 3600;

/**
 * Publish a real-time event to one or more Redis Streams.
 *
 * This is FIRE-AND-FORGET: failures are logged but never block the caller.
 * The DB write is already committed — Redis is a best-effort delivery channel.
 *
 * @param streamKeys - One or more stream keys to publish to
 * @param event - The event payload
 */
async function publishToStreams(streamKeys: string[], event: RealtimeEvent): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const eventId = randomUUID();
  const entry = {
    eventId,
    type: event.type,
    payload: JSON.stringify(event),
    ts: String(event.timestamp),
  };

  try {
    // Publish to all target streams in parallel
    await Promise.all(
      streamKeys.map(async (key) => {
        // XADD with MAXLEN trimming using ioredis
        await redis.xadd(key, "MAXLEN", "~", STREAM_MAXLEN, "*",
          "eventId", eventId,
          "type", event.type,
          "payload", JSON.stringify(event),
          "ts", String(event.timestamp)
        );
        // Refresh TTL so inactive streams expire
        await redis.expire(key, STREAM_TTL_SECONDS);
      })
    );
  } catch (error) {
    // Non-blocking: log and continue. DB is source of truth.
    console.error("[event-publisher] Failed to publish event:", event.type, error);
  }
}

// ============================================================
// PUBLIC API — Event-specific publishers
// ============================================================

/**
 * Publish an order status change event.
 * Called after DB transaction commits in admin status update, delivery arrive/complete, etc.
 *
 * Publishes to:
 * - order:{orderId} — for tracking page subscribers
 * - user:{userId}   — for customer notification
 * - global:orders   — for admin dashboard
 */
export async function publishOrderStatusChanged(params: {
  orderId: string;
  orderNumber: string;
  status: string;
  previousStatus?: string;
  userId?: string | null;
}): Promise<void> {
  const event: OrderStatusEvent = {
    type: "ORDER_STATUS_CHANGED",
    ...params,
    timestamp: Date.now(),
  };

  const streams = [channels.order(params.orderId), channels.globalOrders];
  if (params.userId) streams.push(channels.user(params.userId));

  await publishToStreams(streams, event);
}

/**
 * Publish a rider location update.
 * Called after location write succeeds in /api/delivery/location.
 *
 * Publishes to:
 * - order:{orderId} — for customer tracking page
 */
export async function publishRiderLocation(params: {
  orderId: string;
  riderId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  distanceMetres?: number | null;
}): Promise<void> {
  const event: RiderLocationEvent = {
    type: "RIDER_LOCATION_UPDATED",
    orderId: params.orderId,
    riderId: params.riderId,
    location: {
      latitude: params.latitude,
      longitude: params.longitude,
      heading: params.heading,
    },
    distanceMetres: params.distanceMetres,
    timestamp: Date.now(),
  };

  await publishToStreams([channels.order(params.orderId)], event);
}

/**
 * Publish an order assignment event.
 * Called after delivery partner is assigned to an order.
 *
 * Publishes to:
 * - rider:{riderId}  — alert the delivery partner
 * - order:{orderId}  — update tracking page
 * - user:{userId}    — notify customer
 */
export async function publishOrderAssigned(params: {
  orderId: string;
  orderNumber: string;
  riderId: string;
  customerName: string;
  address: string;
  total: number;
  userId?: string | null;
}): Promise<void> {
  const event: OrderAssignedEvent = {
    type: "ORDER_ASSIGNED",
    orderId: params.orderId,
    orderNumber: params.orderNumber,
    riderId: params.riderId,
    customerName: params.customerName,
    address: params.address,
    total: params.total,
    timestamp: Date.now(),
  };

  const streams = [
    channels.rider(params.riderId),
    channels.order(params.orderId),
  ];
  if (params.userId) streams.push(channels.user(params.userId));

  await publishToStreams(streams, event);
}

/**
 * Publish a new order event (for global broadcast to all delivery partners/staff).
 * Called after order creation succeeds.
 *
 * Publishes to:
 * - global:orders — for admin dashboard and all delivery partners
 */
export async function publishNewOrder(params: {
  orderId: string;
  orderNumber: string;
  customerName: string;
  address: string;
  total: number;
}): Promise<void> {
  const event: NewOrderEvent = {
    type: "NEW_ORDER",
    ...params,
    timestamp: Date.now(),
  };

  await publishToStreams([channels.globalOrders], event);
}

/**
 * Publish an ETA update event.
 * Called when ETA is recalculated (e.g., based on rider distance).
 *
 * Publishes to:
 * - order:{orderId} — for tracking page
 */
export async function publishEtaUpdate(params: {
  orderId: string;
  etaMinutes: number;
}): Promise<void> {
  const event: EtaUpdatedEvent = {
    type: "ETA_UPDATED",
    orderId: params.orderId,
    etaMinutes: params.etaMinutes,
    timestamp: Date.now(),
  };

  await publishToStreams([channels.order(params.orderId)], event);
}
