import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isStaffRole } from "@/lib/authz";
import { LiveOrderTracking } from "@/components/tracking/live-order-tracking";
import type { EtaDisplayMode } from "@/lib/live-order";

export const dynamic = "force-dynamic";

export default async function TrackOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const [order, etaFlag] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        orderNumber: true,
        status: true,
        deliveryOtp: true,
        latitude: true,
        longitude: true,
        distanceKm: true,
        subtotal: true,
        deliveryFee: true,
        tipAmount: true,
        total: true,
        paymentMethod: true,
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
        items: {
          select: {
            name: true,
            quantity: true,
            price: true,
          },
        },
      },
    }),
    prisma.featureFlag.findUnique({
      where: { key: "eta_display_mode" },
    }),
  ]);

  if (!order) redirect("/dashboard");
  if (!isStaffRole(session.user.role) && order.userId !== session.user.id) {
    redirect("/dashboard");
  }

  // Determine ETA display mode from feature flag config
  const etaDisplayMode: EtaDisplayMode =
    etaFlag?.enabled &&
    etaFlag.config &&
    typeof etaFlag.config === "object" &&
    !Array.isArray(etaFlag.config) &&
    "mode" in etaFlag.config &&
    (etaFlag.config as Record<string, unknown>).mode === "always"
      ? "always"
      : "after_assignment";

  const trackingData = {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    deliveryOtp:
      ["OUT_FOR_DELIVERY", "ARRIVING"].includes(order.status)
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
    // Distance-aware ETA fields
    distanceKm: order.distanceKm ? Number(order.distanceKm) : undefined,
    etaDisplayMode,
    // Order bill fields
    orderItems: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: Number(item.price),
    })),
    subtotal: order.subtotal ? Number(order.subtotal) : undefined,
    deliveryFee: order.deliveryFee ? Number(order.deliveryFee) : undefined,
    tipAmount: order.tipAmount ? Number(order.tipAmount) : undefined,
    total: order.total ? Number(order.total) : undefined,
    paymentMethod: order.paymentMethod ?? undefined,
  };

  return <LiveOrderTracking initialData={trackingData} />;
}
