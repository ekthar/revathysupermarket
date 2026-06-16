"use client";

import { useState } from "react";
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

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt}
      className={cn("h-full w-full object-cover", className)}
      loading="lazy"
      onError={() => setCurrentSrc(PRODUCT_IMAGE_FALLBACK)}
    />
  );
}
