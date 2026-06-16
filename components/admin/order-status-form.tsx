"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Clock, PackageCheck, PackageOpen, Truck, XCircle } from "lucide-react";
import { statusLabels } from "@/lib/constants";
import { cn } from "@/lib/utils";

const quickStatuses = [
  { value: "ACCEPTED", label: "Accept", icon: CheckCircle2 },
  { value: "PACKING", label: "Packing", icon: PackageOpen },
  { value: "READY_FOR_DELIVERY", label: "Ready", icon: PackageCheck },
  { value: "OUT_FOR_DELIVERY", label: "Out", icon: Truck },
  { value: "DELIVERED", label: "Delivered", icon: CheckCircle2 },
  { value: "CANCELLED", label: "Cancel", icon: XCircle }
] as const;

export function OrderStatusForm({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  async function update(nextStatus: string) {
    setLoading(true);
    setStatus(nextStatus);
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus })
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground">
        <Clock className="h-3.5 w-3.5 text-primary" />
        Update status
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {quickStatuses.map((item) => {
          const active = status === item.value;
          return (
            <button
              key={item.value}
              type="button"
              disabled={loading}
              onClick={() => update(item.value)}
              className={cn(
                "flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-3 text-xs font-black transition active:scale-[0.98] disabled:opacity-60",
                active
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-background/70 hover:bg-muted",
                item.value === "CANCELLED" && !active && "text-red-600"
              )}
              title={statusLabels[item.value]}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
