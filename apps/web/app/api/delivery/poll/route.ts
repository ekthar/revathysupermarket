import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateDeliveryPartnerRequest } from "@/lib/hybrid-auth";

/**
 * Polling endpoint for delivery partner alerts.
 * Returns assignments that this partner has not acknowledged yet. The pending
 * state lives in the database so a reload, a cold start, or a missed poll cannot
 * swallow an alert.
 *
 * Supports both mobile Bearer token auth and web session auth.
 */
export async function GET(request: NextRequest) {
  const authResult = await authenticateDeliveryPartnerRequest(request);
  if (!authResult) {
    return NextResponse.json({ orders: [] });
  }

  const orders = await prisma.order.findMany({
    where: {
      deliveryPartnerId: authResult.userId,
      deliveryAssignedAt: { not: null },
      deliveryAlertAckAt: null,
      status: { in: ["READY_FOR_DELIVERY", "OUT_FOR_DELIVERY", "ARRIVING"] }
    },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      houseName: true,
      street: true,
      landmark: true,
      pincode: true,
      total: true
    },
    orderBy: { deliveryAssignedAt: "asc" },
    take: 10
  }).catch(() => []);

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      address: `${o.houseName}, ${o.street}, ${o.landmark}, ${o.pincode}`,
      total: Number(o.total)
    }))
  });
}

export async function POST(request: NextRequest) {
  const authResult = await authenticateDeliveryPartnerRequest(request);
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as { orderId?: unknown } | null;
  if (typeof body?.orderId !== "string" || !body.orderId) {
    return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
  }

  const result = await prisma.order.updateMany({
    where: {
      id: body.orderId,
      deliveryPartnerId: authResult.userId,
      deliveryAlertAckAt: null
    },
    data: { deliveryAlertAckAt: new Date() }
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }
  return NextResponse.json({ acknowledged: true });
}
