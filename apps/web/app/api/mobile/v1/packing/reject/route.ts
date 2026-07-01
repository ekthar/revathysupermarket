import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

const schema = z.object({
  eventId: z.string().min(1),
  orderId: z.string().min(1),
  reason: z.string().max(500).optional(),
});

/**
 * POST /api/mobile/v1/packing/reject
 * Packing staff rejects a packing assignment.
 */
export async function POST(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["PACKING_STAFF", "ADMIN", "OWNER", "MANAGER", "STAFF"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { eventId, orderId, reason } = parsed.data;

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

  // Already acknowledged means already handled
  if (event.acknowledgedAt) {
    return NextResponse.json({ event, alreadyAcknowledged: true });
  }

  // Mark as acknowledged (rejected is a form of acknowledgement) and log the reason
  const now = new Date();

  const updated = await prisma.assignmentEvent.update({
    where: { eventId },
    data: { acknowledgedAt: now },
  });

  return NextResponse.json({ event: updated, rejected: true, reason: reason || null });
}
