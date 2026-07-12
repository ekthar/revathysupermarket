"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, Loader2, Minus, Plus, Search, TrendingUp, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Drawer } from "vaul";
import { useCartActions, useCartItem } from "@/components/cart/cart-provider";
import { formatCurrency } from "@/lib/utils";
import { springs } from "@/lib/motion";
import { haptic } from "@/lib/haptics";
import type { Product } from "@/lib/types";
import { useFlyToCart } from "@/components/ui/fly-to-cart";

const HISTORY_KEY = "msm-search-history";
const TRENDING = ["Rice", "Milk", "Eggs", "Onion", "Tomato", "Bread"];

type SearchProduct = Pick<
  Product,
  "id" | "slug" | "name" | "image" | "price" | "discountPrice" | "unit" | "stock" | "category"
>;

function loadHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(window.localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter((x) => typeof x === "string").slice(0, 8) : [];
  } catch {
    return [];
  }
}

function saveHistory(query: string) {
  const q = query.trim();
  if (q.length < 2) return;
  try {
    const prev = loadHistory();
    window.localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify([q, ...prev.filter((item) => item.toLowerCase() !== q.toLowerCase())].slice(0, 8))
    );
  } catch {
    /* ignore */
  }
}

export function GlobalSearchTrigger({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); haptic("light"); }}
        className={className}
        aria-label="Search products"
      >
        <Search className="h-4 w-4" />
        <span className="text-sm font-medium text-muted-foreground truncate">Search groceries…</span>
      </button>
      <GlobalSearchSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function GlobalSearchSheet({
  open,
  onClose,
  initialQuery = "",
}: {
  open: boolean;
  onClose: () => void;
  initialQuery?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (open) {
      setHistory(loadHistory());
      setQuery(initialQuery);
      // Focus after drawer opens
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
    setResults([]);
    setLoading(false);
  }, [open, initialQuery]);

  useEffect(() => {
    const q = query.trim();
    if (!open) return;
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/products?q=${encodeURIComponent(q)}&limit=12&sort=popularity`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("search failed");
        const data = (await res.json()) as { items: SearchProduct[] };
        setResults(data.items ?? []);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  const runSearch = useCallback(
    (value: string) => {
      const q = value.trim();
      if (!q) return;
      saveHistory(q);
      setHistory(loadHistory());
      onClose();
      router.push(`/products?q=${encodeURIComponent(q)}`);
    },
    [onClose, router]
  );

  return (
    <Drawer.Root open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[93] bg-black/45 backdrop-blur-sm" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 top-[8%] z-[94] flex flex-col rounded-t-3xl bg-background outline-none shadow-2xl">
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-neutral-200 dark:bg-neutral-700" />
          </div>
          <Drawer.Title className="sr-only">Search products</Drawer.Title>

          <div className="flex items-center gap-2 px-4 pb-3 border-b border-border">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    runSearch(query);
                  }
                }}
                placeholder="Search for rice, milk, snacks…"
                className="w-full h-12 rounded-2xl bg-muted border border-border pl-10 pr-10 text-sm font-medium outline-none focus:border-primary/40 focus:bg-card transition-colors"
                autoComplete="off"
                enterKeyHint="search"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground press"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-3 rounded-xl text-sm font-bold text-muted-foreground press"
            >
              Cancel
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 pb-[calc(2rem+var(--safe-bottom))]">
            {query.trim().length < 2 ? (
              <div className="space-y-6">
                {history.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-2.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recent</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {history.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setQuery(item)}
                          className="h-9 px-3.5 rounded-full bg-muted text-xs font-semibold text-foreground press"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </section>
                )}
                <section>
                  <div className="flex items-center gap-2 mb-2.5">
                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Popular</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {TRENDING.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setQuery(item)}
                        className="h-9 px-3.5 rounded-full border border-border bg-card text-xs font-semibold text-foreground press"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </section>
                <Link
                  href="/products"
                  onClick={onClose}
                  className="flex h-11 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-white press"
                >
                  Browse all products
                </Link>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="text-sm font-medium">Searching…</p>
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-base font-bold text-foreground">No results for &ldquo;{query.trim()}&rdquo;</p>
                <p className="mt-1 text-sm text-muted-foreground">Try a different spelling or browse categories</p>
                <button
                  type="button"
                  onClick={() => runSearch(query)}
                  className="mt-5 h-10 px-5 rounded-full bg-primary text-sm font-bold text-white press"
                >
                  Search all products
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {results.length} result{results.length === 1 ? "" : "s"}
                  </p>
                  <button
                    type="button"
                    onClick={() => runSearch(query)}
                    className="text-xs font-bold text-primary press"
                  >
                    See all
                  </button>
                </div>
                <AnimatePresence mode="popLayout">
                  {results.map((product) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={springs.snappy}
                    >
                      <SearchResultRow
                        product={product}
                        onNavigate={() => {
                          saveHistory(query);
                          onClose();
                        }}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function SearchResultRow({
  product,
  onNavigate,
}: {
  product: SearchProduct;
  onNavigate: () => void;
}) {
  const cartItem = useCartItem(product.id);
  const { addItem, updateQuantity } = useCartActions();
  const { flyToCart } = useFlyToCart();
  const price = product.discountPrice ?? product.price;
  const outOfStock = product.stock <= 0;
  const btnRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="flex items-center gap-3 rounded-2xl p-2.5 hover:bg-muted/60 transition-colors">
      <Link
        href={`/products/${product.slug}`}
        onClick={onNavigate}
        className="flex items-center gap-3 min-w-0 flex-1"
      >
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
          {product.image ? (
            <Image src={product.image} alt="" fill className="object-cover" sizes="56px" />
          ) : null}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground line-clamp-1">{product.name}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {product.unit || product.category}
            {outOfStock ? " · Sold out" : ""}
          </p>
          <p className="text-sm font-black text-foreground mt-0.5 tabular-nums">{formatCurrency(price)}</p>
        </div>
      </Link>

      {outOfStock ? (
        <span className="text-[10px] font-bold uppercase text-muted-foreground shrink-0">Out</span>
      ) : cartItem ? (
        <div className="flex h-9 shrink-0 items-center overflow-hidden rounded-full bg-black text-white">
          <button
            type="button"
            className="h-full w-8 flex items-center justify-center press"
            onClick={() => { updateQuantity(product.id, cartItem.quantity - 1); haptic("light"); }}
            aria-label="Decrease quantity"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-5 text-center text-xs font-bold tabular-nums">{cartItem.quantity}</span>
          <button
            type="button"
            className="h-full w-8 flex items-center justify-center press"
            onClick={() => { updateQuantity(product.id, cartItem.quantity + 1); haptic("light"); }}
            aria-label="Increase quantity"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          ref={btnRef}
          type="button"
          className="h-9 px-3.5 rounded-full bg-black text-white text-xs font-bold shrink-0 press"
          onClick={(e) => {
            addItem(product as Product);
            haptic("medium");
            if (btnRef.current) flyToCart(product.image, btnRef.current);
            e.stopPropagation();
          }}
        >
          ADD
        </button>
      )}
    </div>
  );
}
