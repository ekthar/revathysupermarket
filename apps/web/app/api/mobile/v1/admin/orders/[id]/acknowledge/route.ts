import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * POST /api/mobile/v1/admin/orders/[id]/acknowledge
 * Mark an order as acknowledged by the current admin/staff user.
 * Sets acknowledgedAt and acknowledgedById, creates an OrderEvent.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER", "STAFF"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.order.findUnique({
    where: { id },
    select: { id: true, acknowledgedAt: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (existing.acknowledgedAt) {
    return NextResponse.json({ error: "Order already acknowledged" }, { status: 409 });
  }

  const order = await prisma.order.update({
    where: { id },
    data: {
      acknowledgedAt: new Date(),
      acknowledgedById: auth.userId,
      statusEvents: {
        create: {
          status: "ACCEPTED",
          note: "Order acknowledged by staff.",
        },
      },
    },
    select: {
      id: true,
      orderNumber: true,
      acknowledgedAt: true,
      acknowledgedById: true,
    },
  });

  // Create audit log entry
  await prisma.auditLog.create({
    data: {
      actorId: auth.userId,
      actorRole: auth.role,
      action: "order_acknowledged",
      targetType: "Order",
      targetId: id,
    },
  });

  return NextResponse.json({
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      acknowledgedAt: order.acknowledgedAt?.toISOString() ?? null,
      acknowledgedById: order.acknowledgedById,
    },
  });
}
