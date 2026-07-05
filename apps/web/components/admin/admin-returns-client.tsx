"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, PackageCheck, RotateCcw, Search, XCircle } from "lucide-react";
import { readApiResponse } from "@/lib/client-api";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/toast-provider";
import { ReturnReceiptPrintButton } from "@/components/admin/return-receipt-print";
import { AnimatedCheckmark } from "@/components/ui/animated-checkmark";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ReturnItem = { orderItemId?: string; name?: string; quantity?: number; price?: number; amount?: number };
type AdminReturn = { id: string; returnNumber?: string; billNumber?: string; orderNumber: string; customerName: string; paymentMethod: string; status: string; reason: string; note: string | null; refundAmount: number; items: unknown; createdAt: string };
type Action = "review" | "approve" | "reject" | "receive_item" | "refund";

const actionsByStatus: Record<string, Array<{ action: Action; label: string; tone: string }>> = {
  REQUESTED: [{ action: "review", label: "Start review", tone: "bg-slate-900 text-white" }, { action: "approve", label: "Approve", tone: "bg-primary text-white" }, { action: "reject", label: "Reject", tone: "bg-red-600 text-white" }],
  UNDER_REVIEW: [{ action: "approve", label: "Approve", tone: "bg-primary text-white" }, { action: "reject", label: "Reject", tone: "bg-red-600 text-white" }],
  APPROVED: [{ action: "receive_item", label: "Item received", tone: "bg-blue-600 text-white" }, { action: "refund", label: "Issue refund", tone: "bg-lime-fresh text-slate-950" }],
  ITEM_RECEIVED: [{ action: "refund", label: "Issue refund", tone: "bg-lime-fresh text-slate-950" }]
};

