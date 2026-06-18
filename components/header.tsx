"use client";

import Link from "next/link";
import { MapPin, ShoppingBag, ShoppingBasket, User } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-provider";
import type { SessionIdentity } from "@/components/session-identity-card";
import { isStaffLoginRole } from "@/lib/roles";

export function Header({ user }: { user: SessionIdentity }) {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const previousCount = useRef(totalItems);
  const [burst, setBurst] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!reduceMotion && totalItems > previousCount.current) setBurst((value) => value + 1);
    previousCount.current = totalItems;
  }, [reduceMotion, totalItems]);

  // Hide header on onboarding/welcome pages
  if (pathname.startsWith("/welcome") || pathname === "/login") return null;
  // Hide on admin pages (admin has its own layout)
  if (pathname.startsWith("/admin") || pathname.startsWith("/staff")) return null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-100 bg-white/95 backdrop-blur-lg dark:border-white/8 dark:bg-slate-900/95">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white sm:h-10 sm:w-10">
            <ShoppingBasket className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-black uppercase leading-tight tracking-wide text-slate-900 dark:text-white sm:text-base">
              Revathy
            </span>
            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 sm:text-[11px]">
              <MapPin className="h-2.5 w-2.5" />
              Neyyattinkara
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
          {[
            { href: "/", label: "Home" },
            { href: "/products", label: "Shop" },
            { href: "/dashboard", label: "My Orders" }
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "font-bold text-primary" : "transition hover:text-primary"}
            >
              {item.label}
            </Link>
          ))}
          {isStaffLoginRole(user?.role) ? (
            <Link href="/admin" className="transition hover:text-primary">Staff Panel</Link>
          ) : null}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Account - desktop only */}
          {user?.id ? (
            <Link
              href="/account"
              className="hidden h-9 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 transition hover:border-primary/30 hover:bg-primary/5 dark:border-white/10 dark:bg-white/5 dark:text-white md:inline-flex"
            >
              <User className="h-3.5 w-3.5" />
              {user.name || "Account"}
            </Link>
          ) : (
            <Button asChild variant="outline" size="sm" className="hidden rounded-full text-xs font-bold md:inline-flex">
              <Link href="/login">Login</Link>
            </Button>
          )}

          {/* Cart button */}
          <Button asChild size="icon" className="relative h-9 w-9 rounded-xl sm:h-10 sm:w-10">
            <Link href="/cart">
              <motion.span
                animate={burst > 0 && !reduceMotion ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                transition={{ duration: 0.25 }}
              >
                <ShoppingBag className="h-4 w-4" />
              </motion.span>
              {totalItems > 0 && (
                <motion.span
                  key={totalItems}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-lime-fresh text-[10px] font-black text-slate-900"
                >
                  {totalItems}
                </motion.span>
              )}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
