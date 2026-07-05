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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order, customer, phone..."
            className="w-full h-10 rounded-xl bg-card border border-border pl-9 pr-4 text-body outline-none placeholder:text-muted-foreground focus:border-primary/50 transition-all"
          />
        </div>
        <button
          type="button"
          onClick={exportCSV}
          className="h-10 px-4 rounded-xl bg-card border border-border text-caption font-semibold text-muted-foreground flex items-center gap-1.5 press"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </button>
      </div>

      {/* Orders */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="mt-3 text-body font-medium text-muted-foreground">No cancelled orders found</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border">
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
                    <span className="text-body font-bold text-foreground">#{order.orderNumber}</span>
                    <span className="text-micro font-semibold text-red-600 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded-full">Cancelled</span>
                  </div>
                  <p className="text-caption text-muted-foreground mt-0.5 truncate">
                    {order.customerName} &middot; {new Date(order.cancelledAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                  </p>
                </div>
                <span className="text-body font-bold text-foreground shrink-0">{formatCurrency(order.total)}</span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${expandedId === order.id ? "rotate-180" : ""}`} />
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
                        <p className="text-micro font-semibold text-red-600 uppercase">Cancellation Reason</p>
                        <p className="text-caption text-red-700 dark:text-red-300 mt-1">{order.reason}</p>
                      </div>

                      {/* Items */}
                      <div className="rounded-lg bg-muted p-3">
                        <p className="text-micro font-semibold text-muted-foreground uppercase mb-2">Items</p>
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-caption py-1">
                            <span className="text-muted-foreground">{item.name} x{item.quantity}</span>
                            <span className="font-medium text-foreground">{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Contact */}
                      <a
                        href={`tel:${order.phone}`}
                        className="flex items-center gap-2 text-caption font-semibold text-primary press"
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
