"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Check } from "lucide-react";
import { useToast } from "@/components/toast-provider";

export function BillNumberEntry({ orderId, currentBillNumber }: { orderId: string; currentBillNumber: string | null }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [billNumber, setBillNumber] = useState(currentBillNumber || "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(!!currentBillNumber);

  async function save() {
    if (!billNumber.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/bill-number`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billNumber: billNumber.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to save bill number", "error");
        return;
      }
      setSaved(true);
      showToast("Bill number saved", "success");
      router.refresh();
    } catch {
      showToast("Network error", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl bg-card border border-border p-5">
      <h2 className="text-sm font-black text-foreground mb-3 flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" /> Bill Number
      </h2>
      <div className="flex gap-2">
        <input
          type="text"
          value={billNumber}
          onChange={(e) => { setBillNumber(e.target.value); setSaved(false); }}
          placeholder="Enter bill no..."
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="button"
          onClick={save}
          disabled={loading || !billNumber.trim() || saved}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
          {saved ? "Saved" : "Save"}
        </button>
      </div>
    </section>
  );
}
