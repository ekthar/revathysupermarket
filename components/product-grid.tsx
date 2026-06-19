"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SlidersHorizontal, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-provider";
import { categories, products } from "@/lib/products";
import type { Product } from "@/lib/types";

type SortMode = "popularity" | "low" | "high" | "newest";

export function ProductGrid({ items = products, initialCategory = "All", initialQuery = "" }: { items?: Product[]; initialCategory?: string; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [maxPrice, setMaxPrice] = useState(350);
  const [sort, setSort] = useState<SortMode>("popularity");
  const [visibleCount, setVisibleCount] = useState(24);
  const { totalItems } = useCart();

  const filtered = useMemo(() => {
    return items
      .filter((product) => {
        const price = product.discountPrice ?? product.price;
        return (
          (category === "All" || product.category === category) &&
          price <= maxPrice &&
          product.name.toLowerCase().includes(query.toLowerCase())
        );
      })
      .sort((a, b) => {
        const aPrice = a.discountPrice ?? a.price;
        const bPrice = b.discountPrice ?? b.price;
        if (sort === "low") return aPrice - bPrice;
        if (sort === "high") return bPrice - aPrice;
        if (sort === "newest") return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
        return b.popularity - a.popularity;
      });
  }, [category, items, maxPrice, query, sort]);
  const visibleItems = filtered.slice(0, visibleCount);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="bg-white border-b border-slate-100 px-4 py-3 sm:static sm:border-0 sm:rounded-[1.75rem] sm:p-4 sm:card-shadow md:grid md:grid-cols-[1.2fr_1fr_1fr] md:gap-4">
        <label className="relative">
          <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-primary" />
          <Input
            value={query}
            onChange={(event) => {
              const value = event.target.value;
              setQuery(value);
              if (value.trim().length >= 3) {
                const saved = JSON.parse(window.localStorage.getItem("revathy-search-history") || "[]") as string[];
                window.localStorage.setItem("revathy-search-history", JSON.stringify([value.trim(), ...saved.filter((item) => item !== value.trim())].slice(0, 8)));
              }
            }}
            placeholder="Search groceries"
            className="h-12 rounded-2xl border-border bg-background/85 pl-11 shadow-sm"
          />
        </label>
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 md:hidden">
          <span className="flex h-9 shrink-0 items-center gap-2 rounded-full bg-primary/10 px-3 text-xs font-black text-primary">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
          </span>
          {["All", ...categories].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={category === item ? "h-9 shrink-0 rounded-full bg-primary px-4 text-xs font-black text-white" : "h-9 shrink-0 rounded-full border border-border bg-card/80 px-4 text-xs font-black text-foreground"}
            >
              {item}
            </button>
          ))}
        </div>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="mt-3 hidden h-12 rounded-2xl border border-input bg-background px-4 text-sm font-semibold md:mt-0 md:block"
        >
          <option>All</option>
          {categories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as SortMode)}
          className="mt-3 h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm font-semibold md:mt-0"
        >
          <option value="popularity">Popularity</option>
          <option value="low">Price Low To High</option>
          <option value="high">Price High To Low</option>
          <option value="newest">Newest</option>
        </select>
        <div className="mt-3 md:col-span-3">
          <div className="flex items-center justify-between text-xs font-black sm:text-sm">
            <span>Price up to Rs {maxPrice}</span>
            <span className="rounded-full bg-lime-fresh/25 px-3 py-1 text-primary">{filtered.length} items</span>
          </div>
          <input
            type="range"
            min="20"
            max="350"
            value={maxPrice}
            onChange={(event) => setMaxPrice(Number(event.target.value))}
            className="mt-3 w-full accent-primary"
          />
        </div>
      </div>

      {filtered.length > 0 ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {visibleItems.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {visibleItems.length < filtered.length ? (
            <div className="mt-8 flex justify-center">
              <Button type="button" variant="outline" onClick={() => setVisibleCount((count) => count + 24)}>
                Load more
              </Button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="font-display text-2xl font-bold">No matching products</p>
          <p className="mt-2 text-muted-foreground">Try a different search, category, or price range.</p>
          <Button className="mt-5" onClick={() => { setQuery(""); setCategory("All"); setMaxPrice(350); }}>
            Reset filters
          </Button>
        </div>
      )}
      {/* Cart bar is now handled by MobileBottomNav - removed duplicate here */}
    </section>
  );
}
