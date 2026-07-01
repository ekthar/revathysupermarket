import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reorderSchema = z.object({
  orderId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { orderId } = parsed.data;

    // Fetch the order and verify ownership
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: session.user.id },
      select: {
        items: {
          select: {
            productId: true,
            name: true,
            quantity: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Get current product info for stock check
    const productIds = [...new Set(order.items.map((item) => item.productId).filter((id): id is string => id !== null))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: { category: { select: { name: true } } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    const available: Array<{
      id: string;
      slug: string;
      name: string;
      category: string;
      price: number;
      discountPrice?: number;
      image: string;
      description: string;
      stock: number;
      popularity: number;
      unit: string;
      isFeatured: boolean;
      quantity: number;
    }> = [];
    const unavailable: string[] = [];

    for (const item of order.items) {
      if (!item.productId) {
        unavailable.push(item.name);
        continue;
      }
      const product = productMap.get(item.productId);
      if (!product || product.stock < 1) {
        unavailable.push(item.name);
      } else {
        const qty = Math.min(item.quantity, product.stock);
        available.push({
          id: product.id,
          slug: product.slug,
          name: product.name,
          category: product.category.name,
          price: Number(product.price),
          discountPrice: product.discountPrice ? Number(product.discountPrice) : undefined,
          image: product.image,
          description: product.description,
          stock: product.stock,
          popularity: product.popularity,
          unit: product.unit,
          isFeatured: product.isFeatured,
          quantity: qty,
        });
      }
    }

    return NextResponse.json({ available, unavailable });
  } catch (error) {
    console.error("Reorder check failed", error);
    return NextResponse.json({ error: "Could not process reorder" }, { status: 500 });
  }
}
