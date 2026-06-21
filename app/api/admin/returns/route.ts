import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireReturnStaff } from "@/lib/authz";

export async function GET() {
  const session = await auth();
  const unauthorized = requireReturnStaff(session);
  if (unauthorized) return unauthorized;

  const returns = await prisma.returnRequest.findMany({
    include: { order: { select: { orderNumber: true, customerName: true, paymentMethod: true } } },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return NextResponse.json({
    returns: returns.map((entry) => ({
      id: entry.id,
      returnNumber: entry.returnNumber,
      orderNumber: entry.order.orderNumber,
      customerName: entry.order.customerName,
      paymentMethod: entry.order.paymentMethod,
      status: entry.status,
      reason: entry.reason,
      note: entry.note,
      refundAmount: Number(entry.refundAmount ?? 0),
      items: entry.items,
      createdAt: entry.createdAt.toISOString()
    }))
  });
}
