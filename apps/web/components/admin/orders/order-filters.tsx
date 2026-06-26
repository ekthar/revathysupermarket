"use client";

import { FileText, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderFiltersProps {
  query: string;
  onQueryChange: (query: string) => void;
  tab: "all" | "new" | "pending" | "packing" | "delivered";
  onTabChange: (tab: "all" | "new" | "pending" | "packing" | "delivered") => void;
  view: "board" | "list";
  onViewChange: (view: "board" | "list") => void;
  counts: {
    all: number;
    new: number;
    pending: number;
    packing: number;
    delivered: number;
  };
}

export function OrderFilters({
  query,
  onQueryChange,
  tab,
  onTabChange,
  view,
  onViewChange,
  counts,
}: OrderFiltersProps) {
  return (
    <div className="rounded-xl bg-[linear-gradient(135deg,rgba(15,138,95,0.12),rgba(167,209,41,0.16))] p-5 sm:p-7">
      <p className="text-xs font-black uppercase text-primary">Staff workflow</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-4xl font-black leading-tight">Orders</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Scan, call, update, and print from one screen.
            {counts.new > 0 ? (
              <span className="ml-2 font-black text-red-600">{counts.new} new unacknowledged</span>
            ) : null}
          </p>
        </div>
        <a
          href="/api/admin/export/orders"
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-black text-white"
        >
          <FileText className="h-4 w-4" />
          Export
        </a>
      </div>
      <label className="relative mt-5 block">
        <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-primary" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="h-12 w-full rounded-2xl border border-white/70 bg-white/90 pl-11 pr-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary dark:border-white/10 dark:bg-slate-900"
          placeholder="Search order number, customer, phone"
        />
      </label>
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
        {(
          [
            ["all", "All", counts.all],
            ["new", "New", counts.new],
            ["pending", "Pending", counts.pending],
            ["packing", "Packing", counts.packing],
            ["delivered", "Delivered", counts.delivered],
          ] as const
        ).map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            onClick={() => onTabChange(key)}
            className={cn(
              "h-10 shrink-0 rounded-full px-4 text-xs font-black transition active:scale-[0.98]",
              tab === key
                ? "bg-primary text-white"
                : "border border-white/70 bg-white/80 text-foreground dark:border-white/10 dark:bg-slate-900"
            )}
          >
            {label} {count}
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onViewChange("board")}
          className={cn(
            "h-10 rounded-full px-4 text-xs font-black",
            view === "board"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              : "bg-white/80 dark:bg-slate-800"
          )}
        >
          Operations board
        </button>
        <button
          type="button"
          onClick={() => onViewChange("list")}
          className={cn(
            "h-10 rounded-full px-4 text-xs font-black",
            view === "list"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              : "bg-white/80 dark:bg-slate-800"
          )}
        >
          Detailed list
        </button>
      </div>
    </div>
  );
}
