import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Find orders that contain this product
  const ordersWithProduct = await prisma.orderItem.findMany({
    where: { productId: product.id },
    select: { orderId: true },
    take: 100,
  });

  const orderIds = ordersWithProduct.map((oi) => oi.orderId);

  if (orderIds.length === 0) {
    return NextResponse.json({ suggestions: [] });
  }

  // Find other products that appear in those same orders (co-purchased)
  const coProducts = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      orderId: { in: orderIds },
      productId: { not: product.id },
      product: { isActive: true },
    },
    _count: { productId: true },
    orderBy: { _count: { productId: "desc" } },
    take: 6,
  });

  if (coProducts.length === 0) {
    return NextResponse.json({ suggestions: [] });
  }

  const productIds = coProducts.map((cp) => cp.productId).filter(Boolean) as string[];

  const suggestions = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
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

  // Sort suggestions by co-occurrence frequency
  const orderMap = new Map(productIds.map((id, i) => [id, i]));
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
