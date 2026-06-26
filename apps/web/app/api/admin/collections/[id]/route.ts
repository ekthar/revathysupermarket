import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";

const schema = z.object({ action: z.enum(["settle", "resolve_discrepancy"]), reason: z.string().trim().max(500).optional() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const permission = await requirePermission("collections.reconcile");
  if ("error" in permission) return permission.error;
  const limit = await enforceRateLimit(`admin:collection:${permission.ctx.userId}`, 40, 300);
  if (limit.limited) return rateLimitResponse(limit.reset);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid reconciliation action.", code: "INVALID_RECONCILIATION" }, { status: 400 });
  if (parsed.data.action === "resolve_discrepancy" && !parsed.data.reason) return NextResponse.json({ error: "A discrepancy reason is required.", code: "REASON_REQUIRED" }, { status: 400 });
  const { id } = await params;
  const collection = await prisma.deliveryCollection.findUnique({ where: { id } });
  if (!collection) return NextResponse.json({ error: "Collection not found.", code: "COLLECTION_NOT_FOUND" }, { status: 404 });
  if (collection.status === "SETTLED") return NextResponse.json({ collection, idempotent: true });
  if (["SHORT", "EXCESS"].includes(collection.status) && parsed.data.action !== "resolve_discrepancy") return NextResponse.json({ error: "Resolve the discrepancy with a reason first.", code: "DISCREPANCY_UNRESOLVED" }, { status: 409 });
  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.deliveryCollection.update({ where: { id }, data: { status: "SETTLED", discrepancyReason: parsed.data.reason, reconciledById: permission.ctx.userId, reconciledAt: new Date() } });
    await tx.auditLog.create({ data: { actorId: permission.ctx.userId, actorRole: permission.ctx.role as never, action: parsed.data.action === "settle" ? "collection.settled" : "collection.discrepancy_resolved", targetType: "DeliveryCollection", targetId: id, metadata: { reason: parsed.data.reason } } });
    return next;
  });
  return NextResponse.json({ collection: updated });
}
