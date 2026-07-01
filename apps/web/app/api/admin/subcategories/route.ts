import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requireProductStaff } from "@/lib/authz";
import { slugify } from "@/lib/utils";

const createSchema = z.object({
  name: z.string().min(2).max(100),
  categoryId: z.string().min(1),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export async function GET(request: Request) {
  const session = await auth();
  const unauthorized = requireProductStaff(session);
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId");

  const where: Record<string, unknown> = {};
  if (categoryId) where.categoryId = categoryId;

  const subcategories = await prisma.subCategory.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      category: { select: { id: true, name: true } },
      _count: { select: { products: true } },
    },
  });

  return NextResponse.json({ subcategories });
}

export async function POST(request: Request) {
  const session = await auth();
  const unauthorized = requireProductStaff(session);
  if (unauthorized) return unauthorized;

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid subcategory data.", details: parsed.error.flatten() }, { status: 400 });
  }

  // Verify category exists
  const category = await prisma.category.findUnique({ where: { id: parsed.data.categoryId } });
  if (!category) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  // Check for duplicate slug
  const slug = slugify(parsed.data.name);
  const existing = await prisma.subCategory.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "A subcategory with this name already exists." }, { status: 409 });
  }

  const subcategory = await prisma.subCategory.create({
    data: {
      name: parsed.data.name,
      slug,
      categoryId: parsed.data.categoryId,
      sortOrder: parsed.data.sortOrder ?? 0,
    },
  });

  await writeAuditLog({
    actorId: session?.user?.id,
    actorRole: session?.user?.role,
    action: "subcategory_created",
    targetType: "SubCategory",
    targetId: subcategory.id,
    metadata: { name: subcategory.name, categoryId: subcategory.categoryId },
  });

  return NextResponse.json({ subcategory }, { status: 201 });
}
