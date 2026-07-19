import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { getRedis } from "@/lib/redis";

/**
 * Redis polling interval in milliseconds.
 *
 * Tradeoff: Lower values reduce alert delivery latency but increase Redis API
 * calls (and therefore Upstash usage costs). 2.5 seconds strikes a balance
 * between near-real-time delivery and reasonable request volume.
 *
 * For true sub-second pub/sub, an ioredis TCP client with SUBSCRIBE would be
 * needed, but Upstash REST does not support long-lived TCP subscriptions.
 */
const POLL_INTERVAL_MS = 2500;

/**
 * SSE endpoint for delivery partner real-time order alerts.
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  const partnerId = request.nextUrl.searchParams.get("partnerId");

  // Verify the authenticated user is the delivery partner
  if (!session?.user?.id || session.user.role !== "DELIVERY_PARTNER") {
    return new Response("Unauthorized", { status: 401 });
  }

  if (session.user.id !== partnerId) {
    return new Response("Forbidden", { status: 403 });
  }

  const encoder = new TextEncoder();
  const redis = getRedis();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection confirmation
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected", partnerId })}\n\n`));

      // Keep-alive every 30 seconds to prevent connection timeout
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keepalive\n\n`));
        } catch {
          clearInterval(keepAlive);
        }
      }, 30000);

      // Poll Redis for new alerts every POLL_INTERVAL_MS
      const pollInterval = setInterval(async () => {
        if (!redis) return;

        try {
          // Check partner-specific alerts (broadcasts now fan-out to individual keys)
          const partnerKey = `delivery:alerts:${partnerId}`;
          const partnerAlerts = await redis.lrange(partnerKey, 0, -1);
          if (partnerAlerts.length > 0) {
            // Remove all fetched messages
            await redis.del(partnerKey);
            // Send each alert to the client (reverse to send oldest first)
            for (const alert of partnerAlerts.reverse()) {
              const message = typeof alert === "string" ? alert : JSON.stringify(alert);
              controller.enqueue(encoder.encode(`data: ${message}\n\n`));
            }
          }
        } catch (error) {
          // Log but do not kill the stream - next poll may succeed
          console.error("[delivery-alerts] Redis poll error:", error);
        }
      }, POLL_INTERVAL_MS);

      // Cleanup on disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
        clearInterval(pollInterval);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    }
  });
}
