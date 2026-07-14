import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { OffersClient } from "@/components/offers/offers-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Offers & Deals",
  description: "Check out the latest offers and deals on groceries."
};

export default async function OffersPage() {
  const now = new Date();

  const [offers, promoCodes, session] = await Promise.all([
    prisma.offer.findMany({
      where: {
        isActive: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] }]
      },
      orderBy: { createdAt: "desc" }
    }).catch(() => []),
    prisma.promoCode.findMany({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }]
      },
      orderBy: { createdAt: "desc" },
      take: 6
    }).catch(() => []),
    auth().catch(() => null)
  ]);

  // Get category names for offers
  const categoryIds = offers.filter((o) => o.categoryId).map((o) => o.categoryId!);
  const categories = categoryIds.length > 0
    ? await prisma.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true, name: true } }).catch(() => [])
    : [];
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  // Serialize Prisma Decimal types and Date objects for client component
  const serializedOffers = offers.map((offer) => ({
    id: offer.id,
    title: offer.title,
    description: offer.description,
    discountType: offer.discountType,
    discountValue: Number(offer.discountValue),
    categoryId: offer.categoryId,
    productId: offer.productId,
    minQuantity: offer.minQuantity,
    maxDiscount: offer.maxDiscount ? Number(offer.maxDiscount) : null,
    isActive: offer.isActive,
    startsAt: offer.startsAt ? offer.startsAt.toISOString() : null,
    expiresAt: offer.expiresAt ? offer.expiresAt.toISOString() : null,
    image: offer.image,
    badge: offer.badge
  }));

  const serializedPromoCodes = promoCodes.map((promo) => ({
    id: promo.id,
    code: promo.code,
    description: promo.description,
    discountType: promo.discountType,
    discountValue: Number(promo.discountValue),
    minimumOrder: Number(promo.minimumOrder),
    isActive: promo.isActive,
    expiresAt: promo.expiresAt ? promo.expiresAt.toISOString() : null
  }));

  const isLoggedIn = !!(session?.user?.id);

  return (
    <OffersClient
      offers={serializedOffers}
      promoCodes={serializedPromoCodes}
      catMap={catMap}
      isLoggedIn={isLoggedIn}
    />
  );
}
