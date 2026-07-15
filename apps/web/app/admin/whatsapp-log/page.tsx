import { getAuthContext } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { AdminAccessDenied } from "@/components/admin/shared";
import { WhatsAppLogClient } from "@/components/admin/whatsapp-log-client";

export const dynamic = "force-dynamic";

export default async function AdminWhatsAppLogPage() {
  const ctx = await getAuthContext();

  if (!ctx || !hasPermission(ctx, "marketing.view")) {
    return <AdminAccessDenied permission="marketing.view" />;
  }

  const logs = await prisma.whatsAppLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const serialized = logs.map((l) => ({
    id: l.id,
    phone: l.phone,
    orderId: l.orderId,
    template: l.template,
    status: l.status,
    error: l.error,
    createdAt: l.createdAt.toISOString(),
  }));

  return <WhatsAppLogClient logs={serialized} />;
}
