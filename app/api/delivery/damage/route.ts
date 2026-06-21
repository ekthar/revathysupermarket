import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

/**
 * POST /api/delivery/damage
 * Record doorstep damage. Instant reductions capped at item value and 20% of order total.
 * Larger requests routed to admin approval.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "DELIVERY_PARTNER") {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHENTICATED" }, { status: 401 });
  }

  const body = await req.json();
  const { orderId, itemName, quantity, reason, reductionAmount, evidenceUrl } = body as {
    orderId: string;
    itemName: string;
    quantity: number;
    reason: string;
    reductionAmount: number;
    evidenceUrl?: string;
  };

  if (!orderId || !itemName || !quantity || !reason || reductionAmount === undefined) {
    return NextResponse.json({ error: "Missing required fields", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  if (reductionAmount <= 0) {
    return NextResponse.json({ error: "Reduction amount must be positive", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  // Verify order
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, deliveryPartnerId: true, total: true, items: true },
  });

  if (!order || order.deliveryPartnerId !== session.user.id) {
    return NextResponse.json({ error: "Order not found or not assigned to you", code: "NOT_FOUND" }, { status: 404 });
  }

  if (!["ARRIVING", "OUT_FOR_DELIVERY"].includes(order.status)) {
    return NextResponse.json({ error: "Can only record damage during delivery", code: "INVALID_STATE" }, { status: 400 });
  }

  // Cap: 20% of order total
  const maxAutoReduction = Number(order.total) * 0.2;
  const needsApproval = reductionAmount > maxAutoReduction;

  // Find item value cap
  const orderItems = order.items as any[];
  const matchedItem = orderItems.find((i: any) => i.name?.toLowerCase() === itemName.toLowerCase());
  if (matchedItem && reductionAmount > Number(matchedItem.price) * matchedItem.quantity) {
    return NextResponse.json({ error: "Reduction cannot exceed item value", code: "EXCEEDS_ITEM_VALUE" }, { status: 400 });
  }

  const adjustment = await prisma.deliveryAdjustment.create({
    data: {
      orderId,
      partnerId: session.user.id,
      itemName,
      quantity,
      reason,
      reductionAmount,
      evidenceUrl: evidenceUrl || null,
      status: needsApproval ? "PENDING_APPROVAL" : "APPROVED",
      approvedAt: needsApproval ? null : new Date(),
    },
  });

  return NextResponse.json({
    adjustment,
    needsApproval,
    message: needsApproval
      ? `Reduction of ₹${reductionAmount} exceeds 20% cap (₹${maxAutoReduction.toFixed(0)}). Sent for admin approval.`
      : `Damage recorded and ₹${reductionAmount} reduction approved.`,
  });
}
