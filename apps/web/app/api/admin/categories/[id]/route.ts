import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requireProductStaff } from "@/lib/authz";
import { slugify } from "@/lib/utils";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  image: z.string().trim().optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).optional()
});

// GET /api/admin/categories/[id]
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const unauthorized = requireProductStaff(session);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } }
  });

  if (!category) return NextResponse.json({ error: "Category not found." }, { status: 404 });
  return NextResponse.json({ category });
}

// PUT /api/admin/categories/[id]
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const unauthorized = requireProductStaff(session);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid category data." }, { status: 400 });

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Category not found." }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) {
    data.name = parsed.data.name;
    data.slug = slugify(parsed.data.name);
  }
  if (parsed.data.description !== undefined) data.description = parsed.data.description;
  if (parsed.data.image !== undefined) data.image = parsed.data.image;
  if (parsed.data.sortOrder !== undefined) data.sortOrder = parsed.data.sortOrder;

  const category = await prisma.category.update({ where: { id }, data });

  await writeAuditLog({
    actorId: session?.user?.id,
    actorRole: session?.user?.role,
    action: "category_updated",
    targetType: "Category",
    targetId: category.id,
    metadata: { name: category.name, changes: Object.keys(data) }
  });

  return NextResponse.json({ category });
}

// DELETE /api/admin/categories/[id]
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const unauthorized = requireProductStaff(session);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } }
  });

  if (!category) return NextResponse.json({ error: "Category not found." }, { status: 404 });

  // Check if any product in this category has ever been sold
  const soldProductsCount = await prisma.orderItem.count({
    where: {
      product: {
        categoryId: id
      }
    }
  });

  if (soldProductsCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete "${category.name}" — sales have already been processed for products in this category.` },
      { status: 400 }
    );
  }

  // Deleting products attached to this category (sales checked and 0 found)
  await prisma.$transaction([
    prisma.product.deleteMany({ where: { categoryId: id } }),
    prisma.category.delete({ where: { id } })
  ]);

  await writeAuditLog({
    actorId: session?.user?.id,
    actorRole: session?.user?.role,
    action: "category_deleted",
    targetType: "Category",
    targetId: id,
    metadata: { name: category.name, deletedProductCount: category._count.products }
  });

  return NextResponse.json({ success: true });
}
