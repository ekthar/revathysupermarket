import { getAuthContext } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { AdminAccessDenied } from "@/components/admin/shared";
import { PushNotificationSender } from "@/components/admin/push-notification-sender";

export const dynamic = "force-dynamic";

export default async function AdminPushNotificationsPage() {
  const ctx = await getAuthContext();

  if (!ctx || !hasPermission(ctx, "marketing.manage")) {
    return <AdminAccessDenied permission="marketing.manage" />;
  }

  const [totalSubscribers, customerSubscribers] = await Promise.all([
    prisma.pushSubscription.count().catch(() => 0),
    prisma.pushSubscription.count({
      where: { user: { role: "CUSTOMER" } },
    }).catch(() => 0),
  ]);

  // PushBroadcast model may not exist yet — gracefully return empty
  let history: { id: string; title: string; body: string; audience: string; sent: number; failed: number; total: number; createdAt: string }[] = [];
  try {
    const broadcasts = await (prisma as unknown as Record<string, { findMany: (opts: unknown) => Promise<unknown[]> }>).pushBroadcast?.findMany?.({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    if (Array.isArray(broadcasts)) {
      history = broadcasts.map((b: unknown) => {
        const row = b as Record<string, unknown>;
        return {
          id: String(row.id),
          title: String(row.title || ""),
          body: String(row.body || ""),
          audience: String(row.audience || "all"),
          sent: Number(row.sent || 0),
          failed: Number(row.failed || 0),
          total: Number(row.total || 0),
          createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt || ""),
        };
      });
    }
  } catch {
    // Model doesn't exist yet
  }

  return (
    <PushNotificationSender
      totalSubscribers={totalSubscribers}
      customerSubscribers={customerSubscribers}
      history={history}
    />
  );
}
