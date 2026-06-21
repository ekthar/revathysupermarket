import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isStaffRole } from "@/lib/authz";
import { LiveOrderTracking } from "@/components/tracking/live-order-tracking";

export const dynamic = "force-dynamic";

export default async function TrackOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

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
      createdAt: true,
      deliveryPartner: {
        select: {
          name: true,
          phone: true,
          currentLatitude: true,
          currentLongitude: true,
          locationUpdatedAt: true,
        },
      },
      statusEvents: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order) redirect("/dashboard");
  if (!isStaffRole(session.user.role) && order.userId !== session.user.id) {
    redirect("/dashboard");
  }

  const trackingData = {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    deliveryOtp:
      ["OUT_FOR_DELIVERY", "READY_FOR_DELIVERY", "ARRIVING"].includes(order.status)
        ? order.deliveryOtp
        : null,
    destination: {
      latitude: Number(order.latitude),
      longitude: Number(order.longitude),
    },
    createdAt: order.createdAt.toISOString(),
    riderName: order.deliveryPartner?.name ?? null,
    riderPhone: order.deliveryPartner?.phone ?? null,
    deliveryPartnerLocation:
      order.deliveryPartner?.currentLatitude &&
      order.deliveryPartner.currentLongitude &&
      order.deliveryPartner.locationUpdatedAt &&
      Date.now() - order.deliveryPartner.locationUpdatedAt.getTime() < 5 * 60_000
        ? {
            latitude: Number(order.deliveryPartner.currentLatitude),
            longitude: Number(order.deliveryPartner.currentLongitude),
            updatedAt: order.deliveryPartner.locationUpdatedAt.toISOString(),
          }
        : null,
    statusEvents: order.statusEvents.map((event) => ({
      status: event.status,
      note: event.note,
      createdAt: event.createdAt.toISOString(),
    })),
  };

  return <LiveOrderTracking initialData={trackingData} />;
}
