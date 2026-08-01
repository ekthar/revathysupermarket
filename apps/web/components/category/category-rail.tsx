"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CATEGORY_ICON_FALLBACK, categoryColorForIndex } from "@/lib/category-icons";
import type { CategoryNavItem } from "@/lib/categories";
import { cn } from "@/lib/utils";

/**
 * CategoryRail — persistent L1 category navigation.
 *
 * The quick-commerce browse pattern: a vertical rail of top-level categories
 * pinned beside the product pane, so switching category never costs a
 * back-navigation. Present on mobile too (where it's the narrow left column),
 * because that's where the pattern originates.
 */
function RailThumb({
  item,
  index,
  active,
  sizePx,
}: {
  item: CategoryNavItem;
  index: number;
  active: boolean;
  sizePx: number;
}) {
  const [failed, setFailed] = useState(false);
  const showPhoto = Boolean(item.image) && !failed;

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-xl transition-shadow",
        categoryColorForIndex(index),
        "dark:bg-neutral-800",
        active && "ring-2 ring-secondary-500 ring-offset-1 ring-offset-background"
      )}
      style={{ width: sizePx, height: sizePx }}
    >
      {showPhoto ? (
        <Image
          src={item.image as string}
          alt=""
          fill
          sizes={`${sizePx}px`}
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          className="absolute inset-0 flex items-center justify-center leading-none"
          style={{ fontSize: Math.round(sizePx * 0.44) }}
        >
          {item.icon || CATEGORY_ICON_FALLBACK}
        </span>
      )}
    </div>
  );
}

export function CategoryRail({
  items,
  activeSlug,
}: {
  items: CategoryNavItem[];
  activeSlug: string;
}) {
  const activeRef = useRef<HTMLAnchorElement>(null);

  // Keep the selected category visible when arriving via a deep link.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeSlug]);

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Product categories"
      className={cn(
        "shrink-0 border-r border-border bg-card/60",
        "w-[84px] md:w-56",
        // Pinned below the header, with its own scroll region.
        "sticky top-[var(--mobile-header-height,56px)] md:top-[70px]",
        "h-[calc(100dvh-var(--mobile-header-height,56px))] md:h-[calc(100dvh-70px)]",
        "overflow-y-auto overscroll-contain no-scrollbar"
      )}
    >
      <ul className="flex flex-col gap-1 p-1.5 md:gap-0.5 md:p-3 pb-nav">
        {items.map((item, index) => {
          const active = item.slug === activeSlug;
          return (
            <li key={item.id}>
              <Link
                ref={active ? activeRef : undefined}
                href={`/category/${item.slug}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-center transition-colors",
                  "md:flex-row md:gap-3 md:px-3 md:py-2.5 md:text-left",
                  active
                    ? "bg-secondary-50 dark:bg-secondary-900/30"
                    : "hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                )}
              >
                <RailThumb item={item} index={index} active={active} sizePx={48} />
                <span className="min-w-0 md:flex-1">
                  <span
                    className={cn(
                      "block text-micro md:text-body leading-tight line-clamp-2 md:line-clamp-1",
                      active
                        ? "font-bold text-secondary-700 dark:text-secondary-300"
                        : "font-semibold text-neutral-700 dark:text-neutral-300"
                    )}
                  >
                    {item.name}
                  </span>
                  <span className="hidden md:block text-caption text-neutral-500 dark:text-neutral-400">
                    {item.count} {item.count === 1 ? "item" : "items"}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
