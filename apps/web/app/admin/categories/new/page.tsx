"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

export default function AdminCategoryNewPage() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [icon, setIcon] = useState("");
  const [sortOrder, setSortOrder] = useState("0");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim() || undefined,
        image: image.trim() || undefined,
        icon: icon.trim() || undefined,
        sortOrder: parseInt(sortOrder, 10) || 0,
      };

      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create category.");
        return;
      }

      const { category } = await res.json();
      router.push(`/admin/categories/${category.id}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/categories"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Catalogue</p>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white">New Category</h1>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleCreate} className="space-y-6">
        <fieldset className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <legend className="px-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200">Category Details</legend>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Name *</label>
              <input id="name" type="text" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
            </div>
            <div>
              <label htmlFor="description" className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Description</label>
              <textarea id="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="icon" className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Icon (emoji)</label>
                <input id="icon" type="text" maxLength={16} value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🍎" className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
              </div>
              <div>
                <label htmlFor="sortOrder" className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Sort Order</label>
                <input id="sortOrder" type="number" min="0" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
              </div>
            </div>
            <div>
              <label htmlFor="image" className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Image URL</label>
              <input id="image" type="url" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
            </div>
          </div>
        </fieldset>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/admin/categories" className="rounded-full px-5 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Create Category
          </button>
        </div>
      </form>
    </div>
  );
}
