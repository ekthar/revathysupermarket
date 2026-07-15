"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Truck, UserCheck, Loader2 } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { readApiResponse } from "@/lib/client-api";

type Partner = { id: string; name: string | null; phone: string | null };

export function DeliveryAssignment({
  orderId,
  currentPartnerId,
  currentPartnerName,
  orderStatus,
}: {
  orderId: string;
  currentPartnerId: string | null;
  currentPartnerName: string | null;
  orderStatus: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedId, setSelectedId] = useState(currentPartnerId || "");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Fetch available delivery partners
  useEffect(() => {
    setFetching(true);
    fetch("/api/admin/staff")
      .then((r) => r.json())
      .then((data) => {
        const deliveryPartners = (data.staff || []).filter(
          (s: { role: string; isActive: boolean }) => s.role === "DELIVERY_PARTNER" && s.isActive
        );
        setPartners(deliveryPartners);
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  async function assignPartner() {
    if (!selectedId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/delivery`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryPartnerId: selectedId }),
      });
      const data = await readApiResponse<{ error?: string }>(res);
      if (!res.ok) {
        showToast(data.error || "Failed to assign delivery partner", "error");
        return;
      }
      showToast("Delivery partner assigned", "success");
      router.refresh();
    } catch {
      showToast("Network error", "error");
    } finally {
      setLoading(false);
    }
  }

  // Don't show assignment for completed/cancelled orders
  const isTerminal = ["DELIVERED", "CANCELLED"].includes(orderStatus);

  return (
    <section className="rounded-2xl bg-card border border-border p-5">
      <h2 className="text-sm font-black text-foreground mb-3 flex items-center gap-2">
        <Truck className="h-4 w-4 text-primary" /> Delivery Assignment
      </h2>

      {currentPartnerId && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2">
          <UserCheck className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            {currentPartnerName || "Assigned"}
          </span>
        </div>
      )}

      {!isTerminal && (
        <div className="space-y-2">
          {fetching ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading partners...
            </div>
          ) : partners.length === 0 ? (
            <p className="text-xs text-muted-foreground">No active delivery partners found.</p>
          ) : (
            <>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Select partner...</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || p.phone || "Unnamed"} {p.id === currentPartnerId ? "(current)" : ""}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={assignPartner}
                disabled={!selectedId || selectedId === currentPartnerId || loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Truck className="h-3.5 w-3.5" />}
                {currentPartnerId ? "Reassign Partner" : "Assign Partner"}
              </button>
            </>
          )}
        </div>
      )}

      {isTerminal && !currentPartnerId && (
        <p className="text-xs text-muted-foreground italic">No partner was assigned to this order.</p>
      )}
    </section>
  );
}
