"use client";

import { ShoppingBag, IndianRupee, Package, Users, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface DashboardStatsProps {
  todayOrders: number;
  revenue: number;
  pendingOrders: number;
  customers: number;
  orderChange: number;
  canSeeFinancials: boolean;
}

function AnimatedValue({ value, prefix }: { value: number; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const duration = 600;
    const start = performance.now();
    const from = 0;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (value - from) * eased);
      if (el) el.textContent = prefix ? `${prefix}${current.toLocaleString("en-IN")}` : current.toLocaleString("en-IN");
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [value, prefix]);

  return <span ref={ref}>0</span>;
}

function ChangeIndicator({ value }: { value: number }) {
  if (value === 0) return null;
  const isPositive = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(value)}%
    </span>
  );
}

export function DashboardStats({ todayOrders, revenue, pendingOrders, customers, orderChange, canSeeFinancials }: DashboardStatsProps) {
  const cards = [
    { icon: ShoppingBag, label: "Today's Orders", value: todayOrders, change: orderChange, color: "text-blue-600 dark:text-blue-400", bgIcon: "bg-blue-50 dark:bg-blue-950/40" },
    ...(canSeeFinancials
      ? [{ icon: IndianRupee, label: "Today's Revenue", value: revenue, change: 0, color: "text-emerald-600 dark:text-emerald-400", bgIcon: "bg-emerald-50 dark:bg-emerald-950/40", isCurrency: true }]
      : []),
    { icon: Package, label: "Pending Orders", value: pendingOrders, change: 0, color: "text-amber-600 dark:text-amber-400", bgIcon: "bg-amber-50 dark:bg-amber-950/40" },
    { icon: Users, label: "Total Customers", value: customers, change: 0, color: "text-purple-600 dark:text-purple-400", bgIcon: "bg-purple-50 dark:bg-purple-950/40" },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-neutral-100 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="flex items-center justify-between">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.bgIcon}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <ChangeIndicator value={card.change} />
          </div>
          <p className="mt-4 text-2xl font-bold text-neutral-900 dark:text-white">
            {"isCurrency" in card && card.isCurrency ? (
              formatCurrency(card.value)
            ) : (
              <AnimatedValue value={card.value} />
            )}
          </p>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
