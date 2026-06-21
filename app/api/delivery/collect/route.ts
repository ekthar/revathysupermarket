import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

/**
 * POST /api/delivery/collect
 * Record cash and/or UPI collection at doorstep.
 * Supports split payment (cash + UPI).
 * UPI reference required when any UPI amount is recorded.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "DELIVERY_PARTNER") {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHENTICATED" }, { status: 401 });
  }

  const body = await req.json();
  const { orderId, cashCollected, upiCollected, upiReference } = body as {
    orderId: string;
    cashCollected: number;
    upiCollected: number;
    upiReference?: string;
  };

  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  if ((cashCollected || 0) < 0 || (upiCollected || 0) < 0) {
    return NextResponse.json({ error: "Amounts cannot be negative", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  // UPI reference required when UPI amount > 0
  if ((upiCollected || 0) > 0 && !upiReference) {
    return NextResponse.json({ error: "UPI reference is required when UPI amount is recorded", code: "UPI_REF_REQUIRED" }, { status: 400 });
  }

  // Verify order
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, deliveryPartnerId: true, total: true, paymentMethod: true, deliveryCollection: true },
  });

  if (!order || order.deliveryPartnerId !== session.user.id) {
    return NextResponse.json({ error: "Order not found or not assigned to you", code: "NOT_FOUND" }, { status: 404 });
  }

  if (!["ARRIVING", "OUT_FOR_DELIVERY"].includes(order.status)) {
    return NextResponse.json({ error: "Order not in delivery state", code: "INVALID_STATE" }, { status: 400 });
  }

  // Calculate expected amount (total minus any approved adjustments and wallet)
  const approvedAdjustments = await prisma.deliveryAdjustment.aggregate({
    where: { orderId, status: "APPROVED" },
    _sum: { reductionAmount: true },
  });
  const adjustmentTotal = Number(approvedAdjustments._sum.reductionAmount || 0);

  // Check wallet transactions (prepaid amount)
  const walletPaid = await prisma.walletTransaction.aggregate({
    where: { orderId, type: "debit" },
    _sum: { amount: true },
  });
  const walletApplied = Math.abs(Number(walletPaid._sum.amount || 0));

  const expectedAmount = Number(order.total) - adjustmentTotal - walletApplied;
  const totalCollected = (cashCollected || 0) + (upiCollected || 0);

  // Upsert collection record (idempotent)
  const collection = await prisma.deliveryCollection.upsert({
    where: { orderId },
    create: {
      orderId,
      partnerId: session.user.id,
      expectedAmount,
      cashCollected: cashCollected || 0,
      upiCollected: upiCollected || 0,
      walletApplied,
      adjustmentAmount: adjustmentTotal,
      upiReference: upiReference || null,
      status: totalCollected >= expectedAmount ? "PENDING_HANDOVER" : "SHORT",
    },
    update: {
      cashCollected: cashCollected || 0,
      upiCollected: upiCollected || 0,
      upiReference: upiReference || null,
      status: totalCollected >= expectedAmount ? "PENDING_HANDOVER" : "SHORT",
    },
  });

  return NextResponse.json({
    collection,
    expectedAmount,
    totalCollected,
    balanced: totalCollected >= expectedAmount,
  });
}
