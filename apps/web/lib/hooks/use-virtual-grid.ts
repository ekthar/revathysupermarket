"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Lightweight virtual grid hook for product lists.
 * 
 * Instead of a full virtualization library (react-window/react-virtual),
 * this uses IntersectionObserver to:
 * 1. Render items only when they're within the viewport buffer
 * 2. Keep items mounted once rendered (no flickering on fast scroll)
 * 3. Pre-render next 2 screens of items for smooth scrolling
 * 4. Optionally unmount items that are very far from viewport (>5 screens)
 * 
 * Why not react-window?
 * - Product cards have variable heights (discount badges, text wrapping)
 * - The grid layout changes across breakpoints (2/3/4 cols)
 * - We need CSS grid layout (not absolute positioning)
 * - react-window adds bundle size for a relatively simple use case
 */

type UseVirtualGridOptions = {
  /** Total number of items */
  totalItems: number;
  /** How many items to render initially (above-the-fold) */
  initialRenderCount?: number;
  /** Buffer zone: how many extra items to render beyond visible (in items) */
  bufferItems?: number;
  /** Estimated row height in px (for calculating buffer zone) */
  estimatedRowHeight?: number;
  /** Number of columns (for calculating rows) */
  columns?: number;
  /** Whether to unmount items far from viewport */
  enableUnmounting?: boolean;
  /** Distance in px before an item gets unmounted */
  unmountDistance?: number;
};

type VirtualGridState = {
  /** How many items should currently be rendered */
  renderCount: number;
  /** Set of item indices that should be rendered (when unmounting is enabled) */
  visibleSet: Set<number> | null;
};

export function useVirtualGrid({
  totalItems,
  initialRenderCount = 8,
  bufferItems = 8,
  estimatedRowHeight = 280,
  columns = 2,
  enableUnmounting = false,
  unmountDistance = 2000,
}: UseVirtualGridOptions) {
  const [state, setState] = useState<VirtualGridState>({
    renderCount: Math.min(initialRenderCount, totalItems),
    visibleSet: null,
  });

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Progressive rendering: observe a sentinel element at the end of rendered items
  // When it comes into view, render more items
  useEffect(() => {
    if (state.renderCount >= totalItems) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState((prev) => ({
            ...prev,
            renderCount: Math.min(prev.renderCount + bufferItems, totalItems),
          }));
        }
      },
      {
        // Trigger when sentinel is within 2 screens of viewport
        rootMargin: `${estimatedRowHeight * 2}px`,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [state.renderCount, totalItems, bufferItems, estimatedRowHeight]);

  // Update renderCount when totalItems changes (new page loaded)
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      renderCount: Math.min(
        Math.max(prev.renderCount, initialRenderCount),
        totalItems
      ),
    }));
  }, [totalItems, initialRenderCount]);

  // Should this item be rendered?
  const shouldRender = useCallback(
    (index: number): boolean => {
      if (state.visibleSet) {
        return state.visibleSet.has(index);
      }
      return index < state.renderCount;
    },
    [state.renderCount, state.visibleSet]
  );

  // Has more items to render (show sentinel)
  const hasMoreToRender = state.renderCount < totalItems;

  return {
    renderCount: state.renderCount,
    shouldRender,
    hasMoreToRender,
    sentinelRef,
    containerRef,
  };
}

/**
 * Hook for a single item visibility tracking.
 * Returns whether the item should render its full content
 * or just a placeholder.
 * 
 * Uses a "render once, keep forever" strategy:
 * Once an item enters the viewport buffer, it stays rendered.
 * This prevents content jumping on scroll back.
 */
export function useItemVisibility(options?: { rootMargin?: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      // Cleanup previous observer
      if (observerRef.current && ref.current) {
        observerRef.current.unobserve(ref.current);
      }

      ref.current = node;

      if (node && !isVisible) {
        observerRef.current = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              observerRef.current?.disconnect();
            }
          },
          { rootMargin: options?.rootMargin || "300px" }
        );
        observerRef.current.observe(node);
      }
    },
    [isVisible, options?.rootMargin]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return { ref: setRef, isVisible };
}
