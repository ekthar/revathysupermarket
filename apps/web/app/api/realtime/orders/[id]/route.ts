/**
 * SSE EVENT GATEWAY — Real-time order tracking via Redis Streams.
 *
 * REPLACES: /api/orders/[id]/stream (which polled PostgreSQL every 10 seconds)
 *
 * Architecture:
 * - Subscribes to Redis Stream `stream:order:{orderId}`
 * - Pushes events to client as SSE messages
 * - ZERO database queries in the event loop
 * - Adaptive polling of Redis: 200ms when active, 2s when idle
 * - Graceful degradation: sends initial state from Redis history on connect
 *
 * Event flow:
 * 1. Client connects to this SSE endpoint
 * 2. Auth check (one-time DB query for authorization only)
 * 3. Read recent events from Redis for initial state hydration
 * 4. Subscribe to Redis Stream for new events
 * 5. Push each event as SSE `data:` message
 * 6. Cleanup on disconnect (AbortSignal)
 *
 * Performance vs old system:
 * - Old: 1 DB query every 10s per connected user (6 queries/min/user)
 * - New: 0 DB queries, ~30 Redis XRANGE calls/min/user when idle (Redis handles millions/sec)
 */

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isStaffRole } from "@/lib/authz";
import { channels } from "@/lib/realtime/event-publisher";
import { createStreamSubscription, readRecentEvents } from "@/lib/realtime/event-subscriber";
import type { StreamEntry } from "@/lib/realtime/event-subscriber";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id: orderId } = await params;

  // ─── AUTH CHECK (one-time DB query, NOT in event loop) ───
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true, status: true },
  });

  if (!order) {
    return new Response("Order not found", { status: 404 });
  }

  if (!isStaffRole(session?.user?.role) && order.userId !== session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  // If order is already delivered/cancelled, send terminal state and close
  if (["DELIVERED", "CANCELLED"].includes(order.status)) {
    return new Response(
      `data: ${JSON.stringify({ type: "ORDER_STATUS_CHANGED", orderId, status: order.status, terminal: true })}\n\n`,
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      }
    );
  }

  // ─── SSE STREAM ───
  const streamKey = channels.order(orderId);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // 1. Send initial state from recent Redis events (hydration)
      try {
        const recentEvents = await readRecentEvents(streamKey, 5);
        if (recentEvents.length > 0) {
          // Send the most recent event of each type for initial state
          const latestByType = new Map<string, StreamEntry>();
          for (const entry of recentEvents) {
            latestByType.set(entry.type, entry);
          }
          for (const entry of latestByType.values()) {
            const message = `data: ${JSON.stringify(entry.event)}\n\n`;
            controller.enqueue(encoder.encode(message));
          }
        }
      } catch {
        // Non-fatal: client will get events from subscription
      }

      // 2. Send connection confirmation
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "CONNECTED", orderId, timestamp: Date.now() })}\n\n`)
      );

      // 3. Subscribe to Redis Stream for new events
      const cleanup = createStreamSubscription({
        streams: [streamKey],
        signal: request.signal,
        onEvent: (entry: StreamEntry) => {
          try {
            const message = `data: ${JSON.stringify(entry.event)}\n\n`;
            controller.enqueue(encoder.encode(message));

            // Auto-close on terminal status
            if (
              entry.event.type === "ORDER_STATUS_CHANGED" &&
              "status" in entry.event &&
              ["DELIVERED", "CANCELLED"].includes(entry.event.status)
            ) {
              // Give client time to process final event, then close
              setTimeout(() => {
                try { controller.close(); } catch { /* already closed */ }
              }, 1000);
            }
          } catch {
            // Controller closed (client disconnected)
            cleanup();
          }
        },
        onError: (error) => {
          console.error("[realtime/orders] Stream subscription error:", error);
        },
      });

      // 4. Keep-alive heartbeat every 25 seconds (prevents proxy timeouts)
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
          cleanup();
        }
      }, 25000);

      // 5. Cleanup on client disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        cleanup();
        try { controller.close(); } catch { /* already closed */ }
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
