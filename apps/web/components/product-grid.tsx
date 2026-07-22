"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { SlidersHorizontal, Search } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ProductSkeletonGrid } from "@/components/ui/product-skeleton-grid";
import { StickySearchBar } from "@/components/products/sticky-search-bar";
import { EmptySearchState } from "@/components/ui/empty-states";
import { LazyRender } from "@/components/ui/lazy-render";
import { categories as demoCategories } from "@/lib/products";
import type { Product } from "@/lib/types";
import { prefetchProductImages, useVisibleRoutePrefetch } from "@/lib/hooks/use-preload";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

type SortMode = "popularity" | "low" | "high" | "newest";

type ProductsResponse = {
  items: Product[];
  nextCursor: string | null;
  total: number;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

async function fetchProducts(params: {
  category: string;
  q: string;
  sort: string;
  maxPrice: number;
  cursor?: string;
  limit?: number;
}): Promise<ProductsResponse> {
  const searchParams = new URLSearchParams();
  if (params.category && params.category !== "All") searchParams.set("category", params.category);
  if (params.q) searchParams.set("q", params.q);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.maxPrice < 350) searchParams.set("maxPrice", String(params.maxPrice));
  if (params.cursor) searchParams.set("cursor", params.cursor);
  searchParams.set("limit", String(params.limit || 24));

  const res = await fetch(`/api/products?${searchParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

// Virtualized product list with staggered entrance animation
const VirtualProductList = memo(function VirtualProductList({
  items,
  hasNextPage,
  isFetchingNextPage,
  loadMoreRef,
}: {
  items: Product[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  loadMoreRef: React.RefObject<HTMLDivElement | null>;
}) {
  // D5: Split items — first 8 above-the-fold, rest in LazyRender groups of 4
  const aboveFold = items.slice(0, 8);
  const belowFold = items.slice(8);

  // Prefetch product detail routes for visible items (instant navigation)
  useVisibleRoutePrefetch(aboveFold);

  // Chunk below-fold items into groups of 4 for LazyRender
  const chunks: Product[][] = [];
  for (let i = 0; i < belowFold.length; i += 4) {
    chunks.push(belowFold.slice(i, i + 4));
  }

  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.04 } }
        }}
        className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(min(150px,45vw),1fr))] gap-2 sm:mt-8 sm:gap-4 md:grid-cols-3 lg:grid-cols-4"
      >
        {/* First 8 cards with staggered entrance */}
        {aboveFold.map((product) => (
          <motion.div
            key={product.id}
            variants={{
              hidden: { opacity: 0, y: 8, scale: 0.97 },
              visible: { opacity: 1, y: 0, scale: 1 }
            }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <ProductCard product={product} />
          </motion.div>
        ))}

        {/* Cards 9+ wrapped in LazyRender groups of 4 */}
        {chunks.map((chunk, chunkIndex) => (
          <LazyRender
            key={`chunk-${chunkIndex}`}
            className="contents"
            height={320}
            rootMargin="200px"
          >
            {chunk.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </LazyRender>
        ))}
      </motion.div>

      {/* Infinite scroll trigger for fetching next page from server */}
      {hasNextPage ? (
        <div ref={loadMoreRef} className="mt-6">
          {isFetchingNextPage && <ProductSkeletonGrid count={4} />}
        </div>
      ) : null}
    </>
  );
});

export function ProductGrid({
  initialItems = [],
  initialTotal = 0,
  initialNextCursor = null,
  initialCategory = "All",
  initialQuery = "",
  initialSort = "popularity",
  categories = demoCategories,
}: {
  initialItems?: Product[];
  initialTotal?: number;
  initialNextCursor?: string | null;
  initialCategory?: string;
  initialQuery?: string;
  initialSort?: SortMode;
  categories?: readonly string[];
}) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [maxPrice, setMaxPrice] = useState(350);
  const [sort, setSort] = useState<SortMode>(initialSort);
  const [filterOpen, setFilterOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const searchAreaRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  // Determine if we should use initial SSR data (when filters match initial state)
  const isInitialState =
    category === initialCategory &&
    debouncedQuery === initialQuery &&
    sort === initialSort &&
    maxPrice === 350;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["products", category, debouncedQuery, sort, maxPrice],
    queryFn: ({ pageParam }) =>
      fetchProducts({
        category,
        q: debouncedQuery,
        sort,
        maxPrice,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    ...(isInitialState && initialItems.length > 0
      ? {
          initialData: {
            pages: [
              {
                items: initialItems,
                nextCursor: initialNextCursor,
                total: initialTotal,
              },
            ],
            pageParams: [undefined],
          },
        }
      : {}),
  });

  const allItems = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );
  const total = data?.pages[0]?.total ?? initialTotal;

  // Prefetch images for items that will be visible soon (next screen)
  useEffect(() => {
    if (allItems.length > 8) {
      // Prefetch images for items 9-16 (next visible batch)
      const nextBatch = allItems.slice(8, 16);
      prefetchProductImages(nextBatch);
    }
  }, [allItems.length]); // Only run when total count changes (new page loaded)

  // Infinite scroll observer
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (debouncedQuery.trim().length >= 3) {
      try {
        const saved = JSON.parse(window.localStorage.getItem("msm-search-history") || "[]") as string[];
        window.localStorage.setItem(
          "msm-search-history",
          JSON.stringify([debouncedQuery.trim(), ...saved.filter((item) => item !== debouncedQuery.trim())].slice(0, 8))
        );
      } catch (err) {
        console.error("Failed to save search history:", err);
      }
    }
  }, [debouncedQuery]);

  // Memoized handlers to prevent child re-renders
  const handleQueryChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);
  }, []);

  const categoryRailRef = useRef<HTMLDivElement>(null);
  const categoryBtnRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const handleCategoryChange = useCallback((item: string) => {
    haptic("light");
    startTransition(() => setCategory(item));
    // Scroll active chip into view
    requestAnimationFrame(() => {
      const btn = categoryBtnRefs.current.get(item);
      btn?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    });
  }, [startTransition]);

  const handleSortChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    startTransition(() => setSort(event.target.value as SortMode));
  }, [startTransition]);

  const handlePriceChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setMaxPrice(Number(event.target.value));
  }, []);

  const handleResetFilters = useCallback(() => {
    startTransition(() => {
      setQuery("");
      setCategory("All");
      setMaxPrice(350);
    });
  }, [startTransition]);

  const scrollToSearch = useCallback(() => {
    searchAreaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-4 pb-8 pt-4 sm:px-6 sm:py-10 lg:px-8">
      {/* Compact sticky search bar — appears when main search scrolls away */}
      <StickySearchBar
        query={debouncedQuery}
        category={category}
        total={total}
        observeRef={searchAreaRef}
        onTap={scrollToSearch}
        onOpenFilters={() => setFilterOpen(true)}
      />

      <div ref={searchAreaRef} className="rounded-xl bg-transparent md:grid md:grid-cols-[1.2fr_1fr_1fr] md:gap-4">
        <label className="relative">
          <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-neutral-400" />
          <Input
            value={query}
            onChange={handleQueryChange}
            placeholder="Search for items"
            className="h-12 rounded-2xl border-0 bg-card pl-11 text-title font-semibold shadow-elevation-2 placeholder:text-muted-foreground"
            aria-label="Search for items"
          />
        </label>
        <div className="sticky-category-rail md:hidden">
          <div ref={categoryRailRef} className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5 pr-4 snap-x snap-mandatory">
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              aria-label="Open sort and filter options"
              className="flex h-10 shrink-0 items-center gap-2 rounded-2xl bg-black dark:bg-white px-4 text-xs font-black text-white dark:text-black press snap-start"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
            </button>
            {["All", ...categories].map((item) => (
              <button
                key={item}
                type="button"
                ref={(el) => {
                  if (el) categoryBtnRefs.current.set(item, el);
                  else categoryBtnRefs.current.delete(item);
                }}
                onClick={() => handleCategoryChange(item)}
                aria-pressed={category === item}
                className={cn(
                  "h-9 shrink-0 rounded-full px-4 text-xs font-black whitespace-nowrap snap-start transition-colors",
                  category === item
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "border border-border bg-card text-muted-foreground shadow-sm"
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between md:hidden">
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">{total} products</span>
        </div>
        <select
          value={category}
          onChange={(event) => handleCategoryChange(event.target.value)}
          className="mt-3 hidden h-12 rounded-2xl border border-input bg-background px-4 text-sm font-semibold text-foreground md:mt-0 md:block"
          aria-label="Filter by category"
        >
          <option>All</option>
          {categories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={handleSortChange}
          className="mt-3 h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm font-semibold text-foreground md:mt-0"
          aria-label="Sort products"
        >
          <option value="popularity">Popularity</option>
          <option value="low">Price Low To High</option>
          <option value="high">Price High To Low</option>
          <option value="newest">Newest</option>
        </select>
        <div className="mt-3 hidden md:col-span-3 md:block">
          <div className="flex items-center justify-between text-xs font-black sm:text-sm">
            <span>Price up to Rs {maxPrice}</span>
            <span className="rounded-full bg-black dark:bg-white px-3 py-1 text-white dark:text-black">{total} items</span>
          </div>
          <input
            type="range"
            min="20"
            max="350"
            value={maxPrice}
            onChange={handlePriceChange}
            className="mt-3 w-full accent-primary"
          />
        </div>
      </div>

      {isError ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <p className="text-body text-neutral-500 dark:text-neutral-400">Failed to load products. Please try again.</p>
          <button
            onClick={() => refetch()}
            className="px-6 py-2.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-sm font-bold transition-opacity hover:opacity-80"
          >
            Retry
          </button>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {isLoading && allItems.length === 0 ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="mt-5"
            >
              <ProductSkeletonGrid count={8} />
            </motion.div>
          ) : allItems.length > 0 ? (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className={isPending ? "opacity-60 transition-opacity duration-200" : ""}
            >
              <VirtualProductList
                items={allItems}
                hasNextPage={!!hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                loadMoreRef={loadMoreRef}
              />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="mt-6"
            >
              <EmptySearchState />
              <div className="mt-4 flex justify-center">
                <Button onClick={handleResetFilters}>Reset filters</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Mobile filter bottom sheet */}
      <BottomSheet open={filterOpen} onClose={() => setFilterOpen(false)} title="Sort & Filter">
        <div className="space-y-5">
          {/* Sort */}
          <div>
            <p className="text-caption font-bold text-neutral-500 uppercase mb-2">Sort by</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "popularity" as const, label: "Popularity" },
                { value: "low" as const, label: "Price: Low \u2192 High" },
                { value: "high" as const, label: "Price: High \u2192 Low" },
                { value: "newest" as const, label: "Newest First" }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => { startTransition(() => setSort(option.value)); setFilterOpen(false); }}
                  className={`h-10 rounded-xl text-caption font-semibold transition-colors ${
                    sort === option.value
                      ? "bg-black text-white dark:bg-white dark:text-black"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price range */}
          <div>
            <p className="text-caption font-bold text-neutral-500 uppercase mb-2">Price range (up to \u20B9{maxPrice})</p>
            <input
              type="range"
              min="20"
              max="350"
              value={maxPrice}
              onChange={handlePriceChange}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-caption text-neutral-500 dark:text-neutral-400 mt-1">
              <span>{"\u20B9"}20</span>
              <span>{"\u20B9"}350</span>
            </div>
          </div>

          {/* Category */}
          <div>
            <p className="text-caption font-bold text-neutral-500 uppercase mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              {["All", ...categories].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => { handleCategoryChange(item); setFilterOpen(false); }}
                  className={`h-9 px-3 rounded-full text-caption font-semibold transition-colors ${
                    category === item
                      ? "bg-black text-white dark:bg-white dark:text-black"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <p className="text-center text-caption font-semibold text-black dark:text-white">{total} products found</p>
        </div>
      </BottomSheet>
    </section>
  );
}
