import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isDeliveryRole } from "@/lib/authz";
import { deliveryLocationSchema } from "@/lib/validations";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !isDeliveryRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const limit = await enforceRateLimit(`delivery:location:${session.user.id}`, 120, 60);
  if (limit.limited) return rateLimitResponse(limit.reset);
  const body = await request.json();
  const parsed = deliveryLocationSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid location." }, { status: 400 });

  const activeOrder = await prisma.order.findFirst({ where: { deliveryPartnerId: session.user.id, status: { in: ["OUT_FOR_DELIVERY", "ARRIVING"] } }, select: { id: true, status: true, latitude: true, longitude: true, userId: true } });
  const distanceMetres = activeOrder ? distanceInMetres(parsed.data.latitude, parsed.data.longitude, Number(activeOrder.latitude), Number(activeOrder.longitude)) : null;
  const shouldArrive = activeOrder?.status === "OUT_FOR_DELIVERY" && distanceMetres !== null && distanceMetres <= 100;
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: session.user.id }, data: { currentLatitude: parsed.data.latitude, currentLongitude: parsed.data.longitude, locationUpdatedAt: new Date() } });
    if (activeOrder) await tx.deliveryLocationEvent.create({ data: { orderId: activeOrder.id, deliveryPartnerId: session.user.id, latitude: parsed.data.latitude, longitude: parsed.data.longitude } });
    if (activeOrder && shouldArrive) {
      const changed = await tx.order.updateMany({ where: { id: activeOrder.id, status: "OUT_FOR_DELIVERY" }, data: { status: "ARRIVING" } });
      if (changed.count === 1) {
        await tx.orderEvent.create({ data: { orderId: activeOrder.id, status: "ARRIVING", note: `Delivery partner is within ${Math.round(distanceMetres!)} metres.` } });
        if (activeOrder.userId) await tx.notification.create({ data: { userId: activeOrder.userId, orderId: activeOrder.id, title: "Your order is near", body: "Your delivery partner is near your doorstep.", type: "delivery" } });
      }
    }
    await tx.deliveryLocationEvent.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } });
  });
  return NextResponse.json({ ok: true, status: shouldArrive ? "ARRIVING" : activeOrder?.status, distanceMetres });
}

function distanceInMetres(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radius = 6371000;
  const toRadians = (value: number) => value * Math.PI / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}
