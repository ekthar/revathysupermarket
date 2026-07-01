import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * POST /api/mobile/v1/admin/orders/[id]/print
 * Record a print action for an order. Increments printCount and sets printedAt.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER", "STAFF"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.order.findUnique({
    where: { id },
    select: { id: true, orderNumber: true, printCount: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const order = await prisma.order.update({
    where: { id },
    data: {
      printCount: { increment: 1 },
      printedAt: new Date(),
      printedById: auth.userId,
    },
    select: {
      id: true,
      orderNumber: true,
      printCount: true,
      printedAt: true,
    },
  });

  return NextResponse.json({
    ok: true,
    orderNumber: order.orderNumber,
    printCount: order.printCount,
    printedAt: order.printedAt?.toISOString() ?? null,
  });
}
