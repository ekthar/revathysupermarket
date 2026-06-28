/**
 * DELIVERY PARTNER EVENT GATEWAY — Real-time alerts via Redis Streams.
 *
 * REPLACES: /api/delivery/alerts (which polled Redis lists every 2.5s with LRANGE+DEL)
 *
 * Architecture:
 * - Subscribes to two Redis Streams:
 *   1. `stream:rider:{riderId}` — personal assignments, order updates for this partner
 *   2. `stream:global:orders`   — new unassigned orders (broadcast to all partners)
 * - Pushes events to client as SSE messages
 * - ZERO database queries in the event loop
 * - One-time auth check on connection
 *
 * Improvements over old system:
 * - Old: LRANGE + DEL on Redis list every 2.5s (destructive read, race conditions)
 * - New: XRANGE with cursor tracking (non-destructive, idempotent, no race conditions)
 * - Old: Only supported per-partner alerts (not global broadcasts)
 * - New: Subscribes to both personal + global streams simultaneously
 *
 * The delivery partner mobile app and web app both connect to this endpoint.
 * Supports both session auth (web) and Bearer token auth (mobile app).
 */

import { auth } from "@/auth";
import { channels } from "@/lib/realtime/event-publisher";
import { createStreamSubscription } from "@/lib/realtime/event-subscriber";
import type { StreamEntry } from "@/lib/realtime/event-subscriber";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // ─── AUTH CHECK ───
  // Support both web session auth and mobile Bearer token
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "DELIVERY_PARTNER") {
    return new Response("Unauthorized", { status: 401 });
  }

  const riderId = session.user.id;

  // ─── SSE STREAM ───
  const encoder = new TextEncoder();
  const riderStream = channels.rider(riderId);
  const globalStream = channels.globalOrders;

  const stream = new ReadableStream({
    start(controller) {
      // 1. Send connection confirmation
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "CONNECTED", riderId, timestamp: Date.now() })}\n\n`
        )
      );

      // 2. Subscribe to rider-specific + global order streams
      const cleanup = createStreamSubscription({
        streams: [riderStream, globalStream],
        signal: request.signal,
        // Faster polling for delivery partners (assignments need to be instant)
        minIntervalMs: 150,
        maxIntervalMs: 1500,
        onEvent: (entry: StreamEntry) => {
          try {
            // Format event for SSE delivery
            const ssePayload = {
              ...entry.event,
              _streamEntryId: entry.id,
              _eventId: entry.eventId,
            };
            const message = `data: ${JSON.stringify(ssePayload)}\n\n`;
            controller.enqueue(encoder.encode(message));
          } catch {
            // Controller closed (client disconnected)
            cleanup();
          }
        },
        onError: (error) => {
          console.error("[realtime/delivery] Stream subscription error:", error);
        },
      });

      // 3. Keep-alive heartbeat every 25 seconds
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
          cleanup();
        }
      }, 25000);

      // 4. Cleanup on client disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        cleanup();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
