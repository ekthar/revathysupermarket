import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

const postSchema = z.object({
  amount: z.coerce.number().min(0),
  method: z.enum(["COD", "UPI_ON_DELIVERY", "WALLET", "CARD"]),
});

/**
 * GET /api/mobile/v1/delivery/orders/[id]/collection
 * Get collection status for an order.
 *
 * POST /api/mobile/v1/delivery/orders/[id]/collection
 * Record or update a collection for an order.
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
    where: { id, deliveryPartnerId: auth.userId },
    select: { id: true, total: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const collection = await prisma.deliveryCollection.findUnique({
    where: { orderId: id },
  });

  return NextResponse.json({
    collection: collection
      ? {
          orderId: collection.orderId,
          cashCollected: Number(collection.cashCollected),
          upiCollected: Number(collection.upiCollected),
          expectedAmount: Number(collection.expectedAmount),
          status: collection.status,
          completedAt: collection.completedAt?.toISOString() ?? null,
        }
      : null,
    orderTotal: Number(order.total),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["DELIVERY_PARTNER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: {
      id,
      deliveryPartnerId: auth.userId,
      status: { in: ["OUT_FOR_DELIVERY", "ARRIVING"] },
    },
    select: { id: true, total: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Active assigned order not found." }, { status: 404 });
  }

  const { amount, method } = parsed.data;
  const expectedAmount = Number(order.total);
  const isCash = method === "COD";
  const cashCollected = isCash ? amount : 0;
  const upiCollected = !isCash ? amount : 0;
  const totalCollected = cashCollected + upiCollected;
  const balanced = Math.abs(totalCollected - expectedAmount) < 0.01;
  const status = balanced
    ? "SETTLED"
    : totalCollected < expectedAmount
      ? "SHORT"
      : "EXCESS";

  const collection = await prisma.deliveryCollection.upsert({
    where: { orderId: id },
    create: {
      orderId: id,
      partnerId: auth.userId,
      expectedAmount,
      cashCollected,
      upiCollected,
      status,
    },
    update: {
      expectedAmount,
      cashCollected,
      upiCollected,
      status,
    },
  });

  return NextResponse.json({
    collection: {
      orderId: collection.orderId,
      cashCollected: Number(collection.cashCollected),
      upiCollected: Number(collection.upiCollected),
      expectedAmount: Number(collection.expectedAmount),
      status: collection.status,
    },
    balanced,
  });
}
