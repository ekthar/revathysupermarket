import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";

const schema = z.object({ reason: z.string().trim().min(5).max(500) });
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const permission = await requirePermission("dispatch.manage");
  if ("error" in permission) return permission.error;
  const limit = await enforceRateLimit(`admin:arrival:${permission.ctx.userId}`, 10, 300);
  if (limit.limited) return rateLimitResponse(limit.reset);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "An override reason is required.", code: "REASON_REQUIRED" }, { status: 400 });
  const { id } = await params;
  const changed = await prisma.$transaction(async (tx) => {
    const result = await tx.order.updateMany({ where: { id, status: "OUT_FOR_DELIVERY", deliveryPartnerId: { not: null } }, data: { status: "ARRIVING" } });
    if (result.count !== 1) return false;
    await tx.orderEvent.create({ data: { orderId: id, status: "ARRIVING", note: `GPS override: ${parsed.data.reason}` } });
    await tx.auditLog.create({ data: { actorId: permission.ctx.userId, actorRole: permission.ctx.role as never, action: "delivery.arrival_override", targetType: "Order", targetId: id, metadata: { reason: parsed.data.reason } } });
    return true;
  });
  if (!changed) return NextResponse.json({ error: "Order is not eligible for an arrival override.", code: "INVALID_STATE" }, { status: 409 });
  return NextResponse.json({ success: true, status: "ARRIVING" });
}
