"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

/**
 * useViewTransition — wraps Next.js navigation with the View Transitions API.
 *
 * When the browser supports `document.startViewTransition()` (Chrome 111+,
 * Safari 18+, Edge 111+), the route change happens inside a transition
 * context, enabling CSS `view-transition-name` matched elements to morph
 * smoothly between pages.
 *
 * Fallback: on unsupported browsers, navigation happens normally with no
 * visual transition — graceful degradation.
 *
 * Usage:
 *   const { navigateWithTransition } = useViewTransition();
 *   <button onClick={() => navigateWithTransition(`/products/${slug}`)}>
 *
 * Pair with `viewTransitionName` style on source and target elements:
 *   Source (card image):  style={{ viewTransitionName: `product-${id}` }}
 *   Target (detail hero): style={{ viewTransitionName: `product-${id}` }}
 */
export function useViewTransition() {
  const router = useRouter();

  const navigateWithTransition = useCallback(
    (href: string, options?: { replace?: boolean }) => {
      // Feature detection for View Transitions API
      if (typeof document !== "undefined" && "startViewTransition" in document) {
        (document as any).startViewTransition(() => {
          if (options?.replace) {
            router.replace(href);
          } else {
            router.push(href);
          }
        });
      } else {
        // Fallback: navigate normally
        if (options?.replace) {
          router.replace(href);
        } else {
          router.push(href);
        }
      }
    },
    [router]
  );

  return { navigateWithTransition };
}
