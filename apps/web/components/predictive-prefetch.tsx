"use client";

import { usePredictivePrefetch } from "@/lib/predictive-prefetch";

/**
 * PredictivePrefetch — invisible component that learns navigation patterns.
 *
 * Mount in app layout. No visual output.
 * Records route transitions and prefetches predicted next pages.
 */
export function PredictivePrefetch() {
  usePredictivePrefetch();
  return null;
}
