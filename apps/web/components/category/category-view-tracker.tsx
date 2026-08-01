"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

/**
 * Client component that fires a CATEGORY_VIEWED analytics event on mount.
 * Renders nothing visible - purely a tracking side-effect.
 */
export function CategoryViewTracker({
  categoryName,
  categorySlug,
  productCount,
}: {
  categoryName: string;
  categorySlug: string;
  productCount?: number;
}) {
  useEffect(() => {
    trackEvent(ANALYTICS_EVENTS.CATEGORY_VIEWED, {
      categoryName,
      categorySlug,
      productCount,
    });
  }, [categoryName, categorySlug, productCount]);

  return null;
}
