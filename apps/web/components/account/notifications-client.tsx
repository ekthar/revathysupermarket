"use client";

import { Bell, Package, Receipt, Megaphone, Info } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  orderId: string | null;
  createdAt: string;
}

const typeIcons: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
  order: { icon: Package, bg: "bg-primary/10 dark:bg-primary/20", color: "text-primary" },
  refund: { icon: Receipt, bg: "bg-secondary-50 dark:bg-secondary-900/30", color: "text-secondary-600" },
  promo: { icon: Megaphone, bg: "bg-orange-50 dark:bg-orange-950/30", color: "text-orange-600" },
  system: { icon: Info, bg: "bg-blue-50 dark:bg-blue-950/30", color: "text-blue-600" }
};

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationsClient({ notifications }: { notifications: Notification[] }) {
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-16 w-16 rounded-full bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center mb-4">
          <Bell className="h-7 w-7 text-neutral-300 dark:text-neutral-600" />
        </div>
        <h2 className="text-title font-bold text-neutral-900 dark:text-white">No notifications</h2>
        <p className="text-body text-neutral-500 dark:text-neutral-400 mt-1">Order updates and alerts will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((notif, i) => {
        const typeConfig = typeIcons[notif.type] || typeIcons.system;
        const Icon = typeConfig.icon;

        return (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className={`rounded-2xl p-4 ${notif.read ? "bg-white dark:bg-neutral-900" : "bg-primary/5 dark:bg-primary/10 border border-primary/10"} card-shadow`}
          >
            <div className="flex gap-3">
              <div className={`h-9 w-9 rounded-xl ${typeConfig.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`h-4 w-4 ${typeConfig.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-body font-semibold text-neutral-900 dark:text-white">{notif.title}</p>
                  <span suppressHydrationWarning className="text-micro text-neutral-400 shrink-0">{timeAgo(notif.createdAt)}</span>
                </div>
                <p className="text-caption text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">{notif.body}</p>
                {notif.orderId && (
                  <Link href="/dashboard" className="mt-2 inline-block text-caption font-semibold text-primary">
                    View Order →
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
