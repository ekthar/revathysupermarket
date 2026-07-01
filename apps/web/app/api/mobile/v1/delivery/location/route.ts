import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

const schema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  heading: z.number().optional(),
});

/**
 * POST /api/mobile/v1/delivery/location
 * Update delivery partner GPS location.
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
    return NextResponse.json({ error: "Invalid location." }, { status: 400 });
  }

  const { latitude, longitude, heading } = parsed.data;

  // Find active delivery order for this partner
  const activeOrder = await prisma.order.findFirst({
    where: {
      deliveryPartnerId: auth.userId,
      status: { in: ["OUT_FOR_DELIVERY", "ARRIVING"] },
    },
    select: { id: true, status: true },
  });

  await prisma.$transaction(async (tx) => {
    // Update user's current location
    await tx.user.update({
      where: { id: auth.userId },
      data: {
        currentLatitude: latitude,
        currentLongitude: longitude,
        locationUpdatedAt: new Date(),
      },
    });

    // If there's an active delivery, create a location event
    if (activeOrder) {
      await tx.deliveryLocationEvent.create({
        data: {
          orderId: activeOrder.id,
          deliveryPartnerId: auth.userId,
          latitude,
          longitude,
          heading: heading ?? null,
        },
      });
    }
  });

  return NextResponse.json({ ok: true, status: activeOrder?.status ?? null });
}
