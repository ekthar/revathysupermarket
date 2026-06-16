import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

const schema = z.object({ name: z.string().min(2), description: z.string().optional() });

async function requireAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ categories: await prisma.category.findMany({ orderBy: { name: "asc" } }) });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  const category = await prisma.category.create({
    data: { name: parsed.data.name, slug: slugify(parsed.data.name), description: parsed.data.description }
  });
  return NextResponse.json({ category });
}
