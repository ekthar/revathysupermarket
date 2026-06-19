import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/promo-codes/validate - Validate a promo code at checkout
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { code, subtotal } = await request.json();
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Enter a promo code." }, { status: 400 });
  }

  const promo = await prisma.promoCode.findUnique({
    where: { code: code.toUpperCase().trim() }
  });

  if (!promo) return NextResponse.json({ error: "Invalid promo code." }, { status: 404 });
  if (!promo.isActive) return NextResponse.json({ error: "This promo code is no longer active." }, { status: 400 });

  const now = new Date();
  if (promo.startsAt && now < promo.startsAt) {
    return NextResponse.json({ error: "This promo code is not yet active." }, { status: 400 });
  }
  if (promo.expiresAt && now > promo.expiresAt) {
    return NextResponse.json({ error: "This promo code has expired." }, { status: 400 });
  }
  if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
    return NextResponse.json({ error: "This promo code has reached its usage limit." }, { status: 400 });
  }

  const minOrder = Number(promo.minimumOrder);
  if (subtotal && subtotal < minOrder) {
    return NextResponse.json({ error: `Minimum order of ₹${minOrder} required for this code.` }, { status: 400 });
  }

  // Calculate discount
  let discount = 0;
  if (promo.discountType === "percentage") {
    discount = Math.round((subtotal || 0) * Number(promo.discountValue) / 100);
    if (promo.maxDiscount) {
      discount = Math.min(discount, Number(promo.maxDiscount));
    }
  } else {
    discount = Number(promo.discountValue);
  }

  return NextResponse.json({
    valid: true,
    discount,
    code: promo.code,
    description: promo.description || `${promo.discountType === "percentage" ? `${promo.discountValue}%` : `₹${promo.discountValue}`} off`
  });
}
