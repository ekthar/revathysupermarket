import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

/**
 * Cart stock/price validation.
 *
 * The cart lives client-side (localStorage), so its stock/price snapshots go
 * stale. This endpoint returns the CURRENT stock, price, and active status for
 * a set of product ids (and optionally variant ids), letting the client
 * reconcile the cart (drop sold-out items, clamp quantities, refresh prices)
 * and apologise to the shopper.
 *
 * Public + read-only: it only exposes catalogue data the shopper can already
 * see on the product pages.
 */
const schema = z.object({
  ids: z.array(z.string().min(1)).max(200),
  variantIds: z.array(z.string().min(1)).max(200).optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const ids = [...new Set(parsed.data.ids)];
  if (ids.length === 0) {
    return NextResponse.json({ items: [], variants: [] });
  }

  const products = await prisma.product
    .findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, stock: true, price: true, discountPrice: true, isActive: true },
    })
    .catch(() => []);

  // Fetch variant-level stock/price when variantIds are provided
  const variantIds = [...new Set(parsed.data.variantIds ?? [])];
  const variants = variantIds.length > 0
    ? await prisma.productVariant
        .findMany({
          where: { id: { in: variantIds } },
          select: { id: true, productId: true, label: true, stock: true, price: true, discountPrice: true },
        })
        .catch(() => [])
    : [];

  return NextResponse.json({
    items: products.map((p) => ({
      id: p.id,
      name: p.name,
      stock: p.stock,
      price: Number(p.price),
      discountPrice: p.discountPrice != null ? Number(p.discountPrice) : null,
      isActive: p.isActive,
    })),
    variants: variants.map((v) => ({
      id: v.id,
      productId: v.productId,
      label: v.label,
      stock: v.stock,
      price: Number(v.price),
      discountPrice: v.discountPrice != null ? Number(v.discountPrice) : null,
    })),
  });
}
