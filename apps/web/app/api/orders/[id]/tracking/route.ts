import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isStaffRole } from "@/lib/authz";
import { getActiveDeliveryOtp } from "@/lib/delivery";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      orderNumber: true,
      status: true,
      updatedAt: true,
      deliveryOtp: true,
      deliveryOtpExpiresAt: true,
      latitude: true,
      longitude: true,
      deliveryPartner: {
        select: {
          currentLatitude: true,
          currentLongitude: true,
          locationUpdatedAt: true
        }
      },
      deliveryLocationEvents: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { heading: true }
      },
      statusEvents: { orderBy: { createdAt: "asc" } }
    }
  });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (!isStaffRole(session.user.role) && order.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const headingValue = order.deliveryLocationEvents?.[0]?.heading ?? undefined;

  return NextResponse.json({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    updatedAt: order.updatedAt.toISOString(),
    deliveryOtp: ["OUT_FOR_DELIVERY", "READY_FOR_DELIVERY"].includes(order.status) ? getActiveDeliveryOtp(order.deliveryOtp, order.deliveryOtpExpiresAt) : null,
    destination: { latitude: Number(order.latitude), longitude: Number(order.longitude) },
    deliveryPartnerLocation: ["OUT_FOR_DELIVERY", "ARRIVING", "CUSTOMER_UNAVAILABLE", "READY_FOR_DELIVERY"].includes(order.status) && order.deliveryPartner?.currentLatitude && order.deliveryPartner.currentLongitude && order.deliveryPartner.locationUpdatedAt && Date.now() - order.deliveryPartner.locationUpdatedAt.getTime() < 10 * 60_000 ? {
      latitude: Number(order.deliveryPartner.currentLatitude),
      longitude: Number(order.deliveryPartner.currentLongitude),
      updatedAt: order.deliveryPartner.locationUpdatedAt?.toISOString(),
      ...(headingValue !== undefined && headingValue !== null ? { heading: headingValue } : {})
    } : null,
    statusEvents: order.statusEvents.map((event) => ({
      status: event.status,
      note: event.note,
      createdAt: event.createdAt.toISOString()
    }))
  });
}
