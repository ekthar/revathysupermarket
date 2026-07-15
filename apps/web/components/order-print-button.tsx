"use client";

import { Printer } from "lucide-react";

interface OrderPrintButtonProps {
  orderId: string;
}

/**
 * Button that opens the consolidated print view in a new browser tab.
 * Uses window.open to open /admin/orders/[id]/print which auto-invokes window.print().
 */
export function OrderPrintButton({ orderId }: OrderPrintButtonProps) {
  function handlePrint() {
    window.open(`/admin/orders/${orderId}/print`, "_blank");
  }

  return (
    <button
      onClick={handlePrint}
      className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted transition-colors"
    >
      <Printer className="h-4 w-4" />
      Print Order
    </button>
  );
}
