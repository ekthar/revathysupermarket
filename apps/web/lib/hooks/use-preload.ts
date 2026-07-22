"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Smart preloading system for Swiggy-level perceived speed.
 * 
 * Strategies:
 * 1. Route preloading on hover/touch intent (product detail pages)
 * 2. Image prefetching for near-visible items via link[rel=prefetch]
 * 3. In-memory product list caching (via React Query's gcTime)
 * 4. Intersection-observer based prefetching for scroll intent
 */

// ============================================================
// 1. Route Preloading Hook - preload product detail on hover/tap
// ============================================================

/**
 * Preloads a Next.js route on user intent (hover, touch start, focus).
 * Uses Next.js router.prefetch() which fetches the RSC payload in background.
 * 
 * Usage:
 *   const { onMouseEnter, onTouchStart, onFocus } = useRoutePreload(`/products/${slug}`);
 *   <Link href={href} onMouseEnter={onMouseEnter} onTouchStart={onTouchStart}>
 */
export function useRoutePreload(href: string) {
  const router = useRouter();
  const prefetchedRef = useRef(false);

  const prefetch = useCallback(() => {
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;
    router.prefetch(href);
  }, [router, href]);

  return {
    onMouseEnter: prefetch,
    onTouchStart: prefetch,
    onFocus: prefetch,
  };
}

// ============================================================
// 2. Image Prefetching - preload images before they enter viewport
// ============================================================

const prefetchedImages = new Set<string>();

/**
 * Prefetches an image URL using a hidden Image() object.
 * Deduplicates to avoid re-fetching same image.
 */
export function prefetchImage(src: string) {
  if (!src || prefetchedImages.has(src)) return;
  prefetchedImages.add(src);

  // Use link[rel=prefetch] for lower priority than preload
  if (typeof document !== "undefined") {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.as = "image";
    link.href = src;
    document.head.appendChild(link);

    // Cleanup after 30s to avoid memory accumulation
    setTimeout(() => {
      link.remove();
    }, 30000);
  }
}

/**
 * Prefetches images for a batch of products.
 * Call this for near-visible products (next 1-2 screens).
 */
export function prefetchProductImages(products: Array<{ image?: string | null }>) {
  for (const product of products) {
    if (product.image) {
      prefetchImage(product.image);
    }
  }
}

// ============================================================
// 3. Scroll Intent Preloading Hook
// ============================================================

/**
 * Detects scroll direction and speed to predict what content to preload.
 * Used to preload next page of products before user reaches the load trigger.
 */
export function useScrollIntentPreload(options: {
  onScrollNearEnd?: () => void;
  /** How far from bottom to trigger (px). Default 600 */
  threshold?: number;
}) {
  const { onScrollNearEnd, threshold = 600 } = options;
  const lastScrollRef = useRef(0);
  const tickingRef = useRef(false);

  const handleScroll = useCallback(() => {
    if (tickingRef.current) return;
    tickingRef.current = true;

    requestAnimationFrame(() => {
      const scrollY = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const distanceFromBottom = scrollHeight - scrollY - clientHeight;

      // If scrolling down and near bottom, trigger preload
      if (scrollY > lastScrollRef.current && distanceFromBottom < threshold) {
        onScrollNearEnd?.();
      }

      lastScrollRef.current = scrollY;
      tickingRef.current = false;
    });
  }, [onScrollNearEnd, threshold]);

  return { onScroll: handleScroll };
}

// ============================================================
// 4. Product List Memory Cache
// ============================================================

/**
 * In-memory cache for product lists.
 * Complements React Query's cache by providing instant access
 * for previously fetched category/search results.
 * 
 * The TanStack React Query client already handles this with:
 * - staleTime: 60s (won't refetch within 1 min)
 * - gcTime: 5min (keeps data in memory for 5 min)
 * 
 * This additional layer provides:
 * - Immediate render from cache (no loading state)
 * - Cross-navigation persistence
 * - Category-specific caching
 */
type CacheEntry<T> = {
  data: T;
  timestamp: number;
  ttl: number;
};

class ProductCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxEntries = 20;

  set<T>(key: string, data: T, ttlMs = 120000 /* 2 min */) {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxEntries) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, { data, timestamp: Date.now(), ttl: ttlMs });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  invalidate(pattern?: string) {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) this.cache.delete(key);
    }
  }
}

