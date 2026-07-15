import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * GET /api/mobile/v1/delivery/orders/[id]
 * Returns full order detail for a delivery partner's assigned order.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["DELIVERY_PARTNER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: {
      id,
      deliveryPartnerId: auth.userId,
    },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      phone: true,
      houseName: true,
      street: true,
      landmark: true,
      pincode: true,
      latitude: true,
      longitude: true,
      notes: true,
      deliveryInstructions: true,
      paymentMethod: true,
      paymentStatus: true,
      status: true,
      subtotal: true,
      discount: true,
      deliveryFee: true,
      total: true,
      tipAmount: true,
      createdAt: true,
      deliveryOtp: true,
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
      deliveryCollection: {
        select: {
          cashCollected: true,
          upiCollected: true,
          expectedAmount: true,
          status: true,
        },
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
      customerName: order.customerName,
      phone: order.phone,
      address: [order.houseName, order.street, order.landmark, order.pincode]
        .filter(Boolean)
        .join(", "),
      latitude: Number(order.latitude),
      longitude: Number(order.longitude),
      notes: order.notes,
      deliveryInstructions: order.deliveryInstructions,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      status: order.status,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      deliveryFee: Number(order.deliveryFee),
      total: Number(order.total),
      tipAmount: Number(order.tipAmount),
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: Number(item.price),
        gstRate: item.gstRate ? Number(item.gstRate) : 0,
      })),
      collection: order.deliveryCollection
        ? {
            cashCollected: Number(order.deliveryCollection.cashCollected),
            upiCollected: Number(order.deliveryCollection.upiCollected),
            expectedAmount: Number(order.deliveryCollection.expectedAmount),
            status: order.deliveryCollection.status,
          }
        : null,
    },
  });
}
