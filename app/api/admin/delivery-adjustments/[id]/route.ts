import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";

const schema = z.object({ decision: z.enum(["approve", "reject"]), reason: z.string().trim().max(500).optional() });
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const permission = await requirePermission("requests.manage");
  if ("error" in permission) return permission.error;
  const limit = await enforceRateLimit(`admin:damage:${permission.ctx.userId}`, 30, 300);
  if (limit.limited) return rateLimitResponse(limit.reset);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.decision === "reject" && !parsed.data.reason) return NextResponse.json({ error: "A decision and rejection reason are required.", code: "INVALID_DECISION" }, { status: 400 });
  const { id } = await params;
  const adjustment = await prisma.deliveryAdjustment.findUnique({ where: { id }, include: { order: { select: { id: true, userId: true } } } });
  if (!adjustment) return NextResponse.json({ error: "Adjustment not found.", code: "NOT_FOUND" }, { status: 404 });
  if (adjustment.status !== "PENDING_APPROVAL") return NextResponse.json({ adjustment, idempotent: true });
  const status = parsed.data.decision === "approve" ? "APPROVED" : "REJECTED";
  const updated = await prisma.$transaction(async (tx) => {
    const claimed = await tx.deliveryAdjustment.updateMany({ where: { id, status: "PENDING_APPROVAL" }, data: { status, approvedById: permission.ctx.userId, approvedAt: new Date() } });
    if (claimed.count !== 1) return tx.deliveryAdjustment.findUniqueOrThrow({ where: { id } });
    if (status === "APPROVED" && adjustment.order.userId) {
      const walletDebit = await tx.walletTransaction.aggregate({ where: { orderId: adjustment.order.id, type: "debit" }, _sum: { amount: true } });
      if (Number(walletDebit._sum.amount ?? 0) > 0) await tx.walletTransaction.create({ data: { userId: adjustment.order.userId, orderId: adjustment.order.id, amount: adjustment.reductionAmount, type: "credit", reason: `Doorstep adjustment ${adjustment.id}` } });
    }
    await tx.auditLog.create({ data: { actorId: permission.ctx.userId, actorRole: permission.ctx.role as never, action: `delivery_adjustment.${parsed.data.decision}`, targetType: "DeliveryAdjustment", targetId: id, metadata: { reason: parsed.data.reason } } });
    return tx.deliveryAdjustment.findUniqueOrThrow({ where: { id } });
  });
  return NextResponse.json({ adjustment: updated });
}
