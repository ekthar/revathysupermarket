"use client";

import Link from "next/link";
import { Apple, Carrot, MapPin, Milk, ShoppingBag, ShoppingBasket } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCart } from "@/components/cart/cart-provider";
import { SessionIdentityCard, type SessionIdentity } from "@/components/session-identity-card";
import { isCustomerRole, isDeliveryPartnerRole, isStaffLoginRole } from "@/lib/roles";

const flyingItems = [
  { icon: Apple, className: "text-berry-600" },
  { icon: Carrot, className: "text-orange-500" },
  { icon: Milk, className: "text-sky-500" }
];

export function Header({ user }: { user: SessionIdentity }) {
  const { totalItems } = useCart();
  const previousCount = useRef(totalItems);
  const [burst, setBurst] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!reduceMotion && totalItems > previousCount.current) setBurst((value) => value + 1);
    previousCount.current = totalItems;
  }, [reduceMotion, totalItems]);

  const navItems = [
    { href: "/", label: "Home", show: true },
    { href: "/products", label: "Shop", show: true },
    { href: "/dashboard", label: "My Orders", show: !user || isCustomerRole(user.role) },
    { href: "/delivery", label: "Delivery", show: isDeliveryPartnerRole(user?.role) },
    { href: "/admin", label: "Staff Panel", show: isStaffLoginRole(user?.role) }
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-950/5 bg-transparent px-2 pt-2 backdrop-blur-none dark:border-white/10">
      <div className="glass-nav mx-auto flex h-[4.75rem] max-w-7xl items-center justify-between gap-2 rounded-[1.65rem] px-3 sm:px-6 lg:px-8">
        <Link href="/" className="relative flex min-w-0 items-center gap-2.5 sm:gap-3">
          <motion.span
            whileTap={{ scale: 0.94 }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.35rem] bg-[linear-gradient(135deg,#0B6B4B,#0F8A5F)] text-white shadow-[0_16px_30px_-20px_rgba(15,138,95,0.85)]"
          >
            <ShoppingBasket className="h-5 w-5" />
          </motion.span>
          <span className="min-w-0">
            <span className="block truncate font-display text-[0.95rem] font-black uppercase leading-none tracking-wide text-slate-950 dark:text-white sm:text-lg">
              REVATHY SUPERMARKET
            </span>
            <span className="mt-1 flex items-center gap-1 text-[10px] font-black text-primary sm:text-[11px]">
              <MapPin className="h-3 w-3 shrink-0" />
              Neyyattinkara
            </span>
          </span>
          <AnimatePresence>
            {burst > 0 && !reduceMotion && (
              <span key={burst} className="pointer-events-none absolute left-6 top-2 z-50">
                {flyingItems.map((item, index) => (
                  <motion.span
                    key={`${burst}-${index}`}
                    initial={{ opacity: 0, x: 0, y: 0, scale: 0.6, rotate: -20 }}
                    animate={{ opacity: [0, 1, 1, 0], x: [0, 58 + index * 18, 132 + index * 16], y: [0, -18 - index * 4, 4], scale: [0.6, 1, 0.65], rotate: [-20, 10, 40] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.85, delay: index * 0.08, ease: "easeInOut" }}
                    className="absolute flex h-6 w-6 items-center justify-center rounded-full bg-card text-foreground shadow-lg ring-1 ring-border"
                  >
                    <item.icon className={`h-3.5 w-3.5 ${item.className}`} />
                  </motion.span>
                ))}
              </span>
            )}
          </AnimatePresence>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 dark:text-slate-300 md:flex">
          {navItems.filter((item) => item.show).map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-primary">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <div className="hidden lg:block">
            <SessionIdentityCard user={user} compact={false} className={user?.id ? "w-64" : ""} />
          </div>
          <div className="lg:hidden">
            <SessionIdentityCard user={user} compact className="p-0 border-0 bg-transparent" />
          </div>
          <Button asChild size="icon" title="Cart" className="relative h-10 w-10 rounded-2xl sm:h-11 sm:w-11">
            <Link href="/cart">
              <motion.span animate={burst > 0 && !reduceMotion ? { scale: [1, 1.18, 1] } : { scale: 1 }} transition={{ duration: 0.32 }}>
                <ShoppingBag className="h-4 w-4" />
              </motion.span>
              {totalItems > 0 && (
                <motion.span
                  key={totalItems}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: [0.5, 1.18, 1] }}
                  className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-lime-fresh px-1 text-[11px] font-black text-slate-950"
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
