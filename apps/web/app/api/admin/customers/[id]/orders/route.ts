import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isStaffRole } from "@/lib/authz";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!isStaffRole(session?.user?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const customer = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, phone: true },
  });

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const [orders, aggregates] = await Promise.all([
    prisma.order.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            name: true,
            quantity: true,
            price: true,
          },
        },
      },
    }),
    prisma.order.aggregate({
      where: { userId: id },
      _count: true,
      _sum: { total: true },
    }),
  ]);

  return NextResponse.json({
    customer,
    orders: orders.map((order: typeof orders[number]) => ({
      ...order,
      total: Number(order.total),
      items: order.items.map((item: typeof order.items[number]) => ({
        ...item,
        price: Number(item.price),
      })),
    })),
    aggregates: {
      totalOrders: aggregates._count,
      totalSpend: Number(aggregates._sum.total ?? 0),
    },
  });
}
