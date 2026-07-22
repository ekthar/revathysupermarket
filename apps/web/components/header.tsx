"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Bell, Clock, MapPin, Search, ShoppingBag, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { springs } from "@/lib/motion";
import { memo, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCartItemCount } from "@/components/cart/cart-provider";
import { SITE } from "@/lib/constants";
import { getSavedLocation, type DeliveryLocation } from "@/components/location-prompt";
import type { SessionIdentity } from "@/components/session-identity-card";
import { GlobalSearchSheet } from "@/components/search/global-search";
import { AnimatedStoreName } from "@/components/ui/gsap/animated-store-name";
import { useTranslations } from "next-intl";
import { MegaMenu } from "@/components/navigation/mega-menu";
import { useScrollDirection } from "@/hooks/use-scroll-direction";

const navLinks = [
  { href: "/products", label: "Shop" },
  { href: "/offers", label: "Deals" },
];

export const Header = memo(function Header({
  user,
  storeName = SITE.name,
  storeAddress = SITE.address,
  logoUrl,
  onOpenLocationPrompt
}: {
  user: SessionIdentity;
  storeName?: string;
  storeAddress?: string;
  logoUrl?: string | null;
  onOpenLocationPrompt?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("common");
  const [searchOpen, setSearchOpen] = useState(false);
  const { direction, isAtTop } = useScrollDirection({ threshold: 8, startOffset: 50 });

  // Mobile header collapses on scroll down, reappears on scroll up (iOS-style)
  const mobileHeaderHidden = direction === "down" && !isAtTop;

  // Keyboard shortcut: ⌘K / Ctrl+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Prefer native back navigation (preserves scroll position + history) and
  // fall back to the parent path when there is no in-app history to return to.
  const handleBack = useCallback(() => {
    const parent = pathname.startsWith("/account/") ? "/account" : pathname.startsWith("/checkout") ? "/cart" : "/";
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(parent);
    }
  }, [router, pathname]);

  // Hide on login/welcome/staff/admin/delivery/track
  if (["/login", "/welcome"].includes(pathname) || pathname.startsWith("/staff") || pathname.startsWith("/admin") || pathname.startsWith("/delivery") || pathname.startsWith("/track")) return null;

  // Determine if we're on an inner page that needs a back button
  const innerPages = ["/account/settings", "/account/favorites", "/account/loyalty", "/account/notifications", "/account/edit", "/account/wallet", "/account/addresses", "/support", "/checkout"];
  const isInnerPage = innerPages.some((p) => pathname.startsWith(p)) || (pathname.startsWith("/account/") && pathname !== "/account");

  return (
    <>
      {/* Desktop Header — clean, 5-element right section */}
      <header className="sticky top-0 z-40 hidden md:block bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-100/80 dark:border-neutral-800/80">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-[64px]">
            {/* Left: Logo + Back button */}
            <div className="flex items-center gap-3">
              {isInnerPage && (
                <button
                  onClick={handleBack}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors press"
                  aria-label="Go back"
                >
                  <ArrowLeft className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
                </button>
              )}
              <Link href="/" className="flex items-center gap-2.5 press">
                {logoUrl && (
                  <Image src={logoUrl} alt={storeName} width={32} height={32} className="h-8 w-8 rounded-lg object-contain" unoptimized />
                )}
                <AnimatedStoreName name={storeName} className="font-display text-xl font-black tracking-tight uppercase" />
              </Link>
            </div>

            {/* Center: Navigation + Mega Menu */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {navLinks.map((link) => {
                const [linkPath, linkQuery] = link.href.split("?");
                const linkParams = new URLSearchParams(linkQuery || "");
                let isActive = false;
                if (linkQuery) {
                  isActive = pathname === linkPath && [...linkParams.entries()].every(
                    ([key, val]) => searchParams.get(key) === val
                  );
                } else {
                  isActive = pathname === linkPath && !searchParams.has("category") && !searchParams.has("sort");
                }
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-4 py-2 text-sm font-semibold rounded-full transition-all ${
                      isActive
                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                        : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <MegaMenu />
            </nav>

            {/* Right: Search, Location, Notifications, Cart, Account — 5 items max */}
            <div className="flex items-center gap-2">
              {/* Search trigger */}
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 h-9 pl-3.5 pr-4 rounded-full bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 ring-1 ring-neutral-200/50 dark:ring-neutral-700/50 hover:ring-neutral-300 dark:hover:ring-neutral-600 transition-all press text-sm text-neutral-500 dark:text-neutral-400 min-w-[180px] lg:min-w-[220px]"
                aria-label="Search products"
              >
                <Search className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate text-[13px]">Search...</span>
                <kbd className="ml-auto hidden xl:inline-flex h-5 items-center rounded border border-neutral-200 dark:border-neutral-700 px-1.5 text-[10px] font-semibold text-neutral-400">
                  ⌘K
                </kbd>
              </button>

              {/* Location indicator */}
              <LocationIndicator onOpenLocationPrompt={onOpenLocationPrompt} />

              {/* Notifications */}
              <Link href="/account/notifications" className="relative flex items-center justify-center h-9 w-9 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors press" aria-label="Notifications">
                <Bell className="h-[18px] w-[18px] text-neutral-600 dark:text-neutral-300" />
              </Link>

              {/* Cart */}
              <CartBadgeLink />

              {/* Account */}
              {user?.id ? (
                <Link
                  href="/account"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 dark:bg-white transition-transform press"
                  aria-label="Your account"
                >
                  <span className="text-xs font-black text-white dark:text-neutral-900">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 h-9 px-4 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-semibold transition-transform press"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header — collapses on scroll down, reappears on scroll up */}
      <header
        className={`ios-sticky-tracking-header ios-glass md:hidden transition-transform duration-300 ease-out ${
          mobileHeaderHidden ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="flex h-14 items-center justify-between px-4">
          {/* Back button on inner pages OR store branding on home */}
          {isInnerPage ? (
            <button onClick={handleBack} className="flex items-center gap-2 min-w-0 press group">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 transition-colors group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700">
                <ArrowLeft className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
              </div>
              <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300 truncate">Back</span>
            </button>
          ) : (
            <Link href="/" className="flex items-center gap-2.5 min-w-0 press">
              {logoUrl ? (
                <Image src={logoUrl} alt={storeName} width={32} height={32} className="h-8 w-8 rounded-xl object-contain" unoptimized />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-900 dark:bg-white">
                  <span className="text-xs font-black text-white dark:text-neutral-900">{storeName.charAt(0)}</span>
                </div>
              )}
              <div className="min-w-0">
                <AnimatedStoreName name={storeName} className="font-display text-lg font-black tracking-tight truncate" />
              </div>
            </Link>
          )}

          {/* Right icons */}
          <div className="flex items-center gap-2">
            <LocationIndicator onOpenLocationPrompt={onOpenLocationPrompt} compact />
            <Link href="/account/notifications" className="relative flex items-center justify-center h-9 w-9 rounded-full bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors press" aria-label="Notifications">
              <Bell className="h-[17px] w-[17px] text-neutral-600 dark:text-neutral-300" />
            </Link>
          </div>
        </div>
      </header>

      {/* Global search sheet */}
      <GlobalSearchSheet open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
});

// Isolated cart badge link - only this component re-renders when cart count changes
function CartBadgeLink() {
  const totalItems = useCartItemCount();
  return (
    <Link href="/cart" data-cart-icon className="relative flex items-center justify-center h-9 w-9 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors press" aria-label={`Cart${totalItems > 0 ? `, ${totalItems} items` : ""}`}>
      <ShoppingBag className="h-[18px] w-[18px] text-neutral-600 dark:text-neutral-300" />
      <AnimatePresence mode="popLayout">
        {totalItems > 0 && (
          <motion.span
            key={totalItems}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={springs.tap}
            className="absolute -top-0.5 -right-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-neutral-900 dark:bg-white text-[10px] font-black text-white dark:text-neutral-900 px-1 ring-2 ring-white dark:ring-neutral-950"
          >
            {totalItems}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}

// Location indicator - shows saved delivery address with ETA
function LocationIndicator({ onOpenLocationPrompt, compact }: { onOpenLocationPrompt?: () => void; compact?: boolean }) {
  const [location, setLocation] = useState<DeliveryLocation | null>(null);

  useEffect(() => {
    setLocation(getSavedLocation());

    const handleUpdate = () => setLocation(getSavedLocation());
    window.addEventListener("location-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("location-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  if (!location) return null;

  if (compact) {
    return (
      <button
        onClick={onOpenLocationPrompt}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-secondary-50 dark:bg-secondary-900/30 hover:bg-secondary-100 dark:hover:bg-secondary-900/50 transition-colors press"
        aria-label="Change delivery location"
      >
        <MapPin className="h-3.5 w-3.5 text-secondary-600 dark:text-secondary-400" />
        {location.eta && (
          <span className="text-micro font-bold text-secondary-700 dark:text-secondary-300">{location.eta}</span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={onOpenLocationPrompt}
      className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary-50 dark:bg-secondary-900/30 hover:bg-secondary-100 dark:hover:bg-secondary-900/50 transition-colors press"
      aria-label="Change delivery location"
    >
      <MapPin className="h-3.5 w-3.5 text-secondary-600 dark:text-secondary-400" />
      <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 max-w-[100px] truncate">
        {location.area || location.pincode || "Location"}
      </span>
      {location.eta && (
        <span className="flex items-center gap-0.5 text-[10px] font-bold text-secondary-600 dark:text-secondary-400">
          <Clock className="h-2.5 w-2.5" />
          {location.eta}
        </span>
      )}
    </button>
  );
}
