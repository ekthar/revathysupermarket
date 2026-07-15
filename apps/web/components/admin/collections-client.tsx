"use client";

import { useState } from "react";
import { Banknote, CheckCircle, AlertTriangle, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/toast-provider";

type Collection = {
  id: string;
  orderId: string;
  partnerId: string;
  expectedAmount: number;
  cashCollected: number;
  upiCollected: number;
  walletApplied: number;
  adjustmentAmount: number;
  upiReference: string | null;
  status: string;
  discrepancyReason: string | null;
  createdAt: string;
  order: { orderNumber: string; customerName: string; total: number };
  partner: { id: string; name: string | null; phone: string | null };
  reconciledBy: { name: string | null } | null;
};

type Grouped = { pending: Collection[]; upiPending: Collection[]; settled: Collection[]; discrepancy: Collection[] };
type Totals = { pendingCash: number; pendingUpi: number; settledTotal: number; discrepancyCount: number };

export function CollectionsClient({ collections, grouped, totals }: { collections: Collection[]; grouped: Grouped; totals: Totals }) {
  void collections;
  const { showToast } = useToast();
  const [tab, setTab] = useState<"pending" | "upi" | "settled" | "discrepancy">("pending");
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkCash, setBulkCash] = useState("");
  const [bulkUpi, setBulkUpi] = useState("");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  async function reconcile(collection: Collection) {
    const discrepancy = collection.status === "SHORT" || collection.status === "EXCESS";
    const reason = discrepancy ? window.prompt("Explain how this discrepancy was resolved")?.trim() : undefined;
    if (discrepancy && !reason) return;
    const response = await fetch(`/api/admin/collections/${collection.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: discrepancy ? "resolve_discrepancy" : "settle", reason }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return showToast(data.error ?? "Reconciliation failed", "error");
    setHidden((current) => new Set(current).add(collection.id)); showToast("Collection settled", "success");
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectAll() {
    const currentList = tab === "pending" ? grouped.pending : grouped.upiPending;
    const allIds = currentList.filter((c) => !hidden.has(c.id)).map((c) => c.id);
    setSelectedIds(new Set(allIds));
  }

  async function handleBulkCollect() {
    const cashAmount = Number(bulkCash) || 0;
    const upiAmount = Number(bulkUpi) || 0;
    if (cashAmount <= 0 && upiAmount <= 0) { showToast("Enter cash or UPI amount", "error"); return; }
    setBulkSubmitting(true);
    try {
      const response = await fetch("/api/admin/collections/bulk-settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionIds: Array.from(selectedIds), cashAmount, upiAmount }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) { showToast(data.error ?? "Bulk collection failed", "error"); return; }
      setHidden((current) => { const next = new Set(current); selectedIds.forEach((id) => next.add(id)); return next; });
      setSelectedIds(new Set());
      setShowBulkModal(false);
      setBulkCash(""); setBulkUpi("");
      showToast(`${selectedIds.size} bills collected successfully`, "success");
    } catch { showToast("Network error", "error"); }
    finally { setBulkSubmitting(false); }
  }

  const tabs = [
    { key: "pending" as const, label: "Pending Cash", count: grouped.pending.length, icon: Banknote, color: "text-yellow-600" },
    { key: "upi" as const, label: "UPI Pending", count: grouped.upiPending.length, icon: CreditCard, color: "text-blue-600" },
    { key: "settled" as const, label: "Settled", count: grouped.settled.length, icon: CheckCircle, color: "text-green-600" },
    { key: "discrepancy" as const, label: "Discrepancies", count: grouped.discrepancy.length, icon: AlertTriangle, color: "text-red-600" },
  ];

  const currentList = tab === "pending" ? grouped.pending : tab === "upi" ? grouped.upiPending : tab === "settled" ? grouped.settled : grouped.discrepancy;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-black text-foreground">Collections</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl bg-card border border-border p-4">
          <p className="text-xs text-muted-foreground">Pending Cash</p>
          <p className="text-lg font-black text-yellow-600 dark:text-yellow-500">₹{totals.pendingCash.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-4">
          <p className="text-xs text-muted-foreground">UPI Awaiting</p>
          <p className="text-lg font-black text-blue-600 dark:text-blue-400">₹{totals.pendingUpi.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-4">
          <p className="text-xs text-muted-foreground">Settled Total</p>
          <p className="text-lg font-black text-green-600 dark:text-green-400">₹{totals.settledTotal.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-4">
          <p className="text-xs text-muted-foreground">Discrepancies</p>
          <p className="text-lg font-black text-red-600 dark:text-red-400">{totals.discrepancyCount}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
              tab === t.key ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground"
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (tab === "pending" || tab === "upi") && (
        <div className="flex items-center justify-between rounded-xl bg-primary/10 border border-primary/20 px-4 py-3">
          <span className="text-sm font-bold text-foreground">{selectedIds.size} bill{selectedIds.size !== 1 ? "s" : ""} selected</span>
          <div className="flex gap-2">
            <button onClick={() => setSelectedIds(new Set())} className="h-8 rounded-lg border border-border px-3 text-xs font-bold text-muted-foreground">Clear</button>
            <button onClick={() => setShowBulkModal(true)} className="h-8 rounded-lg bg-primary px-4 text-xs font-black text-white">Collect All</button>
          </div>
        </div>
      )}

      {/* List */}
      {currentList.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">No collections in this category</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(tab === "pending" || tab === "upi") && currentList.filter((c) => !hidden.has(c.id)).length > 1 && (
            <button onClick={selectAll} className="text-xs font-bold text-primary hover:underline">Select all</button>
          )}
          {currentList.filter((c) => !hidden.has(c.id)).map((c) => (
            <div key={c.id} className="rounded-xl bg-card border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {(tab === "pending" || tab === "upi") && (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(c.id)}
                      onChange={() => toggleSelect(c.id)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                  )}
                  <span className="text-sm font-bold text-foreground">#{c.order.orderNumber}</span>
                  <span className="text-xs text-muted-foreground ml-2">{c.order.customerName}</span>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">{c.partner.name}</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div><p className="text-muted-foreground">Expected</p><p className="font-bold">₹{Number(c.expectedAmount).toFixed(0)}</p></div>
                <div><p className="text-muted-foreground">Cash</p><p className="font-bold">₹{Number(c.cashCollected).toFixed(0)}</p></div>
                <div><p className="text-muted-foreground">UPI</p><p className="font-bold">₹{Number(c.upiCollected).toFixed(0)}</p></div>
                <div><p className="text-muted-foreground">Wallet</p><p className="font-bold">₹{Number(c.walletApplied).toFixed(0)}</p></div>
              </div>
              {c.discrepancyReason && <p className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg px-2 py-1">{c.discrepancyReason}</p>}
              {c.status !== "SETTLED" && <button onClick={() => reconcile(c)} className="mt-3 h-10 rounded-xl bg-primary px-4 text-xs font-black text-white">{c.status === "SHORT" || c.status === "EXCESS" ? "Resolve discrepancy" : c.upiCollected > 0 ? "Verify UPI & settle" : "Confirm cash handover"}</button>}
            </div>
          ))}
        </div>
      )}

      {/* Bulk Collection Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-lg">
            <h3 className="text-lg font-black text-foreground">Collect {selectedIds.size} Bills</h3>
            <p className="mt-1 text-xs text-muted-foreground">Enter total cash and UPI amounts received for selected bills</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground">Cash Amount (₹)</label>
                <input type="number" min="0" value={bulkCash} onChange={(e) => setBulkCash(e.target.value)} placeholder="0" className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-bold" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground">UPI Amount (₹)</label>
                <input type="number" min="0" value={bulkUpi} onChange={(e) => setBulkUpi(e.target.value)} placeholder="0" className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-bold" />
              </div>
              {(Number(bulkCash) > 0 || Number(bulkUpi) > 0) && (
                <p className="text-sm font-semibold text-foreground">Total: ₹{(Number(bulkCash) + Number(bulkUpi)).toLocaleString()}</p>
              )}
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => { setShowBulkModal(false); setBulkCash(""); setBulkUpi(""); }} className="flex-1 h-11 rounded-xl border border-border text-sm font-bold text-muted-foreground">Cancel</button>
              <button onClick={handleBulkCollect} disabled={bulkSubmitting} className="flex-1 h-11 rounded-xl bg-primary text-sm font-black text-white disabled:opacity-50">{bulkSubmitting ? "Processing..." : "Confirm Collection"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
