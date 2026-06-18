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

  const tabs = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/products", icon: Search, label: "Browse" },
    { href: "/cart", icon: ShoppingBag, label: "Cart", badge: totalItems },
    { href: user?.id ? "/account" : "/login", icon: User, label: user?.id ? "Account" : "Login" }
  ];

  return (
    <>
      {/* Floating cart bar - visible when items in cart */}
      <AnimatePresence>
        {totalItems > 0 && !pathname.startsWith("/cart") && !pathname.startsWith("/checkout") && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-[68px] inset-x-0 z-50 flex justify-center px-4 md:hidden"
            style={{ paddingBottom: "var(--safe-bottom)" }}
          >
            <Link
              href="/cart"
              className="flex items-center justify-between w-full max-w-md px-5 py-3 rounded-full bg-slate-900 text-white shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] press"
            >
              <span className="text-[13px] font-semibold">
                {totalItems} Item{totalItems > 1 ? "s" : ""} Selected
              </span>
              <span className="text-[14px] font-bold">
                {formatCurrency(subtotal)}
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 -mr-1">
                <ShoppingBag className="h-4 w-4 text-white" />
              </span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-50 bg-white/98 backdrop-blur-md border-t border-slate-100/80 md:hidden" style={{ paddingBottom: "var(--safe-bottom)" }}>
        <div className="grid grid-cols-4 h-[56px]">
          {tabs.map((tab) => {
            const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-[3px] text-[10px] font-medium transition-colors",
                  active ? "text-slate-900" : "text-slate-400"
                )}
              >
                <span className="relative">
                  <tab.icon
                    className={cn(
                      "h-[22px] w-[22px] transition-all",
                      active && "scale-110"
                    )}
                    strokeWidth={active ? 2.2 : 1.8}
                  />
                  {tab.badge && tab.badge > 0 ? (
                    <motion.span
                      key={tab.badge}
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 text-[8px] font-bold text-white px-0.5"
                    >
                      {tab.badge}
                    </motion.span>
                  ) : null}
                </span>
                <span className={cn(
                  "leading-none transition-all",
                  active ? "font-bold" : "font-medium"
                )}>
                  {tab.label}
                </span>
                {/* Active indicator dot */}
                {active && (
                  <motion.span
                    layoutId="activeTab"
                    className="absolute bottom-1 h-1 w-1 rounded-full bg-slate-900"
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
