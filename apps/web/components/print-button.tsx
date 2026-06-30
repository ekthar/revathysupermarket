"use client";

import { Printer } from "lucide-react";
import { useState } from "react";

interface PrintButtonProps {
  orderId?: string;
  /** If true, record a "printed" notification to staff after printing */
  trackPrint?: boolean;
}

export function PrintButton({ orderId, trackPrint = false }: PrintButtonProps) {
  const [printed, setPrinted] = useState(false);

  function handlePrint() {
    window.print();
    if (trackPrint && orderId) {
      // Mark as printed in the DB so other staff can see it
      fetch(`/api/admin/orders/${orderId}/printed`, { method: "POST" }).catch(() => null);
    }
    setPrinted(true);
  }

  return (
    <button
      onClick={handlePrint}
      className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-colors ${
        printed
          ? "bg-green-600 text-white"
          : "bg-slate-900 text-white hover:bg-slate-700"
      }`}
    >
      <Printer className="h-4 w-4" />
      {printed ? "Printed ✓" : "Print Invoice"}
    </button>
  );
}
