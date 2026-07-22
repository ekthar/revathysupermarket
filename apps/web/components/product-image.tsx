"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { safeProductImageUrl, PRODUCT_IMAGE_FALLBACK } from "@/lib/image";
import { cn } from "@/lib/utils";

/**
 * ProductImage — native-feel progressive image loading.
 *
 * Loading sequence (Apple/Instagram pattern):
 * 1. Instantly show a color swatch background (category-aware warm neutral)
 * 2. Overlay with a subtle shimmer animation
 * 3. When image loads: cross-fade in with slight scale (1.02→1) over 300ms
 * 4. Result: perceived-instant loading, no blank white gaps
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
  priority
}: {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const [currentSrc, setCurrentSrc] = useState(() => safeProductImageUrl(src));
  const [loaded, setLoaded] = useState(false);
  const retriedRef = useRef(false);

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
          {/* Color swatch + shimmer placeholder — visible while image loads */}
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-300 ease-out",
              loaded ? "opacity-0" : "opacity-100"
            )}
            aria-hidden="true"
          >
            {/* Warm neutral base color (works for all food categories) */}
            <div className="absolute inset-0 bg-neutral-100 dark:bg-neutral-800" />
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
