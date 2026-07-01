import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * POST /api/mobile/v1/orders/[id]/print
 * Record a print action for the order invoice.
 * Atomically increments printCount, sets printedAt and printedById.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;

  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "STAFF", "PACKING_STAFF"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
      printedById: auth.userId,
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
