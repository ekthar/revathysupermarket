import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";
import { publishOrderStatusChanged, publishRiderLocation } from "@/lib/realtime/event-publisher";
import { calculateDistanceMeters } from "@/lib/distance";

/**
 * POST /api/delivery/arrive
 * Mark order as ARRIVING when partner is within 100m of delivery address.
 * Notifies the customer once.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "DELIVERY_PARTNER") {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHENTICATED" }, { status: 401 });
  }
  const limit = await enforceRateLimit(`delivery:arrive:${session.user.id}`, 30, 300);
  if (limit.limited) return rateLimitResponse(limit.reset);

  const body = await req.json();
  const { orderId, latitude, longitude } = body as { orderId: string; latitude: number; longitude: number };

  if (!orderId || !latitude || !longitude) {
    return NextResponse.json({ error: "Missing orderId, latitude, or longitude", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  // Verify order belongs to this partner
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, deliveryPartnerId: true, latitude: true, longitude: true, userId: true, customerName: true },
  });

  if (!order || order.deliveryPartnerId !== session.user.id) {
    return NextResponse.json({ error: "Order not found or not assigned to you", code: "NOT_FOUND" }, { status: 404 });
  }

  if (order.status !== "OUT_FOR_DELIVERY") {
    return NextResponse.json({ error: "Order is not out for delivery", code: "INVALID_STATE" }, { status: 400 });
  }

  // Calculate distance to delivery address
  const distanceM = calculateDistanceMeters(
    { lat: latitude, lng: longitude },
    { lat: Number(order.latitude), lng: Number(order.longitude) }
  );

  if (distanceM > 100) {
    return NextResponse.json({ error: `Too far from delivery address (${Math.round(distanceM)}m). Must be within 100m.`, code: "TOO_FAR", distance: distanceM }, { status: 400 });
  }

  // Update order status to ARRIVING
  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status: "ARRIVING" } }),
    prisma.orderEvent.create({ data: { orderId, status: "ARRIVING", note: `Partner arrived within ${Math.round(distanceM)}m` } }),
    prisma.deliveryLocationEvent.create({ data: { orderId, deliveryPartnerId: session.user.id, latitude, longitude } }),
  ]);

  // Notify customer
  if (order.userId) {
    await prisma.notification.create({
      data: {
        userId: order.userId,
        title: "Your order is here!",
        body: `Your delivery partner has arrived at your doorstep.`,
        type: "delivery",
        orderId,
      },
    }).catch(() => {});
  }

  // ─── PUBLISH REAL-TIME EVENTS ───
  publishOrderStatusChanged({
    orderId,
    orderNumber: "", // Not available in current scope, non-critical for tracking
    status: "ARRIVING",
    previousStatus: "OUT_FOR_DELIVERY",
    userId: order.userId,
  }).catch(() => null);

  publishRiderLocation({
    orderId,
    riderId: session.user.id,
    latitude,
    longitude,
    distanceMetres: distanceM,
  }).catch(() => null);

  return NextResponse.json({ success: true, status: "ARRIVING", distance: Math.round(distanceM) });
}
