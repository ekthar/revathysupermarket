"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import { useCart, useCartActions } from "@/components/cart/cart-provider";
import { formatCurrency } from "@/lib/utils";
import { haptic } from "@/lib/haptics";
import type { Product } from "@/lib/types";

type Suggestion = {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  discountPrice?: number;
  unit?: string | null;
  stock: number;
};

export function CartSuggestions() {
  const { items } = useCart();
  const { addItem } = useCartActions();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const ids = items.map((i) => i.id).join(",");

  useEffect(() => {
    if (!ids) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/cart/suggestions?ids=${encodeURIComponent(ids)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.suggestions) setSuggestions(data.suggestions);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [ids]);

  if (suggestions.length === 0) return null;

  return (
    <section className="mt-3">
      <h2 className="text-body font-bold text-neutral-900 dark:text-white mb-2 px-0.5">
        Often bought together
      </h2>
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1 -mx-0.5 px-0.5">
        {suggestions.map((s) => {
          const price = s.discountPrice ?? s.price;
          const inCart = items.some((i) => i.id === s.id);
          if (inCart || s.stock <= 0) return null;
          return (
            <div
              key={s.id}
              className="snap-start shrink-0 w-[148px] rounded-2xl bg-white dark:bg-neutral-900 p-2.5 shadow-elevation-2 border border-border/60"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden bg-muted mb-2">
                {s.image ? (
                  <Image src={s.image} alt="" fill className="object-cover" sizes="148px" />
                ) : null}
              </div>
              <p className="text-xs font-bold text-foreground line-clamp-2 min-h-[2rem]">{s.name}</p>
              <div className="mt-1.5 flex items-center justify-between gap-1">
                <span className="text-xs font-black tabular-nums">{formatCurrency(price)}</span>
                <button
                  type="button"
                  onClick={() => {
                    addItem({
                      id: s.id,
                      slug: s.slug,
                      name: s.name,
                      image: s.image,
                      price: s.price,
                      discountPrice: s.discountPrice,
                      unit: s.unit ?? undefined,
                      stock: s.stock,
                      category: "Grocery",
                      description: "",
                      popularity: 0,
                    } as Product);
                    haptic("medium");
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-white press"
                  aria-label={`Add ${s.name}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
