"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/toast-provider";
import { readApiResponse } from "@/lib/client-api";

type Unit = {
  id: string;
  name: string;
  productCount: number;
};

export function UnitManagementClient({ units }: { units: Unit[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      showToast("Unit name is required", "error");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/admin/units", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    const data = await readApiResponse<{ unit?: Unit; error?: string }>(res);
    setSubmitting(false);

    if (!res.ok) {
      showToast(data.error ?? "Failed to create unit", "error");
      return;
    }

    showToast("Unit created successfully", "success");
    setName("");
    startTransition(() => router.refresh());
  }

  async function handleDelete(unit: Unit) {
    const res = await fetch(`/api/admin/units/${unit.id}`, {
      method: "DELETE",
    });
    const data = await readApiResponse<{ success?: boolean; error?: string }>(res);

    if (!res.ok) {
      showToast(data.error ?? "Failed to delete unit", "error");
      return;
    }

    showToast("Unit deleted successfully", "success");
    startTransition(() => router.refresh());
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Create Panel */}
      <section className="rounded-xl border border-white/70 bg-card/95 p-5 shadow-soft dark:border-white/10">
        <h3 className="font-display text-xl font-black">Add Unit</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Define a new unit string to be used for pricing products.
        </p>

        <form onSubmit={handleCreate} className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-black uppercase text-muted-foreground">Unit Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 10 nos, 2 kg, 12 packets"
              required
              className="mt-1 h-12 rounded-2xl"
            />
          </div>

          <Button type="submit" className="w-full h-12 rounded-2xl" disabled={submitting || isPending}>
            <PlusCircle className="h-4 w-4" />
            {submitting ? "Adding..." : "Add Unit"}
          </Button>
        </form>
      </section>

      {/* Units List */}
      <section className="rounded-xl border border-white/70 bg-card/95 p-5 shadow-soft dark:border-white/10 md:col-span-2">
        <h3 className="font-display text-xl font-black">Available Units</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage existing unit strings. Pre-populate common options for products.
        </p>

        {units.length === 0 ? (
          <div className="mt-8 text-center text-muted-foreground">No units configured.</div>
        ) : (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {units.map((unit) => (
              <div
                key={unit.id}
                className="flex items-center justify-between rounded-2xl border border-border p-3.5 bg-background hover:bg-slate-50 dark:hover:bg-slate-900/50 transition"
              >
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{unit.name}</p>
                  <p className="text-xs text-muted-foreground">{unit.productCount} product(s)</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(unit)}
                  disabled={unit.productCount > 0}
                  className="h-9 w-9 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title={unit.productCount > 0 ? "Currently assigned to products" : "Delete unit"}
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
