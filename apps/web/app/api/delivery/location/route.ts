import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { prisma } from "@/lib/prisma";
import { deliveryLocationSchema } from "@/lib/validations";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";
import { authenticateDeliveryRequest } from "@/lib/hybrid-auth";
import { publishRiderLocation, publishOrderStatusChanged } from "@/lib/realtime/event-publisher";
import { calculateDistanceMeters } from "@/lib/distance";
import { ARRIVAL_RADIUS_METERS } from "@/lib/constants";

const AUTO_ARRIVE_HOLD_SECONDS = 20;
const PROXIMITY_KEY_TTL = 60;

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  return Redis.fromEnv();
}

async function autoArrive(orderId: string, partnerId: string, latitude: number, longitude: number, distanceM: number) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true, customerName: true },
  });
  if (!order) return;

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: "ARRIVING", arrivedAt: new Date() },
    }),
    prisma.orderEvent.create({
      data: { orderId, status: "ARRIVING", note: `Auto-arrived within ${Math.round(distanceM)}m` },
    }),
    prisma.deliveryLocationEvent.create({
      data: { orderId, deliveryPartnerId: partnerId, latitude, longitude },
    }),
  ]);

  if (order.userId) {
    await prisma.notification.create({
      data: {
        userId: order.userId,
        title: "Your order is here!",
        body: "Your delivery partner has arrived at your doorstep.",
        type: "delivery",
        orderId,
      },
    }).catch(() => {});
  }

  publishOrderStatusChanged({
    orderId,
    orderNumber: "",
    status: "ARRIVING",
    previousStatus: "OUT_FOR_DELIVERY",
    userId: order.userId,
  }).catch(() => null);

  publishRiderLocation({
    orderId, riderId: partnerId,
    latitude, longitude,
    distanceMetres: distanceM,
  }).catch(() => null);
}

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

  const activeOrder = await prisma.order.findFirst({
    where: { deliveryPartnerId: authResult.userId, status: { in: ["OUT_FOR_DELIVERY", "ARRIVING"] } },
    select: { id: true, status: true, latitude: true, longitude: true },
  });

  const distanceMetres = activeOrder ? calculateDistanceMeters(
    { lat: parsed.data.latitude, lng: parsed.data.longitude },
    { lat: Number(activeOrder.latitude), lng: Number(activeOrder.longitude) }
  ) : null;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: authResult.userId },
      data: { currentLatitude: parsed.data.latitude, currentLongitude: parsed.data.longitude, locationUpdatedAt: new Date() },
    });
    if (activeOrder) {
      await tx.deliveryLocationEvent.create({
        data: { orderId: activeOrder.id, deliveryPartnerId: authResult.userId, latitude: parsed.data.latitude, longitude: parsed.data.longitude, heading: parsed.data.heading ?? null },
      });
    }
    await tx.deliveryLocationEvent.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    });
  });

  // ─── AUTO-ARRIVE CHECK ───
  // If rider is within arrival radius, track proximity duration in Redis.
  // When they've been inside for AUTO_ARRIVE_HOLD_SECONDS consecutive seconds,
  // auto-transition OUT_FOR_DELIVERY → ARRIVING.
  let didAutoArrive = false;
  if (activeOrder && activeOrder.status === "OUT_FOR_DELIVERY" && distanceMetres !== null) {
    const redis = getRedis();
    const proxKey = `arrival:proximity:${activeOrder.id}`;

    if (distanceMetres <= ARRIVAL_RADIUS_METERS) {
      if (redis) {
        const entered = await redis.get<number>(proxKey);
        if (entered === null) {
          await redis.set(proxKey, Date.now(), { ex: PROXIMITY_KEY_TTL });
        } else if (Date.now() - entered >= AUTO_ARRIVE_HOLD_SECONDS * 1000) {
          await redis.del(proxKey).catch(() => {});
          await autoArrive(activeOrder.id, authResult.userId, parsed.data.latitude, parsed.data.longitude, distanceMetres);
          didAutoArrive = true;
        }
      } else {
        // No Redis — fall back to manual-arrive only (no auto)
      }
    } else {
      if (redis) await redis.del(proxKey).catch(() => {});
    }
  }

  // ─── PUBLISH REAL-TIME EVENT ───
  if (activeOrder && !didAutoArrive) {
    publishRiderLocation({
      orderId: activeOrder.id,
      riderId: authResult.userId,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      heading: parsed.data.heading ?? undefined,
      distanceMetres: distanceMetres,
    }).catch(() => null);
  }

  return NextResponse.json({ ok: true, status: activeOrder?.status, distanceMetres, autoArrived: didAutoArrive });
}
