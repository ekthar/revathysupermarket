import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

/**
 * POST /api/orders/[id]/print — Record a print action for the order invoice.
 * Atomically increments printCount, sets printedAt, and returns duplicate status.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;

  const result = await requireRole(["ADMIN", "OWNER", "STAFF", "PACKING_STAFF"]);
  if (result instanceof NextResponse) return result;
  const session = result;

  // Verify order exists
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Atomic increment and timestamp update
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      printCount: { increment: 1 },
      printedAt: new Date(),
      printedById: session.user.id,
    },
    select: {
      printCount: true,
      printedAt: true,
    },
  });

  return NextResponse.json({
    printCount: updated.printCount,
    printedAt: updated.printedAt?.toISOString() ?? null,
    isDuplicate: updated.printCount > 1,
  });
}
