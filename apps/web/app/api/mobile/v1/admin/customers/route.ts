import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * GET /api/mobile/v1/admin/customers
 * Customer list with order count and total spent. Supports search by name/phone.
 */
export async function GET(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER", "STAFF"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const skip = (page - 1) * limit;
  const search = searchParams.get("search") || "";

  const where: Record<string, unknown> = { role: "CUSTOMER" };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        isActive: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  // Get total spent per customer
  const customerIds = customers.map((c) => c.id);
  const totals = await prisma.order.groupBy({
    by: ["userId"],
    where: {
      userId: { in: customerIds },
      status: "DELIVERED",
    },
    _sum: { total: true },
  });

  const totalMap = new Map(totals.map((t) => [t.userId, Number(t._sum.total ?? 0)]));

  return NextResponse.json({
    customers: customers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      isActive: c.isActive,
      createdAt: c.createdAt.toISOString(),
      orderCount: c._count.orders,
      totalSpent: totalMap.get(c.id) || 0,
    })),
    total,
    page,
    limit,
  });
}
