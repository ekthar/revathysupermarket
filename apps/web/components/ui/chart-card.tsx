"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * ChartCard — Tremor-inspired container for admin dashboard charts.
 * Provides consistent styling, title, subtitle, and metric display.
 *
 * Usage:
 * ```tsx
 * <ChartCard
 *   title="Revenue"
 *   subtitle="Last 7 days"
 *   metric="₹42,500"
 *   metricChange="+12%"
 *   metricChangeType="positive"
 * >
 *   <ResponsiveContainer width="100%" height={200}>
 *     <BarChart data={data}>...</BarChart>
 *   </ResponsiveContainer>
 * </ChartCard>
 * ```
 */
export function ChartCard({
  title,
  subtitle,
  metric,
  metricChange,
  metricChangeType = "neutral",
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  metric?: string;
  metricChange?: string;
  metricChangeType?: "positive" | "negative" | "neutral";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 shadow-soft", className)}>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-baseline justify-between">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground/70">{subtitle}</p>}
          </div>
          {metricChange && (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                metricChangeType === "positive" && "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
                metricChangeType === "negative" && "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
                metricChangeType === "neutral" && "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
              )}
            >
              {metricChange}
            </span>
          )}
        </div>
        {metric && (
          <p className="mt-1 text-2xl font-black text-foreground tracking-tight">{metric}</p>
        )}
      </div>

      {/* Chart content */}
      <div className="w-full">{children}</div>
    </div>
  );
}

/**
 * StatCard — Tremor-inspired metric/stat card for KPIs.
 */
export function StatCard({
  title,
  metric,
  change,
  changeType = "neutral",
  icon,
  className,
}: {
  title: string;
  metric: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 shadow-soft", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {icon && <span className="text-muted-foreground/60">{icon}</span>}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-2xl font-black text-foreground tracking-tight">{metric}</p>
        {change && (
          <span
            className={cn(
              "text-xs font-semibold",
              changeType === "positive" && "text-emerald-600 dark:text-emerald-400",
              changeType === "negative" && "text-red-600 dark:text-red-400",
              changeType === "neutral" && "text-muted-foreground"
            )}
          >
            {change}
          </span>
        )}
      </div>
    </div>
  );
}
