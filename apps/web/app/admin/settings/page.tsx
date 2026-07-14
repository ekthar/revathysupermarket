import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canManageSettings } from "@/lib/authz";
import { deliverySummary } from "@/lib/delivery";
import { getStoreSettings } from "@/lib/store-settings";
import { SettingsManagementClient } from "@/components/admin/settings-management-client";
import { BannerReorderClient } from "@/components/admin/banner-reorder-client";
import { MapPin } from "lucide-react";
import { getLoyaltyConfig } from "@/lib/loyalty-config";
import { LoyaltySettingsClient } from "@/components/admin/loyalty-settings-client";
import { FeatureFlagSettings } from "@/components/admin/feature-flag-settings";
import { seedFeatureFlags } from "@/prisma/feature-flags";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!canManageSettings(session?.user?.role)) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 shadow-soft">
        <h2 className="font-display text-3xl font-black">Settings</h2>
        <p className="mt-2 text-sm text-muted-foreground">Owner access is required.</p>
      </div>
    );
  }

  // Self-healing: ensure every default feature flag defined in code exists
  // in the DB before we read them. This is a no-op (besides a handful of
  // upserts) once the DB is caught up, but guarantees that flags added to
  // `featureFlags` after the last seed run (e.g. whatsapp_enabled,
  // sms_enabled) actually show up here without requiring a manual reseed.
  await seedFeatureFlags(prisma).catch(() => 0);

  const [settings, banners, templateRows, loyaltyConfig, flags, deliveryPartners] = await Promise.all([
    getStoreSettings(),
    prisma.banner.findMany({
      select: { id: true, title: true, subtitle: true, image: true, href: true, isActive: true },
      orderBy: { createdAt: "desc" }
    }).catch(() => []),
    prisma.setting.findMany({ where: { key: { startsWith: "whatsappTemplateStatus." } } }).catch(() => []),
    getLoyaltyConfig(),
    prisma.featureFlag.findMany({ orderBy: { key: "asc" } }).catch(() => []),
    prisma.user.findMany({
      where: { role: "DELIVERY_PARTNER", isActive: true },
      select: { id: true, name: true, phone: true },
      orderBy: { name: "asc" },
    }).catch(() => []),
  ]);
  const templateStatuses = Object.fromEntries(templateRows.map((row) => [row.key.replace("whatsappTemplateStatus.", ""), row.value]));

  return (
    <div>
      <div className="rounded-xl bg-[linear-gradient(135deg,rgba(15,138,95,0.12),rgba(167,209,41,0.16))] p-5 sm:p-7">
        <p className="text-xs font-black uppercase text-primary">Store control</p>
        <h2 className="mt-2 font-display text-4xl font-black leading-tight">Settings</h2>
        <p className="mt-2 text-sm text-muted-foreground">Manage contact details, delivery radius, map links, and offers.</p>
      </div>
      <SettingsManagementClient
        settings={settings}
        banners={banners}
        whatsappConfig={{
          phoneNumberIdConfigured: Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID),
          apiTokenConfigured: Boolean(process.env.WHATSAPP_API_TOKEN),
          verifyTokenConfigured: Boolean(process.env.WHATSAPP_VERIFY_TOKEN),
          businessPhone: process.env.WHATSAPP_BUSINESS_PHONE ?? settings.whatsapp
        }}
        templateStatuses={templateStatuses}
      />
      <BannerReorderClient banners={banners} />
      <LoyaltySettingsClient initialConfig={loyaltyConfig} />
      <div className="mt-5 rounded-xl border border-white/70 bg-primary p-5 text-white shadow-soft dark:border-white/10">
        <MapPin className="h-6 w-6 text-lime-fresh" />
        <h3 className="mt-3 font-display text-2xl font-black">Delivery radius</h3>
        <p className="mt-2 text-sm leading-6 text-white/80">
          Delivery eligibility is based on GPS distance only. {deliverySummary(settings.deliveryRadiusKm)}
        </p>
      </div>

      {/* Feature Flags Section */}
      <div className="mt-8">
        <div className="rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-950 p-5 mb-4">
          <h2 className="text-2xl font-black text-foreground">Feature Flags</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Control app-wide feature toggles. Changes take effect immediately.
          </p>
        </div>
        <FeatureFlagSettings
          flags={flags.map((f) => ({
            key: f.key,
            enabled: f.enabled,
            config: f.config as Record<string, unknown> | null,
          }))}
          deliveryPartners={deliveryPartners.map((p) => ({
            id: p.id,
            name: p.name ?? p.phone ?? "Unknown",
          }))}
        />
      </div>
    </div>
  );
}
