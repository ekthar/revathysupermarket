import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canManageSettings } from "@/lib/authz";
import { deliverySummary } from "@/lib/delivery";
import { getStoreSettings } from "@/lib/store-settings";
import { SettingsManagementClient } from "@/components/admin/settings-management-client";
import { MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!canManageSettings(session?.user?.role)) {
    return (
      <div className="rounded-[1.75rem] border border-border bg-card p-8 shadow-soft">
        <h2 className="font-display text-3xl font-black">Settings</h2>
        <p className="mt-2 text-sm text-muted-foreground">Owner access is required.</p>
      </div>
    );
  }

  const [settings, banners, templateRows] = await Promise.all([
    getStoreSettings(),
    prisma.banner.findMany({
      select: { id: true, title: true, subtitle: true, image: true, href: true, isActive: true },
      orderBy: { createdAt: "desc" }
    }).catch(() => []),
    prisma.setting.findMany({ where: { key: { startsWith: "whatsappTemplateStatus." } } }).catch(() => [])
  ]);
  const templateStatuses = Object.fromEntries(templateRows.map((row) => [row.key.replace("whatsappTemplateStatus.", ""), row.value]));

  return (
    <div>
      <div className="rounded-[2rem] bg-[linear-gradient(135deg,rgba(15,138,95,0.12),rgba(167,209,41,0.16))] p-5 sm:p-7">
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
      <div className="mt-5 rounded-[1.75rem] border border-white/70 bg-primary p-5 text-white shadow-soft dark:border-white/10">
        <MapPin className="h-6 w-6 text-lime-fresh" />
        <h3 className="mt-3 font-display text-2xl font-black">Delivery radius</h3>
        <p className="mt-2 text-sm leading-6 text-white/80">
          Checkout uses store coordinates, GPS distance, and pincode validation. {deliverySummary(settings.deliveryRadiusKm, settings.serviceablePincodes)}
        </p>
      </div>
    </div>
  );
}
