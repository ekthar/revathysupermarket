"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit3, Loader2, Minus, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { useToast } from "@/components/toast-provider";

type OrderItem = {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
  unit: string;
};

type SubstituteProduct = {
  id: string;
  name: string;
  price: number;
  unit: string;
};

export function OrderItemEditor({ orderId, items }: { orderId: string; items: OrderItem[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [substituteFor, setSubstituteFor] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SubstituteProduct[]>([]);
  const [searching, setSearching] = useState(false);

  async function editItem(itemId: string, action: string, data?: Record<string, unknown>) {
    setLoading(itemId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, action, reason: "Admin edit", ...data }),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || "Edit failed", "error");
        return;
      }
      showToast("Order updated", "success");
      router.refresh();
    } catch {
      showToast("Network error", "error");
    } finally {
      setLoading(null);
    }
  }

  async function searchProducts(query: string) {
    if (query.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=8`);
      const data = await res.json();
      setSearchResults(
        (data.products || []).map((p: { id: string; name: string; price: number | string; unit?: string }) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          unit: p.unit || "pcs",
        }))
      );
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  function handleSubstitute(itemId: string, product: SubstituteProduct) {
    editItem(itemId, "substitute", { productId: product.id });
    setSubstituteFor(null);
    setSearchQuery("");
    setSearchResults([]);
  }

  return (
    <section className="rounded-2xl bg-card border border-amber-200 dark:border-amber-800/50 p-5">
      <h2 className="text-sm font-black text-foreground mb-3 flex items-center gap-2">
        <Edit3 className="h-4 w-4 text-amber-600" /> Edit Order Items
      </h2>
      <p className="text-xs text-muted-foreground mb-4">Remove items, adjust quantities, or substitute products.</p>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl bg-muted/50 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">₹{item.price} × {item.quantity} = ₹{(item.price * item.quantity).toFixed(0)}</p>
              </div>

              {loading === item.id ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <div className="flex items-center gap-1">
                  {/* Quantity controls */}
                  <button
                    type="button"
                    onClick={() => editItem(item.id, "quantity-change", { quantity: Math.max(1, item.quantity - 1) })}
                    disabled={item.quantity <= 1}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300 disabled:opacity-30"
                    title="Decrease quantity"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => editItem(item.id, "quantity-change", { quantity: item.quantity + 1 })}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300"
                    title="Increase quantity"
                  >
                    <Plus className="h-3 w-3" />
                  </button>

                  {/* Substitute */}
                  <button
                    type="button"
                    onClick={() => setSubstituteFor(substituteFor === item.id ? null : item.id)}
                    className="ml-1 flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200"
                    title="Substitute product"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => { if (confirm(`Remove "${item.name}" from this order?`)) editItem(item.id, "remove"); }}
                    className="ml-1 flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200"
                    title="Remove item"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Substitute search panel */}
            {substituteFor === item.id && (
              <div className="mt-3 rounded-lg border border-border bg-background p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); searchProducts(e.target.value); }}
                    placeholder="Search replacement product..."
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    autoFocus
                  />
                  <button type="button" onClick={() => { setSubstituteFor(null); setSearchQuery(""); setSearchResults([]); }}>
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
                {searching && <p className="text-xs text-muted-foreground">Searching...</p>}
                {searchResults.length > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {searchResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSubstitute(item.id, p)}
                        className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left hover:bg-muted transition-colors"
                      >
                        <span className="text-xs font-medium text-foreground truncate">{p.name}</span>
                        <span className="text-xs font-bold text-muted-foreground shrink-0 ml-2">₹{p.price}</span>
                      </button>
                    ))}
                  </div>
                )}
                {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                  <p className="text-xs text-muted-foreground">No products found</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
