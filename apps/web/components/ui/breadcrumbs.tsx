"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { usePathname } from "next/navigation";
import { memo } from "react";

type BreadcrumbItem = {
  label: string;
  href: string;
};

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  /** If true, auto-generates breadcrumbs from the current path */
  auto?: boolean;
  className?: string;
}

const PATH_LABELS: Record<string, string> = {
  products: "Products",
  cart: "Cart",
  checkout: "Checkout",
  account: "Account",
  dashboard: "My Orders",
  settings: "Settings",
  favorites: "Favorites",
  wallet: "Wallet",
  loyalty: "Rewards",
  notifications: "Notifications",
  edit: "Edit Profile",
  support: "Support",
};

/**
 * Breadcrumb navigation component.
 * 
 * Improves UX by showing users where they are in the app hierarchy.
 * Also helps screen readers understand page structure (aria-label="Breadcrumb").
 * 
 * Usage:
 * ```tsx
 * <Breadcrumbs items={[
 *   { label: "Products", href: "/products" },
 *   { label: "Fruits", href: "/products?category=Fruits" }
 * ]} />
 * ```
 */
export const Breadcrumbs = memo(function Breadcrumbs({ items, auto = false, className = "" }: BreadcrumbsProps) {
  const pathname = usePathname();

  const breadcrumbs: BreadcrumbItem[] = items || [];

  // Auto-generate from path if no explicit items
  if (auto && breadcrumbs.length === 0) {
    const segments = pathname.split("/").filter(Boolean);
    let href = "";
    for (const segment of segments) {
      href += `/${segment}`;
      const label = PATH_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
      breadcrumbs.push({ label, href });
    }
  }

  if (breadcrumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center gap-1 text-caption text-neutral-500 dark:text-neutral-400 ${className}`}>
      <Link
        href="/"
        className="flex items-center gap-1 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
        aria-label="Home"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>

      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        return (
          <span key={item.href} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3 text-neutral-300 dark:text-neutral-600" />
            {isLast ? (
              <span className="font-semibold text-neutral-700 dark:text-neutral-200 truncate max-w-[120px] sm:max-w-[200px]" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors truncate max-w-[100px] sm:max-w-[160px]"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
});
