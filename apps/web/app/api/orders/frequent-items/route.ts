import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCacheHeaders } from "@/lib/api-cache-headers";

/**
 * GET /api/orders/frequent-items — Smart Reorder: user's most frequently ordered items.
 *
 * Analyzes order history (last 60 days) to find items ordered 2+ times.
 * Returns the top 8 products with their average quantities, sorted by frequency.
 *
 * Used by the "Your Usual" one-tap reorder button on the homepage.
 * Only returns items that are currently in stock and active.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ items: [] }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    // Find all order items from recent completed orders
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          userId,
          status: { notIn: ["CANCELLED", "RETURNED"] },
          createdAt: { gte: sixtyDaysAgo },
        },
      },
      select: {
        productId: true,
        quantity: true,
        product: {
          select: {
            id: true,
            slug: true,
            name: true,
            image: true,
            price: true,
            discountPrice: true,
            stock: true,
            unit: true,
            isActive: true,
            category: { select: { name: true } },
          },
        },
      },
    });

    // Aggregate by product: count orders and average quantity
    const productMap = new Map<string, {
      product: (typeof orderItems)[0]["product"];
      orderCount: number;
      totalQuantity: number;
    }>();

    for (const item of orderItems) {
      if (!item.product || !item.product.isActive || item.product.stock <= 0) continue;

      const existing = productMap.get(item.productId);
      if (existing) {
        existing.orderCount += 1;
        existing.totalQuantity += item.quantity;
      } else {
        productMap.set(item.productId, {
          product: item.product,
          orderCount: 1,
          totalQuantity: item.quantity,
        });
      }
    }

    // Filter: only items ordered 2+ times (truly "usual")
    const frequent = Array.from(productMap.values())
      .filter((entry) => entry.orderCount >= 2)
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 8)
      .map((entry) => ({
        id: entry.product!.id,
        slug: entry.product!.slug,
        name: entry.product!.name,
        image: entry.product!.image,
        price: Number(entry.product!.price),
        discountPrice: entry.product!.discountPrice ? Number(entry.product!.discountPrice) : null,
        stock: entry.product!.stock,
        unit: entry.product!.unit,
        category: entry.product!.category.name,
        frequency: entry.orderCount,
        avgQuantity: Math.round(entry.totalQuantity / entry.orderCount),
      }));

    return NextResponse.json(
      { items: frequent, hasUsual: frequent.length >= 3 },
      { headers: getCacheHeaders("products") }
    );
  } catch (error) {
    console.error("Frequent items API error:", error);
    return NextResponse.json({ items: [], hasUsual: false }, { status: 500 });
  }
}
