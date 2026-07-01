import Image from "next/image";
import Link from "next/link";
import { Tag, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Offers & Deals",
  description: "Check out the latest offers and deals on groceries."
};

export default async function OffersPage() {
  const now = new Date();
  const [offers, promoCodes] = await Promise.all([
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
    }).catch(() => [])
  ]);

  // Get category names for offers
  const categoryIds = offers.filter((o) => o.categoryId).map((o) => o.categoryId!);
  const categories = categoryIds.length > 0
    ? await prisma.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true, name: true } }).catch(() => [])
    : [];
  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-xl bg-[linear-gradient(135deg,rgba(255,140,0,0.12),rgba(255,200,0,0.16))] p-5 sm:p-7">
        <p className="text-xs font-black uppercase text-orange-600">Save more</p>
        <h1 className="mt-2 font-display text-4xl font-black leading-tight text-foreground">Offers & Deals</h1>
        <p className="mt-2 text-sm text-muted-foreground">Exclusive discounts on your favorite groceries. Offers auto-apply at checkout!</p>
      </section>

      {/* Active Offers */}
      {offers.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Active Offers</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer) => (
              <div key={offer.id} className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {offer.image && (
                  <Image src={offer.image} alt={offer.title} width={400} height={128} className="w-full h-32 object-cover" unoptimized />
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2">
                    {offer.badge && (
                      <span className="text-micro font-black bg-orange-500 text-white px-2 py-0.5 rounded-full">
                        {offer.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 font-bold text-foreground">{offer.title}</h3>
                  {offer.description && (
                    <p className="mt-1 text-caption text-muted-foreground">{offer.description}</p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-caption font-semibold text-primary">
                      {offer.discountType === "percentage"
                        ? `${Number(offer.discountValue)}% off`
                        : `${formatCurrency(Number(offer.discountValue))} off`}
                      {offer.maxDiscount ? ` (up to ${formatCurrency(Number(offer.maxDiscount))})` : ""}
                    </span>
                    {offer.categoryId && (
                      <span className="text-micro font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {catMap.get(offer.categoryId) ?? ""}
                      </span>
                    )}
                  </div>
                  {offer.expiresAt && (
                    <p className="mt-2 text-micro text-red-500 font-medium">
                      Expires {new Date(offer.expiresAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Promo Codes */}
      {promoCodes.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-bold text-foreground mb-4">Promo Codes</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {promoCodes.map((promo) => (
              <div key={promo.id} className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  <span className="text-body font-black text-primary tracking-wider">{promo.code}</span>
                </div>
                {promo.description && (
                  <p className="mt-2 text-caption text-muted-foreground">{promo.description}</p>
                )}
                <p className="mt-2 text-caption font-semibold text-foreground">
                  {promo.discountType === "percentage"
                    ? `${Number(promo.discountValue)}% off`
                    : `${formatCurrency(Number(promo.discountValue))} off`}
                  {Number(promo.minimumOrder) > 0 ? ` on orders above ${formatCurrency(Number(promo.minimumOrder))}` : ""}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {offers.length === 0 && promoCodes.length === 0 && (
        <div className="mt-12 text-center">
          <Tag className="h-12 w-12 text-muted-foreground/40 mx-auto" />
          <h2 className="mt-4 text-lg font-bold text-foreground">No offers right now</h2>
          <p className="mt-2 text-sm text-muted-foreground">Check back soon! We regularly add new deals.</p>
          <Link href="/products" className="mt-6 inline-flex items-center gap-2 h-11 px-6 rounded-full bg-primary text-sm font-bold text-white">
            Browse Products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </main>
  );
}
