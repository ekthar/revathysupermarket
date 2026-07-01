"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

type Period = "today" | "week" | "month" | "quarter";

interface ReportsTimeSelectorProps {
  todayData: { orders: number; cod: number; upi: number; paid: number };
}

export function ReportsTimeSelector({ todayData }: ReportsTimeSelectorProps) {
  const [period, setPeriod] = useState<Period>("today");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ orders: number; cod: number; upi: number; paid: number } | null>(todayData);

  async function fetchPeriodData(p: Period) {
    setPeriod(p);
    if (p === "today") {
      setData(todayData);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/sales?period=${p}`);
      if (response.ok) {
        const result = await response.json();
        setData({
          orders: result.totalOrders ?? 0,
          cod: result.codCollection ?? 0,
          upi: result.upiCollection ?? 0,
          paid: Number(result.totalRevenue ?? 0),
        });
      }
    } catch {
      // Keep showing previous data
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Period selector pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(["today", "week", "month", "quarter"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => fetchPeriodData(p)}
            className={`h-9 px-4 rounded-full text-xs font-bold capitalize transition-all ${
              period === p
                ? "bg-primary text-white shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {p === "today" ? "Today" : p}
          </button>
        ))}
        {loading && <span className="text-xs text-muted-foreground self-center ml-2">Loading...</span>}
      </div>

      {/* Metrics grid */}
      <div className="grid gap-3 md:grid-cols-4">
        {[
          [`${period === "today" ? "Today" : period.charAt(0).toUpperCase() + period.slice(1)} orders`, data?.orders ?? 0],
          ["COD collection", formatCurrency(data?.cod ?? 0)],
          ["UPI collection", formatCurrency(data?.upi ?? 0)],
          ["Total revenue", formatCurrency(data?.paid ?? 0)],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10">
            <p className="text-xs font-black uppercase text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-black">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
