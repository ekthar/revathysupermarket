"use client";

import Link from "next/link";
import { Home, Search, ShoppingBag, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGroup, motion } from "framer-motion";
import { memo } from "react";
import { useCartItemCount } from "@/components/cart/cart-provider";
import type { SessionIdentity } from "@/components/session-identity-card";
import { cn } from "@/lib/utils";

export const MobileBottomNav = memo(function MobileBottomNav({ user }: { user: SessionIdentity }) {
  const pathname = usePathname();
  const router = useRouter();

  if (["/login", "/welcome"].includes(pathname) || pathname.startsWith("/staff") || pathname.startsWith("/admin")) return null;

  const isCartFlow = pathname.startsWith("/cart") || pathname.startsWith("/checkout");

  const accountHref = user?.id ? "/account" : "/login";

  return (
    <>
      <nav className="ios-bottom-bar md:hidden" data-disable-edge-swipe="true">
        <div className="ios-glass mx-auto w-full max-w-[24rem] rounded-xl p-2 shadow-elevation-3">
          <LayoutGroup>
            <div className="grid min-h-[clamp(52px,8vh,58px)] grid-cols-4 items-center gap-1">
              <NavTab href="/" icon={Home} label="Home" active={pathname === "/"} onPrefetch={() => router.prefetch("/")} />
              <NavTab href="/products" icon={Search} label="Browse" active={pathname.startsWith("/products")} onPrefetch={() => router.prefetch("/products")} />
              <CartNavTab href="/cart" active={isCartFlow} onPrefetch={() => router.prefetch("/cart")} />
              <NavTab
                href={accountHref}
                icon={User}
                label={user?.id ? "You" : "Login"}
                active={pathname.startsWith("/account") || pathname === "/login" || pathname.startsWith("/dashboard")}
                onPrefetch={() => router.prefetch(accountHref)}
              />
            </div>
          </LayoutGroup>
        </div>
      </nav>
    </>
  );
});

// Isolated cart nav tab - only this re-renders when cart count changes
function CartNavTab({ href, active, onPrefetch }: { href: string; active: boolean; onPrefetch?: () => void }) {
  const totalItems = useCartItemCount();
  return (
    <NavTab href={href} icon={ShoppingBag} label="Cart" active={active} badge={totalItems} onPrefetch={onPrefetch} />
  );
}

const NavTab = memo(function NavTab({ href, icon: Icon, label, active, badge, onPrefetch }: { href: string; icon: React.ElementType; label: string; active: boolean; badge?: number; onPrefetch?: () => void }) {
  return (
    <Link
      href={href}
      onMouseEnter={onPrefetch}
      onTouchStart={onPrefetch}
      className={cn(
        "relative flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-2 text-micro transition-colors focus-visible:ring-2 focus-visible:ring-primary/30",
        active ? "text-white" : "text-neutral-500 hover:bg-white/65 dark:hover:bg-neutral-800/65"
      )}
    >
      {/* Active background indicator — no layoutId animation on mount to prevent CLS */}
      {active && (
        <motion.div
          layoutId="nav-active-indicator"
          className="absolute inset-0 rounded-2xl bg-black shadow-elevation-3"
          style={{ willChange: "transform" }}
          transition={{
            type: "spring",
            stiffness: 380,
            damping: 32,
            mass: 0.8,
          }}
          // Prevent initial mount animation (no slide-in from wrong position)
          initial={false}
        />
      )}

      <div className="relative z-10">
        <Icon className="h-[20px] w-[20px]" strokeWidth={active ? 2.2 : 1.8} />
      </div>
      {badge ? (
        <span className="absolute right-[22%] top-1 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary-500 px-1 text-micro font-black text-white">
          {badge}
        </span>
      ) : null}
      <span className={cn("relative z-10 max-w-full truncate leading-none", active ? "font-black" : "font-semibold")}>
        {label}
      </span>
    </Link>
  );
});
