"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, Loader2 } from "lucide-react";
import { useToast } from "@/components/toast-provider";

export function AcknowledgeButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  async function acknowledge() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/acknowledge`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "Failed to acknowledge order", "error");
        return;
      }
      showToast("Stock review started — you can now update the status", "success");
      router.refresh();
    } catch {
      showToast("Network error", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={acknowledge}
      disabled={loading}
      className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
      Start Stock Review (Required before status change)
    </button>
  );
}
