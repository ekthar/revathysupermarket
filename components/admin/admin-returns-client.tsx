"use client";

import { useEffect, useRef, useState } from "react";
import { BellRing, CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { readApiResponse } from "@/lib/client-api";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/toast-provider";

type AdminReturn = {
  id: string;
  orderNumber: string;
  customerName: string;
  paymentMethod: string;
  status: string;
  reason: string;
  note: string | null;
  refundAmount: number;
  items: unknown;
  createdAt: string;
};

export function AdminReturnsClient({ returns }: { returns: AdminReturn[] }) {
  const { showToast } = useToast();
  const [localReturns, setLocalReturns] = useState(returns);
  const [loading, setLoading] = useState<string | null>(null);
  const knownReturnIds = useRef(new Set(returns.map((entry) => entry.id)));

  useEffect(() => {
    let active = true;
    async function refreshReturns() {
      const response = await fetch("/api/admin/returns", { cache: "no-store" });
      const data = await readApiResponse<{ returns?: AdminReturn[] }>(response);
      if (!active || !response.ok || !data.returns) return;
      const freshRequests = data.returns.filter((entry) => !knownReturnIds.current.has(entry.id) && entry.status === "REQUESTED");
      if (freshRequests.length > 0) {
        freshRequests.forEach((entry) => knownReturnIds.current.add(entry.id));
        showToast(`${freshRequests.length} new return request${freshRequests.length === 1 ? "" : "s"}`, "success");
      }
      setLocalReturns(data.returns);
    }
    const interval = window.setInterval(refreshReturns, 7000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [showToast]);

  async function resolveReturn(id: string, status: "APPROVED" | "REJECTED" | "REFUNDED") {
    const resolutionNote = window.prompt(status === "REJECTED" ? "Reason for rejection" : "Resolution note") ?? "";
    if (!resolutionNote.trim()) return;
    const refundReference = status === "REFUNDED" ? window.prompt("Refund reference / confirmation") ?? "" : "";
    const current = localReturns.find((entry) => entry.id === id);
    setLoading(id);
    const response = await fetch(`/api/admin/returns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        resolutionNote,
        refundReference,
        refundAmount: current?.refundAmount,
        refundMethod: status === "REFUNDED" ? (current?.paymentMethod === "UPI_ON_DELIVERY" ? "UPI" : "CASH") : undefined
      })
    });
    const data = await readApiResponse<{ error?: string }>(response);
    setLoading(null);
    if (!response.ok) {
      showToast(data.error ?? "Return update failed", "error");
      return;
    }
    setLocalReturns((entries) => entries.map((entry) => entry.id === id ? { ...entry, status } : entry));
    showToast("Return updated", "success");
  }

  return (
    <div>
      <div className="rounded-[2rem] bg-[linear-gradient(135deg,rgba(15,138,95,0.12),rgba(167,209,41,0.16))] p-5 sm:p-7">
        <p className="text-xs font-black uppercase text-primary">Returns queue</p>
        <h2 className="mt-2 font-display text-4xl font-black leading-tight">Returns & refunds</h2>
        <p className="mt-2 flex items-center gap-2 text-sm font-bold text-muted-foreground">
          <BellRing className="h-4 w-4 text-primary" />
          Auto-refreshes every few seconds for new customer requests.
        </p>
      </div>
      <div className="mt-5 grid gap-4">
        {localReturns.length === 0 ? <div className="rounded-[1.75rem] border border-dashed border-border p-10 text-center">No returns yet.</div> : localReturns.map((entry) => (
          <article key={entry.id} className="rounded-[1.75rem] border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h3 className="font-display text-2xl font-bold">#{entry.orderNumber}</h3>
                <p className="text-sm text-muted-foreground">{entry.customerName} · {entry.reason}</p>
                {entry.note ? <p className="mt-2 text-sm">{entry.note}</p> : null}
              </div>
              <div className="text-right">
                <p className="font-black">{formatCurrency(entry.refundAmount)}</p>
                <p className="mt-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{entry.status}</p>
              </div>
            </div>
            <pre className="mt-3 overflow-x-auto rounded-2xl bg-muted p-3 text-xs">{JSON.stringify(entry.items, null, 2)}</pre>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button disabled={loading === entry.id} onClick={() => resolveReturn(entry.id, "APPROVED")} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary text-xs font-black text-white disabled:opacity-60"><CheckCircle2 className="h-4 w-4" />Approve</button>
              <button disabled={loading === entry.id} onClick={() => resolveReturn(entry.id, "REFUNDED")} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-lime-fresh text-xs font-black text-slate-950 disabled:opacity-60"><RotateCcw className="h-4 w-4" />Refunded</button>
              <button disabled={loading === entry.id} onClick={() => resolveReturn(entry.id, "REJECTED")} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-600 text-xs font-black text-white disabled:opacity-60"><XCircle className="h-4 w-4" />Reject</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
