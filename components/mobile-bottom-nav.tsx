"use client";

import Link from "next/link";
import { Home, Search, ShoppingBag, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart/cart-provider";
import type { SessionIdentity } from "@/components/session-identity-card";
import { cn } from "@/lib/utils";

export function MobileBottomNav({ user }: { user: SessionIdentity }) {
  const pathname = usePathname();
  const { totalItems } = useCart();

  // Hide on onboarding, login, staff, admin
  if (pathname === "/login" || pathname === "/welcome" || pathname.startsWith("/staff") || pathname.startsWith("/admin")) return null;

  const tabs = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/products", icon: Search, label: "Browse" },
    { href: "/cart", icon: ShoppingBag, label: "Cart", badge: totalItems },
    { href: user?.id ? "/account" : "/login", icon: User, label: user?.id ? "Account" : "Login" }
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 bg-white border-t border-slate-100 md:hidden" style={{ paddingBottom: "var(--safe-bottom)" }}>
      <div className="grid grid-cols-4 h-14">
        {tabs.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-slate-400"
              )}
            >
              <span className="relative">
                <tab.icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-white px-0.5">
                    {tab.badge}
                  </span>
                ) : null}
              </span>
              <span className={cn(active && "font-semibold")}>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
