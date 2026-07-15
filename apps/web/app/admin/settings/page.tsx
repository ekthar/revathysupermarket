import { getAuthContext } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { AdminAccessDenied } from "@/components/admin/shared";
import { SettingsManagementClient } from "@/components/admin/settings-management-client";
import { getStoreSettings } from "@/lib/store-settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const ctx = await getAuthContext();

  if (!ctx || !hasPermission(ctx, "settings.manage")) {
    return <AdminAccessDenied permission="settings.manage" />;
  }

  const settings = await getStoreSettings();

  let serializedBanners: {
    id: string;
    title: string;
    subtitle: string | null;
    image: string;
    href: string | null;
    isActive: boolean;
  }[] = [];

  try {
    const banners = await prisma.banner.findMany({ orderBy: { createdAt: "asc" } });
    serializedBanners = banners.map((b) => ({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      image: b.image,
      href: b.href,
      isActive: b.isActive,
    }));
  } catch (error) {
    console.error("[admin/settings] Banner query failed:", error);
  }

  // WhatsApp config status (env vars)
  const whatsappConfig = {
    phoneNumberIdConfigured: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
    apiTokenConfigured: !!process.env.WHATSAPP_API_TOKEN,
    verifyTokenConfigured: !!process.env.WHATSAPP_VERIFY_TOKEN,
    businessPhone: process.env.WHATSAPP_BUSINESS_PHONE || "",
  };

  // Template statuses (model may not exist)
  let templateStatuses: Record<string, string> = {};
  try {
    const model = (prisma as unknown as Record<string, unknown>).whatsappTemplate;
    if (model && typeof model === "object" && "findMany" in model) {
      const templates = await (model as { findMany: () => Promise<{ name: string; status: string }[]> }).findMany();
      templateStatuses = Object.fromEntries(templates.map((t) => [t.name, t.status]));
    }
  } catch {
    // Table doesn't exist
  }

  return (
    <SettingsManagementClient
      settings={settings}
      banners={serializedBanners}
      whatsappConfig={whatsappConfig}
      templateStatuses={templateStatuses}
    />
  );
}
