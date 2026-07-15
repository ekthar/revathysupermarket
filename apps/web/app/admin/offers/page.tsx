import { getAuthContext } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { AdminAccessDenied } from "@/components/admin/shared";
import { OfferManagementClient } from "@/components/admin/offer-management-client";

export const dynamic = "force-dynamic";

export default async function AdminOffersPage() {
  const ctx = await getAuthContext();

  if (!ctx || !hasPermission(ctx, "marketing.view")) {
    return <AdminAccessDenied permission="marketing.view" />;
  }

  const [offers, categories] = await Promise.all([
    prisma.offer.findMany({
      orderBy: { createdAt: "desc" },
    }).catch(() => []),
    prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }).catch(() => []),
  ]);

  const serialized = offers.map((o) => ({
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
    badge: o.badge,
  }));

  return <OfferManagementClient offers={serialized} categories={categories} />;
}
