import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requireProductStaff } from "@/lib/authz";
import { slugify } from "@/lib/utils";

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  categoryId: z.string().min(1).optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const unauthorized = requireProductStaff(session);
  if (unauthorized) return unauthorized;

  const { id } = await params;

  const existing = await prisma.subCategory.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Subcategory not found." }, { status: 404 });
  }

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid subcategory data.", details: parsed.error.flatten() }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.name) {
    data.name = parsed.data.name;
    data.slug = slugify(parsed.data.name);
    // Check slug uniqueness
    const slugConflict = await prisma.subCategory.findFirst({
      where: { slug: data.slug as string, id: { not: id } },
    });
    if (slugConflict) {
      return NextResponse.json({ error: "A subcategory with this name already exists." }, { status: 409 });
    }
  }
  if (parsed.data.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: parsed.data.categoryId } });
    if (!category) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }
    data.categoryId = parsed.data.categoryId;
  }
  if (parsed.data.sortOrder !== undefined) {
    data.sortOrder = parsed.data.sortOrder;
  }

  const subcategory = await prisma.subCategory.update({ where: { id }, data });

  await writeAuditLog({
    actorId: session?.user?.id,
    actorRole: session?.user?.role,
    action: "subcategory_updated",
    targetType: "SubCategory",
    targetId: subcategory.id,
    metadata: { name: subcategory.name, changes: Object.keys(data) },
  });

  return NextResponse.json({ subcategory });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const unauthorized = requireProductStaff(session);
  if (unauthorized) return unauthorized;

  const { id } = await params;

  const existing = await prisma.subCategory.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Subcategory not found." }, { status: 404 });
  }

  if (existing._count.products > 0) {
    return NextResponse.json(
      { error: `Cannot delete subcategory with ${existing._count.products} product(s). Reassign products first.` },
      { status: 409 }
    );
  }

  await prisma.subCategory.delete({ where: { id } });

  await writeAuditLog({
    actorId: session?.user?.id,
    actorRole: session?.user?.role,
    action: "subcategory_deleted",
    targetType: "SubCategory",
    targetId: id,
    metadata: { name: existing.name },
  });

  return NextResponse.json({ success: true });
}
