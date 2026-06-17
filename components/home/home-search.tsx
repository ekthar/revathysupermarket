"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Product } from "@/lib/types";

export function HomeSearch({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  useEffect(() => {
    setHistory(JSON.parse(window.localStorage.getItem("revathy-search-history") || "[]"));
  }, []);
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return products.filter((product) => product.name.toLowerCase().includes(needle)).slice(0, 5);
  }, [products, query]);

  return (
    <div className="relative z-20 mx-auto max-w-4xl px-4 sm:px-6">
      <div className="rounded-[1.5rem] border border-border/70 bg-card/95 p-2 shadow-soft">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-primary" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search rice, milk, snacks..."
            className="h-12 rounded-2xl border-0 bg-background/90 pl-12 text-base font-bold shadow-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </label>
        {results.length > 0 ? (
          <div className="mt-2 grid gap-1 rounded-2xl bg-background/95 p-2">
            {results.map((product) => (
              <Link key={product.id} href={`/products/${product.slug}`} className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-bold hover:bg-muted">
                <span>{product.name}</span>
                <span className="text-xs text-primary">{product.unit}</span>
              </Link>
            ))}
          </div>
        ) : query.trim() === "" && history.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2 rounded-2xl bg-background/95 p-2">
            {history.slice(0, 5).map((item) => (
              <button key={item} type="button" onClick={() => setQuery(item)} className="rounded-full bg-muted px-3 py-1 text-xs font-black text-primary">
                {item}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
