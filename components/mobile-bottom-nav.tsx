"use client";

import Link from "next/link";
import { Home, LayoutDashboard, Search, ShoppingBag, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useCart } from "@/components/cart/cart-provider";
import type { SessionIdentity } from "@/components/session-identity-card";
import { isCustomerRole, isDeliveryPartnerRole, isStaffLoginRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

export function MobileBottomNav({ user }: { user: SessionIdentity }) {
  const pathname = usePathname();
  const { totalItems } = useCart();

  // Hide nav on onboarding/login/admin pages
  if (pathname.startsWith("/welcome") || pathname.startsWith("/admin") || pathname.startsWith("/staff")) return null;

  const items = [
    { href: "/", label: "Home", icon: Home, show: true },
    { href: "/products", label: "Shop", icon: Search, show: true },
    { href: "/cart", label: "Cart", icon: ShoppingBag, show: !isStaffLoginRole(user?.role) && !isDeliveryPartnerRole(user?.role), badge: totalItems },
    { href: "/dashboard", label: "Orders", icon: LayoutDashboard, show: !user || isCustomerRole(user.role) },
    { href: user?.id ? "/account" : "/login", label: user?.id ? "Account" : "Login", icon: User, show: true }
  ].filter((item) => item.show).slice(0, 5);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 md:hidden" style={{ paddingBottom: "var(--safe-bottom)" }}>
      <div className="mx-2 mb-2 rounded-[1.25rem] border border-white/60 bg-white/95 shadow-[0_-4px_24px_-8px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95">
        <div className={`grid grid-cols-${items.length} gap-0.5 px-1 py-1.5`}>
          {items.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-[10px] font-semibold transition-colors",
                  active ? "text-primary" : "text-slate-500 dark:text-slate-400"
                )}
              >
                <span className="relative">
                  <item.icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                  {item.badge && item.badge > 0 ? (
                    <motion.span
                      key={item.badge}
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-black text-white"
                    >
                      {item.badge}
                    </motion.span>
                  ) : null}
                </span>
                <span className={cn("leading-none", active && "font-bold")}>{item.label}</span>
                {active ? (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute -top-0.5 h-0.5 w-5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
