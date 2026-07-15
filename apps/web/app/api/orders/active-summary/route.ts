import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateDistanceKm } from "@/lib/distance";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ order: null });
  }

  const order = await prisma.order.findFirst({
    where: {
      userId: session.user.id,
      status: { notIn: ["DELIVERED", "CANCELLED"] },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      latitude: true,
      longitude: true,
      deliveryPartner: {
        select: {
          currentLatitude: true,
          currentLongitude: true,
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ order: null });
  }

  let etaMinutes: number | null = null;
  if (
    order.deliveryPartner?.currentLatitude &&
    order.deliveryPartner.currentLongitude &&
    ["OUT_FOR_DELIVERY", "ARRIVING"].includes(order.status)
  ) {
    const dist = calculateDistanceKm(
      { lat: Number(order.deliveryPartner.currentLatitude), lng: Number(order.deliveryPartner.currentLongitude) },
      { lat: Number(order.latitude), lng: Number(order.longitude) }
    );
    etaMinutes = Math.max(2, Math.ceil((dist / 18) * 60));
  }

  return NextResponse.json({
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      etaMinutes,
    },
  });
}
