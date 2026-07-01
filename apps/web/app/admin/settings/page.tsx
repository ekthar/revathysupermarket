import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { FeatureFlagSettings } from "@/components/admin/feature-flag-settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user?.id || !["ADMIN", "OWNER"].includes(session.user.role as string)) {
    redirect("/admin");
  }

  // Fetch all feature flags
  const flags = await prisma.featureFlag.findMany({
    orderBy: { key: "asc" },
  });

  // Fetch delivery partners for forced_accept_delivery per-staff overrides
  const deliveryPartners = await prisma.user.findMany({
    where: { role: "DELIVERY_PARTNER", isActive: true },
    select: { id: true, name: true, phone: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-950 p-5">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Feature Flags</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
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
  );
}
