import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { getDateRange, to2dp } from "@/lib/report-utils";

/**
 * GET /api/reports/profit?period=week|month|quarter
 * Returns profit analysis (revenue - cost) for delivered/paid orders.
 * Uses Product.costPrice for cost calculation (pre-tax).
 * Products without costPrice are flagged in warnings.
 */
export async function GET(request: Request) {
  const result = await requireRole(["ADMIN", "OWNER"]);
  if (result instanceof NextResponse) return result;

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "";

  const range = getDateRange(period);
  if (!range) {
    return NextResponse.json(
      { error: "Invalid period. Use: week, month, or quarter" },
      { status: 400 }
    );
  }

  const { start, end, periodStart, periodEnd } = range;

  // Fetch all order items with product cost data from delivered/paid orders
  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: {
        status: "DELIVERED",
        paymentStatus: "PAID",
        createdAt: { gte: start, lte: end },
      },
    },
    select: {
      quantity: true,
      price: true,
      productId: true,
      name: true,
      product: {
        select: {
          id: true,
          name: true,
          costPrice: true,
        },
      },
    },
  });

  let totalRevenue = 0;
  let totalCost = 0;
  const missingCostProducts = new Map<string, string>(); // productId -> name

  for (const item of orderItems) {
    const revenue = Number(item.price) * item.quantity;
    totalRevenue += revenue;

    if (item.product?.costPrice !== null && item.product?.costPrice !== undefined) {
      totalCost += Number(item.product.costPrice) * item.quantity;
    } else if (item.productId) {
      // Track products missing cost price
      missingCostProducts.set(
        item.productId,
        item.product?.name ?? item.name
      );
    }
  }

  const grossProfit = totalRevenue - totalCost;
  const profitMarginPercent =
    totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const warnings = Array.from(missingCostProducts.entries()).map(
    ([productId, name]) => ({
      productId,
      name,
      reason: "missing_cost_price" as const,
    })
  );

  return NextResponse.json({
    totalRevenue: to2dp(totalRevenue),
    totalCost: to2dp(totalCost),
    grossProfit: to2dp(grossProfit),
    profitMarginPercent: to2dp(profitMarginPercent),
    periodStart,
    periodEnd,
    warnings,
  });
}
