"use client";

import Link from "next/link";
import { Clock, Package } from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { useEffect, useState } from "react";
import { readApiResponse } from "@/lib/client-api";

type RecentOrder = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: Array<{ name: string }>;
};

const statusColors: Record<string, string> = {
  ORDER_RECEIVED: "bg-orange-100 text-orange-700",
  ACCEPTED: "bg-blue-100 text-blue-700",
  PACKING: "bg-purple-100 text-purple-700",
  READY_FOR_DELIVERY: "bg-yellow-100 text-yellow-700",
  OUT_FOR_DELIVERY: "bg-primary/10 text-primary",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700"
};

const statusLabels: Record<string, string> = {
  ORDER_RECEIVED: "Received",
  ACCEPTED: "Confirmed",
  PACKING: "Packing",
  READY_FOR_DELIVERY: "Ready",
  OUT_FOR_DELIVERY: "On the way",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled"
};

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} Mins Ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h Ago`;
  return `${Math.floor(hours / 24)}d Ago`;
}

export function RecentOrdersSection() {
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await fetch("/api/orders", { cache: "no-store" });
        if (!response.ok) { setLoading(false); return; }
        const data = await readApiResponse<{ orders?: RecentOrder[] }>(response);
        if (data.orders) setOrders(data.orders.slice(0, 5));
      } catch {}
      setLoading(false);
    }
    fetchOrders();
  }, []);

  if (loading || orders.length === 0) return null;

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 24,
      },
    },
  };

  return (
    <section className="pt-5 md:hidden">
      <div className="px-4 flex items-center justify-between mb-3">
        <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">Order&apos;s List</h2>
        <Link href="/dashboard" className="text-[12px] font-semibold text-primary flex items-center gap-0.5">
          See all <span className="text-primary">&#9679;</span>
        </Link>
      </div>

      {/* Horizontal scroll order cards - staggered entry */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="flex gap-3 overflow-x-auto px-4 no-scrollbar pb-2"
      >
        {orders.map((order) => (
          <motion.div
            key={order.id}
            variants={itemVariants}
            className="will-change-transform"
          >
            <Link
              href={!["DELIVERED", "CANCELLED"].includes(order.status) ? `/track/${order.id}` : "/dashboard"}
              className="block w-[200px] shrink-0 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm press"
            >
              {/* Order header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-bold text-slate-800 dark:text-white">
                  Order #{order.orderNumber.split("-").pop()}
                </span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusColors[order.status] || "bg-slate-100 text-slate-600"}`}>
                  {statusLabels[order.status] || order.status}
                </span>
              </div>

              {/* Item thumbnails row */}
              <div className="flex items-center gap-1 mb-2">
                <div className="flex -space-x-2">
                  {order.items.slice(0, 2).map((item, i) => (
                    <div key={i} className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                      <Package className="h-3 w-3 text-slate-400" />
                    </div>
                  ))}
                </div>
                <span className="text-[11px] text-slate-500 ml-1">{order.items.length} Items</span>
                <span className="text-[12px] font-bold text-slate-900 dark:text-white ml-auto">{formatCurrency(order.total)}</span>
              </div>

              {/* Time + table */}
              <div className="flex items-center gap-3 text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeAgo(order.createdAt)}
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
