"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
  icon: string | null;
  sortOrder: number;
  productCount: number;
  hasSales: boolean;
};

/** Inline field error message — matches the field-error class in globals.css */
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p role="alert" aria-live="polite" className="mt-1 text-xs font-semibold text-red-500 animate-in fade-in slide-in-from-top-1">{message}</p>;
}

export function CategoryManagementClient({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [localCategories, setLocalCategories] = useState(categories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Create form
  const [createForm, setCreateForm] = useState({ name: "", description: "", image: "", icon: "", sortOrder: "0" });
  const [createErrors, setCreateErrors] = useState<{ name?: string }>({});
  // Edit form
  const [editForm, setEditForm] = useState({ name: "", description: "", image: "", icon: "", sortOrder: "0" });
  const [editErrors, setEditErrors] = useState<{ name?: string }>({});

  /** Validate a category name field on blur */
  function validateName(value: string): string | undefined {
    const trimmed = value.trim();
    if (!trimmed) return "Name is required";
    if (trimmed.length < 2) return "Name must be at least 2 characters";
    return undefined;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const nameErr = validateName(createForm.name);
    if (nameErr) { setCreateErrors({ name: nameErr }); return; }
    setCreateErrors({});

    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        image: createForm.image.trim() || undefined,
        icon: createForm.icon.trim() || undefined,
        sortOrder: Number(createForm.sortOrder) || 0
      })
    });
    const data = await readApiResponse<{ category?: Category; error?: string }>(res);
    if (!res.ok) { showToast(data.error ?? "Failed to create category", "error"); return; }
    showToast("Category created", "success");
    setCreateForm({ name: "", description: "", image: "", icon: "", sortOrder: "0" });
    setShowCreate(false);
    startTransition(() => router.refresh());
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setEditForm({
      name: cat.name,
      description: cat.description ?? "",
      image: cat.image ?? "",
      icon: cat.icon ?? "",
      sortOrder: String(cat.sortOrder)
    });
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    const nameErr = validateName(editForm.name);
    if (nameErr) { setEditErrors({ name: nameErr }); return; }
    setEditErrors({});

    const res = await fetch(`/api/admin/categories/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
        image: editForm.image.trim() || null,
        icon: editForm.icon.trim() || null,
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
        <form onSubmit={handleCreate} className="rounded-xl border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl font-black">Create Category</h3>
            <button type="button" onClick={() => setShowCreate(false)} aria-label="Close" className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Input
                value={createForm.name}
                onChange={(e) => { setCreateForm((f) => ({ ...f, name: e.target.value })); if (createErrors.name) setCreateErrors({}); }}
                onBlur={(e) => { const err = validateName(e.target.value); setCreateErrors(err ? { name: err } : {}); }}
                placeholder="Category name *"
                aria-invalid={!!createErrors.name}
                className={`h-12 rounded-2xl ${createErrors.name ? "border-red-400 focus-visible:ring-red-400" : ""}`}
              />
              <FieldError message={createErrors.name} />
            </div>
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
              value={createForm.icon}
              onChange={(e) => setCreateForm((f) => ({ ...f, icon: e.target.value }))}
              placeholder="Emoji icon (optional, e.g. 🍎)"
              maxLength={16}
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
            <Image src={createForm.image} alt="Preview" width={64} height={64} className="mt-3 h-16 w-16 rounded-xl object-cover border border-border" unoptimized />
          )}
          <Button type="submit" className="mt-4" disabled={isPending}>
            <Save className="h-4 w-4" /> Create
          </Button>
        </form>
      )}

      {/* Category list */}
      <div className="rounded-xl border border-white/70 bg-card/95 shadow-soft dark:border-white/10 overflow-hidden">
        {displayCategories.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No categories yet. Create your first category above.</p>
        ) : (
          <div className="divide-y divide-border">
            {displayCategories.map((cat, index) => (
              <div key={cat.id} className="p-4 sm:p-5">
                {editingId === cat.id ? (
                  <form onSubmit={handleEdit} className="space-y-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <Input
                          value={editForm.name}
                          onChange={(e) => { setEditForm((f) => ({ ...f, name: e.target.value })); if (editErrors.name) setEditErrors({}); }}
                          onBlur={(e) => { const err = validateName(e.target.value); setEditErrors(err ? { name: err } : {}); }}
                          placeholder="Category name"
                          aria-invalid={!!editErrors.name}
                          className={`h-11 rounded-2xl ${editErrors.name ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                        />
                        <FieldError message={editErrors.name} />
                      </div>
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
                        value={editForm.icon}
                        onChange={(e) => setEditForm((f) => ({ ...f, icon: e.target.value }))}
                        placeholder="Emoji icon"
                        maxLength={16}
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
                      <Image src={editForm.image} alt="Preview" width={56} height={56} className="h-14 w-14 rounded-xl object-cover border border-border" unoptimized />
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
                    <div className="relative h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                      {cat.image ? (
                        <Image src={cat.image} alt={cat.name} fill className="object-cover" unoptimized />
                      ) : cat.icon ? (
                        <span className="text-2xl leading-none">{cat.icon}</span>
                      ) : (
                        <Package className="h-5 w-5 text-primary" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-foreground truncate">{cat.name}</h4>
                        <span className="text-micro font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                          {cat.productCount} product{cat.productCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {cat.description && (
                        <p className="text-caption text-muted-foreground mt-0.5 truncate">{cat.description}</p>
                      )}
                      <p className="text-micro text-muted-foreground mt-0.5">Order: {cat.sortOrder} &middot; /{cat.slug}</p>
                    </div>

                    {/* Sort buttons */}
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateSortOrder(cat.id, Math.max(0, cat.sortOrder - 1))}
                        disabled={index === 0}
                        aria-label="Move category up"
                        className="h-6 w-6 flex items-center justify-center rounded bg-muted hover:bg-muted/80 disabled:opacity-30"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSortOrder(cat.id, cat.sortOrder + 1)}
                        disabled={index === displayCategories.length - 1}
                        aria-label="Move category down"
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
                        aria-label={`Edit ${cat.name}`}
                      >
                        <Edit3 className="h-3.5 w-3.5 text-primary" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat)}
                        disabled={cat.hasSales}
                        className="h-9 w-9 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title={cat.hasSales ? "Category has sales history and cannot be deleted" : "Delete"}
                        aria-label={cat.hasSales ? `${cat.name} cannot be deleted` : `Delete ${cat.name}`}
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
