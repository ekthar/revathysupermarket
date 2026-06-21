import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isStaffRole } from "@/lib/authz";

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
      deliveryOtp: true,
      latitude: true,
      longitude: true,
      deliveryPartner: {
        select: {
          currentLatitude: true,
          currentLongitude: true,
          locationUpdatedAt: true
        }
      },
      statusEvents: { orderBy: { createdAt: "asc" } }
    }
  });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (!isStaffRole(session.user.role) && order.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    deliveryOtp: ["OUT_FOR_DELIVERY", "READY_FOR_DELIVERY"].includes(order.status) ? order.deliveryOtp : null,
    destination: { latitude: Number(order.latitude), longitude: Number(order.longitude) },
    deliveryPartnerLocation: order.status === "OUT_FOR_DELIVERY" && order.deliveryPartner?.currentLatitude && order.deliveryPartner.currentLongitude && order.deliveryPartner.locationUpdatedAt && Date.now() - order.deliveryPartner.locationUpdatedAt.getTime() < 5 * 60_000 ? {
      latitude: Number(order.deliveryPartner.currentLatitude),
      longitude: Number(order.deliveryPartner.currentLongitude),
      updatedAt: order.deliveryPartner.locationUpdatedAt?.toISOString()
    } : null,
    statusEvents: order.statusEvents.map((event) => ({
      status: event.status,
      note: event.note,
      createdAt: event.createdAt.toISOString()
    }))
  });
}
