import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateMobileRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        orderNumber: true,
        userId: true,
        status: true,
        customerName: true,
        phone: true,
        houseName: true,
        street: true,
        landmark: true,
        pincode: true,
        notes: true,
        latitude: true,
        longitude: true,
        paymentMethod: true,
        paymentStatus: true,
        subtotal: true,
        discount: true,
        deliveryFee: true,
        total: true,
        deliveryMode: true,
        estimatedDeliveryAt: true,
        loyaltyPointsRedeemed: true,
        deliveryPartnerId: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            productId: true,
            name: true,
            quantity: true,
            price: true,
            gstRate: true,
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

    // Ownership check
    if (order.userId !== auth.userId) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Fetch delivery partner location if order is out for delivery
    let deliveryLocation = null;
    if (
      order.deliveryPartnerId &&
      (order.status === "OUT_FOR_DELIVERY" || order.status === "ARRIVING")
    ) {
      const location = await prisma.deliveryLocationEvent.findFirst({
        where: { orderId: id, deliveryPartnerId: order.deliveryPartnerId },
        select: { latitude: true, longitude: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      });
      if (location) {
        deliveryLocation = {
          latitude: Number(location.latitude),
          longitude: Number(location.longitude),
          updatedAt: location.createdAt,
        };
      }
    }

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        customerName: order.customerName,
        phone: order.phone,
        address: {
          houseName: order.houseName,
          street: order.street,
          landmark: order.landmark,
          pincode: order.pincode,
        },
        latitude: Number(order.latitude),
        longitude: Number(order.longitude),
        notes: order.notes,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        subtotal: Number(order.subtotal),
        discount: Number(order.discount),
        deliveryFee: Number(order.deliveryFee),
        total: Number(order.total),
        deliveryMode: order.deliveryMode,
        estimatedDeliveryAt: order.estimatedDeliveryAt,
        loyaltyPointsRedeemed: order.loyaltyPointsRedeemed,
        createdAt: order.createdAt,
        items: order.items.map((i) => ({
          id: i.id,
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          price: Number(i.price),
          gstRate: Number(i.gstRate),
        })),
        statusEvents: order.statusEvents,
        deliveryLocation,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}
