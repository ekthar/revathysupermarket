"use client";

/* eslint-disable @next/next/no-img-element */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Edit3, FolderPlus, ImagePlus, Package, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/toast-provider";
import { readApiResponse } from "@/lib/client-api";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  sortOrder: number;
  productCount: number;
};

export function CategoryManagementClient({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [localCategories, setLocalCategories] = useState(categories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Create form
  const [createForm, setCreateForm] = useState({ name: "", description: "", image: "", sortOrder: "0" });
  // Edit form
  const [editForm, setEditForm] = useState({ name: "", description: "", image: "", sortOrder: "0" });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.name.trim()) { showToast("Name is required", "error"); return; }
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        image: createForm.image.trim() || undefined,
        sortOrder: Number(createForm.sortOrder) || 0
      })
    });
    const data = await readApiResponse<{ category?: Category; error?: string }>(res);
    if (!res.ok) { showToast(data.error ?? "Failed to create category", "error"); return; }
    showToast("Category created", "success");
    setCreateForm({ name: "", description: "", image: "", sortOrder: "0" });
    setShowCreate(false);
    startTransition(() => router.refresh());
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setEditForm({
      name: cat.name,
      description: cat.description ?? "",
      image: cat.image ?? "",
      sortOrder: String(cat.sortOrder)
    });
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    const res = await fetch(`/api/admin/categories/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
        image: editForm.image.trim() || null,
        sortOrder: Number(editForm.sortOrder) || 0
      })
    });
    const data = await readApiResponse<{ category?: Category; error?: string }>(res);
    if (!res.ok) { showToast(data.error ?? "Failed to update", "error"); return; }
    showToast("Category updated", "success");
    setEditingId(null);
    startTransition(() => router.refresh());
  }

  async function handleDelete(cat: Category) {
    if (!confirm(`Delete "${cat.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/categories/${cat.id}`, { method: "DELETE" });
    const data = await readApiResponse<{ error?: string }>(res);
    if (!res.ok) { showToast(data.error ?? "Failed to delete", "error"); return; }
    showToast("Category deleted", "success");
    setLocalCategories((prev) => prev.filter((c) => c.id !== cat.id));
    startTransition(() => router.refresh());
  }

  async function updateSortOrder(catId: string, newOrder: number) {
    await fetch(`/api/admin/categories/${catId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sortOrder: newOrder })
    });
    startTransition(() => router.refresh());
  }

  const displayCategories = localCategories.length > 0 ? localCategories : categories;

  return (
    <div className="mt-5 space-y-4">
      {/* Create button / form */}
      {!showCreate ? (
        <Button onClick={() => setShowCreate(true)} className="w-full sm:w-auto">
          <FolderPlus className="h-4 w-4" />
          New Category
        </Button>
      ) : (
        <form onSubmit={handleCreate} className="rounded-[1.75rem] border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl font-black">Create Category</h3>
            <button type="button" onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              value={createForm.name}
              onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Category name *"
              required
              className="h-12 rounded-2xl"
            />
            <Input
              value={createForm.description}
              onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Description (optional)"
              className="h-12 rounded-2xl"
            />
            <Input
              value={createForm.image}
              onChange={(e) => setCreateForm((f) => ({ ...f, image: e.target.value }))}
              placeholder="Image URL (optional)"
              type="url"
              className="h-12 rounded-2xl"
            />
            <Input
              value={createForm.sortOrder}
              onChange={(e) => setCreateForm((f) => ({ ...f, sortOrder: e.target.value }))}
              placeholder="Sort order"
              type="number"
              min="0"
              className="h-12 rounded-2xl"
            />
          </div>
          {createForm.image && (
            <img src={createForm.image} alt="Preview" className="mt-3 h-16 w-16 rounded-xl object-cover border border-border" />
          )}
          <Button type="submit" className="mt-4" disabled={isPending}>
            <Save className="h-4 w-4" /> Create
          </Button>
        </form>
      )}

      {/* Category list */}
      <div className="rounded-[1.75rem] border border-white/70 bg-card/95 shadow-soft dark:border-white/10 overflow-hidden">
        {displayCategories.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No categories yet. Create your first category above.</p>
        ) : (
          <div className="divide-y divide-border">
            {displayCategories.map((cat, index) => (
              <div key={cat.id} className="p-4 sm:p-5">
                {editingId === cat.id ? (
                  <form onSubmit={handleEdit} className="space-y-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Category name"
                        required
                        className="h-11 rounded-2xl"
                      />
                      <Input
                        value={editForm.description}
                        onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder="Description"
                        className="h-11 rounded-2xl"
                      />
                      <Input
                        value={editForm.image}
                        onChange={(e) => setEditForm((f) => ({ ...f, image: e.target.value }))}
                        placeholder="Image URL"
                        type="url"
                        className="h-11 rounded-2xl"
                      />
                      <Input
                        value={editForm.sortOrder}
                        onChange={(e) => setEditForm((f) => ({ ...f, sortOrder: e.target.value }))}
                        placeholder="Sort order"
                        type="number"
                        min="0"
                        className="h-11 rounded-2xl"
                      />
                    </div>
                    {editForm.image && (
                      <img src={editForm.image} alt="Preview" className="h-14 w-14 rounded-xl object-cover border border-border" />
                    )}
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={isPending}>
                        <Save className="h-3.5 w-3.5" /> Save
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center gap-4">
                    {/* Image / Icon */}
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-5 w-5 text-primary" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-white truncate">{cat.name}</h4>
                        <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                          {cat.productCount} product{cat.productCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {cat.description && (
                        <p className="text-[12px] text-muted-foreground mt-0.5 truncate">{cat.description}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-0.5">Order: {cat.sortOrder} &middot; /{cat.slug}</p>
                    </div>

                    {/* Sort buttons */}
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateSortOrder(cat.id, Math.max(0, cat.sortOrder - 1))}
                        disabled={index === 0}
                        className="h-6 w-6 flex items-center justify-center rounded bg-muted hover:bg-muted/80 disabled:opacity-30"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSortOrder(cat.id, cat.sortOrder + 1)}
                        disabled={index === displayCategories.length - 1}
                        className="h-6 w-6 flex items-center justify-center rounded bg-muted hover:bg-muted/80 disabled:opacity-30"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(cat)}
                        className="h-9 w-9 flex items-center justify-center rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="h-3.5 w-3.5 text-primary" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat)}
                        disabled={cat.productCount > 0}
                        className="h-9 w-9 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title={cat.productCount > 0 ? "Has products — reassign first" : "Delete"}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
