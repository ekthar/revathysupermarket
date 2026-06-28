"use client";

import { memo, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { safeProductImageUrl, PRODUCT_IMAGE_FALLBACK } from "@/lib/image";
import { cn } from "@/lib/utils";

export const ProductImage = memo(function ProductImage({
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

  const handleError = useCallback(() => {
    setCurrentSrc(PRODUCT_IMAGE_FALLBACK);
  }, []);

  return (
    <div className={cn("relative aspect-square w-full", className)}>
      <Image
        src={currentSrc}
        alt={alt}
        fill
        sizes="(max-width: 768px) 50vw, 25vw"
        className="object-cover"
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
});
