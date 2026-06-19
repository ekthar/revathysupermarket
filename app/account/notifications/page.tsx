import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Bell } from "lucide-react";
import { NotificationsClient } from "@/components/account/notifications-client";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account/notifications");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  // Mark all as read on page visit
  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true }
  }).catch(() => null);

  return (
    <main className="max-w-lg mx-auto px-4 py-5">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/account" className="flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-slate-800 card-shadow press">
          <ArrowLeft className="h-4 w-4 text-slate-600 dark:text-slate-300" />
        </Link>
        <div>
          <h1 className="text-[18px] font-bold text-slate-900 dark:text-white">Notifications</h1>
          <p className="text-[12px] text-slate-500 dark:text-slate-400">{notifications.length} notification{notifications.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <NotificationsClient
        notifications={notifications.map((n) => ({
          id: n.id,
          title: n.title,
          body: n.body,
          type: n.type,
          read: n.read,
          orderId: n.orderId,
          createdAt: n.createdAt.toISOString()
        }))}
      />
    </main>
  );
}
