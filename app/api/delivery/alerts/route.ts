import { NextRequest } from "next/server";
import { auth } from "@/auth";

// Extend globalThis for SSE controller registry
declare global {
  // eslint-disable-next-line no-var
  var __deliveryAlertControllers: Map<string, Set<ReadableStreamDefaultController>> | undefined;
}

/**
 * SSE endpoint for delivery partner real-time order alerts.
 * Delivery partners connect here to receive instant alerts when orders are assigned.
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
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection confirmation
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected", partnerId })}\n\n`));

      // Keep-alive every 30 seconds
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keepalive\n\n`));
        } catch {
          clearInterval(keepAlive);
        }
      }, 30000);

      // Store the controller in a global registry for push notifications
      // In production, use Redis pub/sub for multi-instance support
      if (!global.__deliveryAlertControllers) {
        global.__deliveryAlertControllers = new Map();
      }
      const controllers = global.__deliveryAlertControllers!;
      if (!controllers.has(partnerId)) {
        controllers.set(partnerId, new Set());
      }
      controllers.get(partnerId)!.add(controller);

      // Cleanup on disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
        controllers.get(partnerId)?.delete(controller);
        if (controllers.get(partnerId)?.size === 0) {
          controllers.delete(partnerId);
        }
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
