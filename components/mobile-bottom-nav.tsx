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
  const scrollingDown = useScrollDirection();

  if (["/login", "/welcome"].includes(pathname) || pathname.startsWith("/staff") || pathname.startsWith("/admin")) return null;

  const isCartFlow = pathname.startsWith("/cart") || pathname.startsWith("/checkout");

  return (
    <>
      {/* Floating cart FAB - simple icon that collapses on scroll */}
      <AnimatePresence>
        {totalItems > 0 && !isCartFlow && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="fixed bottom-[72px] right-4 z-[55] md:hidden"
            style={{ marginBottom: "var(--safe-bottom)" }}
          >
            <Link
              href="/cart"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-[0_6px_24px_-4px_rgba(15,138,95,0.5)] press relative"
            >
              <ShoppingBag className="h-5 w-5 text-white" />
              <motion.span
                key={totalItems}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white px-1 shadow-sm"
              >
                {totalItems}
              </motion.span>
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
