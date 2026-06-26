import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

const cartValidationSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.coerce.number().int().positive(),
    })
  ).min(1),
});

export async function POST(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = cartValidationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid cart data" }, { status: 400 });
    }

    const { items } = parsed.data;
    const productIds = [...new Set(items.map((i) => i.productId))];

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
        price: true,
        discountPrice: true,
        stock: true,
        unit: true,
        isActive: true,
        gstRate: true,
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    const validatedItems = items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        return {
          productId: item.productId,
          quantity: item.quantity,
          available: false,
          reason: "Product not found",
          currentPrice: 0,
          name: "Unknown",
          image: "",
          unit: "",
          stock: 0,
        };
      }

      if (!product.isActive) {
        return {
          productId: product.id,
          quantity: item.quantity,
          available: false,
          reason: "Product is no longer available",
          currentPrice: Number(product.discountPrice ?? product.price),
          name: product.name,
          image: product.image,
          unit: product.unit,
          stock: 0,
        };
      }

      const inStock = product.stock >= item.quantity;
      return {
        productId: product.id,
        quantity: item.quantity,
        available: inStock,
        reason: inStock ? null : `Only ${product.stock} available`,
        currentPrice: Number(product.discountPrice ?? product.price),
        originalPrice: Number(product.price),
        discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
        name: product.name,
        image: product.image,
        unit: product.unit,
        stock: product.stock,
        gstRate: product.gstRate ? Number(product.gstRate) : null,
      };
    });

    const allAvailable = validatedItems.every((i) => i.available);
    const subtotal = validatedItems
      .filter((i) => i.available)
      .reduce((sum, i) => sum + i.currentPrice * i.quantity, 0);

    return NextResponse.json({
      valid: allAvailable,
      items: validatedItems,
      subtotal,
    });
  } catch {
    return NextResponse.json({ error: "Failed to validate cart" }, { status: 500 });
  }
}
