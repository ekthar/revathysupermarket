import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";
import { productSchema } from "@/lib/validations";
import { enforceRateLimit, rateLimitResponse } from "@/lib/distributed-rate-limit";

/**
 * GET /api/mobile/v1/admin/products
 * Paginated product list with search and category filter.
 */
export async function GET(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER", "STAFF"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const skip = (page - 1) * limit;
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId") || undefined;

  const where: Record<string, unknown> = {};
  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }
  if (categoryId) {
    where.categoryId = categoryId;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
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
        isFeatured: true,
        categoryId: true,
        createdAt: true,
      },
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({
    products: products.map((p) => ({
      ...p,
      price: Number(p.price),
      discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
    })),
    total,
    page,
    limit,
  });
}

/**
 * POST /api/mobile/v1/admin/products
 * Create a new product.
 */
export async function POST(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limit = await enforceRateLimit(`mobile-admin:${auth.userId}`, 60, 60);
  if (limit.limited) return rateLimitResponse(limit.reset);

  const body = await request.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })) },
      { status: 400 }
    );
  }

  const { name, description, image, price, discountPrice, costPrice, brand, stock, unit, isActive, isFeatured, gstRate } = parsed.data;
  const { categoryId, subCategoryId } = body;

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const product = await prisma.product.create({
    data: {
      name,
      slug,
      description,
      image: image || "",
      price,
      discountPrice: discountPrice || null,
      costPrice: costPrice || null,
      brand: brand || null,
      stock: stock ?? 0,
      unit: unit ?? "1 pc",
      categoryId,
      subCategoryId: subCategoryId || null,
      isActive: isActive ?? true,
      isFeatured: isFeatured ?? false,
      gstRate: gstRate || null,
    },
  });

  return NextResponse.json({ product }, { status: 201 });
}
