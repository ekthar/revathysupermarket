import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";
import { to2dp } from "@/lib/report-utils";

/**
 * GET /api/mobile/v1/reports/fast-moving-items
 * Returns top 20 products by quantity sold in the last 30 days
 * (from DELIVERED + PAID orders only).
 */
export async function GET(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  // Fetch order items from delivered/paid orders in last 30 days
  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: {
        status: "DELIVERED",
        paymentStatus: "PAID",
        createdAt: { gte: thirtyDaysAgo },
      },
      productId: { not: null },
    },
    select: {
      productId: true,
      name: true,
      quantity: true,
      price: true,
      product: {
        select: {
          id: true,
          name: true,
          category: {
            select: { name: true },
          },
        },
      },
    },
  });

  // Aggregate by product
  const productMap = new Map<
    string,
    {
      productId: string;
      name: string;
      category: string;
      totalQuantity: number;
      totalRevenue: number;
    }
  >();

  for (const item of orderItems) {
    const pid = item.productId!;
    const existing = productMap.get(pid);
    const revenue = Number(item.price) * item.quantity;

    if (existing) {
      existing.totalQuantity += item.quantity;
      existing.totalRevenue += revenue;
    } else {
      productMap.set(pid, {
        productId: pid,
        name: item.product?.name ?? item.name,
        category: item.product?.category?.name ?? "Unknown",
        totalQuantity: item.quantity,
        totalRevenue: revenue,
      });
    }
  }

  // Sort by quantity descending, take top 20
  const items = Array.from(productMap.values())
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, 20)
    .map((item) => ({
      ...item,
      totalRevenue: to2dp(item.totalRevenue),
    }));

  return NextResponse.json({ items });
}
