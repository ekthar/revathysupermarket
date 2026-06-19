"use client";

import Link from "next/link";
import { Home, Search, ShoppingBag, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { formatCurrency } from "@/lib/utils";
import type { SessionIdentity } from "@/components/session-identity-card";
import { cn } from "@/lib/utils";

function useScrollDirection() {
  const [scrollingDown, setScrollingDown] = useState(false);
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        setScrollingDown(currentY > lastY && currentY > 80);
        lastY = currentY;
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrollingDown;
}

export function MobileBottomNav({ user }: { user: SessionIdentity }) {
  const pathname = usePathname();
  const { totalItems, subtotal } = useCart();

  if (["/login", "/welcome"].includes(pathname) || pathname.startsWith("/staff") || pathname.startsWith("/admin")) return null;

  const isCartFlow = pathname.startsWith("/cart") || pathname.startsWith("/checkout");

  return (
    <>
      {/* Floating cart bar - collapses to minimal on scroll down */}
      <AnimatePresence>
        {totalItems > 0 && !isCartFlow && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="fixed bottom-[68px] inset-x-0 z-[55] flex justify-center px-4 md:hidden"
            style={{ paddingBottom: "var(--safe-bottom)" }}
          >
            <Link
              href="/cart"
              className={cn(
                "flex items-center justify-between w-full max-w-md rounded-2xl bg-slate-900 dark:bg-slate-800 text-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] press transition-all duration-300",
                scrollingDown ? "px-3 py-2" : "px-4 py-2.5"
              )}
            >
              {/* Collapsed: just count + price. Expanded: full text */}
              {scrollingDown ? (
                <>
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-white/80" />
                    <span className="text-[13px] font-bold">{totalItems}</span>
                  </div>
                  <span className="text-[14px] font-bold text-emerald-400">{formatCurrency(subtotal)}</span>
                </>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <motion.p
                      key={totalItems}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[13px] font-bold"
                    >
                      {totalItems} item{totalItems > 1 ? "s" : ""} in cart
                    </motion.p>
                    <p className="text-[10px] text-white/60 truncate mt-0.5">
                      Tap to view cart
                    </p>
                  </div>
                  <motion.span
                    key={`price-${subtotal}`}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-emerald-400 text-white text-[14px] font-bold shadow-sm"
                  >
                    {formatCurrency(subtotal)}
                    <span className="text-[16px]">&rsaquo;</span>
                  </motion.span>
                </>
              )}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation - Foodizo style with elevated center cart */}
      <nav className="fixed inset-x-0 bottom-0 z-50 md:hidden" style={{ paddingBottom: "var(--safe-bottom)" }}>
        <div className="bg-white/98 dark:bg-slate-950/98 backdrop-blur-md border-t border-slate-100/80 dark:border-slate-800/80 px-4">
          <div className="flex items-end justify-around h-[56px] max-w-md mx-auto">
            {/* Home */}
            <NavTab href="/" icon={Home} label="Home" active={pathname === "/"} />

            {/* Browse */}
            <NavTab href="/products" icon={Search} label="Stores" active={pathname.startsWith("/products")} />

            {/* Center elevated Cart */}
            <Link
              href="/cart"
              className="relative flex flex-col items-center -mt-4"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "flex h-[52px] w-[52px] items-center justify-center rounded-full shadow-lg border-4 border-white dark:border-slate-950",
                  pathname.startsWith("/cart")
                    ? "bg-primary"
                    : "bg-gradient-to-br from-primary to-emerald-500"
                )}
              >
                <ShoppingBag className="h-5 w-5 text-white" />
                {totalItems > 0 && (
                  <motion.span
                    key={totalItems}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-orange-500 text-[8px] font-bold text-white px-0.5 shadow-sm"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </motion.div>
              <span className={cn(
                "text-[9px] font-semibold mt-1",
                pathname.startsWith("/cart") ? "text-primary" : "text-slate-400"
              )}>
                Cart
              </span>
            </Link>

            {/* Account/Login */}
            <NavTab
              href={user?.id ? "/account" : "/login"}
              icon={User}
              label={user?.id ? "Profile" : "Login"}
              active={pathname.startsWith("/account") || pathname === "/login"}
            />
          </div>
        </div>
      </nav>
    </>
  );
}

function NavTab({ href, icon: Icon, label, active }: { href: string; icon: React.ElementType; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center gap-[2px] py-2 px-3",
        active ? "text-primary" : "text-slate-400"
      )}
    >
      <motion.div whileTap={{ scale: 0.8 }}>
        <Icon className="h-[20px] w-[20px]" strokeWidth={active ? 2.2 : 1.8} />
      </motion.div>
      <span className={cn("text-[9px]", active ? "font-bold" : "font-medium")}>
        {label}
      </span>
    </Link>
  );
}
