import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

const schema = z.object({
  orderId: z.string().min(1),
  cashCollected: z.coerce.number().min(0).max(1_000_000),
  upiCollected: z.coerce.number().min(0).max(1_000_000),
  upiReference: z.string().trim().max(120).optional(),
});

/**
 * POST /api/mobile/v1/delivery/collect
 * Record payment collection for a delivery order.
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
    return NextResponse.json(
      { error: "Enter valid cash and UPI amounts.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  if (parsed.data.upiCollected > 0 && !parsed.data.upiReference) {
    return NextResponse.json({ error: "UPI reference is required." }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: {
      id: parsed.data.orderId,
      deliveryPartnerId: auth.userId,
      status: { in: ["OUT_FOR_DELIVERY", "ARRIVING"] },
    },
    select: { id: true, total: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Active assigned order not found." }, { status: 404 });
  }

  // Calculate expected amount directly (total minus adjustments minus wallet)
  const [adjustments, wallet] = await Promise.all([
    prisma.deliveryAdjustment.aggregate({
      where: { orderId: order.id, status: "APPROVED" },
      _sum: { reductionAmount: true },
    }),
    prisma.walletTransaction.aggregate({
      where: { orderId: order.id, type: "debit" },
      _sum: { amount: true },
    }),
  ]);

  const adjustmentAmount = Number(adjustments._sum.reductionAmount ?? 0);
  const walletApplied = Number(wallet._sum.amount ?? 0);
  const expectedAmount = Number(order.total) - adjustmentAmount - walletApplied;
  const totalCollected = parsed.data.cashCollected + parsed.data.upiCollected;
  const delta = totalCollected - expectedAmount;
  const balanced = Math.abs(delta) < 0.01;
  const status = balanced
    ? "SETTLED"
    : delta < 0
      ? "SHORT"
      : "EXCESS";

  const collection = await prisma.deliveryCollection.upsert({
    where: { orderId: order.id },
    create: {
      orderId: order.id,
      partnerId: auth.userId,
      expectedAmount,
      cashCollected: parsed.data.cashCollected,
      upiCollected: parsed.data.upiCollected,
      walletApplied,
      adjustmentAmount,
      upiReference: parsed.data.upiReference ?? null,
      status,
    },
    update: {
      expectedAmount,
      cashCollected: parsed.data.cashCollected,
      upiCollected: parsed.data.upiCollected,
      walletApplied,
      adjustmentAmount,
      upiReference: parsed.data.upiReference ?? null,
      status,
      discrepancyReason: null,
    },
  });

  return NextResponse.json({
    collection,
    expectedAmount,
    totalCollected,
    balanced,
    delta,
  });
}
