"use client";

import { memo, useCallback, useEffect, useRef, useState, useTransition } from "react";
import { SlidersHorizontal, Search } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
// Cart import removed - was unused and causing unnecessary re-renders on cart changes
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ProductSkeletonGrid } from "@/components/ui/product-skeleton-grid";
import { categories } from "@/lib/products";
import type { Product } from "@/lib/types";
import { prefetchProductImages } from "@/lib/hooks/use-preload";
import { useVirtualGrid } from "@/lib/hooks/use-virtual-grid";

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

// Lazy-rendered product card - only renders when near viewport
const LazyProductCard = memo(function LazyProductCard({ product }: { product: Product }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" } // Start rendering 200px before it enters viewport
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!isVisible) {
    // Placeholder with same dimensions to avoid layout shift
    return <div ref={ref} className="aspect-[3/4] rounded-lg bg-neutral-50 dark:bg-neutral-900 animate-pulse" />;
  }

  return (
    <div ref={ref}>
      <ProductCard product={product} />
    </div>
  );
});

// Virtualized product list - only renders visible items + 2 screens buffer
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
  const { renderCount, hasMoreToRender, sentinelRef } = useVirtualGrid({
    totalItems: items.length,
    initialRenderCount: 8, // Above-the-fold
    bufferItems: 8, // Render 8 more at a time (2 rows × 4 cols or 4 rows × 2 cols)
    estimatedRowHeight: 320,
  });

  return (
    <>
      <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(min(150px,45vw),1fr))] gap-2 sm:mt-8 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.slice(0, renderCount).map((product, index) => (
          // First 8 render immediately, rest use lazy rendering as they enter buffer
          index < 8 ? (
            <ProductCard key={product.id} product={product} />
          ) : (
            <LazyProductCard key={product.id} product={product} />
          )
        ))}
      </div>

      {/* Sentinel for progressive rendering - triggers more items to render */}
      {hasMoreToRender && (
        <div ref={sentinelRef} className="h-1" aria-hidden="true" />
      )}

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
}: {
  initialItems?: Product[];
  initialTotal?: number;
  initialNextCursor?: string | null;
  initialCategory?: string;
  initialQuery?: string;
  initialSort?: SortMode;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [maxPrice, setMaxPrice] = useState(350);
  const [sort, setSort] = useState<SortMode>(initialSort);
  const [filterOpen, setFilterOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const loadMoreRef = useRef<HTMLDivElement>(null);

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

  const allItems = data?.pages.flatMap((page) => page.items) ?? [];
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

  // Memoized handlers to prevent child re-renders
  const handleQueryChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);
    if (value.trim().length >= 3) {
      const saved = JSON.parse(window.localStorage.getItem("msm-search-history") || "[]") as string[];
      window.localStorage.setItem("msm-search-history", JSON.stringify([value.trim(), ...saved.filter((item) => item !== value.trim())].slice(0, 8)));
    }
  }, []);

  const handleCategoryChange = useCallback((item: string) => {
    startTransition(() => setCategory(item));
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

  return (
    <section className="mx-auto max-w-7xl px-4 pb-8 pt-4 sm:px-6 sm:py-10 lg:px-8">
      <div className="rounded-xl bg-transparent md:grid md:grid-cols-[1.2fr_1fr_1fr] md:gap-4">
        <label className="relative">
          <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-neutral-400" />
          <Input
            value={query}
            onChange={handleQueryChange}
            placeholder="Search for items"
            className="h-12 rounded-2xl border-0 bg-white pl-11 text-title font-semibold shadow-elevation-2 placeholder:text-neutral-400"
          />
        </label>
        <div className="mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:hidden">
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="flex h-10 shrink-0 items-center gap-2 rounded-2xl bg-black px-4 text-xs font-black text-white press"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
          </button>
          {["All", ...categories].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => handleCategoryChange(item)}
              className={category === item ? "h-9 shrink-0 rounded-full bg-black px-4 text-xs font-black text-white whitespace-nowrap" : "h-9 shrink-0 rounded-full border border-black/5 bg-white px-4 text-xs font-black text-neutral-700 shadow-sm whitespace-nowrap"}
            >
              {item}
            </button>
          ))}
        </div>
        <select
          value={category}
          onChange={(event) => handleCategoryChange(event.target.value)}
          className="mt-3 hidden h-12 rounded-2xl border border-input bg-background px-4 text-sm font-semibold md:mt-0 md:block"
        >
          <option>All</option>
          {categories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={handleSortChange}
          className="mt-3 h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm font-semibold md:mt-0"
        >
          <option value="popularity">Popularity</option>
          <option value="low">Price Low To High</option>
          <option value="high">Price High To Low</option>
          <option value="newest">Newest</option>
        </select>
        <div className="mt-3 hidden md:col-span-3 md:block">
          <div className="flex items-center justify-between text-xs font-black sm:text-sm">
            <span>Price up to Rs {maxPrice}</span>
            <span className="rounded-full bg-black px-3 py-1 text-white">{total} items</span>
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

      {isLoading && allItems.length === 0 ? (
        <div className="mt-5">
          <ProductSkeletonGrid count={8} />
        </div>
      ) : allItems.length > 0 ? (
        <div className={isPending ? "opacity-60 transition-opacity duration-200" : "transition-opacity duration-200"}>
          <VirtualProductList
            items={allItems}
            hasNextPage={!!hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            loadMoreRef={loadMoreRef}
          />
        </div>
      ) : (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="font-display text-2xl font-bold">No matching products</p>
          <p className="mt-2 text-muted-foreground">Try a different search, category, or price range.</p>
          <Button className="mt-5" onClick={handleResetFilters}>
            Reset filters
          </Button>
        </div>
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
                      ? "bg-black text-white"
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
            <div className="flex justify-between text-caption text-neutral-400 mt-1">
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
                      ? "bg-black text-white"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <p className="text-center text-caption font-semibold text-black">{total} products found</p>
        </div>
      </BottomSheet>
    </section>
  );
}
