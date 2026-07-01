import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * GET /api/mobile/v1/admin/products/[id]
 * Single product detail.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER", "STAFF"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true } },
      subCategory: { select: { id: true, name: true } },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({
    product: {
      ...product,
      price: Number(product.price),
      discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
      costPrice: product.costPrice ? Number(product.costPrice) : null,
      gstRate: product.gstRate ? Number(product.gstRate) : null,
    },
  });
}

/**
 * PATCH /api/mobile/v1/admin/products/[id]
 * Update product fields.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  const allowedFields = [
    "name", "description", "image", "price", "discountPrice", "costPrice",
    "brand", "stock", "unit", "categoryId", "subCategoryId", "isActive",
    "isFeatured", "gstRate",
  ];

  const data: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  }

  // Auto-update slug if name changes
  if (data.name) {
    data.slug = (data.name as string).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  const product = await prisma.product.update({
    where: { id },
    data,
  });

  return NextResponse.json({ product });
}

/**
 * DELETE /api/mobile/v1/admin/products/[id]
 * Soft-delete product (set isActive=false).
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  await prisma.product.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
