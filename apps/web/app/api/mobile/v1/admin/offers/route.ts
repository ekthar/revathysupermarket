import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * GET /api/mobile/v1/admin/offers
 * All offers.
 */
export async function GET(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER", "STAFF"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const offers = await prisma.offer.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    offers: offers.map((o) => ({
      ...o,
      discountValue: Number(o.discountValue),
      maxDiscount: o.maxDiscount ? Number(o.maxDiscount) : null,
      startsAt: o.startsAt?.toISOString() ?? null,
      expiresAt: o.expiresAt?.toISOString() ?? null,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    })),
  });
}

/**
 * POST /api/mobile/v1/admin/offers
 * Create a new offer.
 */
export async function POST(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { title, description, discountType, discountValue, categoryId, productId, minQuantity, maxDiscount, isActive, startsAt, expiresAt, image, badge } = body;

  if (!title || discountValue === undefined) {
    return NextResponse.json({ error: "Missing required fields: title, discountValue" }, { status: 400 });
  }

  const offer = await prisma.offer.create({
    data: {
      title,
      description: description || null,
      discountType: discountType || "percentage",
      discountValue,
      categoryId: categoryId || null,
      productId: productId || null,
      minQuantity: minQuantity ?? 1,
      maxDiscount: maxDiscount || null,
      isActive: isActive ?? true,
      startsAt: startsAt ? new Date(startsAt) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      image: image || null,
      badge: badge || null,
    },
  });

  return NextResponse.json({ offer }, { status: 201 });
}
