import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  title: z.string().min(2).optional(),
  subtitle: z.string().optional(),
  image: z.string().url().optional(),
  href: z.string().optional(),
  isActive: z.boolean().optional()
});

async function requireAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid banner." }, { status: 400 });
    const banner = await prisma.banner.update({ where: { id }, data: parsed.data });
    revalidatePath("/");
    revalidatePath("/admin/settings");
    return NextResponse.json({ banner });
  } catch (error) {
    console.error("Banner update failed", error);
    return NextResponse.json({ error: "Banner could not be updated." }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    await prisma.banner.delete({ where: { id } });
    revalidatePath("/");
    revalidatePath("/admin/settings");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Banner delete failed", error);
    return NextResponse.json({ error: "Banner could not be deleted." }, { status: 500 });
  }
}
