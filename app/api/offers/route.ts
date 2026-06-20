import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/offers - Public endpoint for active offers
export async function GET() {
  try {
    const now = new Date();
    const offers = await prisma.offer.findMany({
      where: {
        isActive: true,
        OR: [
          { startsAt: null },
          { startsAt: { lte: now } }
        ],
        AND: [
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gte: now } }
            ]
          }
        ]
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({
      offers: offers.map((offer) => ({
        id: offer.id,
        title: offer.title,
        description: offer.description,
        discountType: offer.discountType,
        discountValue: Number(offer.discountValue),
        categoryId: offer.categoryId,
        productId: offer.productId,
        minQuantity: offer.minQuantity,
        maxDiscount: offer.maxDiscount ? Number(offer.maxDiscount) : null,
        badge: offer.badge,
        image: offer.image,
        expiresAt: offer.expiresAt?.toISOString() || null
      }))
    });
  } catch {
    return NextResponse.json({ offers: [] });
  }
}
