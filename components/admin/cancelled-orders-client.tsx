"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, Download, Phone, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/utils";

interface CancelledOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  total: number;
  createdAt: string;
  cancelledAt: string;
  reason: string;
  items: { name: string; quantity: number; price: number }[];
}

export function CancelledOrdersClient({ orders }: { orders: CancelledOrder[] }) {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    return !q || o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.phone.includes(q);
  });

  function exportCSV() {
    const headers = ["Order #", "Customer", "Phone", "Total", "Ordered", "Cancelled", "Reason"];
    const rows = orders.map((o) => [
      o.orderNumber, o.customerName, o.phone,
      o.total.toString(),
      new Date(o.createdAt).toLocaleDateString("en-IN"),
      new Date(o.cancelledAt).toLocaleDateString("en-IN"),
      o.reason
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cancelled-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* Search + Export */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order, customer, phone..."
            className="w-full h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 pl-9 pr-4 text-[13px] outline-none placeholder:text-slate-400 focus:border-primary/50 transition-all"
          />
        </div>
        <button
          type="button"
          onClick={exportCSV}
          className="h-10 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[12px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 press"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </button>
      </div>

      {/* Orders */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-10 text-center">
          <AlertTriangle className="h-8 w-8 text-slate-300 mx-auto" />
          <p className="mt-3 text-[13px] font-medium text-slate-500">No cancelled orders found</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-50 dark:divide-slate-800">
          {filtered.map((order) => (
            <div key={order.id}>
              <button
                type="button"
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                className="w-full text-left px-4 py-3.5 flex items-center gap-3 press"
              >
                <div className="h-9 w-9 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-slate-900 dark:text-white">#{order.orderNumber}</span>
                    <span className="text-[10px] font-semibold text-red-600 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded-full">Cancelled</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {order.customerName} &middot; {new Date(order.cancelledAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                  </p>
                </div>
                <span className="text-[13px] font-bold text-slate-900 dark:text-white shrink-0">{formatCurrency(order.total)}</span>
                <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${expandedId === order.id ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {expandedId === order.id && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-4 pb-4 space-y-3">
                      {/* Reason */}
                      <div className="rounded-lg bg-red-50 dark:bg-red-950/20 p-3">
                        <p className="text-[10px] font-semibold text-red-600 uppercase">Cancellation Reason</p>
                        <p className="text-[12px] text-red-700 dark:text-red-300 mt-1">{order.reason}</p>
                      </div>

                      {/* Items */}
                      <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase mb-2">Items</p>
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-[11px] py-1">
                            <span className="text-slate-600 dark:text-slate-300">{item.name} x{item.quantity}</span>
                            <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Contact */}
                      <a
                        href={`tel:${order.phone}`}
                        className="flex items-center gap-2 text-[11px] font-semibold text-primary press"
                      >
                        <Phone className="h-3.5 w-3.5" /> Call {order.customerName}
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
