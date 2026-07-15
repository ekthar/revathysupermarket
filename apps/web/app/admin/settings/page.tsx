import { getAuthContext } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/permissions";
import { SettingsService } from "@/lib/services";
import { AdminAccessDenied } from "@/components/admin/shared";
import { SettingsPageClient } from "@/components/admin/settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const ctx = await getAuthContext();

  if (!ctx || !hasPermission(ctx, "settings.manage")) {
    return <AdminAccessDenied permission="settings.manage" />;
  }

  const [settings, featureFlags] = await Promise.all([
    SettingsService.getAll(),
    SettingsService.getFeatureFlags(),
  ]);

  const serializedFlags = featureFlags.map((f) => ({
    ...f,
    updatedAt: f.updatedAt.toISOString(),
  }));

  return (
    <SettingsPageClient settings={settings} featureFlags={serializedFlags} />
  );
}
