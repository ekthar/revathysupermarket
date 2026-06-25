"use client";

import { useEffect, useState } from "react";
import { safeProductImageUrl, PRODUCT_IMAGE_FALLBACK } from "@/lib/image";
import { cn } from "@/lib/utils";

export function ProductImage({
  src,
  alt,
  className
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const [currentSrc, setCurrentSrc] = useState(safeProductImageUrl(src));

  // Re-render when src prop changes (e.g., after admin updates image)
  useEffect(() => {
    setCurrentSrc(safeProductImageUrl(src));
  }, [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt}
      width={640}
      height={640}
      style={{ aspectRatio: "1/1" }}
      className={cn("block h-full min-w-0 max-w-full object-cover", className)}
      loading="lazy"
      onError={() => setCurrentSrc(PRODUCT_IMAGE_FALLBACK)}
    />
  );
}
