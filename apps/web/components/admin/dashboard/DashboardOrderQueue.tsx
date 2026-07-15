"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface DashboardOrderQueueProps {
  pipeline: {
    received: number;
    packing: number;
    ready: number;
    outForDelivery: number;
  };
}

const stages = [
  { key: "received", label: "Received", color: "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300" },
  { key: "packing", label: "Packing", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" },
  { key: "ready", label: "Ready", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" },
  { key: "outForDelivery", label: "Out for Delivery", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" },
] as const;

export function DashboardOrderQueue({ pipeline }: DashboardOrderQueueProps) {
  const total = pipeline.received + pipeline.packing + pipeline.ready + pipeline.outForDelivery;

  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Order Pipeline</h3>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">{total} active</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {stages.map((stage, idx) => (
          <div key={stage.key} className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${stage.color}`}>
              {stage.label}
              <span className="font-bold">{pipeline[stage.key]}</span>
            </span>
            {idx < stages.length - 1 && (
              <ArrowRight className="h-3.5 w-3.5 text-neutral-300 dark:text-neutral-600" />
            )}
          </div>
        ))}
      </div>

      <Link
        href="/admin/orders"
        className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
      >
        View all orders
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
