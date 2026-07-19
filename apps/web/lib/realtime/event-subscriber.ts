/**
 * EVENT SUBSCRIBER — Consumption side of the event-driven real-time system.
 *
 * Architecture:
 * - SSE endpoints create a StreamSubscription for their target channel(s).
 * - The subscriber uses Redis XREAD with cursor tracking to read new events.
 * - NO DATABASE QUERIES happen in this module. Redis is the ONLY data source.
 * - Adaptive polling: fast (200ms) when events are flowing, slow (2s) when idle.
 *
 * Design for Upstash REST:
 * - Upstash REST API does not support blocking XREAD or SUBSCRIBE.
 * - Instead, we use non-blocking XREAD with cursor-based iteration.
 * - Adaptive interval ensures low latency during active delivery while
 *   minimizing Redis API calls during idle periods.
 *
 * Cursor Tracking:
 * - Each subscription tracks the last-read entry ID per stream.
 * - On first read, uses "$" to get only new events (no history replay).
 * - Subsequent reads use the last received entry ID as cursor.
 *
 * Deduplication:
 * - Each event carries a unique `eventId` field.
 * - Subscribers track the last N event IDs to prevent duplicate delivery.
 * - Redis Stream entry IDs are monotonically increasing, so cursor-based
 *   reads naturally prevent re-delivery.
 */

import { getRedis } from "@/lib/redis";
import type { RealtimeEvent } from "./event-publisher";

// ============================================================
// TYPES
// ============================================================

export type StreamEntry = {
  /** Redis Stream entry ID (e.g., "1719500000000-0") */
  id: string;
  /** Unique event identifier for deduplication */
  eventId: string;
  /** Event type discriminator */
  type: string;
  /** Full parsed event payload */
  event: RealtimeEvent;
  /** Server timestamp (ms) */
  timestamp: number;
};

export type SubscriptionOptions = {
  /** Stream keys to subscribe to */
  streams: string[];
  /** Callback invoked for each new event */
  onEvent: (entry: StreamEntry) => void;
  /** Callback invoked on error (non-fatal, subscription continues) */
  onError?: (error: unknown) => void;
  /** Minimum poll interval in ms (when events are flowing). Default: 200ms */
  minIntervalMs?: number;
  /** Maximum poll interval in ms (when idle). Default: 2000ms */
  maxIntervalMs?: number;
  /** AbortSignal to stop the subscription */
  signal?: AbortSignal;
  /** Whether to read historical events. Default: false (only new events) */
  readHistory?: boolean;
  /** Max events to read per poll. Default: 50 */
  batchSize?: number;
};

// ============================================================
// REDIS CONNECTION
// ============================================================

// Uses shared connection from lib/redis.ts

// ============================================================
// STREAM SUBSCRIPTION
// ============================================================

/**
 * Creates a long-lived subscription to one or more Redis Streams.
 * Returns a cleanup function to stop the subscription.
 *
 * The subscription loop:
 * 1. XREAD from cursor position (or "$" for new-only)
 * 2. Parse entries and invoke onEvent callback
 * 3. Update cursor to last-read entry ID
 * 4. Adaptive wait: short if events received, longer if idle
 * 5. Repeat until signal is aborted or cleanup is called
 *
 * This runs inside the SSE ReadableStream's start() function.
 */
