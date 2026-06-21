"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { Bell, ChevronDown, Heart, HelpCircle, ShoppingBag, Truck, User } from "lucide-react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { SITE } from "@/lib/constants";
import type { SessionIdentity } from "@/components/session-identity-card";

export function Header({
  user,
  storeName = SITE.name,
  storeAddress = SITE.address,
  logoUrl
}: {
  user: SessionIdentity;
  storeName?: string;
  storeAddress?: string;
  logoUrl?: string | null;
}) {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hide on login/welcome/staff/admin
  if (["/login", "/welcome"].includes(pathname) || pathname.startsWith("/staff") || pathname.startsWith("/admin")) return null;

  const shortAddress = storeAddress.split(",")[0]?.trim() || storeAddress;

  const navLinks = [
    { href: "/products", label: "Shop" },
    { href: "/products?view=categories", label: "Categories" },
    { href: "/products?sort=offers", label: "Deals" },
    { href: "/products?category=Fruits", label: "Fresh Produce" },
  ];

  return (
    <>
      {/* Desktop Header */}
      <header className="sticky top-0 z-40 hidden md:block bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
        {/* Top bar */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-[70px]">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 press">
              {logoUrl && (
                <img src={logoUrl} alt={storeName} className="h-9 w-9 rounded-lg object-contain" />
              )}
              <span className="font-display text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                {storeName}
              </span>
            </Link>

            {/* Navigation links */}
            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-semibold transition-colors ${
                    pathname === link.href || pathname.startsWith(link.href.split("?")[0])
                      ? "text-primary"
                      : "text-slate-600 hover:text-slate-900 dark:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-3 ml-6">
              <Link
                href="/support"
                className="hidden xl:flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
                Help & Support
              </Link>

              <Link href="/account/favorites" className="relative flex items-center justify-center h-10 w-10 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors press">
                <Heart className="h-[18px] w-[18px] text-slate-600 dark:text-slate-300" />
              </Link>

              <Link href="/account/notifications" className="relative flex items-center justify-center h-10 w-10 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors press">
                <Bell className="h-[18px] w-[18px] text-slate-600 dark:text-slate-300" />
              </Link>

              <Link href="/cart" className="relative flex items-center justify-center h-10 w-10 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors press">
                <ShoppingBag className="h-[18px] w-[18px] text-slate-600 dark:text-slate-300" />
                {totalItems > 0 && (
                  <motion.span
                    key={totalItems}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white px-1"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </Link>

              {user?.id ? (
                <Link
                  href="/account"
                  className="flex items-center gap-2 h-10 px-4 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors press"
                >
                  <User className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{user.name?.split(" ")[0] || "Account"}</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 h-10 px-4 rounded-full border border-slate-200 dark:border-slate-700 hover:border-primary/30 hover:bg-primary/5 transition-all press"
                >
                  <User className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Login/Signup</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="ios-sticky-tracking-header ios-glass md:hidden">
        <div className="flex items-center justify-between px-4 h-[56px]">
          {/* Delivery address */}
          <Link href="/" className="flex items-center gap-2.5 min-w-0 press">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800">
              <Truck className="h-4 w-4 text-slate-700 dark:text-slate-300" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 font-medium">Delivery to</p>
              <div className="flex items-center gap-0.5">
                <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate">{shortAddress}</p>
                <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
              </div>
            </div>
          </Link>

          {/* Right icons */}
          <div className="flex items-center gap-2.5">
            <Link href="/account/notifications" className="relative flex items-center justify-center h-9 w-9 rounded-full bg-slate-50 dark:bg-slate-800 press">
              <Bell className="h-[17px] w-[17px] text-slate-600 dark:text-slate-300" />
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
