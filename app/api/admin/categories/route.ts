import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requireProductStaff } from "@/lib/authz";
import { slugify } from "@/lib/utils";

const schema = z.object({ name: z.string().min(2), description: z.string().optional() });

export async function GET() {
  const session = await auth();
  const unauthorized = requireProductStaff(session);
  if (unauthorized) return unauthorized;
  return NextResponse.json({ categories: await prisma.category.findMany({ orderBy: { name: "asc" } }) });
}

export async function POST(request: Request) {
  const session = await auth();
  const unauthorized = requireProductStaff(session);
  if (unauthorized) return unauthorized;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  const category = await prisma.category.create({
    data: { name: parsed.data.name, slug: slugify(parsed.data.name), description: parsed.data.description }
  });
  await writeAuditLog({
    actorId: session?.user?.id,
    actorRole: session?.user?.role,
    action: "category_created",
    targetType: "Category",
    targetId: category.id,
    metadata: { name: category.name }
  });
  return NextResponse.json({ category });
}
