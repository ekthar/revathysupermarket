import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canManageSettings } from "@/lib/authz";
import { BannerManagementClient } from "@/components/admin/banner-management-client";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const session = await auth();
  if (!canManageSettings(session?.user?.role)) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 shadow-soft">
        <h2 className="font-display text-3xl font-black">Banners</h2>
        <p className="mt-2 text-sm text-muted-foreground">Owner access is required to manage promotional banners.</p>
      </div>
    );
  }

  const banners = await prisma.banner.findMany({
    orderBy: { createdAt: "desc" },
  }).catch(() => []);

  return (
    <div>
      <section className="rounded-xl bg-[linear-gradient(135deg,rgba(249,115,22,0.12),rgba(234,88,12,0.08))] p-5 sm:p-7">
        <p className="text-xs font-black uppercase text-brand-saffron">Promotions</p>
        <h1 className="mt-2 font-display text-4xl font-black leading-tight">Story Banners</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create full-bleed promotional banners shown as stories on the homepage. Add countdown timers, coupon codes, and schedule visibility.
        </p>
      </section>

      <BannerManagementClient
        banners={banners.map((b) => ({
          id: b.id,
          title: b.title,
          subtitle: b.subtitle,
          image: b.image,
          href: b.href,
          isActive: b.isActive,
          startsAt: b.startsAt?.toISOString() || null,
          endsAt: b.endsAt?.toISOString() || null,
        }))}
      />
    </div>
  );
}
