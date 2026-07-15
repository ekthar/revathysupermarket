import { getAuthContext } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { AdminAccessDenied } from "@/components/admin/shared";
import { FeatureFlagSettings } from "@/components/admin/feature-flag-settings";

export const dynamic = "force-dynamic";

export default async function AdminFeatureFlagsPage() {
  const ctx = await getAuthContext();

  if (!ctx || !hasPermission(ctx, "settings.manage")) {
    return <AdminAccessDenied permission="settings.manage" />;
  }

  let serializedFlags: { key: string; enabled: boolean; config: Record<string, unknown> | null }[] = [];
  let serializedPartners: { id: string; name: string }[] = [];

  try {
    const [flags, deliveryPartners] = await Promise.all([
      prisma.featureFlag.findMany({ orderBy: { key: "asc" } }),
      prisma.user.findMany({
        where: { role: "DELIVERY_PARTNER", isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    serializedFlags = flags.map((f) => ({
      key: f.key,
      enabled: f.enabled,
      config: f.config as Record<string, unknown> | null,
    }));

    serializedPartners = deliveryPartners.map((p) => ({
      id: p.id,
      name: p.name || "Unnamed",
    }));
  } catch (error) {
    console.error("[admin/feature-flags] Query failed:", error);
  }

  return (
    <FeatureFlagSettings flags={serializedFlags} deliveryPartners={serializedPartners} />
  );
}
