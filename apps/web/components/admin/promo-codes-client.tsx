"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Percent, Plus, Tag, Trash2, ToggleLeft, ToggleRight, IndianRupee } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { readApiResponse } from "@/lib/client-api";

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  minimumOrder: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
}

export function PromoCodesClient({ codes: initialCodes }: { codes: PromoCode[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [codes, setCodes] = useState(initialCodes);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [form, setForm] = useState({
    code: "",
    description: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: "",
    minimumOrder: "0",
    maxDiscount: "",
    usageLimit: "",
    expiresAt: ""
  });

  function generateCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setForm((f) => ({ ...f, code }));
  }

  async function createCode(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    const payload = {
      code: form.code,
      description: form.description || undefined,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minimumOrder: Number(form.minimumOrder) || 0,
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined
    };

    const res = await fetch("/api/admin/promo-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await readApiResponse<{ promo?: PromoCode; error?: string }>(res);
    setCreating(false);

    if (!res.ok) {
      showToast(data.error || "Failed to create promo code", "error");
      return;
    }

    showToast(`Promo code ${form.code} created!`, "success");
    setForm({ code: "", description: "", discountType: "percentage", discountValue: "", minimumOrder: "0", maxDiscount: "", usageLimit: "", expiresAt: "" });
    setShowForm(false);
    router.refresh();
  }

  async function toggleCode(id: string, isActive: boolean) {
    setCodes((prev) => prev.map((c) => c.id === id ? { ...c, isActive: !isActive } : c));
    const res = await fetch(`/api/admin/promo-codes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive })
    });
    if (!res.ok) setCodes((prev) => prev.map((c) => c.id === id ? { ...c, isActive } : c));
  }

  async function deleteCode(id: string) {
    if (!confirm("Delete this promo code?")) return;
    setCodes((prev) => prev.filter((c) => c.id !== id));
    await fetch(`/api/admin/promo-codes/${id}`, { method: "DELETE" });
    showToast("Promo code deleted", "success");
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    showToast(`Copied: ${code}`, "success");
  }

  return (
    <div className="space-y-4">
      {/* Create button */}
      <button
        type="button"
        onClick={() => { setShowForm(!showForm); if (!form.code) generateCode(); }}
        className="w-full h-12 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 dark:bg-primary/10 text-body font-bold text-primary flex items-center justify-center gap-2 press"
      >
        <Plus className="h-4 w-4" />
        Create Promo Code
      </button>

      {/* Create form */}
      {showForm && (
        <form onSubmit={createCode} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="text-caption font-semibold text-slate-500 mb-1 block">Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="SAVE20"
                  required
                  className="flex-1 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-body font-bold tracking-wider outline-none"
                />
                <button type="button" onClick={generateCode} className="h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-caption font-bold text-slate-600 dark:text-slate-300 press">
                  Random
                </button>
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="text-caption font-semibold text-slate-500 mb-1 block">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="20% off on first order"
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-body outline-none"
              />
            </div>
            <div>
              <label className="text-caption font-semibold text-slate-500 mb-1 block">Discount Type</label>
              <select
                value={form.discountType}
                onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value as any }))}
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-body font-semibold outline-none"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="text-caption font-semibold text-slate-500 mb-1 block">
                {form.discountType === "percentage" ? "Discount %" : "Discount ₹"}
              </label>
              <input
                type="number"
                value={form.discountValue}
                onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                placeholder={form.discountType === "percentage" ? "20" : "100"}
                min="1"
                max={form.discountType === "percentage" ? "100" : "10000"}
                required
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-body outline-none"
              />
            </div>
            <div>
              <label className="text-caption font-semibold text-slate-500 mb-1 block">Min Order ₹</label>
              <input
                type="number"
                value={form.minimumOrder}
                onChange={(e) => setForm((f) => ({ ...f, minimumOrder: e.target.value }))}
                placeholder="0"
                min="0"
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-body outline-none"
              />
            </div>
            <div>
              <label className="text-caption font-semibold text-slate-500 mb-1 block">Max Discount ₹</label>
              <input
                type="number"
                value={form.maxDiscount}
                onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))}
                placeholder="No cap"
                min="1"
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-body outline-none"
              />
            </div>
            <div>
              <label className="text-caption font-semibold text-slate-500 mb-1 block">Usage Limit</label>
              <input
                type="number"
                value={form.usageLimit}
                onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
                placeholder="Unlimited"
                min="1"
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-body outline-none"
              />
            </div>
            <div>
              <label className="text-caption font-semibold text-slate-500 mb-1 block">Expires At</label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-body outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="w-full h-11 rounded-xl bg-primary text-white text-body font-bold press disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create Promo Code"}
          </button>
        </form>
      )}

      {/* Existing codes */}
      {codes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-10 text-center">
          <Tag className="h-8 w-8 text-slate-300 mx-auto" />
          <p className="mt-3 text-body font-medium text-slate-500">No promo codes yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {codes.map((code) => (
            <div
              key={code.id}
              className={`rounded-2xl bg-white dark:bg-slate-900 border p-4 ${code.isActive ? "border-slate-100 dark:border-slate-800" : "border-slate-100 dark:border-slate-800 opacity-60"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${code.discountType === "percentage" ? "bg-orange-50 dark:bg-orange-950/30" : "bg-emerald-50 dark:bg-emerald-950/30"}`}>
                    {code.discountType === "percentage" ? (
                      <Percent className="h-4 w-4 text-orange-600" />
                    ) : (
                      <IndianRupee className="h-4 w-4 text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-body font-bold tracking-wider text-slate-900 dark:text-white">{code.code}</span>
                      <button type="button" onClick={() => copyCode(code.code)} className="text-slate-400 press">
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-caption text-slate-500 mt-0.5">
                      {code.discountType === "percentage" ? `${code.discountValue}% off` : `₹${code.discountValue} off`}
                      {code.minimumOrder > 0 ? ` • Min ₹${code.minimumOrder}` : ""}
                      {code.maxDiscount ? ` • Max ₹${code.maxDiscount}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-micro font-medium text-slate-400">
                    {code.usedCount}{code.usageLimit ? `/${code.usageLimit}` : ""} used
                  </span>
                  <button type="button" onClick={() => toggleCode(code.id, code.isActive)} className="press">
                    {code.isActive ? (
                      <ToggleRight className="h-6 w-6 text-primary" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-slate-300" />
                    )}
                  </button>
                  <button type="button" onClick={() => deleteCode(code.id)} className="press text-red-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {code.description && (
                <p className="mt-2 text-caption text-slate-500 dark:text-slate-400">{code.description}</p>
              )}
              {code.expiresAt && (
                <p className="mt-1 text-micro text-slate-400">
                  Expires: {new Date(code.expiresAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