// Singleton instance
export const productCache = new ProductCache();

// ============================================================
// 5. Prefetch on Visibility Hook (for lazy sections)
// ============================================================

/**
 * Hook that triggers prefetch when element becomes visible.
 * Used for below-the-fold sections that need data before they scroll into view.
 */
export function usePrefetchOnVisible(prefetchFn: () => void) {
  const triggered = useRef(false);

  const ref = useCallback((node: HTMLElement | null) => {
    if (!node || triggered.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered.current) {
          triggered.current = true;
          prefetchFn();
          observer.disconnect();
        }
      },
      { rootMargin: "400px" } // Trigger 400px before visible
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [prefetchFn]);

  return ref;
}


// ============================================================
// 6. Viewport-based Route Prefetching for Product Grids
// ============================================================

const prefetchedRoutes = new Set<string>();

/**
 * Prefetches product detail routes for items visible in the viewport.
 *
 * Call this with an array of product slugs. It uses a shared
 * IntersectionObserver-like approach — but instead of observing DOM elements,
 * it eagerly prefetches routes for products that are "above the fold" or
 * recently scrolled into view.
 *
 * This hook should be called in the product grid with the current visible
 * product list. It debounces and limits prefetch to avoid overloading.
 *
 * Strategy:
 * - Prefetch first 4 visible product detail routes immediately
 * - Prefetch next 4 after 2 seconds (likely-next-tapped)
 * - Max 12 prefetched routes per session (memory budget)
 * - Deduplicates: won't re-prefetch already-prefetched routes
 *
 * Usage:
 *   useVisibleRoutePrefetch(products.slice(0, 8));
 */
export function useVisibleRoutePrefetch(products: Array<{ slug: string }>) {
  const router = useRouter();
  const didRun = useRef(false);

  // Only run once per product set (avoid re-prefetching on every render)
  const slugKey = products.map(p => p.slug).join(",");
  const prevKey = useRef("");

  if (slugKey !== prevKey.current) {
    didRun.current = false;
    prevKey.current = slugKey;
  }

  useCallback(() => {}, []); // stable reference trick for ESLint

  // Use useEffect to run prefetching after render
  const routerRef = useRef(router);
  routerRef.current = router;

  // Prefetch on mount / product change
  if (typeof window !== "undefined" && !didRun.current && products.length > 0) {
    didRun.current = true;

    // Immediate: prefetch first 4 products
    const immediate = products.slice(0, 4);
    requestIdleCallback(() => {
      for (const product of immediate) {
        const href = `/products/${product.slug}`;
        if (prefetchedRoutes.has(href) || prefetchedRoutes.size >= 12) continue;
        prefetchedRoutes.add(href);
        routerRef.current.prefetch(href);
      }
    });

    // Delayed: prefetch next 4 after 2s
    if (products.length > 4) {
      setTimeout(() => {
        const delayed = products.slice(4, 8);
        requestIdleCallback(() => {
          for (const product of delayed) {
            const href = `/products/${product.slug}`;
            if (prefetchedRoutes.has(href) || prefetchedRoutes.size >= 12) continue;
            prefetchedRoutes.add(href);
            routerRef.current.prefetch(href);
          }
        });
      }, 2000);
    }
  }
}

// Polyfill requestIdleCallback for Safari
if (typeof window !== "undefined" && !("requestIdleCallback" in window)) {
  (window as any).requestIdleCallback = (cb: () => void) => setTimeout(cb, 1);
}
