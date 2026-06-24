import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const search = url.searchParams.get("search");
    const featured = url.searchParams.get("featured");
    const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { isActive: true };

    if (category) {
      where.category = { slug: category };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (featured === "true") {
      where.isFeatured = true;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          image: true,
          price: true,
          discountPrice: true,
          stock: true,
          unit: true,
          isFeatured: true,
          gstRate: true,
          categoryId: true,
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: [{ isFeatured: "desc" }, { popularity: "desc" }, { name: "asc" }],
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    const items = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      image: p.image,
      price: Number(p.price),
      discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
      stock: p.stock,
      unit: p.unit,
      isFeatured: p.isFeatured,
      gstRate: p.gstRate ? Number(p.gstRate) : null,
      categoryId: p.categoryId,
      category: p.category,
    }));

    return NextResponse.json({
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
