import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const validateSchema = z.object({
  code: z.string().min(1).transform((v) => v.toUpperCase().trim()),
  subtotal: z.coerce.number().min(0)
});

// POST /api/promo-codes/validate - Validate a promo code and return discount
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Please log in to apply promo codes." }, { status: 401 });
    }

    const body = await request.json();
    const parsed = validateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Please enter a valid promo code." }, { status: 400 });
    }

    const { code, subtotal } = parsed.data;

    const promo = await prisma.promoCode.findUnique({ where: { code } });
    if (!promo) {
      return NextResponse.json({ error: "Invalid promo code." }, { status: 404 });
    }

    // Check if active
    if (!promo.isActive) {
      return NextResponse.json({ error: "This promo code is no longer active." }, { status: 400 });
    }

    // Check date range
    const now = new Date();
    if (promo.startsAt && now < promo.startsAt) {
      return NextResponse.json({ error: "This promo code is not yet active." }, { status: 400 });
    }
    if (promo.expiresAt && now > promo.expiresAt) {
      return NextResponse.json({ error: "This promo code has expired." }, { status: 400 });
    }

    // Check usage limit
    if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
      return NextResponse.json({ error: "This promo code has reached its usage limit." }, { status: 400 });
    }

    // Check minimum order
    if (subtotal < Number(promo.minimumOrder)) {
      return NextResponse.json({
        error: `Minimum order of ₹${Number(promo.minimumOrder)} required for this code.`
      }, { status: 400 });
    }

    // Calculate discount
    let discount = 0;
    if (promo.discountType === "percentage") {
      discount = Math.round((subtotal * Number(promo.discountValue)) / 100);
      // Apply max discount cap
      if (promo.maxDiscount && discount > Number(promo.maxDiscount)) {
        discount = Number(promo.maxDiscount);
      }
    } else {
      // Fixed discount
      discount = Math.min(Number(promo.discountValue), subtotal);
    }

    return NextResponse.json({
      valid: true,
      code: promo.code,
      discountType: promo.discountType,
      discountValue: Number(promo.discountValue),
      discount,
      description: promo.description || `${promo.discountType === "percentage" ? `${promo.discountValue}% off` : `₹${promo.discountValue} off`}`
    });
  } catch (error) {
    console.error("Promo validation error:", error);
    return NextResponse.json({ error: "Could not validate promo code." }, { status: 500 });
  }
}
