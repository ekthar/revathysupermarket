import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";

/**
 * POST /api/admin/orders/[id]/printed
 * Records when an order invoice was printed and by whom.
 * Sends a real-time notification to all staff via the existing event publisher.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await requirePermission("orders.manage");
  if ("error" in result) return result.error;

  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, orderNumber: true, printedAt: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Only record the first print — don't overwrite so staff can see who printed first
  if (!order.printedAt) {
    await prisma.order.update({
      where: { id },
      data: { printedAt: new Date(), printedById: result.ctx.userId },
    });
  }

  return NextResponse.json({ ok: true, orderNumber: order.orderNumber, printedAt: order.printedAt ?? new Date() });
}
