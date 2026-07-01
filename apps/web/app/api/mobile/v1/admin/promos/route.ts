import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * GET /api/mobile/v1/admin/promos
 * All promo codes.
 */
export async function GET(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER", "STAFF"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const promos = await prisma.promoCode.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    promos: promos.map((p) => ({
      ...p,
      discountValue: Number(p.discountValue),
      minimumOrder: Number(p.minimumOrder),
      maxDiscount: p.maxDiscount ? Number(p.maxDiscount) : null,
      startsAt: p.startsAt?.toISOString() ?? null,
      expiresAt: p.expiresAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
  });
}

/**
 * POST /api/mobile/v1/admin/promos
 * Create a new promo code.
 */
export async function POST(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { code, description, discountType, discountValue, minimumOrder, maxDiscount, usageLimit, isActive, startsAt, expiresAt } = body;

  if (!code || discountValue === undefined) {
    return NextResponse.json({ error: "Missing required fields: code, discountValue" }, { status: 400 });
  }

  const promo = await prisma.promoCode.create({
    data: {
      code: code.toUpperCase(),
      description: description || null,
      discountType: discountType || "percentage",
      discountValue,
      minimumOrder: minimumOrder ?? 0,
      maxDiscount: maxDiscount || null,
      usageLimit: usageLimit || null,
      isActive: isActive ?? true,
      startsAt: startsAt ? new Date(startsAt) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  return NextResponse.json({ promo }, { status: 201 });
}
