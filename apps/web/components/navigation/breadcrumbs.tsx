"use client";

/**
 * Breadcrumb Navigation — Contextual path indicator
 * ═══════════════════════════════════════════════════
 *
 * Shows the user's current location in the site hierarchy.
 * Auto-generates breadcrumbs based on the current path.
 *
 * Features:
 * - Auto-generates from URL path segments
 * - Customizable labels via props
 * - Animated entrance
 * - Responsive (collapses on mobile)
 * - Structured data for SEO (JSON-LD BreadcrumbList)
 */

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

// Human-readable labels for common path segments
const pathLabels: Record<string, string> = {
  products: "Products",
  cart: "Cart",
  checkout: "Checkout",
  account: "Account",
  orders: "Orders",
  offers: "Deals & Offers",
  support: "Help & Support",
  favorites: "Favorites",
  settings: "Settings",
  notifications: "Notifications",
  wallet: "Wallet",
  loyalty: "Rewards",
  addresses: "Addresses",
  "edit-profile": "Edit Profile",
};

// Category-friendly labels
const categoryLabels: Record<string, string> = {
  Fruits: "Fruits",
  Vegetables: "Vegetables",
  Dairy: "Dairy",
  Beverages: "Beverages",
  Snacks: "Snacks",
  Household: "Household",
  "Personal Care": "Personal Care",
  "Frozen Foods": "Frozen Foods",
  "Grocery Essentials": "Grocery Essentials",
};

interface BreadcrumbItem {
  label: string;
  href: string;
  current?: boolean;
}

interface BreadcrumbsProps {
  /** Override auto-generated items */
  items?: BreadcrumbItem[];
  /** Additional class names */
  className?: string;
}

export function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const breadcrumbs = useMemo(() => {
    if (items) return items;

    // Don't show on homepage, login, admin, staff, delivery
    if (
      pathname === "/" ||
      pathname === "/login" ||
      pathname === "/welcome" ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/staff") ||
      pathname.startsWith("/delivery")
    ) {
      return [];
    }

    const segments = pathname.split("/").filter(Boolean);
    const crumbs: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

    let currentPath = "";
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === segments.length - 1;

      // Skip dynamic segments like [id]
      if (segment.startsWith("[") || segment.match(/^[0-9a-f-]{20,}$/)) {
        crumbs.push({
          label: "Details",
          href: currentPath,
          current: isLast,
        });
        return;
      }

      const label = pathLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");

      crumbs.push({
        label,
        href: currentPath,
        current: isLast,
      });
    });

    // Add category as extra breadcrumb if on products page with category filter
    const category = searchParams.get("category");
    if (pathname === "/products" && category) {
      crumbs.push({
        label: categoryLabels[category] || category,
        href: `/products?category=${encodeURIComponent(category)}`,
        current: true,
      });
      // Mark previous as not current
      if (crumbs.length > 1) {
        crumbs[crumbs.length - 2].current = false;
      }
    }

    return crumbs;
  }, [pathname, searchParams, items]);

  // Don't render if no breadcrumbs or only home
  if (breadcrumbs.length <= 1) return null;

  return (
    <>
      {/* SEO structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: breadcrumbs.map((crumb, idx) => ({
              "@type": "ListItem",
              position: idx + 1,
              name: crumb.label,
              item: crumb.href.startsWith("http")
                ? crumb.href
                : `${typeof window !== "undefined" ? window.location.origin : ""}${crumb.href}`,
            })),
          }),
        }}
      />

      {/* Visual breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className={`hidden md:block ${className}`}
      >
        <ol className="flex items-center gap-1.5 text-sm">
          {breadcrumbs.map((crumb, idx) => (
            <li key={crumb.href + idx} className="flex items-center gap-1.5">
              {idx > 0 && (
                <ChevronRight className="h-3 w-3 text-neutral-300 dark:text-neutral-600" />
              )}

              {crumb.current ? (
                <span
                  className="font-semibold text-neutral-900 dark:text-white truncate max-w-[180px]"
                  aria-current="page"
                >
                  {idx === 0 ? (
                    <Home className="h-3.5 w-3.5 inline-block" />
                  ) : (
                    crumb.label
                  )}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors truncate max-w-[150px]"
                >
                  {idx === 0 ? (
                    <Home className="h-3.5 w-3.5 inline-block" />
                  ) : (
                    crumb.label
                  )}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
