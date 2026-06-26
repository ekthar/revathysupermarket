import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canManageSettings } from "@/lib/authz";
import { OfferManagementClient } from "@/components/admin/offer-management-client";

export const dynamic = "force-dynamic";

export default async function AdminOffersPage() {
  const session = await auth();
  if (!canManageSettings(session?.user?.role)) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 shadow-soft">
        <h2 className="font-display text-3xl font-black">Offers</h2>
        <p className="mt-2 text-sm text-muted-foreground">Owner access is required.</p>
      </div>
    );
  }

  const [offers, categories] = await Promise.all([
    prisma.offer.findMany({ orderBy: { createdAt: "desc" } }).catch(() => []),
    prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }).catch(() => [])
  ]);

  return (
    <div>
      <section className="rounded-xl bg-[linear-gradient(135deg,rgba(15,138,95,0.12),rgba(167,209,41,0.16))] p-5 sm:p-7">
        <p className="text-xs font-black uppercase text-primary">Promotions</p>
        <h1 className="mt-2 font-display text-4xl font-black leading-tight">Offers & Deals</h1>
        <p className="mt-2 text-sm text-muted-foreground">Create product or category-level offers. Customers see badges on applicable products.</p>
      </section>
      <OfferManagementClient
        offers={offers.map((o) => ({
          id: o.id,
          title: o.title,
          description: o.description,
          discountType: o.discountType,
          discountValue: Number(o.discountValue),
          categoryId: o.categoryId,
          productId: o.productId,
          minQuantity: o.minQuantity,
          maxDiscount: o.maxDiscount ? Number(o.maxDiscount) : null,
          isActive: o.isActive,
          startsAt: o.startsAt?.toISOString() || null,
          expiresAt: o.expiresAt?.toISOString() || null,
          image: o.image,
          badge: o.badge
        }))}
        categories={categories}
      />
    </div>
  );
}
