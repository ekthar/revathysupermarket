"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCircle2, Package, Truck, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { readApiResponse } from "@/lib/client-api";

type Notification = {
  id: string;
  title: string;
  body: string;
  type: "order_update" | "delivery" | "promo" | "system";
  read: boolean;
  createdAt: string;
  url?: string;
};

const STORAGE_KEY = "revathy-notifications-seen";

export function InAppNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  // Load seen IDs from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSeenIds(new Set(JSON.parse(saved)));
    } catch {}
  }, []);

  // Poll for notifications
  useEffect(() => {
    let active = true;

    async function fetchNotifications() {
      try {
        const response = await fetch("/api/notifications", { cache: "no-store" });
        if (!response.ok) return;
        const data = await readApiResponse<{ notifications?: Notification[] }>(response);
        if (active && data.notifications) {
          setNotifications(data.notifications);
        }
      } catch {}
    }

    fetchNotifications();
    const interval = window.setInterval(fetchNotifications, 15000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  function markAllRead() {
    const allIds = new Set([...seenIds, ...notifications.map((n) => n.id)]);
    setSeenIds(allIds);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...allIds]));
    } catch {}
  }

  function markRead(id: string) {
    const updated = new Set([...seenIds, id]);
    setSeenIds(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...updated]));
    } catch {}
  }

  const unreadCount = notifications.filter((n) => !seenIds.has(n.id)).length;

  const typeIcons = {
    order_update: Package,
    delivery: Truck,
    promo: Bell,
    system: CheckCircle2
  };

  const typeColors = {
    order_update: "bg-blue-100 text-blue-600",
    delivery: "bg-green-100 text-green-600",
    promo: "bg-orange-100 text-orange-600",
    system: "bg-slate-100 text-slate-600"
  };

  function timeAgo(dateStr: string) {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  return (
    <>
      {/* Bell button with badge */}
      <button
        onClick={() => { setOpen(!open); if (!open) markAllRead(); }}
        className="relative flex items-center justify-center h-9 w-9 rounded-full bg-slate-50 press"
      >
        <Bell className="h-[17px] w-[17px] text-slate-600" />
        {unreadCount > 0 && (
          <motion.span
            key={unreadCount}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white px-0.5"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Notification panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[80] bg-black/20 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed top-[60px] right-4 z-[81] w-[calc(100vw-2rem)] max-w-sm bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <h3 className="text-[14px] font-bold text-slate-900">Notifications</h3>
                <button onClick={() => setOpen(false)} className="h-7 w-7 rounded-full bg-slate-50 flex items-center justify-center">
                  <X className="h-3.5 w-3.5 text-slate-500" />
                </button>
              </div>

              {/* Notification list */}
              <div className="max-h-[60vh] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center">
                    <Bell className="h-8 w-8 mx-auto text-slate-200" />
                    <p className="mt-2 text-[13px] text-slate-500">No notifications yet</p>
                  </div>
                ) : (
                  notifications.slice(0, 20).map((notif) => {
                    const Icon = typeIcons[notif.type] || Bell;
                    const isUnread = !seenIds.has(notif.id);
                    return (
                      <div
                        key={notif.id}
                        onClick={() => { markRead(notif.id); if (notif.url) window.location.href = notif.url; }}
                        className={cn(
                          "flex gap-3 px-4 py-3 border-b border-slate-50 last:border-0 cursor-pointer transition-colors hover:bg-slate-50",
                          isUnread && "bg-blue-50/50"
                        )}
                      >
                        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", typeColors[notif.type])}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={cn("text-[12px] text-slate-800 line-clamp-1", isUnread && "font-bold")}>{notif.title}</p>
                            {isUnread && <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{notif.body}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{timeAgo(notif.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
