"use client";

import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/lib/types";

type CategoryEntry = {
  name: string;
  slug: string;
  icon: string | null;
};

export function ZeroResultSuggestions({
  categories,
  popularProducts,
  onClose,
}: {
  categories: CategoryEntry[];
  popularProducts: Product[];
  onClose: () => void;
}) {
  return (
    <div className="space-y-6 pt-4">
      {/* Category entry points */}
      {categories.length > 0 && (
        <section>
          <h3 className="text-caption font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Browse categories
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {categories.slice(0, 9).map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                onClick={onClose}
                className="flex flex-col items-center gap-1.5 rounded-2xl bg-muted p-3 hover:bg-muted/80 transition-colors text-center"
              >
                <span className="text-xl">{category.icon || "🛒"}</span>
                <span className="text-xs font-semibold text-foreground line-clamp-2">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Popular products */}
      {popularProducts.length > 0 && (
        <section>
          <h3 className="text-caption font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Popular products
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {popularProducts.slice(0, 4).map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                onClick={onClose}
                className="flex flex-col rounded-2xl bg-card border border-border overflow-hidden hover:shadow-sm transition-shadow"
              >
                <div className="relative aspect-square bg-muted">
                  {product.image && (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 40vw, 200px"
                    />
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-bold text-foreground line-clamp-2">{product.name}</p>
                  <p className="mt-1 text-xs font-black text-foreground tabular-nums">
                    {formatCurrency(product.discountPrice ?? product.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
