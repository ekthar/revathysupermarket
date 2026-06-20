"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/types";

const KEY = "store-recently-viewed";

export function ProductRecentlyViewed({ product }: { product: Product }) {
  const [recent, setRecent] = useState<Product[]>([]);

  useEffect(() => {
    const saved = JSON.parse(window.localStorage.getItem(KEY) || "[]") as Product[];
    const next = [product, ...saved.filter((item) => item.id !== product.id)].slice(0, 8);
    window.localStorage.setItem(KEY, JSON.stringify(next));
    setRecent(next.filter((item) => item.id !== product.id));
  }, [product]);

  const visible = useMemo(() => recent.slice(0, 4), [recent]);
  if (visible.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="font-display text-3xl font-black">Recently viewed</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {visible.map((item) => (
          <Link key={item.id} href={`/products/${item.slug}`} className="rounded-2xl border border-border bg-card/95 p-3 text-sm font-black hover:text-primary">
            {item.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
