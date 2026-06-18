import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isStaffRole } from "@/lib/authz";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!isStaffRole(session?.user?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: {
      status: "ORDER_RECEIVED",
      acknowledgedAt: null
    },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      phone: true,
      total: true,
      createdAt: true,
      items: { select: { id: true } }
    },
    orderBy: { createdAt: "desc" },
    take: 5
  }).catch(() => []);

  return NextResponse.json({
    count: orders.length,
    orders: orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      phone: order.phone,
      total: Number(order.total),
      itemCount: order.items.length,
      createdAt: order.createdAt.toISOString()
    }))
  });
}
