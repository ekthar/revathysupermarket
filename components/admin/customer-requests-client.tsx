"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Clock, MessageSquare, RotateCcw, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";

type Request = {
  id: string;
  type: "substitution" | "support" | "return";
  orderNumber: string | null;
  customer: string;
  phone: string;
  subject: string;
  status: string;
  priority: string;
  assignee: string | null;
  createdAt: string;
  orderId: string | null;
};

type Counts = { open: number; urgent: number; waiting: number; resolved: number };

const typeIcons = { substitution: Shuffle, support: MessageSquare, return: RotateCcw };
const typeColors = { substitution: "bg-blue-100 text-blue-700", support: "bg-purple-100 text-purple-700", return: "bg-orange-100 text-orange-700" };
const priorityColors: Record<string, string> = { URGENT: "text-red-600", HIGH: "text-orange-600", NORMAL: "text-slate-600", LOW: "text-slate-400" };

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function CustomerRequestsClient({ requests, counts }: { requests: Request[]; counts: Counts }) {
  const [tab, setTab] = useState<"open" | "urgent" | "waiting" | "all">("open");

  const filtered = tab === "all" ? requests :
    tab === "open" ? requests.filter((r) => r.status === "OPEN" || r.status === "REQUESTED") :
    tab === "urgent" ? requests.filter((r) => r.priority === "URGENT" || r.priority === "HIGH") :
    requests.filter((r) => r.status === "WAITING_FOR_CUSTOMER" || r.status === "UNDER_REVIEW");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-slate-900">Customer Requests</h1>
        <span className="text-xs text-slate-500">{requests.length} total</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { key: "open", label: "Open", count: counts.open },
          { key: "urgent", label: "Urgent", count: counts.urgent },
          { key: "waiting", label: "Waiting", count: counts.waiting },
          { key: "all", label: "All", count: requests.length },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
              tab === t.key ? "bg-primary text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:border-primary/30"
            )}
          >
            {t.label}
            {t.count > 0 && <span className={cn("flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold", tab === t.key ? "bg-white/20" : "bg-red-500 text-white")}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Request list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center">
          <p className="text-sm text-slate-400">No requests in this queue</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((req) => {
            const Icon = typeIcons[req.type];
            return (
              <div key={req.id} className="rounded-xl bg-white border border-slate-200 p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-start gap-3">
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", typeColors[req.type])}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-900 truncate">{req.subject}</p>
                      {req.priority === "URGENT" && <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="font-medium">{req.customer}</span>
                      {req.orderNumber && (
                        <Link href={`/admin/orders/${req.orderId}`} className="text-primary hover:underline font-semibold">#{req.orderNumber}</Link>
                      )}
                      {req.assignee && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-semibold">{req.assignee}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={cn("text-xs font-semibold", priorityColors[req.priority] || "text-slate-500")}>{req.priority}</span>
                    <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-0.5 justify-end"><Clock className="h-3 w-3" /> {timeAgo(req.createdAt)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
