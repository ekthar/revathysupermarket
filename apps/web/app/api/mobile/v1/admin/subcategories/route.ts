import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * GET /api/mobile/v1/admin/subcategories
 * List subcategories, optionally filtered by categoryId.
 *
 * POST /api/mobile/v1/admin/subcategories
 * Create a new subcategory.
 */
export async function GET(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId");

  const where: Record<string, unknown> = {};
  if (categoryId) where.categoryId = categoryId;

  const subcategories = await prisma.subCategory.findMany({
    where,
    orderBy: { sortOrder: "asc" },
    include: { category: { select: { id: true, name: true } } },
  });

  return NextResponse.json({
    data: subcategories.map((sc) => ({
      id: sc.id,
      name: sc.name,
      slug: sc.slug,
      categoryId: sc.categoryId,
      categoryName: sc.category.name,
      sortOrder: sc.sortOrder,
      createdAt: sc.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { name, categoryId, sortOrder } = body;

  if (!name || !categoryId) {
    return NextResponse.json({ error: "name and categoryId are required" }, { status: 400 });
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const subcategory = await prisma.subCategory.create({
    data: {
      name,
      slug,
      categoryId,
      sortOrder: sortOrder ?? 0,
    },
  });

  return NextResponse.json({ data: subcategory }, { status: 201 });
}
