import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requireProductStaff } from "@/lib/authz";
import { slugify } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  image: z.string().trim().optional(),
  sortOrder: z.coerce.number().int().min(0).optional()
});

export async function GET() {
  const session = await auth();
  const unauthorized = requireProductStaff(session);
  if (unauthorized) return unauthorized;
  // Categories are admin-managed, typically <50 rows - no take limit needed
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } }
  });
  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const session = await auth();
  const unauthorized = requireProductStaff(session);
  if (unauthorized) return unauthorized;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid category." }, { status: 400 });

  // Check if name already exists
  const existing = await prisma.category.findUnique({ where: { name: parsed.data.name } });
  if (existing) return NextResponse.json({ error: "Category name already exists." }, { status: 409 });

  const category = await prisma.category.create({
    data: {
      name: parsed.data.name,
      slug: slugify(parsed.data.name),
      description: parsed.data.description,
      image: parsed.data.image,
      sortOrder: parsed.data.sortOrder ?? 0
    }
  });
  await writeAuditLog({
    actorId: session?.user?.id,
    actorRole: session?.user?.role,
    action: "category_created",
    targetType: "Category",
    targetId: category.id,
    metadata: { name: category.name }
  });
  return NextResponse.json({ category }, { status: 201 });
}
