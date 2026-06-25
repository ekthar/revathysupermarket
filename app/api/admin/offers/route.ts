import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManageSettings } from "@/lib/authz";

const createSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().max(300).optional(),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.coerce.number().positive().max(10000),
  categoryId: z.string().optional().nullable(),
  productId: z.string().optional().nullable(),
  minQuantity: z.coerce.number().int().min(1).default(1),
  maxDiscount: z.coerce.number().positive().optional().nullable(),
  isActive: z.boolean().default(true),
  startsAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  image: z.string().trim().optional().nullable(),
  badge: z.string().max(30).optional().nullable()
});

// GET /api/admin/offers
export async function GET() {
  const session = await auth();
  if (!canManageSettings(session?.user?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const offers = await prisma.offer.findMany({
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ offers });
}

// POST /api/admin/offers
export async function POST(request: Request) {
  const session = await auth();
  if (!canManageSettings(session?.user?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid offer data." }, { status: 400 });
  }

  const offer = await prisma.offer.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      discountType: parsed.data.discountType,
      discountValue: parsed.data.discountValue,
      categoryId: parsed.data.categoryId || null,
      productId: parsed.data.productId || null,
      minQuantity: parsed.data.minQuantity,
      maxDiscount: parsed.data.maxDiscount || null,
      isActive: parsed.data.isActive,
      startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : null,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      image: parsed.data.image || null,
      badge: parsed.data.badge || null
    }
  });

  revalidatePath("/offers");
  revalidateTag("offers");

  return NextResponse.json({ offer }, { status: 201 });
}
