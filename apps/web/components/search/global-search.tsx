"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, Loader2, Minus, Plus, Search, Sparkles, TrendingUp, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Drawer } from "vaul";
import { useCartActions, useCartItem } from "@/components/cart/cart-provider";
import { formatCurrency } from "@/lib/utils";
import { springs } from "@/lib/motion";
import { haptic } from "@/lib/haptics";
import type { Product } from "@/lib/types";
import { useFlyToCart } from "@/components/ui/fly-to-cart";
import { VoiceSearchButton } from "@/components/search/voice-search-button";
import { ZeroResultSuggestions } from "@/components/search/zero-result-suggestions";

const HISTORY_KEY = "msm-search-history";

/** Marks a keyboard-navigable row so arrow keys can walk the result list. */
const OPTION_ATTR = "data-search-option";

type SearchProduct = Pick<
  Product,
  "id" | "slug" | "name" | "image" | "price" | "discountPrice" | "unit" | "stock" | "category"
>;

type CategorySuggestion = { name: string; slug: string };

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
  const resultsRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [trending, setTrending] = useState<string[]>([]);
  const [categories, setCategories] = useState<CategorySuggestion[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const trimmed = query.trim();
  const isSearching = trimmed.length >= 2;

  useEffect(() => {
    if (open) {
      setHistory(loadHistory());
      setQuery(initialQuery);
      // Focus after drawer animation settles (~320ms spring)
      const t = setTimeout(() => inputRef.current?.focus(), 350);
      return () => clearTimeout(t);
    }
    setResults([]);
    setSuggestions([]);
    setLoading(false);
  }, [open, initialQuery]);

  // Bootstrap popular terms + categories once per session. Fetched on first open
  // rather than on mount so a closed sheet costs nothing.
  useEffect(() => {
    if (!open || trending.length > 0) return;
    let cancelled = false;
    fetch("/api/search/trending")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { terms?: string[]; categories?: CategorySuggestion[] } | null) => {
        if (cancelled || !data) return;
        if (Array.isArray(data.terms)) setTrending(data.terms);
        if (Array.isArray(data.categories)) setCategories(data.categories);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, trending.length]);

  useEffect(() => {
    if (!open) return;
    if (!isSearching) {
      setResults([]);
      setSuggestions([]);
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
          `/api/products?q=${encodeURIComponent(trimmed)}&limit=12&sort=popularity`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("search failed");
        const data = (await res.json()) as { items: SearchProduct[]; suggestions?: string[] };
        setResults(data.items ?? []);
        // The products API returns fuzzy near-misses when the exact match count is
        // low — surface them as "Did you mean" rather than discarding them.
        setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setResults([]);
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open, isSearching, trimmed]);

  // Categories whose name matches the query — lets a search for "fruit" jump
  // straight to the category rather than only listing individual products.
  const categoryMatches = useMemo(() => {
    if (!isSearching) return [];
    const needle = trimmed.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(needle)).slice(0, 3);
  }, [categories, isSearching, trimmed]);

  const runSearch = useCallback(
    (value: string) => {
      const q = value.trim();
      if (!q) return;
      saveHistory(q);
      setHistory(loadHistory());
      // Dismiss keyboard before navigating
      inputRef.current?.blur();
      onClose();
      router.push(`/products?q=${encodeURIComponent(q)}`);
    },
    [onClose, router]
  );

  // Dismiss keyboard before closing sheet to prevent visual glitch
  // (keyboard collapsing mid-animation looks janky)
  const handleClose = useCallback(() => {
    inputRef.current?.blur();
    // Small delay so keyboard starts dismissing before sheet animates down
    setTimeout(() => onClose(), 60);
  }, [onClose]);

  /**
   * Roving arrow-key navigation over the rendered rows.
   *
   * Rows stay real links and buttons (so Tab and screen readers work natively);
   * arrow keys are a progressive enhancement that moves DOM focus rather than
   * imposing listbox semantics on containers that hold interactive children.
   */
  const focusOption = useCallback((direction: 1 | -1, from?: HTMLElement) => {
    const container = resultsRef.current;
    if (!container) return false;
    const options = Array.from(
      container.querySelectorAll<HTMLElement>(`[${OPTION_ATTR}]`)
    );
    if (options.length === 0) return false;

    const currentIndex = from ? options.indexOf(from) : -1;
    const nextIndex = currentIndex + direction;

    if (nextIndex < 0) {
      inputRef.current?.focus();
      return true;
    }
    const next = options[Math.min(nextIndex, options.length - 1)];
    next?.focus();
    next?.scrollIntoView({ block: "nearest" });
    return true;
  }, []);

  const handleResultsKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      const target = (event.target as HTMLElement).closest<HTMLElement>(`[${OPTION_ATTR}]`);
      if (!target) return;
      event.preventDefault();
      focusOption(event.key === "ArrowDown" ? 1 : -1, target);
    },
    [focusOption]
  );

  const handleInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        runSearch(query);
        return;
      }
      if (event.key === "ArrowDown") {
        // Step into the results list.
        if (focusOption(1)) event.preventDefault();
      }
    },
    [focusOption, query, runSearch]
  );

  const resultCount = categoryMatches.length + results.length;

  return (
    <Drawer.Root open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-dialog bg-black/45 backdrop-blur-sm" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 top-[8%] z-[91] flex flex-col rounded-t-3xl bg-background outline-none shadow-2xl">
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
                onKeyDown={handleInputKeyDown}
                placeholder="Search for rice, milk, snacks…"
                className="w-full h-12 rounded-2xl bg-muted border border-border pl-10 pr-10 text-sm font-medium outline-none focus:border-primary/40 focus:bg-card transition-colors"
                autoComplete="off"
                enterKeyHint="search"
                aria-label="Search products"
                // Intentionally not a combobox: the result rows contain their own
                // buttons (add to cart / steppers), which cannot legally nest
                // inside role="option". Results are exposed as a labelled region
                // plus a live status message, and arrow keys move real DOM focus.
                aria-controls="search-results-region"
                aria-describedby="search-results-status"
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
              ) : (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <VoiceSearchButton
                    onTranscript={(text) => setQuery(text)}
                    onFinalResult={(text) => { setQuery(text); if (text.trim()) runSearch(text.trim()); }}
                  />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="h-11 px-3 rounded-xl text-sm font-bold text-muted-foreground press"
            >
              Cancel
            </button>
          </div>

          {/* Screen-reader status for async result counts. */}
          <p id="search-results-status" className="sr-only" role="status" aria-live="polite">
            {!isSearching
              ? ""
              : loading
                ? "Searching"
                : resultCount === 0
                  ? `No results for ${trimmed}`
                  : `${resultCount} result${resultCount === 1 ? "" : "s"} for ${trimmed}`}
          </p>

          <div
            id="search-results-region"
            ref={resultsRef}
            onKeyDown={handleResultsKeyDown}
            className="flex-1 overflow-y-auto px-4 py-4 pb-[calc(2rem+var(--safe-bottom))]"
          >
            {!isSearching ? (
              <div className="space-y-6">
                {history.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-2.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <h3 className="text-caption font-bold uppercase tracking-wider text-muted-foreground">Recent</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {history.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setQuery(item)}
                          className="h-10 px-4 rounded-full bg-muted text-caption font-semibold text-foreground press"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {trending.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-2.5">
                      <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                      <h3 className="text-caption font-bold uppercase tracking-wider text-muted-foreground">Popular right now</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {trending.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setQuery(item)}
                          className="h-10 px-4 rounded-full border border-border bg-card text-caption font-semibold text-foreground press"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {categories.length > 0 && (
                  <section>
                    <h3 className="text-caption font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                      Browse categories
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {categories.slice(0, 8).map((category) => (
                        <Link
                          key={category.slug}
                          href={`/category/${category.slug}`}
                          onClick={handleClose}
                          className="flex h-10 items-center rounded-full bg-muted px-4 text-caption font-semibold text-foreground press"
                        >
                          {category.name}
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                <Link
                  href="/products"
                  onClick={handleClose}
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
            ) : resultCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-base font-bold text-foreground">No results for &ldquo;{trimmed}&rdquo;</p>
                <p className="mt-1 text-sm text-muted-foreground">Try a different spelling or browse categories</p>

                {/* "Did you mean" — fuzzy near-misses from the products API. */}
                {suggestions.length > 0 && (
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setQuery(suggestion)}
                        className="flex h-10 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-caption font-semibold text-foreground press"
                      >
                        <Sparkles className="h-3 w-3 text-amber-500" />
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => runSearch(query)}
                  className="mt-5 h-11 px-5 rounded-full bg-primary text-sm font-bold text-white press"
                >
                  Search all products
                </button>

                {/* Zero-result suggestions: category entry points & popular products */}
                <ZeroResultSuggestions
                  categories={categories.map((c) => ({ name: c.name, slug: c.slug, icon: null }))}
                  popularProducts={[]}
                  onClose={handleClose}
                />
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-caption font-bold text-muted-foreground uppercase tracking-wider">
                    {resultCount} result{resultCount === 1 ? "" : "s"}
                  </p>
                  <button
                    type="button"
                    onClick={() => runSearch(query)}
                    className="text-caption font-bold text-primary press"
                  >
                    See all
                  </button>
                </div>

                {/* Matching categories rank above individual products: picking a
                    category is usually a better answer than one product. */}
                {categoryMatches.map((category) => (
                  <Link
                    key={`cat-${category.slug}`}
                    href={`/category/${category.slug}`}
                    onClick={handleClose}
                    {...{ [OPTION_ATTR]: "" }}
                    className="flex items-center gap-3 rounded-2xl p-2.5 hover:bg-muted/60 focus-visible:bg-muted transition-colors"
                  >
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-secondary-50 dark:bg-secondary-900/30">
                      <Search className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-foreground">{category.name}</span>
                      <span className="block text-micro text-muted-foreground">Browse category</span>
                    </span>
                  </Link>
                ))}

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
                          handleClose();
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
        {...{ [OPTION_ATTR]: "" }}
        className="flex items-center gap-3 min-w-0 flex-1 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
          {product.image ? (
            <Image src={product.image} alt={product.name} fill className="object-cover" sizes="56px" />
          ) : null}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground line-clamp-1">{product.name}</p>
          <p className="text-micro text-muted-foreground mt-0.5">
            {product.unit || product.category}
            {outOfStock ? " · Sold out" : ""}
          </p>
          <p className="text-sm font-black text-foreground mt-0.5 tabular-nums">{formatCurrency(price)}</p>
        </div>
      </Link>

      {outOfStock ? (
        <span className="text-micro font-bold uppercase text-muted-foreground shrink-0">Out</span>
      ) : cartItem ? (
        // 44px tall with 44px hit areas, matching --touch-target.
        <div className="flex h-11 shrink-0 items-center overflow-hidden rounded-full bg-black text-white">
          <button
            type="button"
            className="h-full w-11 flex items-center justify-center press"
            onClick={() => { updateQuantity(product.id, cartItem.quantity - 1); haptic("light"); }}
            aria-label={`Decrease ${product.name} quantity`}
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-5 text-center text-caption font-bold tabular-nums">{cartItem.quantity}</span>
          <button
            type="button"
            className="h-full w-11 flex items-center justify-center press"
            onClick={() => { updateQuantity(product.id, cartItem.quantity + 1); haptic("light"); }}
            aria-label={`Increase ${product.name} quantity`}
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          ref={btnRef}
          type="button"
          className="h-11 px-4 rounded-full bg-black text-white text-caption font-bold shrink-0 press"
          onClick={(e) => {
            addItem(product as Product);
            haptic("medium");
            if (btnRef.current) flyToCart(product.image, btnRef.current);
            e.stopPropagation();
          }}
          aria-label={`Add ${product.name} to cart`}
        >
          ADD
        </button>
      )}
    </div>
  );
}
