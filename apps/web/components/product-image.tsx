"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { safeProductImageUrl, PRODUCT_IMAGE_FALLBACK } from "@/lib/image";
import { cn } from "@/lib/utils";

/**
 * SafeImage / ProductImage component with progressive blur-up loading.
 *
 * Native-feel image loading:
 * 1. Shows a shimmer/blur placeholder while the image loads
 * 2. Fades in the full image once loaded (like Instagram/native apps)
 * 3. Max 1 retry (original → fallback → inline SVG placeholder)
 * 4. Never retries a URL that already failed
 */

// Terminal fallback: inline SVG data URI (never makes a network request)
const INLINE_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' fill='%23f5f5f5'%3E%3Crect width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23ccc' font-size='48'%3E%F0%9F%9B%92%3C/text%3E%3C/svg%3E";

// Tiny blur placeholder (10x10 grey, base64 encoded)
// This renders instantly and is blurred up via CSS until the real image loads
const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIklEQVQY02N89+7dfwYKABMDhYCJgUJAsSIGBgYGBgYGBgYAbYoEAXMfEMIAAAAASUVORK5CYII=";

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
      // Already retried once — use inline SVG (guaranteed to work, no network)
      setCurrentSrc(INLINE_PLACEHOLDER);
      setLoaded(true);
      return;
    }
    // First failure: try the fallback image
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
          {/* Blur placeholder — visible while image loads */}
          <div
            className={cn(
              "absolute inset-0 bg-neutral-100 dark:bg-neutral-800 transition-opacity duration-500 ease-out",
              loaded ? "opacity-0" : "opacity-100"
            )}
            style={{
              backgroundImage: `url(${BLUR_DATA_URL})`,
              backgroundSize: "cover",
              filter: "blur(20px)",
              transform: "scale(1.1)", // prevents blur edge artifacts
            }}
            aria-hidden="true"
          />
          {/* Actual image — fades in on load */}
          <Image
            src={currentSrc}
            alt={alt}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className={cn(
              "object-cover transition-opacity duration-500 ease-out",
              loaded ? "opacity-100" : "opacity-0"
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
