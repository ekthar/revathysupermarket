"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { GripVertical, Save, Loader2 } from "lucide-react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast-provider";
import { readApiResponse } from "@/lib/client-api";

type Banner = {
  id: string;
  title: string;
  subtitle?: string | null;
  image: string;
  href?: string | null;
  isActive: boolean;
};

export function BannerReorderClient({ banners }: { banners: Banner[] }) {
  const { showToast } = useToast();
  const [items, setItems] = useState<Banner[]>(banners);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [parent] = useAutoAnimate({ duration: 250, easing: "ease-out" });

  // Drag state
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    dragIndexRef.current = index;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = dragIndexRef.current;
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragOverIndex(null);
      return;
    }

    setItems((current) => {
      const updated = [...current];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(dropIndex, 0, moved);
      return updated;
    });
    setHasChanges(true);
    setDragOverIndex(null);
    dragIndexRef.current = null;
  }, []);

  const handleDragEnd = useCallback(() => {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  }, []);

  async function saveOrder() {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/banners/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bannerIds: items.map((b) => b.id) })
      });
      const data = await readApiResponse<{ ok?: boolean; error?: string }>(response);
      if (!response.ok || !data.ok) {
        showToast(data.error ?? "Reorder could not be saved", "error");
        return;
      }
      setHasChanges(false);
      showToast("Banner order saved", "success");
    } catch {
      showToast("Reorder could not be saved", "error");
    } finally {
      setSaving(false);
    }
  }

  if (items.length < 2) {
    return null;
  }

  return (
    <div className="mt-5 rounded-xl border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
            <GripVertical className="h-5 w-5 text-primary" />
          </span>
          <div>
            <h3 className="font-display text-2xl font-black">Reorder Banners</h3>
            <p className="text-xs font-bold text-muted-foreground">Drag banners to change display order on the homepage.</p>
          </div>
        </div>
        {hasChanges && (
          <Button onClick={saveOrder} disabled={saving} size="sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Order
          </Button>
        )}
      </div>

      <div ref={parent} className="mt-4 grid gap-2">
        {items.map((banner, index) => (
          <div
            key={banner.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-3 rounded-xl border bg-background/70 p-3 transition-all cursor-grab active:cursor-grabbing ${
              dragOverIndex === index
                ? "border-primary ring-2 ring-primary/20"
                : "border-border"
            }`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground">
              <GripVertical className="h-5 w-5" />
            </span>
            <Image
              src={banner.image}
              alt={banner.title}
              width={64}
              height={40}
              className="h-10 w-16 shrink-0 rounded-lg object-cover border border-border"
              unoptimized
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{banner.title}</p>
              {banner.subtitle && (
                <p className="truncate text-xs text-muted-foreground">{banner.subtitle}</p>
              )}
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                banner.isActive
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {banner.isActive ? "Active" : "Off"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
