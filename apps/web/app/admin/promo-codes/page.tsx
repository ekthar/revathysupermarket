import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canManageSettings } from "@/lib/authz";
import { PromoCodesClient } from "@/components/admin/promo-codes-client";

export const dynamic = "force-dynamic";

export default async function AdminPromoCodesPage() {
  const session = await auth();
  if (!canManageSettings(session?.user?.role)) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8">
        <h2 className="font-display text-2xl font-bold">Promo Codes</h2>
        <p className="mt-2 text-sm text-muted-foreground">Owner access required.</p>
      </div>
    );
  }

  const codes = await prisma.promoCode.findMany({
    orderBy: { createdAt: "desc" }
  }).catch(() => []);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-slate-900 p-5">
        <p className="text-caption font-bold uppercase text-orange-600 dark:text-orange-400">Marketing</p>
        <h1 className="mt-1 text-xl font-bold text-foreground">Promo Codes</h1>
        <p className="text-caption text-muted-foreground mt-1">Create and manage discount codes for customers</p>
      </div>

      <PromoCodesClient
        codes={codes.map((c) => ({
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
          expiresAt: c.expiresAt?.toISOString() || null
        }))}
      />
    </div>
  );
}
