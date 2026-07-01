import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * GET /api/mobile/v1/admin/customers/[id]
 * Customer detail with recent orders.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER", "STAFF"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const customer = await prisma.user.findUnique({
    where: { id, role: "CUSTOMER" },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      isActive: true,
      createdAt: true,
      orders: {
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
        },
      },
      _count: { select: { orders: true } },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  // Get total spent
  const totalSpent = await prisma.order.aggregate({
    _sum: { total: true },
    where: { userId: id, status: "DELIVERED" },
  });

  return NextResponse.json({
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      isActive: customer.isActive,
      createdAt: customer.createdAt.toISOString(),
      orderCount: customer._count.orders,
      totalSpent: Number(totalSpent._sum.total ?? 0),
      recentOrders: customer.orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: Number(o.total),
        createdAt: o.createdAt.toISOString(),
      })),
    },
  });
}