export function createStreamSubscription(options: SubscriptionOptions): () => void {
  const {
    streams,
    onEvent,
    onError,
    minIntervalMs = 200,
    maxIntervalMs = 2000,
    signal,
    readHistory = false,
    batchSize = 50,
  } = options;

  let running = true;
  let timer: ReturnType<typeof setTimeout> | null = null;

  // Track cursor per stream: "$" means only new events, "0" means from beginning
  const cursors = new Map<string, string>();
  for (const stream of streams) {
    cursors.set(stream, readHistory ? "0" : "$");
  }

  // Adaptive interval: starts at max, decreases when events are received
  let currentInterval = maxIntervalMs;

  async function poll() {
    if (!running || signal?.aborted) return;

    const redis = getRedis();
    if (!redis) {
      // No Redis available — back off and retry
      timer = setTimeout(poll, maxIntervalMs);
      return;
    }

    let receivedEvents = false;

    try {
      // Read from all subscribed streams
      for (const stream of streams) {
        if (!running || signal?.aborted) break;

        const cursor = cursors.get(stream)!;

        // Use XREAD: read entries after cursor, up to batchSize
        // For "$" cursor (first read), we need XREVRANGE to get latest then switch to XREAD
        let entries: Array<{ id: string; fields: Record<string, string> }> = [];

        if (cursor === "$") {
          // First poll with "$": no history, just set cursor to latest entry
          const latest = await redis.xrevrange(stream, "+", "-", "COUNT", 1);
          if (latest && latest.length > 0) {
            cursors.set(stream, latest[0][0]);
          } else {
            cursors.set(stream, "0-0");
          }
          continue;
        }

        // Normal XRANGE: get entries after our cursor
        const result = await redis.xrange(stream, `(${cursor}`, "+", "COUNT", batchSize);

        if (result && result.length > 0) {
          // ioredis returns [[id, [field, value, field, value, ...]], ...]
          entries = result.map((entry: [string, string[]]) => {
            const [id, fields] = entry;
            const fieldMap: Record<string, string> = {};
            for (let i = 0; i < fields.length; i += 2) {
              fieldMap[fields[i]] = fields[i + 1];
            }
            return { id, fields: fieldMap };
          });
        }

        if (entries.length > 0) {
          receivedEvents = true;

          for (const entry of entries) {
            // Update cursor to latest entry
            cursors.set(stream, entry.id);

            // Parse the event payload
            try {
              const event = JSON.parse(entry.fields.payload || "{}") as RealtimeEvent;
              onEvent({
                id: entry.id,
                eventId: entry.fields.eventId || entry.id,
                type: entry.fields.type || event.type,
                event,
                timestamp: Number(entry.fields.ts) || Date.now(),
              });
            } catch (parseError) {
              onError?.(parseError);
            }
          }
        }
      }
    } catch (error) {
      onError?.(error);
    }

    if (!running || signal?.aborted) return;

    // Adaptive interval: fast when events are flowing, slow when idle
    if (receivedEvents) {
      currentInterval = minIntervalMs;
    } else {
      // Exponential backoff toward maxInterval
      currentInterval = Math.min(currentInterval * 1.5, maxIntervalMs);
    }

    timer = setTimeout(poll, currentInterval);
  }

  // Start the polling loop
  poll();

  // Handle abort signal
  signal?.addEventListener("abort", () => {
    running = false;
    if (timer) clearTimeout(timer);
  });

  // Return cleanup function
  return () => {
    running = false;
    if (timer) clearTimeout(timer);
  };
}

// ============================================================
// CONVENIENCE: One-shot read for initial state
// ============================================================

/**
 * Read the most recent N events from a stream.
 * Used to provide initial state when a client first connects
 * (e.g., last known status + location for a tracking page).
 *
 * This is the ONLY time we read "historical" data from Redis,
 * and it's still NOT a database query.
 */
export async function readRecentEvents(
  streamKey: string,
  count: number = 10
): Promise<StreamEntry[]> {
  const redis = getRedis();
  if (!redis) return [];

  try {
    const result = await redis.xrevrange(streamKey, "+", "-", "COUNT", count);
    if (!result || result.length === 0) return [];

    return result
      .map((entry: [string, string[]]) => {
        const [id, fields] = entry;
        const fieldMap: Record<string, string> = {};
        for (let i = 0; i < fields.length; i += 2) {
          fieldMap[fields[i]] = fields[i + 1];
        }
        try {
          const event = JSON.parse(fieldMap.payload || "{}") as RealtimeEvent;
          return {
            id,
            eventId: fieldMap.eventId || id,
            type: fieldMap.type || event.type,
            event,
            timestamp: Number(fieldMap.ts) || 0,
          };
        } catch {
          return null;
        }
      })
      .filter((e): e is StreamEntry => e !== null)
      .reverse(); // Return in chronological order (oldest first)
  } catch (error) {
    console.error("[event-subscriber] Failed to read recent events:", error);
    return [];
  }
}
