"use client";

import { BellRing, CheckCircle2, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type AdminOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  total: number;
};

interface OrderActionModalProps {
  order: AdminOrder;
  onAcknowledge: (orderId: string) => void;
  onDismiss: (orderId: string) => void;
  ackLoading: string | null;
}

export function OrderActionModal({
  order,
  onAcknowledge,
  onDismiss,
  ackLoading,
}: OrderActionModalProps) {
  return (
    <div className="fixed inset-x-3 top-4 z-50 mx-auto max-w-2xl rounded-xl border border-red-200 bg-card p-4 shadow-premium dark:border-red-500/40">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white">
          <BellRing className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase text-red-600">New order needs stock review</p>
          <h3 className="mt-1 font-display text-2xl font-black">
            #{order.orderNumber} - {formatCurrency(order.total)}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {order.customerName} - {order.phone}
          </p>
          <p className="mt-2 text-sm font-bold">
            Go to the rack, verify stock, make substitutions/removals if needed, then mark Stock OK.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => onAcknowledge(order.id)}
              disabled={ackLoading === order.id}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary text-xs font-black text-white disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              Start stock review
            </button>
            <button
              onClick={() => onDismiss(order.id)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background text-xs font-black"
            >
              <X className="h-4 w-4" />
              Keep open below
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
