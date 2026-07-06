"use client";

import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, Package, Receipt, Megaphone, Info, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

function useClientTime(dateStr: string) {
  const [label, setLabel] = useState<string>("");
  useEffect(() => {
    function compute() {
      const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
      if (seconds < 60) return "Just now";
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      return `${Math.floor(hours / 24)}d ago`;
    }
    setLabel(compute());
    const interval = setInterval(() => setLabel(compute()), 60_000);
    return () => clearInterval(interval);
  }, [dateStr]);
  return label;
}

function NotifTime({ dateStr }: { dateStr: string }) {
  const label = useClientTime(dateStr);
  return <span className="text-micro text-neutral-400 shrink-0">{label}</span>;
}

function NotifRow({ notif, onMarkRead, onClear, index }: { notif: Notification; onMarkRead: (id: string) => void; onClear: (id: string) => void; index: number }) {
  const typeConfig = typeIcons[notif.type] || typeIcons.system;
  const Icon = typeConfig.icon;
  return (
    <motion.div
      key={notif.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ delay: index * 0.03 }}
      className={`rounded-2xl p-4 ${notif.read ? "bg-white dark:bg-neutral-900" : "bg-primary/5 dark:bg-primary/10 border border-primary/10"} card-shadow`}
    >
      <div className="flex gap-3">
        <div className={`h-9 w-9 rounded-xl ${typeConfig.bg} flex items-center justify-center shrink-0`}>
          <Icon className={`h-4 w-4 ${typeConfig.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-body font-semibold text-neutral-900 dark:text-white">{notif.title}</p>
            <NotifTime dateStr={notif.createdAt} />
          </div>
          <p className="text-caption text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">{notif.body}</p>
          <div className="mt-2 flex items-center gap-3">
            {notif.orderId && (
              <Link href={`/dashboard/orders/${notif.orderId}`} className="text-caption font-semibold text-primary">
                View Order →
              </Link>
            )}
            {!notif.read && (
              <button onClick={() => onMarkRead(notif.id)} className="flex items-center gap-1 text-caption font-semibold text-neutral-400 hover:text-primary transition-colors">
                <Check className="h-3 w-3" />Mark as read
              </button>
            )}
            <button onClick={() => onClear(notif.id)} className="flex items-center gap-1 text-caption font-semibold text-neutral-300 hover:text-red-400 transition-colors ml-auto">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function NotificationsClient({ notifications: initial }: { notifications: Notification[] }) {
  const [notifications, setNotifications] = useState(initial);

  function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    fetch(`/api/notifications/${id}/read`, { method: "PATCH" }).catch(() => {});
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    fetch("/api/notifications/read-all", { method: "PATCH" }).catch(() => {});
  }

  function clearNotif(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    fetch(`/api/notifications/${id}`, { method: "DELETE" }).catch(() => {});
  }

  function clearAll() {
    setNotifications([]);
    fetch("/api/notifications", { method: "DELETE" }).catch(() => {});
  }

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

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div>
      <div className="mb-3 flex items-center justify-end gap-3">
        {hasUnread && (
          <button onClick={markAllRead} className="flex items-center gap-1.5 text-caption font-semibold text-primary hover:underline">
            <CheckCheck className="h-3.5 w-3.5" />Mark all as read
          </button>
        )}
        <button onClick={clearAll} className="flex items-center gap-1.5 text-caption font-semibold text-neutral-400 hover:text-red-500 transition-colors">
          <Trash2 className="h-3.5 w-3.5" />Clear all
        </button>
      </div>
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {notifications.map((notif, i) => (
            <NotifRow key={notif.id} notif={notif} index={i} onMarkRead={markRead} onClear={clearNotif} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
