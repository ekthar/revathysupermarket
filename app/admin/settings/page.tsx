import { prisma } from "@/lib/prisma";
import { deliverySummary } from "@/lib/delivery";
import { getStoreSettings } from "@/lib/store-settings";
import { SettingsManagementClient } from "@/components/admin/settings-management-client";
import { MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [settings, banners] = await Promise.all([
    getStoreSettings(),
    prisma.banner.findMany({
      select: { id: true, title: true, subtitle: true, image: true, href: true, isActive: true },
      orderBy: { createdAt: "desc" }
    }).catch(() => [])
  ]);

  return (
    <div>
      <div className="rounded-[2rem] bg-[linear-gradient(135deg,rgba(15,138,95,0.12),rgba(167,209,41,0.16))] p-5 sm:p-7">
        <p className="text-xs font-black uppercase text-primary">Store control</p>
        <h2 className="mt-2 font-display text-4xl font-black leading-tight">Settings</h2>
        <p className="mt-2 text-sm text-muted-foreground">Manage contact details, delivery radius, map links, and offers.</p>
      </div>
      <SettingsManagementClient settings={settings} banners={banners} />
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
