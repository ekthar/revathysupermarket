import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";
import { allowedExternalImageUrl } from "@/lib/security";
import { validateDamageAdjustment } from "@/lib/delivery-money";

const schema = z.object({ orderId: z.string().min(1), orderItemId: z.string().min(1), quantity: z.coerce.number().int().positive(), reason: z.string().trim().min(3).max(300), reductionAmount: z.coerce.number().positive(), evidenceUrl: z.string().url().optional() });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "DELIVERY_PARTNER") return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  const limit = await enforceRateLimit(`delivery:damage:${session.user.id}`, 20, 3600);
  if (limit.limited) return rateLimitResponse(limit.reset);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid item, quantity, reason and reduction.", code: "INVALID_DAMAGE", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  const { orderId, orderItemId, quantity, reason, reductionAmount, evidenceUrl } = parsed.data;
  if (evidenceUrl && !allowedExternalImageUrl(evidenceUrl)) return NextResponse.json({ error: "Evidence must use an approved image host.", code: "INVALID_EVIDENCE" }, { status: 400 });

  const order = await prisma.order.findFirst({ where: { id: orderId, deliveryPartnerId: session.user.id, status: { in: ["OUT_FOR_DELIVERY", "ARRIVING"] } }, include: { items: true, deliveryAdjustments: { where: { status: { in: ["APPROVED", "PENDING_APPROVAL"] } } } } });
  if (!order) return NextResponse.json({ error: "Active assigned order not found.", code: "ORDER_NOT_FOUND" }, { status: 404 });
  const item = order.items.find((entry) => entry.id === orderItemId);
  if (!item) return NextResponse.json({ error: "Order item not found.", code: "ITEM_NOT_FOUND" }, { status: 404 });
  const previousQuantity = order.deliveryAdjustments.filter((entry) => entry.orderItemId === orderItemId).reduce((sum, entry) => sum + entry.quantity, 0);
  const previousReductions = order.deliveryAdjustments.reduce((sum, entry) => sum + Number(entry.reductionAmount), 0);
  const decision = validateDamageAdjustment({ orderTotal: Number(order.total), itemUnitPrice: Number(item.price), purchasedQuantity: item.quantity, previouslyAdjustedQuantity: previousQuantity, quantity, previousReduction: previousReductions, reduction: reductionAmount });
  if (!decision.valid) return NextResponse.json({ error: decision.code === "QUANTITY_EXCEEDED" ? "Adjusted quantity exceeds the purchased quantity." : "Reduction cannot exceed the selected item value.", code: decision.code }, { status: 409 });
  const orderCap = decision.orderCap ?? Number(order.total) * 0.2;
  const needsApproval = decision.needsApproval;
  const evidenceThreshold = Number(process.env.DELIVERY_DAMAGE_EVIDENCE_THRESHOLD ?? 100);
  if (reductionAmount >= evidenceThreshold && !evidenceUrl) return NextResponse.json({ error: "Evidence photo is required for this reduction.", code: "EVIDENCE_REQUIRED" }, { status: 400 });

  const adjustment = await prisma.deliveryAdjustment.create({ data: { orderId, orderItemId, partnerId: session.user.id, itemName: item.name, quantity, reason, reductionAmount, evidenceUrl: evidenceUrl ?? null, status: needsApproval ? "PENDING_APPROVAL" : "APPROVED", approvedAt: needsApproval ? null : new Date() } });
  return NextResponse.json({ adjustment, needsApproval, orderCap, remainingInstantLimit: Math.max(0, orderCap - previousReductions - (needsApproval ? 0 : reductionAmount)) }, { status: 201 });
}