export function AdminReturnsClient({ returns }: { returns: AdminReturn[] }) {
  const { showToast } = useToast();
  const [entries, setEntries] = useState(returns);
  const [filter, setFilter] = useState("ACTIVE");
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<{ entry: AdminReturn; action: Action } | null>(null);
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("WALLET");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    async function refresh() {
      if (document.visibilityState !== "visible") return;
      const response = await fetch("/api/admin/returns", { cache: "no-store" });
      const data = await readApiResponse<{ returns?: AdminReturn[] }>(response);
      if (active && response.ok && data.returns) setEntries(data.returns);
    }
    const interval = window.setInterval(refresh, 30000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  const visible = useMemo(() => entries.filter((entry) => {
    const active = !["REFUNDED", "REJECTED"].includes(entry.status);
    const matchesFilter = filter === "ALL" || (filter === "ACTIVE" ? active : entry.status === filter);
    const text = `${entry.returnNumber ?? ""} ${entry.billNumber ?? ""} ${entry.orderNumber} ${entry.customerName} ${entry.reason}`.toLowerCase();
    return matchesFilter && text.includes(query.toLowerCase());
  }), [entries, filter, query]);

  function openAction(entry: AdminReturn, action: Action) {
    setDialog({ entry, action }); setNote(""); setAmount(String(entry.refundAmount || "")); setMethod(entry.paymentMethod === "UPI_ON_DELIVERY" ? "UPI" : "WALLET");
  }

  async function submit() {
    if (!dialog) return;
    if (dialog.action === "reject" && !note.trim()) return showToast("Enter a rejection reason", "error");
    setLoading(true);
    const response = await fetch(`/api/admin/returns/${dialog.entry.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: dialog.action, reason: note || undefined, refundAmount: dialog.action === "refund" ? Number(amount) : undefined, refundMethod: dialog.action === "refund" ? method : undefined }) });
    const data = await readApiResponse<{ error?: string; returnRequest?: { status: string } }>(response);
    setLoading(false);
    if (!response.ok) return showToast(data.error ?? "Return update failed", "error");
    setEntries((current) => current.map((entry) => entry.id === dialog.entry.id ? { ...entry, status: data.returnRequest?.status ?? entry.status } : entry));
    showToast("Return updated", "success");
    setSuccess(true);
    window.setTimeout(() => { setDialog(null); setSuccess(false); }, 900);
  }

  return <div className="space-y-5">
    <header className="rounded-xl bg-[linear-gradient(135deg,rgba(15,138,95,0.12),rgba(167,209,41,0.16))] p-5 sm:p-7"><p className="text-xs font-black uppercase text-primary">Operations</p><h1 className="mt-2 font-display text-3xl font-black sm:text-4xl">Returns & refunds</h1><p className="mt-2 text-sm text-muted-foreground">Review items, receive goods and issue traceable refunds.</p></header>
    <div className="grid gap-2 sm:grid-cols-[1fr_auto]"><label className="relative"><Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground"/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search return, order or customer" className="h-11 w-full rounded-2xl border border-border bg-background pl-10 pr-3 text-sm"/></label><select value={filter} onChange={(e) => setFilter(e.target.value)} className="h-11 rounded-2xl border border-border bg-background px-3 text-sm font-bold"><option value="ACTIVE">Active</option><option value="ALL">All</option><option value="REQUESTED">Requested</option><option value="UNDER_REVIEW">Under review</option><option value="APPROVED">Approved</option><option value="ITEM_RECEIVED">Item received</option><option value="REFUNDED">Refunded</option><option value="REJECTED">Rejected</option></select></div>
    {visible.length === 0 ? <div className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">No returns in this queue.</div> : <div className="grid gap-4">{visible.map((entry) => { const items = Array.isArray(entry.items) ? entry.items as ReturnItem[] : []; return <article key={entry.id} className="rounded-3xl border border-border bg-card p-4 shadow-soft"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase text-primary">{entry.returnNumber ?? `Order #${entry.orderNumber}`}</p><h2 className="mt-1 text-xl font-black">#{entry.orderNumber} · {entry.customerName}</h2>{entry.billNumber && <p className="mt-0.5 text-xs font-bold text-muted-foreground">Bill: {entry.billNumber}</p>}<p className="mt-1 text-sm text-muted-foreground">{entry.reason.replaceAll("_", " ")} · {new Date(entry.createdAt).toLocaleString("en-IN")}</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{entry.status.replaceAll("_", " ")}</span></div><div className="mt-4 divide-y divide-border rounded-2xl bg-muted/60 px-3">{items.map((item, index) => <div key={item.orderItemId ?? index} className="flex items-center justify-between gap-3 py-3 text-sm"><div><p className="font-bold">{item.name ?? "Item"}</p><p className="text-xs text-muted-foreground">Quantity {item.quantity ?? 0} × {formatCurrency(Number(item.price ?? 0))}</p></div><p className="font-black">{formatCurrency(Number(item.amount ?? Number(item.price ?? 0) * Number(item.quantity ?? 0)))}</p></div>)}</div>{entry.note && <p className="mt-3 rounded-xl bg-muted p-3 text-sm">{entry.note}</p>}<div className="mt-4 flex flex-wrap gap-2">{(actionsByStatus[entry.status] ?? []).map((item) => <button key={item.action} onClick={() => openAction(entry, item.action)} className={`inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-xs font-black ${item.tone}`}>{item.action === "reject" ? <XCircle className="h-4 w-4"/> : item.action === "refund" ? <RotateCcw className="h-4 w-4"/> : item.action === "receive_item" ? <PackageCheck className="h-4 w-4"/> : <CheckCircle2 className="h-4 w-4"/>}{item.label}</button>)}{entry.status === "REFUNDED" && <ReturnReceiptPrintButton entry={entry} />}</div></article>; })}</div>}
    {dialog && (
      <Dialog open onOpenChange={(isOpen) => { if (!isOpen) setDialog(null); }}>
        <DialogContent className="max-w-md">
          {success ? (
            <div className="flex flex-col items-center py-6 text-center">
              <AnimatedCheckmark size={72} delay={0.05} />
              <p className="mt-4 font-black">Return updated</p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{dialog.action.replace("_", " ")} return</DialogTitle>
              </DialogHeader>
              <p className="-mt-2 text-sm text-muted-foreground">{dialog.entry.returnNumber} · #{dialog.entry.orderNumber}</p>
              {dialog.action === "refund" && (
                <>
                  <label className="mt-4 block text-sm font-bold">Refund amount
                    <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3" />
                  </label>
                  <label className="mt-3 block text-sm font-bold">Method
                    <select value={method} onChange={(e) => setMethod(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3">
                      <option value="WALLET">Wallet</option>
                      <option value="UPI">UPI</option>
                      <option value="CASH">Cash</option>
                    </select>
                  </label>
                </>
              )}
              <label className="mt-4 block text-sm font-bold">{dialog.action === "reject" ? "Reason" : "Resolution note"}
                <textarea value={note} onChange={(e) => setNote(e.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-border bg-background p-3" />
              </label>
              <DialogFooter className="grid grid-cols-2 gap-2 sm:grid-cols-2">
                <button onClick={() => setDialog(null)} className="h-11 rounded-2xl border border-border font-bold">Cancel</button>
                <button disabled={loading} onClick={submit} className="h-11 rounded-2xl bg-primary font-black text-white disabled:opacity-50">{loading ? "Saving…" : "Confirm"}</button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    )}
  </div>;
}
