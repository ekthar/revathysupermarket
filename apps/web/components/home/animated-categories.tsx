"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { memo, useState } from "react";
import { ScrollReveal, ScrollRevealItem } from "@/components/ui/scroll-reveal-motion";
import { CATEGORY_ICON_FALLBACK, categoryColorForIndex } from "@/lib/category-icons";
import { cn } from "@/lib/utils";

/**
 * A single category as rendered on the homepage tiles.
 *
 * `image` and `icon` are both admin-editable and both optional, which is why the
 * thumbnail below implements a three-step fallback chain rather than assuming a
 * photo exists.
 */
export type CategoryTile = {
  name: string;
  slug: string;
  image?: string | null;
  icon?: string | null;
  count: number;
};

/**
 * CategoryThumb — photographic category thumbnail.
 *
 * Fallback chain: admin-uploaded photo → admin emoji → generic emoji. The photo
 * step can fail at runtime (dead S3 object, expired Unsplash URL), so a failed
 * load degrades to the emoji instead of leaving an empty well.
 */
function CategoryThumb({
  tile,
  index,
  shape,
  sizePx,
}: {
  tile: CategoryTile;
  index: number;
  shape: "circle" | "squircle";
  sizePx: number;
}) {
  const [failed, setFailed] = useState(false);
  const showPhoto = Boolean(tile.image) && !failed;
  const radius = shape === "circle" ? "rounded-full" : "rounded-2xl";

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden",
        radius,
        categoryColorForIndex(index),
        "dark:bg-neutral-800"
      )}
      style={{ width: sizePx, height: sizePx }}
    >
      {showPhoto ? (
        <Image
          src={tile.image as string}
          alt=""
          fill
          sizes={`${sizePx}px`}
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          className="absolute inset-0 flex items-center justify-center leading-none"
          style={{ fontSize: Math.round(sizePx * 0.42) }}
        >
          {tile.icon || CATEGORY_ICON_FALLBACK}
        </span>
      )}
    </div>
  );
}

export const AnimatedCategories = memo(function AnimatedCategories({
  categories,
}: {
  categories: CategoryTile[];
}) {
  if (categories.length === 0) return null;

  return (
    <>
      {/* Desktop categories */}
      <section className="hidden md:block max-w-7xl mx-auto px-6 lg:px-8 pt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title">Popular Categories</h2>
          <Link href="/categories" className="show-all-pill text-sm">
            Show All
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <ScrollReveal y={16} stagger={0.05} amount={0.3}>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.slice(0, 6).map((tile, index) => (
              <ScrollRevealItem key={tile.slug}>
                <Link
                  href={`/category/${tile.slug}`}
                  className="flex flex-col items-center gap-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-5 press hover:border-secondary-200 dark:hover:border-secondary-800 hover:shadow-elevation-1 transition-all"
                >
                  <CategoryThumb tile={tile} index={index} shape="squircle" sizePx={72} />
                  <div className="text-center">
                    <p className="text-body font-bold text-neutral-800 dark:text-white">{tile.name}</p>
                    <p className="text-caption text-neutral-600 dark:text-neutral-400 mt-0.5">
                      {tile.count} {tile.count === 1 ? "Product" : "Products"}
                    </p>
                  </div>
                </Link>
              </ScrollRevealItem>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* Mobile categories — horizontal scroll circles (Swiggy-style) */}
      <section className="pt-4 md:hidden">
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="text-title font-bold text-neutral-900 dark:text-white">Shop by Category</h2>
          <Link href="/categories" className="show-all-pill text-xs">
            Show All
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-2 snap-x">
          {categories.map((tile, index) => (
            <Link
              key={tile.slug}
              href={`/category/${tile.slug}`}
              className="flex flex-col items-center gap-1.5 shrink-0 w-[72px] snap-start press"
            >
              <CategoryThumb tile={tile} index={index} shape="circle" sizePx={60} />
              <span className="text-micro font-semibold text-neutral-600 dark:text-neutral-300 text-center leading-tight line-clamp-2 w-full">
                {tile.name}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
});
