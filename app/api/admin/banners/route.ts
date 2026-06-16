import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  title: z.string().min(2),
  subtitle: z.string().optional(),
  image: z.string().url(),
  href: z.string().optional(),
  isActive: z.boolean().default(true)
});

async function requireAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ banners: await prisma.banner.findMany({ orderBy: { createdAt: "desc" } }) });
}

export async function POST(request: Request) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid banner." }, { status: 400 });
    const banner = await prisma.banner.create({ data: parsed.data });
    revalidatePath("/");
    revalidatePath("/admin/settings");
    return NextResponse.json({ banner });
  } catch (error) {
    console.error("Banner create failed", error);
    return NextResponse.json({ error: "Banner could not be saved." }, { status: 500 });
  }
}
