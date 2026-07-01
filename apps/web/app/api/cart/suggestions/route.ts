import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productIds = searchParams.get("ids")?.split(",").filter(Boolean) ?? [];

  if (productIds.length === 0) {
    return NextResponse.json({ suggestions: [] });
  }

  // Find orders that contain any of the cart products
  const ordersWithCartProducts = await prisma.orderItem.findMany({
    where: { productId: { in: productIds } },
    select: { orderId: true },
    take: 200,
  });

  const orderIds = [...new Set(ordersWithCartProducts.map((oi) => oi.orderId))];

  if (orderIds.length === 0) {
    return NextResponse.json({ suggestions: [] });
  }

  // Find co-purchased products, excluding items already in cart
  const coProducts = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      orderId: { in: orderIds },
      productId: { notIn: productIds },
      product: { isActive: true },
    },
    _count: { productId: true },
    orderBy: { _count: { productId: "desc" } },
    take: 8,
  });

  if (coProducts.length === 0) {
    return NextResponse.json({ suggestions: [] });
  }

  const suggestedIds = coProducts.map((cp) => cp.productId).filter(Boolean) as string[];

  const suggestions = await prisma.product.findMany({
    where: { id: { in: suggestedIds }, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      price: true,
      discountPrice: true,
      unit: true,
      stock: true,
    },
  });

  // Sort by co-occurrence frequency
  const orderMap = new Map(suggestedIds.map((id, i) => [id, i]));
  suggestions.sort((a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99));

  return NextResponse.json({
    suggestions: suggestions.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      image: s.image,
      price: Number(s.price),
      discountPrice: s.discountPrice ? Number(s.discountPrice) : undefined,
      unit: s.unit,
      stock: s.stock,
    })),
  });
}
