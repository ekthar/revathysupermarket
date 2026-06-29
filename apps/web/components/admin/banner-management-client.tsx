"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  Link as LinkIcon,
  ImagePlus,
  Sparkles,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/toast-provider";
import { cn } from "@/lib/utils";

type AdminBanner = {
  id: string;
  title: string;
  subtitle?: string | null;
  image: string;
  href?: string | null;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
};

interface BannerManagementClientProps {
  banners: AdminBanner[];
}

export function BannerManagementClient({ banners: initial }: BannerManagementClientProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [banners, setBanners] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BannerForm>(emptyForm());

  function emptyForm(): BannerForm {
    return { title: "", subtitle: "", image: "", href: "", isActive: true, startsAt: "", endsAt: "" };
  }

  function startEdit(banner: AdminBanner) {
    setForm({
      title: banner.title,
      subtitle: banner.subtitle || "",
      image: banner.image,
      href: banner.href || "",
      isActive: banner.isActive,
      startsAt: banner.startsAt ? banner.startsAt.slice(0, 16) : "",
      endsAt: banner.endsAt ? banner.endsAt.slice(0, 16) : "",
    });
    setEditingId(banner.id);
    setShowForm(true);
  }

  function cancelForm() {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.image.trim()) {
      showToast("Title and image are required", "error");
      return;
    }

    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || undefined,
      image: form.image.trim(),
      href: form.href.trim() || undefined,
      isActive: form.isActive,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
    };

    const url = editingId ? `/api/admin/banners/${editingId}` : "/api/admin/banners";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showToast(data.error || "Failed to save banner", "error");
      return;
    }

    showToast(editingId ? "Banner updated" : "Banner created", "success");
    cancelForm();
    startTransition(() => router.refresh());
  }

  async function toggleActive(banner: AdminBanner) {
    const res = await fetch(`/api/admin/banners/${banner.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...banner, isActive: !banner.isActive }),
    });
    if (res.ok) {
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, isActive: !b.isActive } : b))
      );
      showToast(banner.isActive ? "Banner hidden" : "Banner visible", "success");
    }
  }

  async function deleteBanner(id: string) {
    if (!confirm("Delete this banner permanently?")) return;
    const res = await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    if (res.ok) {
      setBanners((prev) => prev.filter((b) => b.id !== id));
      showToast("Banner deleted", "success");
    }
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Create button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {banners.length} banner{banners.length !== 1 ? "s" : ""} total &middot;{" "}
          {banners.filter((b) => b.isActive).length} active
        </p>
        <Button onClick={() => { cancelForm(); setShowForm(true); }} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> New Banner
        </Button>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm"
        >
          <h3 className="text-title font-bold">{editingId ? "Edit Banner" : "Create Banner"}</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-caption font-bold text-muted-foreground">Title *</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="FLAT ₹50 OFF on Vegetables"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-caption font-bold text-muted-foreground">Subtitle</label>
              <Input
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                placeholder="On orders above ₹299"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-caption font-bold text-muted-foreground flex items-center gap-1">
                <ImagePlus className="h-3.5 w-3.5" /> Image URL *
              </label>
              <Input
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="https://images.unsplash.com/..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-caption font-bold text-muted-foreground flex items-center gap-1">
                <LinkIcon className="h-3.5 w-3.5" /> Link (href)
              </label>
              <Input
                value={form.href}
                onChange={(e) => setForm({ ...form, href: e.target.value })}
                placeholder="/products?category=Vegetables"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-caption font-bold text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Starts At
              </label>
              <Input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-caption font-bold text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Ends At (countdown)
              </label>
              <Input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
              />
            </div>
          </div>

          {/* Live preview */}
          {form.image && (
            <div className="mt-2">
              <p className="text-micro font-bold text-muted-foreground mb-2 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Live Preview
              </p>
              <div className="relative rounded-xl overflow-hidden aspect-[3/1] bg-gradient-to-br from-orange-600 via-amber-500 to-yellow-400">
                <Image
                  src={form.image}
                  alt="Preview"
                  fill
                  sizes="600px"
                  className="object-cover mix-blend-overlay opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
                <div className="relative z-10 flex h-full items-center px-5 py-4">
                  <div>
                    <h4 className="font-display text-lg font-black text-white">{form.title || "Banner Title"}</h4>
                    {form.subtitle && (
                      <p className="text-sm text-white/80 mt-1">{form.subtitle}</p>
                    )}
                    {form.endsAt && (
                      <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-red-500/80 text-white text-micro font-bold">
                        <Clock className="h-3 w-3" /> Countdown active
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-border"
            />
            <span className="text-body font-medium">Visible to customers</span>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isPending} className="gap-2">
              {editingId ? "Save Changes" : "Create Banner"}
            </Button>
            <Button type="button" variant="outline" onClick={cancelForm}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Banner list */}
      <div className="space-y-3">
        {banners.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No banners yet</p>
            <p className="text-caption mt-1">Create your first promotional banner above.</p>
          </div>
        )}

        {banners.map((banner) => (
          <div
            key={banner.id}
            className={cn(
              "flex items-center gap-4 rounded-xl border border-border bg-card p-3 transition",
              !banner.isActive && "opacity-50"
            )}
          >
            {/* Thumbnail */}
            <div className="relative h-16 w-24 shrink-0 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800">
              {banner.image && (
                <Image src={banner.image} alt="" fill sizes="96px" className="object-cover" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-body font-bold text-foreground truncate">{banner.title}</h4>
              {banner.subtitle && (
                <p className="text-caption text-muted-foreground truncate">{banner.subtitle}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                {banner.isActive ? (
                  <span className="flex items-center gap-1 text-micro font-bold text-state-success">
                    <Eye className="h-3 w-3" /> Live
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-micro font-bold text-muted-foreground">
                    <EyeOff className="h-3 w-3" /> Hidden
                  </span>
                )}
                {banner.endsAt && (
                  <span className="flex items-center gap-1 text-micro text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Ends {new Date(banner.endsAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => toggleActive(banner)}
                className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted transition"
                aria-label={banner.isActive ? "Hide banner" : "Show banner"}
              >
                {banner.isActive ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              <button
                onClick={() => startEdit(banner)}
                className="h-8 px-2.5 rounded-lg text-caption font-bold text-primary hover:bg-muted transition"
              >
                Edit
              </button>
              <button
                onClick={() => deleteBanner(banner.id)}
                className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950 transition"
                aria-label="Delete banner"
              >
                <Trash2 className="h-4 w-4 text-state-danger" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type BannerForm = {
  title: string;
  subtitle: string;
  image: string;
  href: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
};
