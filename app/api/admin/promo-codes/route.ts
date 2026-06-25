import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManageSettings } from "@/lib/authz";

const createSchema = z.object({
  code: z.string().min(3).max(20).transform((v) => v.toUpperCase().replace(/\s/g, "")),
  description: z.string().max(200).optional(),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.coerce.number().positive().max(10000),
  minimumOrder: z.coerce.number().min(0).default(0),
  maxDiscount: z.coerce.number().positive().optional(),
  usageLimit: z.coerce.number().int().positive().optional(),
  isActive: z.boolean().default(true),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional()
});

// GET /api/admin/promo-codes
export async function GET() {
  const session = await auth();
  if (!canManageSettings(session?.user?.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const codes = await prisma.promoCode.findMany({
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ codes });
}

// POST /api/admin/promo-codes
export async function POST(request: Request) {
  const session = await auth();
  if (!canManageSettings(session?.user?.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid promo code data." }, { status: 400 });
  }

  // Check uniqueness
  const existing = await prisma.promoCode.findUnique({ where: { code: parsed.data.code } });
  if (existing) return NextResponse.json({ error: "Promo code already exists." }, { status: 409 });

  const promo = await prisma.promoCode.create({
    data: {
      code: parsed.data.code,
      description: parsed.data.description,
      discountType: parsed.data.discountType,
      discountValue: parsed.data.discountValue,
      minimumOrder: parsed.data.minimumOrder,
      maxDiscount: parsed.data.maxDiscount,
      usageLimit: parsed.data.usageLimit,
      isActive: parsed.data.isActive,
      startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : null,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null
    }
  });

  revalidatePath("/offers");
  revalidateTag("offers");

  return NextResponse.json({ promo }, { status: 201 });
}
