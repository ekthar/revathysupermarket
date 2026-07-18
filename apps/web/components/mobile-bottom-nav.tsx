"use client";

import Link from "next/link";
import { Home, Search, ShoppingBag, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGroup, motion } from "framer-motion";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useCartItemCount } from "@/components/cart/cart-provider";
import type { SessionIdentity } from "@/components/session-identity-card";
import { cn } from "@/lib/utils";
import { springs } from "@/lib/motion";

export const MobileBottomNav = memo(function MobileBottomNav({ user }: { user: SessionIdentity }) {
  const pathname = usePathname();
  const router = useRouter();

  // Optimistic highlight: the tab the user just tapped. We move the indicator
  // to it *immediately* on tap instead of waiting for the route transition to
  // complete — that wait is the "laggy" feeling. `pathname` remains the source
  // of truth and reconciles the highlight once navigation settles.
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear the optimistic highlight once the real route matches.
  useEffect(() => {
    setPendingHref(null);
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, [pathname]);

  useEffect(() => () => { if (resetTimer.current) clearTimeout(resetTimer.current); }, []);

  const select = useCallback((href: string) => {
    setPendingHref(href);
    router.push(href);
    // Safety net: if navigation never lands (e.g. blocked/offline), fall back
    // to the real pathname so the indicator can't get stuck on the wrong tab.
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setPendingHref(null), 1500);
  }, [router]);

  if (["/login", "/welcome"].includes(pathname) || pathname.startsWith("/staff") || pathname.startsWith("/admin") || pathname.startsWith("/checkout") || pathname.startsWith("/delivery") || pathname.startsWith("/track")) return null;

  const accountHref = user?.id ? "/account" : "/login";
  const activePath = pendingHref ?? pathname;

  const homeActive = activePath === "/";
  const browseActive = activePath.startsWith("/products");
  const cartActive = activePath.startsWith("/cart") || activePath.startsWith("/checkout");
  const accountActive = activePath.startsWith("/account") || activePath === "/login" || activePath.startsWith("/dashboard");

  return (
    <nav className="ios-bottom-bar md:hidden" data-disable-edge-swipe="true">
      <div className="ios-glass mx-auto w-full max-w-[min(24rem,calc(100vw-1.5rem))] rounded-xl p-2 shadow-elevation-3">
        <LayoutGroup>
          <div className="grid min-h-[52px] grid-cols-4 items-center gap-1">
            <NavTab href="/" icon={Home} label="Home" active={homeActive} onSelect={select} onPrefetch={() => router.prefetch("/")} />
            <NavTab href="/products" icon={Search} label="Browse" active={browseActive} onSelect={select} onPrefetch={() => router.prefetch("/products")} />
            <CartNavTab href="/cart" active={cartActive} onSelect={select} onPrefetch={() => router.prefetch("/cart")} />
            <NavTab
              href={accountHref}
              icon={User}
              label={user?.id ? "You" : "Login"}
              active={accountActive}
              onSelect={select}
              onPrefetch={() => router.prefetch(accountHref)}
            />
          </div>
        </LayoutGroup>
      </div>
    </nav>
  );
});

// Isolated cart nav tab - only this re-renders when cart count changes
function CartNavTab({ href, active, onSelect, onPrefetch }: { href: string; active: boolean; onSelect: (href: string) => void; onPrefetch?: () => void }) {
  const totalItems = useCartItemCount();
  return (
    <div data-cart-icon>
      <NavTab href={href} icon={ShoppingBag} label="Cart" active={active} badge={totalItems} onSelect={onSelect} onPrefetch={onPrefetch} />
    </div>
  );
}

const NavTab = memo(function NavTab({ href, icon: Icon, label, active, badge, onSelect, onPrefetch }: { href: string; icon: React.ElementType; label: string; active: boolean; badge?: number; onSelect: (href: string) => void; onPrefetch?: () => void }) {
  return (
    <Link
      href={href}
      prefetch
      onMouseEnter={onPrefetch}
      onPointerDown={onPrefetch}
      onClick={(e) => {
        // Drive navigation ourselves so the indicator can move optimistically
        // in the same tick as the tap. Preserve modifier-click / middle-click.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        onSelect(href);
      }}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-2 text-micro transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary/30",
        active ? "text-white dark:text-black" : "text-neutral-500 hover:bg-white/65 dark:hover:bg-neutral-800/65"
      )}
    >
      {/* Shared-layout active indicator — a single pill that slides between
          tabs via GPU layout projection. `initial={false}` prevents a slide-in
          from the wrong position on first mount. */}
      {active && (
        <motion.div
          layoutId="nav-active-indicator"
          className="absolute inset-0 rounded-2xl bg-black dark:bg-white shadow-elevation-3"
          style={{ willChange: "transform" }}
          transition={springs.indicator}
          initial={false}
        />
      )}

      {/* Icon + label get a quick tactile press; the whole tab content sits
          above the indicator. */}
      <motion.span
        className="relative z-10 flex flex-col items-center gap-0.5"
        whileTap={{ scale: 0.92 }}
        transition={springs.tap}
      >
        <span className="relative">
          <Icon className="h-[20px] w-[20px]" strokeWidth={active ? 2.2 : 1.8} />
          {badge ? (
            <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary-500 px-1 text-micro font-black text-white">
              {badge > 99 ? "99+" : badge}
            </span>
          ) : null}
        </span>
        <span className={cn("max-w-full truncate leading-none", active ? "font-black" : "font-semibold")}>
          {label}
        </span>
      </motion.span>
    </Link>
  );
});
