import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deliveryLocationSchema } from "@/lib/validations";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";
import { authenticateDeliveryRequest } from "@/lib/hybrid-auth";

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
  const distanceMetres = activeOrder ? distanceInMetres(parsed.data.latitude, parsed.data.longitude, Number(activeOrder.latitude), Number(activeOrder.longitude)) : null;
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: authResult.userId }, data: { currentLatitude: parsed.data.latitude, currentLongitude: parsed.data.longitude, locationUpdatedAt: new Date() } });
    if (activeOrder) await tx.deliveryLocationEvent.create({ data: { orderId: activeOrder.id, deliveryPartnerId: authResult.userId, latitude: parsed.data.latitude, longitude: parsed.data.longitude } });
    await tx.deliveryLocationEvent.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } });
  });
  return NextResponse.json({ ok: true, status: activeOrder?.status, distanceMetres });
}

function distanceInMetres(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radius = 6371000;
  const toRadians = (value: number) => value * Math.PI / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}
