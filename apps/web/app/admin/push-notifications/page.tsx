import { getAuthContext } from "@/lib/auth-guard";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { AdminAccessDenied, AdminPageShell } from "@/components/admin/shared";
import { Bell, Send } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPushNotificationsPage() {
  const ctx = await getAuthContext();
  if (!ctx || !hasPermission(ctx, "marketing.manage")) {
    return <AdminAccessDenied permission="marketing.manage" />;
  }

  const recentNotifications = await prisma.notification.findMany({
    where: { type: "broadcast" },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, title: true, body: true, createdAt: true },
  });

  return (
    <AdminPageShell
      eyebrow="Marketing"
      title="Push Notifications"
      variant="green"
      breadcrumbs={[{ label: "Marketing" }, { label: "Push Notifications" }]}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Compose Section */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="flex items-center gap-2 text-base font-semibold text-neutral-900 dark:text-neutral-100">
            <Send className="h-4 w-4 text-emerald-600" />
            Compose Notification
          </h2>
          <p className="mt-1 text-xs text-neutral-500">Send a push notification to all subscribed users.</p>
          <form action="/api/admin/push/broadcast" method="POST" className="mt-4 space-y-3">
            <input type="hidden" name="senderId" value={ctx.userId} />
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-300">Title</label>
              <input name="title" required maxLength={100} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-800" placeholder="e.g. Weekend Sale!" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-300">Body</label>
              <textarea name="body" required maxLength={255} rows={3} className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-800" placeholder="Get 20% off on all groceries..." />
            </div>
            <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700">
              <Send className="h-3.5 w-3.5" />
              Send Broadcast
            </button>
          </form>
        </div>

        {/* Recent History */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="flex items-center gap-2 text-base font-semibold text-neutral-900 dark:text-neutral-100">
            <Bell className="h-4 w-4 text-emerald-600" />
            Recent Sends
          </h2>
          {recentNotifications.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-500">No broadcasts sent yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-neutral-100 dark:divide-neutral-800">
              {recentNotifications.map((n) => (
                <li key={n.id} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{n.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">{n.body}</p>
                  <p className="mt-1 text-[10px] text-neutral-400">
                    {new Date(n.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminPageShell>
  );
}
