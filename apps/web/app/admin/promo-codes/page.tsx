import { getAuthContext } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { AdminAccessDenied } from "@/components/admin/shared";
import { PromoCodesClient } from "@/components/admin/promo-codes-client";

export const dynamic = "force-dynamic";

export default async function AdminPromoCodesPage() {
  const ctx = await getAuthContext();

  if (!ctx || !hasPermission(ctx, "marketing.view")) {
    return <AdminAccessDenied permission="marketing.view" />;
  }

  const codes = await prisma.promoCode.findMany({
    orderBy: { createdAt: "desc" },
  });

  const serialized = codes.map((c) => ({
    id: c.id,
    code: c.code,
    description: c.description,
    discountType: c.discountType,
    discountValue: Number(c.discountValue),
    minimumOrder: Number(c.minimumOrder),
    maxDiscount: c.maxDiscount ? Number(c.maxDiscount) : null,
    usageLimit: c.usageLimit,
    usedCount: c.usedCount,
    isActive: c.isActive,
    startsAt: c.startsAt?.toISOString() || null,
    expiresAt: c.expiresAt?.toISOString() || null,
  }));

  return <PromoCodesClient codes={serialized} />;
}
