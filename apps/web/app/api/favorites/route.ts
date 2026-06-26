import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/favorites - List user's favorites
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
          price: true,
          discountPrice: true,
          unit: true,
          stock: true,
          isActive: true,
          category: { select: { name: true, slug: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ favorites });
}

const addFavoriteSchema = z.object({
  productId: z.string().min(1)
});

// POST /api/favorites - Add a product to favorites
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = addFavoriteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid product ID." }, { status: 400 });

  // Verify product exists
  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  // Upsert to avoid duplicate errors
  const favorite = await prisma.favorite.upsert({
    where: {
      userId_productId: {
        userId: session.user.id,
        productId: parsed.data.productId
      }
    },
    update: {},
    create: {
      userId: session.user.id,
      productId: parsed.data.productId
    }
  });

  return NextResponse.json({ favorite }, { status: 201 });
}
