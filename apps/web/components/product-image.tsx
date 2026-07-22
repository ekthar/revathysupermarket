"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { safeProductImageUrl, PRODUCT_IMAGE_FALLBACK } from "@/lib/image";
import { cn } from "@/lib/utils";
import { getCategoryColor } from "@/lib/blur-placeholder";

/**
 * ProductImage — native-feel progressive image loading.
 *
 * Loading sequence (Apple/Instagram/Pinterest pattern):
 * 1. Instantly show a category-aware color swatch (dominant color approximation)
 * 2. Overlay with a subtle shimmer animation indicating load progress
 * 3. When image loads: cross-fade in with slight scale (1.02→1) over 300ms
 * 4. Result: perceived-instant loading with content-aware color preview
 *
 * The category color swatch mimics the "dominant color placeholder" technique
 * used by Instagram and Pinterest — the background matches the general hue
 * of the product category (warm gold for fruits, soft green for vegetables, etc.)
 *
 * Error handling:
 * - 1st failure → fallback product image
 * - 2nd failure → inline SVG placeholder (no network request)
 */

// Terminal fallback: inline SVG data URI (never makes a network request)
const INLINE_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' fill='%23f5f5f5'%3E%3Crect width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23ccc' font-size='48'%3E%F0%9F%9B%92%3C/text%3E%3C/svg%3E";

export const ProductImage = memo(function ProductImage({
  src,
  alt,
  className,
  priority,
  category,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
  /** Product category — used for content-aware color placeholder */
  category?: string;
}) {
  const [currentSrc, setCurrentSrc] = useState(() => safeProductImageUrl(src));
  const [loaded, setLoaded] = useState(false);
  const retriedRef = useRef(false);

  // Category-aware background color (warm gold for fruits, green for vegetables, etc.)
  const placeholderColor = getCategoryColor(category);

  // Re-sync when src prop changes (e.g., after admin updates image)
  useEffect(() => {
    setCurrentSrc(safeProductImageUrl(src));
    setLoaded(false);
    retriedRef.current = false;
  }, [src]);

  const handleError = useCallback(() => {
    if (retriedRef.current) {
      setCurrentSrc(INLINE_PLACEHOLDER);
      setLoaded(true);
      return;
    }
    retriedRef.current = true;
    setCurrentSrc(PRODUCT_IMAGE_FALLBACK);
  }, []);

  const handleLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  return (
    <div className={cn("relative aspect-square w-full overflow-hidden", className)}>
      {currentSrc === INLINE_PLACEHOLDER ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={INLINE_PLACEHOLDER}
          alt={alt}
          className="h-full w-full object-cover"
        />
      ) : (
        <>
          {/* Category-aware color swatch + shimmer — visible while image loads */}
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-300 ease-out",
              loaded ? "opacity-0" : "opacity-100"
            )}
            aria-hidden="true"
          >
            {/* Category-specific color base (mimics dominant color extraction) */}
            <div
              className="absolute inset-0"
              style={{ backgroundColor: placeholderColor }}
            />
            {/* Shimmer overlay — moving gradient that indicates loading */}
            <div className="absolute inset-0 img-placeholder" />
          </div>

          {/* Actual image — fades in with subtle scale on load */}
          <Image
            src={currentSrc}
            alt={alt}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className={cn(
              "object-cover transition-all duration-300 ease-out",
              loaded
                ? "opacity-100 scale-100"
                : "opacity-0 scale-[1.02]"
            )}
            onError={handleError}
            onLoad={handleLoad}
            loading={priority ? undefined : "lazy"}
            priority={priority}
          />
        </>
      )}
    </div>
  );
});
