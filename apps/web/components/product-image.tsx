"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { safeProductImageUrl, PRODUCT_IMAGE_FALLBACK } from "@/lib/image";
import { cn } from "@/lib/utils";

/**
 * SafeImage / ProductImage component.
 *
 * Prevents infinite image retry loops by:
 * 1. Validating URL before rendering
 * 2. Max 1 retry (original → fallback → inline SVG placeholder)
 * 3. Never retrying a URL that already failed
 * 4. Using a static inline SVG as terminal fallback (never fails to load)
 */

// Terminal fallback: inline SVG data URI (never makes a network request)
const INLINE_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' fill='%23f5f5f5'%3E%3Crect width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23ccc' font-size='48'%3E%F0%9F%9B%92%3C/text%3E%3C/svg%3E";

export const ProductImage = memo(function ProductImage({
  src,
  alt,
  className
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const [currentSrc, setCurrentSrc] = useState(() => safeProductImageUrl(src));
  const retriedRef = useRef(false);

  // Re-sync when src prop changes (e.g., after admin updates image)
  useEffect(() => {
    setCurrentSrc(safeProductImageUrl(src));
    retriedRef.current = false;
  }, [src]);

  const handleError = useCallback(() => {
    if (retriedRef.current) {
      // Already retried once — use inline SVG (guaranteed to work, no network)
      setCurrentSrc(INLINE_PLACEHOLDER);
      return;
    }
    // First failure: try the fallback image
    retriedRef.current = true;
    setCurrentSrc(PRODUCT_IMAGE_FALLBACK);
  }, []);

  return (
    <div className={cn("relative aspect-square w-full", className)}>
      {currentSrc === INLINE_PLACEHOLDER ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={INLINE_PLACEHOLDER}
          alt={alt}
          className="h-full w-full object-cover"
        />
      ) : (
        <Image
          src={currentSrc}
          alt={alt}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover"
          onError={handleError}
          loading="lazy"
        />
      )}
    </div>
  );
});
