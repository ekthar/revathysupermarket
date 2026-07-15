import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";
import { getActiveDeliveryOtp } from "@/lib/delivery";

/**
 * GET /api/mobile/v1/admin/orders/[id]
 * Full order detail for admin mobile app - includes items, customer, address,
 * delivery partner, timeline, payment, billNumber, printCount.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER", "STAFF"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        select: {
          id: true,
          productId: true,
          name: true,
          quantity: true,
          price: true,
        },
      },
      deliveryPartner: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      statusEvents: {
        select: {
          id: true,
          status: true,
          note: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      customerName: order.customerName,
      phone: order.phone,
      houseName: order.houseName,
      street: order.street,
      landmark: order.landmark,
      pincode: order.pincode,
      notes: order.notes,
      latitude: Number(order.latitude),
      longitude: Number(order.longitude),
      distanceKm: Number(order.distanceKm),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      status: order.status,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      deliveryFee: Number(order.deliveryFee),
      total: Number(order.total),
      tipAmount: Number(order.tipAmount),
      acknowledgedAt: order.acknowledgedAt?.toISOString() ?? null,
      acknowledgedById: order.acknowledgedById,
      deliveryPartnerId: order.deliveryPartnerId,
      deliveryAssignedAt: order.deliveryAssignedAt?.toISOString() ?? null,
      deliveryOtp: getActiveDeliveryOtp(order.deliveryOtp, order.deliveryOtpExpiresAt),
      deliveryOtpExpiresAt: order.deliveryOtpExpiresAt?.toISOString() ?? null,
      deliveryConfirmedAt: order.deliveryConfirmedAt?.toISOString() ?? null,
      billNumber: order.billNumber,
      staffNote: order.staffNote,
      printCount: order.printCount,
      printedAt: order.printedAt?.toISOString() ?? null,
      deliveryMode: order.deliveryMode,
      estimatedDeliveryAt: order.estimatedDeliveryAt?.toISOString() ?? null,
      deliveryInstructions: order.deliveryInstructions,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: Number(item.price),
      })),
      deliveryPartner: order.deliveryPartner
        ? {
            id: order.deliveryPartner.id,
            name: order.deliveryPartner.name,
            phone: order.deliveryPartner.phone,
          }
        : null,
      timeline: order.statusEvents.map((event) => ({
        id: event.id,
        status: event.status,
        note: event.note,
        createdAt: event.createdAt.toISOString(),
      })),
    },
  });
}
