"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

/**
 * Predictive Prefetching — learn user navigation patterns, prefetch next likely page.
 *
 * How it works:
 * 1. Track navigation transitions (from → to) in localStorage
 * 2. Build a frequency map of "after visiting X, user usually goes to Y"
 * 3. On each page load, prefetch the top 2 most likely next pages
 * 4. Result: the next page the user taps loads INSTANTLY
 *
 * Example patterns it learns:
 * - Home → Products (90% of users browse after landing)
 * - Products (Fruits) → Products (Vegetables) (adjacent category)
 * - Cart → Checkout (obvious flow)
 * - Account → Dashboard (order history check)
 *
 * Storage: lightweight localStorage entry (~2KB max)
 * Privacy: no PII, just route paths and counts
 * Budget: max 2 prefetches per page (avoid bandwidth waste)
 */

const STORAGE_KEY = "msm-nav-patterns";
const MAX_ENTRIES_PER_SOURCE = 5; // Top 5 destinations per source page
const MAX_SOURCES = 20; // Track max 20 source pages
const PREFETCH_COUNT = 2; // Prefetch top 2 predictions per page

type NavPatterns = Record<string, Record<string, number>>;

// ─── Pattern Storage ──────────────────────────────────────────────────────────

function loadPatterns(): NavPatterns {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePatterns(patterns: NavPatterns) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns));
  } catch {
    // Storage full — clear old data
    localStorage.removeItem(STORAGE_KEY);
  }
}

/** Normalize path to a general pattern (remove dynamic segments for grouping) */
function normalizePath(path: string): string {
  // /products/apple-banana-500g → /products/[slug]
  if (path.startsWith("/products/") && path !== "/products") {
    return "/products/[slug]";
  }
  // /dashboard/order-123 → /dashboard/[id]
  if (path.startsWith("/dashboard/")) return "/dashboard/[id]";
  // Keep everything else as-is
  return path;
}

/** Record a navigation transition */
function recordTransition(from: string, to: string) {
  if (from === to) return; // Skip same-page
  const normalFrom = normalizePath(from);
  const normalTo = normalizePath(to);

  const patterns = loadPatterns();

  // Initialize source entry
  if (!patterns[normalFrom]) patterns[normalFrom] = {};
  patterns[normalFrom][normalTo] = (patterns[normalFrom][normalTo] || 0) + 1;

  // Trim: keep only top N destinations per source
  const entries = Object.entries(patterns[normalFrom]);
  if (entries.length > MAX_ENTRIES_PER_SOURCE) {
    entries.sort((a, b) => b[1] - a[1]);
    patterns[normalFrom] = Object.fromEntries(entries.slice(0, MAX_ENTRIES_PER_SOURCE));
  }

  // Trim: keep only top N sources
  const sourceKeys = Object.keys(patterns);
  if (sourceKeys.length > MAX_SOURCES) {
    // Remove sources with lowest total transitions
    const scored = sourceKeys.map((key) => ({
      key,
      total: Object.values(patterns[key]).reduce((s, v) => s + v, 0)
    }));
    scored.sort((a, b) => b.total - a.total);
    const keep = new Set(scored.slice(0, MAX_SOURCES).map((s) => s.key));
    for (const key of sourceKeys) {
      if (!keep.has(key)) delete patterns[key];
    }
  }

  savePatterns(patterns);
}

/** Get predicted next pages for a given path (sorted by probability) */
function getPredictions(currentPath: string): string[] {
  const patterns = loadPatterns();
  const normalPath = normalizePath(currentPath);
  const destinations = patterns[normalPath];

  if (!destinations) return getDefaultPredictions(currentPath);

  // Sort by frequency, return top N
  const sorted = Object.entries(destinations)
    .sort((a, b) => b[1] - a[1])
    .slice(0, PREFETCH_COUNT)
    .map(([path]) => path);

  // Don't prefetch normalized patterns (can't prefetch /products/[slug])
  return sorted.filter((p) => !p.includes("[")).concat(getDefaultPredictions(currentPath)).slice(0, PREFETCH_COUNT);
}

/** Default predictions when no user history exists */
function getDefaultPredictions(currentPath: string): string[] {
  // Common navigation patterns (cold start)
  const defaults: Record<string, string[]> = {
    "/": ["/products", "/offers"],
    "/products": ["/cart", "/"],
    "/cart": ["/checkout", "/products"],
    "/checkout": ["/dashboard"],
    "/account": ["/dashboard", "/account/settings"],
    "/dashboard": ["/", "/products"],
    "/offers": ["/products", "/cart"],
  };

  return defaults[currentPath] || ["/products"];
}

// ─── React Hook ───────────────────────────────────────────────────────────────

/**
 * usePredictivePrefetch — tracks navigation and prefetches predicted next pages.
 *
 * Mount once in the app layout. It will:
 * 1. Record every route transition (from → to)
 * 2. On each new page, prefetch the top 2 predicted next pages
 * 3. Uses requestIdleCallback to avoid blocking the main thread
 *
 * Usage:
 *   function Layout() {
 *     usePredictivePrefetch();
 *     return <>{children}</>;
 *   }
 */
export function usePredictivePrefetch() {
  const pathname = usePathname();
  const router = useRouter();
  const prevPath = useRef<string | null>(null);

  useEffect(() => {
    // Record transition
    if (prevPath.current && prevPath.current !== pathname) {
      recordTransition(prevPath.current, pathname);
    }
    prevPath.current = pathname;

    // Prefetch predictions (in idle time)
    const predictions = getPredictions(pathname);
    if (predictions.length === 0) return;

    const idle = typeof requestIdleCallback !== "undefined"
      ? requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 100);

    const id = idle(() => {
      for (const path of predictions) {
        router.prefetch(path);
      }
    });

    return () => {
      if (typeof cancelIdleCallback !== "undefined") {
        cancelIdleCallback(id as number);
      }
    };
  }, [pathname, router]);
}
