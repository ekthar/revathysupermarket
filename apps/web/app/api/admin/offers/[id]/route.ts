import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManageSettings } from "@/lib/authz";

const updateSchema = z.object({
  title: z.string().min(2).max(100).optional(),
  description: z.string().max(300).optional().nullable(),
  discountType: z.enum(["percentage", "fixed"]).optional(),
  discountValue: z.coerce.number().positive().max(10000).optional(),
  categoryId: z.string().optional().nullable(),
  productId: z.string().optional().nullable(),
  minQuantity: z.coerce.number().int().min(1).optional(),
  maxDiscount: z.coerce.number().positive().optional().nullable(),
  isActive: z.boolean().optional(),
  startsAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  image: z.string().trim().optional().nullable(),
  badge: z.string().max(30).optional().nullable()
});

// PUT /api/admin/offers/[id]
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!canManageSettings(session?.user?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.offer.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Offer not found." }, { status: 404 });

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid data." }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  if (parsed.data.description !== undefined) data.description = parsed.data.description;
  if (parsed.data.discountType !== undefined) data.discountType = parsed.data.discountType;
  if (parsed.data.discountValue !== undefined) data.discountValue = parsed.data.discountValue;
  if (parsed.data.categoryId !== undefined) data.categoryId = parsed.data.categoryId || null;
  if (parsed.data.productId !== undefined) data.productId = parsed.data.productId || null;
  if (parsed.data.minQuantity !== undefined) data.minQuantity = parsed.data.minQuantity;
  if (parsed.data.maxDiscount !== undefined) data.maxDiscount = parsed.data.maxDiscount;
  if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;
  if (parsed.data.startsAt !== undefined) data.startsAt = parsed.data.startsAt ? new Date(parsed.data.startsAt) : null;
  if (parsed.data.expiresAt !== undefined) data.expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;
  if (parsed.data.image !== undefined) data.image = parsed.data.image;
  if (parsed.data.badge !== undefined) data.badge = parsed.data.badge;

  const offer = await prisma.offer.update({ where: { id }, data });

  revalidatePath("/offers");
  revalidateTag("offers");

  return NextResponse.json({ offer });
}

// DELETE /api/admin/offers/[id]
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!canManageSettings(session?.user?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.offer.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Offer not found." }, { status: 404 });

  await prisma.offer.delete({ where: { id } });

  revalidatePath("/offers");
  revalidateTag("offers");

  return NextResponse.json({ success: true });
}
