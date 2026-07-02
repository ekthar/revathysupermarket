import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deliveryLocationSchema } from "@/lib/validations";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";
import { authenticateDeliveryRequest } from "@/lib/hybrid-auth";
import { publishRiderLocation } from "@/lib/realtime/event-publisher";
import { calculateDistanceMeters } from "@/lib/distance";

export async function POST(request: Request) {
  const authResult = await authenticateDeliveryRequest(request);
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await enforceRateLimit(`delivery:location:${authResult.userId}`, 120, 60);
  if (limit.limited) return rateLimitResponse(limit.reset);
  const body = await request.json();
  const parsed = deliveryLocationSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid location." }, { status: 400 });

  const activeOrder = await prisma.order.findFirst({ where: { deliveryPartnerId: authResult.userId, status: { in: ["OUT_FOR_DELIVERY", "ARRIVING"] } }, select: { id: true, status: true, latitude: true, longitude: true } });
  const distanceMetres = activeOrder ? calculateDistanceMeters(
    { lat: parsed.data.latitude, lng: parsed.data.longitude },
    { lat: Number(activeOrder.latitude), lng: Number(activeOrder.longitude) }
  ) : null;
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: authResult.userId }, data: { currentLatitude: parsed.data.latitude, currentLongitude: parsed.data.longitude, locationUpdatedAt: new Date() } });
    if (activeOrder) await tx.deliveryLocationEvent.create({ data: { orderId: activeOrder.id, deliveryPartnerId: authResult.userId, latitude: parsed.data.latitude, longitude: parsed.data.longitude, heading: parsed.data.heading ?? null } });
    await tx.deliveryLocationEvent.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } });
  });

  // ─── PUBLISH REAL-TIME EVENT ───
  if (activeOrder) {
    publishRiderLocation({
      orderId: activeOrder.id,
      riderId: authResult.userId,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      heading: parsed.data.heading ?? undefined,
      distanceMetres: distanceMetres,
    }).catch(() => null); // Fire-and-forget
  }

  return NextResponse.json({ ok: true, status: activeOrder?.status, distanceMetres });
}
