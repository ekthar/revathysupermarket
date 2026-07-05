"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Percent, Plus, Save, Tag, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/toast-provider";
import { readApiResponse } from "@/lib/client-api";
import { formatCurrency } from "@/lib/utils";

type Offer = {
  id: string;
  title: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  categoryId: string | null;
  productId: string | null;
  minQuantity: number;
  maxDiscount: number | null;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  image: string | null;
  badge: string | null;
};

type Category = { id: string; name: string };

export function OfferManagementClient({ offers, categories }: { offers: Offer[]; categories: Category[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [localOffers, setLocalOffers] = useState(offers);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: "",
    categoryId: "",
    minQuantity: "1",
    maxDiscount: "",
    badge: "",
    image: "",
    startsAt: "",
    expiresAt: ""
  });

  function resetForm() {
    setForm({
      title: "", description: "", discountType: "percentage", discountValue: "",
      categoryId: "", minQuantity: "1", maxDiscount: "", badge: "", image: "",
      startsAt: "", expiresAt: ""
    });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.discountValue) {
      showToast("Title and discount value are required", "error");
      return;
    }
    const res = await fetch("/api/admin/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        categoryId: form.categoryId || null,
        minQuantity: Number(form.minQuantity) || 1,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        badge: form.badge.trim() || null,
        image: form.image.trim() || null,
        startsAt: form.startsAt || null,
        expiresAt: form.expiresAt || null,
        isActive: true
      })
    });
    const data = await readApiResponse<{ offer?: Offer; error?: string }>(res);
    if (!res.ok) { showToast(data.error ?? "Failed", "error"); return; }
    showToast("Offer created!", "success");
    resetForm();
    setShowCreate(false);
    startTransition(() => router.refresh());
  }

  async function toggleOffer(offer: Offer) {
    setLocalOffers((prev) => prev.map((o) => o.id === offer.id ? { ...o, isActive: !o.isActive } : o));
    const res = await fetch(`/api/admin/offers/${offer.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !offer.isActive })
    });
    if (!res.ok) {
      setLocalOffers((prev) => prev.map((o) => o.id === offer.id ? offer : o));
      showToast("Failed to update", "error");
      return;
    }
    showToast(offer.isActive ? "Offer disabled" : "Offer enabled", "success");
  }

  async function deleteOffer(offer: Offer) {
    if (!confirm(`Delete "${offer.title}"?`)) return;
    setLocalOffers((prev) => prev.filter((o) => o.id !== offer.id));
    const res = await fetch(`/api/admin/offers/${offer.id}`, { method: "DELETE" });
    if (!res.ok) {
      setLocalOffers((prev) => [offer, ...prev]);
      showToast("Failed to delete", "error");
      return;
    }
    showToast("Offer deleted", "success");
  }

  const getCategoryName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? "All products";

  return (
    <div className="mt-5 space-y-4">
      {!showCreate ? (
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> New Offer
        </Button>
      ) : (
        <form onSubmit={handleCreate} className="rounded-xl border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl font-black">Create Offer</h3>
            <button type="button" onClick={() => { setShowCreate(false); resetForm(); }} aria-label="Close">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Offer title *" required className="h-12 rounded-2xl" />
            <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Description (optional)" className="h-12 rounded-2xl" />
            <div className="flex gap-2">
              <select
                value={form.discountType}
                onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value as "percentage" | "fixed" }))}
                className="h-12 rounded-2xl border border-border bg-background px-3 text-sm font-bold outline-none"
              >
                <option value="percentage">% off</option>
                <option value="fixed">₹ off</option>
              </select>
              <Input value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))} placeholder="Discount value *" type="number" min="1" required className="h-12 rounded-2xl flex-1" />
            </div>
            <select
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              className="h-12 rounded-2xl border border-border bg-background px-3 text-sm font-bold outline-none"
            >
              <option value="">All products</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <Input value={form.badge} onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))} placeholder="Badge text (e.g. '20% OFF')" className="h-12 rounded-2xl" />
            <Input value={form.maxDiscount} onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))} placeholder="Max discount cap (₹)" type="number" min="0" className="h-12 rounded-2xl" />
            <Input value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} placeholder="Offer image URL (optional)" type="url" className="h-12 rounded-2xl" />
            <Input value={form.minQuantity} onChange={(e) => setForm((f) => ({ ...f, minQuantity: e.target.value }))} placeholder="Min quantity" type="number" min="1" className="h-12 rounded-2xl" />
            <Input value={form.startsAt} onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} placeholder="Starts at" type="datetime-local" className="h-12 rounded-2xl" />
            <Input value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} placeholder="Expires at" type="datetime-local" className="h-12 rounded-2xl" />
          </div>
          {form.image && <Image src={form.image} alt="Preview" width={64} height={64} className="mt-3 h-16 rounded-xl object-cover border border-border" unoptimized />}
          <Button type="submit" className="mt-4" disabled={isPending}>
            <Save className="h-4 w-4" /> Create Offer
          </Button>
        </form>
      )}

      {/* Offers list */}
      <div className="rounded-xl border border-white/70 bg-card/95 shadow-soft dark:border-white/10 overflow-hidden">
        {localOffers.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No offers yet. Create your first offer above.</p>
        ) : (
          <div className="divide-y divide-border">
            {localOffers.map((offer) => (
              <div key={offer.id} className="p-4 sm:p-5">
                <div className="flex items-center gap-4">
                  <div className={`relative h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${offer.isActive ? "bg-primary/10" : "bg-muted"}`}>
                    {offer.image ? (
                      <Image src={offer.image} alt={offer.title || "Offer image"} fill className="rounded-xl object-cover" unoptimized />
                    ) : (
                      <Tag className={`h-5 w-5 ${offer.isActive ? "text-primary" : "text-muted-foreground"}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-foreground truncate">{offer.title}</h4>
                      {offer.badge && (
                        <span className="text-micro font-black bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full shrink-0">
                          {offer.badge}
                        </span>
                      )}
                      <span className={`text-micro font-bold px-2 py-0.5 rounded-full shrink-0 ${offer.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}>
                        {offer.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-caption text-muted-foreground mt-0.5">
                      {offer.discountType === "percentage" ? `${offer.discountValue}% off` : `${formatCurrency(offer.discountValue)} off`}
                      {offer.maxDiscount ? ` (max ${formatCurrency(offer.maxDiscount)})` : ""}
                      {" · "}
                      {getCategoryName(offer.categoryId)}
                      {offer.expiresAt ? ` · Expires ${new Date(offer.expiresAt).toLocaleDateString("en-IN")}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button type="button" onClick={() => toggleOffer(offer)} className="h-9 w-9 flex items-center justify-center rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors" title={offer.isActive ? "Disable" : "Enable"} aria-label={offer.isActive ? `Disable ${offer.title}` : `Enable ${offer.title}`}>
                      {offer.isActive ? <EyeOff className="h-3.5 w-3.5 text-primary" /> : <Eye className="h-3.5 w-3.5 text-primary" />}
                    </button>
                    <button type="button" onClick={() => deleteOffer(offer)} className="h-9 w-9 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/20 hover:bg-red-100 transition-colors" aria-label={`Delete ${offer.title}`}>
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
