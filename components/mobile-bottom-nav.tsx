"use client";

import Link from "next/link";
import { Home, Search, ShoppingBag, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/components/cart/cart-provider";
import { formatCurrency } from "@/lib/utils";
import type { SessionIdentity } from "@/components/session-identity-card";
import { cn } from "@/lib/utils";

export function MobileBottomNav({ user }: { user: SessionIdentity }) {
  const pathname = usePathname();
  const { totalItems, subtotal } = useCart();

  if (["/login", "/welcome"].includes(pathname) || pathname.startsWith("/staff") || pathname.startsWith("/admin")) return null;

  // Hide bottom nav entirely on cart/checkout pages on mobile
  const isCartFlow = pathname.startsWith("/cart") || pathname.startsWith("/checkout");

  const tabs = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/products", icon: Search, label: "Browse" },
    { href: "/cart", icon: ShoppingBag, label: "Cart" },
    { href: user?.id ? "/account" : "/login", icon: User, label: user?.id ? "Account" : "Login" }
  ];

  return (
    <>
      {/* SINGLE floating cart bar - only shows when items in cart AND not on cart/checkout pages */}
      <AnimatePresence>
        {totalItems > 0 && !isCartFlow && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="fixed bottom-[62px] inset-x-0 z-[55] flex justify-center px-4 md:hidden"
            style={{ paddingBottom: "var(--safe-bottom)" }}
          >
            <Link
              href="/cart"
              className="flex items-center justify-between w-full max-w-md px-5 py-3 rounded-full bg-slate-900 text-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] press ripple"
            >
              <motion.span
                key={totalItems}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[13px] font-semibold"
              >
                {totalItems} Item{totalItems > 1 ? "s" : ""} Selected
              </motion.span>
              <motion.span
                key={`price-${subtotal}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="text-[14px] font-bold"
              >
                {formatCurrency(subtotal)}
              </motion.span>
              <motion.span
                whileTap={{ scale: 0.85, rotate: -10 }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 -mr-1"
              >
                <ShoppingBag className="h-4 w-4 text-white" />
              </motion.span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation tabs - no cart badge here (single cart bar above handles it) */}
      <nav className="fixed inset-x-0 bottom-0 z-50 bg-white/98 dark:bg-slate-950/98 backdrop-blur-md border-t border-slate-100/80 dark:border-slate-800/80 md:hidden" style={{ paddingBottom: "var(--safe-bottom)" }}>
        <div className="grid grid-cols-4 h-[56px]">
          {tabs.map((tab) => {
            const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-[3px] text-[10px] font-medium transition-colors",
                  active ? "text-slate-900 dark:text-white" : "text-slate-400"
                )}
              >
                <motion.span
                  whileTap={{ scale: 0.8 }}
                  className="relative"
                >
                  <tab.icon
                    className={cn(
                      "h-[22px] w-[22px] transition-all",
                      active && "scale-110"
                    )}
                    strokeWidth={active ? 2.2 : 1.8}
                  />
                </motion.span>
                <span className={cn(
                  "leading-none transition-all",
                  active ? "font-bold" : "font-medium"
                )}>
                  {tab.label}
                </span>
                {/* Active indicator line */}
                {active && (
                  <motion.span
                    layoutId="activeTabIndicator"
                    className="absolute -bottom-0 h-[2px] w-4 rounded-full bg-slate-900"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
