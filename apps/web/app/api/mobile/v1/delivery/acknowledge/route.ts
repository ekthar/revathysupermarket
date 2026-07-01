import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

const schema = z.object({
  eventId: z.string().min(1),
  orderId: z.string().min(1),
});

/**
 * POST /api/mobile/v1/delivery/acknowledge
 * Acknowledge a delivery assignment event.
 */
export async function POST(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["DELIVERY_PARTNER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { eventId, orderId } = parsed.data;

  const event = await prisma.assignmentEvent.findUnique({
    where: { eventId },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Ownership check
  if (event.partnerId !== auth.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Idempotent: already acknowledged
  if (event.acknowledgedAt) {
    return NextResponse.json({ event, alreadyAcknowledged: true });
  }

  const now = new Date();

  const [updated] = await prisma.$transaction([
    prisma.assignmentEvent.update({
      where: { eventId },
      data: { acknowledgedAt: now },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: { deliveryAlertAckAt: now },
    }),
  ]);

  return NextResponse.json({ event: updated });
}
