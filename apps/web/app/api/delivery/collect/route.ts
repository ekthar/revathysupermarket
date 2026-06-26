import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";
import { collectionBalance } from "@/lib/delivery-money";
import { authenticateDeliveryPartnerRequest } from "@/lib/hybrid-auth";

const schema = z.object({ orderId: z.string().min(1), cashCollected: z.coerce.number().min(0).max(1_000_000), upiCollected: z.coerce.number().min(0).max(1_000_000), upiReference: z.string().trim().max(120).optional() });

export async function POST(request: Request) {
  const authResult = await authenticateDeliveryPartnerRequest(request);
  if (!authResult) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const limit = await enforceRateLimit(`delivery:collect:${authResult.userId}`, 30, 300);
  if (limit.limited) return rateLimitResponse(limit.reset);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter valid cash and UPI amounts.", code: "INVALID_COLLECTION", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  if (parsed.data.upiCollected > 0 && !parsed.data.upiReference) return NextResponse.json({ error: "UPI reference is required.", code: "UPI_REFERENCE_REQUIRED" }, { status: 400 });

  const order = await prisma.order.findFirst({ where: { id: parsed.data.orderId, deliveryPartnerId: authResult.userId, status: { in: ["OUT_FOR_DELIVERY", "ARRIVING"] } }, select: { id: true, total: true } });
  if (!order) return NextResponse.json({ error: "Active assigned order not found.", code: "ORDER_NOT_FOUND" }, { status: 404 });
  const [adjustments, wallet] = await Promise.all([
    prisma.deliveryAdjustment.aggregate({ where: { orderId: order.id, status: "APPROVED" }, _sum: { reductionAmount: true } }),
    prisma.walletTransaction.aggregate({ where: { orderId: order.id, type: "debit" }, _sum: { amount: true } })
  ]);
  const adjustmentAmount = Number(adjustments._sum.reductionAmount ?? 0);
  const walletApplied = Number(wallet._sum.amount ?? 0);
  const balance = collectionBalance({ total: Number(order.total), adjustment: adjustmentAmount, wallet: walletApplied, cash: parsed.data.cashCollected, upi: parsed.data.upiCollected });
  const remainingPayable = balance.expected;
  const doorstepCollected = balance.collected;
  const status = balance.status;
  const collection = await prisma.deliveryCollection.upsert({ where: { orderId: order.id }, create: { orderId: order.id, partnerId: authResult.userId, expectedAmount: remainingPayable, cashCollected: parsed.data.cashCollected, upiCollected: parsed.data.upiCollected, walletApplied, adjustmentAmount, upiReference: parsed.data.upiReference ?? null, status }, update: { expectedAmount: remainingPayable, cashCollected: parsed.data.cashCollected, upiCollected: parsed.data.upiCollected, walletApplied, adjustmentAmount, upiReference: parsed.data.upiReference ?? null, status, discrepancyReason: null } });
  return NextResponse.json({ collection, expectedAmount: remainingPayable, totalCollected: doorstepCollected, balanced: balance.balanced, delta: balance.delta });
}
