import { auth } from "@/auth";
import { canManageSettings } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { PushNotificationSender } from "@/components/admin/push-notification-sender";

export const dynamic = "force-dynamic";

export default async function AdminPushNotificationsPage() {
  const session = await auth();
  if (!canManageSettings(session?.user?.role)) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8">
        <h2 className="font-display text-2xl font-bold">Push Notifications</h2>
        <p className="mt-2 text-sm text-muted-foreground">Owner access required.</p>
      </div>
    );
  }

  const totalSubscribers = await prisma.pushSubscription.count().catch(() => 0);
  const customerSubscribers = await prisma.pushSubscription.count({
    where: { user: { role: "CUSTOMER" } }
  }).catch(() => 0);

  // Get broadcast history
  const historyRaw = await prisma.setting.findMany({
    where: { key: { startsWith: "pushBroadcast:" } },
    orderBy: { createdAt: "desc" },
    take: 10
  }).catch(() => []);

  const history = historyRaw.map((h) => {
    try { return { id: h.id, ...JSON.parse(h.value), createdAt: h.createdAt.toISOString() }; }
    catch { return null; }
  }).filter(Boolean) as any[];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-slate-900 p-5">
        <p className="text-[11px] font-bold uppercase text-blue-600 dark:text-blue-400">Engagement</p>
        <h1 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">Push Notifications</h1>
        <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">
          Send push notifications to {totalSubscribers} subscriber{totalSubscribers !== 1 ? "s" : ""} ({customerSubscribers} customers)
        </p>
      </div>

      <PushNotificationSender
        totalSubscribers={totalSubscribers}
        customerSubscribers={customerSubscribers}
        history={history}
      />
    </div>
  );
}
