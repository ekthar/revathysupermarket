import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/validations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "10")));
  const offset = (page - 1) * limit;

  const product = await prisma.product.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const [reviews, totalCount, aggregation] = await Promise.all([
    prisma.review.findMany({
      where: { productId: product.id },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    }),
    prisma.review.count({ where: { productId: product.id } }),
    prisma.review.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      user: { id: r.user.id, name: r.user.name, image: r.user.image },
    })),
    avgRating: aggregation._avg.rating ? Number(aggregation._avg.rating.toFixed(1)) : 0,
    reviewCount: aggregation._count.rating,
    totalCount,
    page,
    totalPages: Math.ceil(totalCount / limit),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const { slug } = await params;
  const body = await request.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Rating must be between 1 and 5.", code: "INVALID_REVIEW" },
      { status: 400 }
    );
  }

  const product = await prisma.product.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Verify user has purchased this product in a delivered order
  const hasPurchased = await prisma.orderItem.findFirst({
    where: {
      productId: product.id,
      order: {
        userId: session.user.id,
        status: "DELIVERED",
      },
    },
    select: { id: true },
  });

  if (!hasPurchased) {
    return NextResponse.json(
      {
        error: "You can only review products you have purchased.",
        code: "NOT_PURCHASED",
      },
      { status: 403 }
    );
  }

  // Upsert review (one review per user per product)
  const review = await prisma.review.upsert({
    where: {
      userId_productId: {
        userId: session.user.id,
        productId: product.id,
      },
    },
    update: {
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    },
    create: {
      userId: session.user.id,
      productId: product.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    },
  });

  return NextResponse.json({ review }, { status: 201 });
}
