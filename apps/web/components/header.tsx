"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Bell, Heart, HelpCircle, ShoppingBag, User } from "lucide-react";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
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
  const router = useRouter();
  const { totalItems } = useCart();

  // Hide on login/welcome/staff/admin/delivery
  if (["/login", "/welcome"].includes(pathname) || pathname.startsWith("/staff") || pathname.startsWith("/admin") || pathname.startsWith("/delivery")) return null;

  // Determine if we're on an inner page that needs a back button
  const innerPages = ["/account/settings", "/account/favorites", "/account/loyalty", "/account/notifications", "/account/edit", "/account/wallet", "/support", "/checkout"];
  const isInnerPage = innerPages.some((p) => pathname.startsWith(p)) || (pathname.startsWith("/account/") && pathname !== "/account");
  const parentPath = pathname.startsWith("/account/") ? "/account" : pathname.startsWith("/checkout") ? "/cart" : "/";

  const navLinks = [
    { href: "/products", label: "Shop" },
    { href: "/products?view=categories", label: "Categories" },
    { href: "/products?sort=offers", label: "Deals" },
    { href: "/products?category=Fruits", label: "Fresh Produce" },
  ];

  return (
    <>
      {/* Desktop Header */}
      <header className="sticky top-0 z-40 hidden md:block bg-white dark:bg-neutral-950 border-b border-neutral-100 dark:border-neutral-800">
        {/* Top bar */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-[70px]">
            {/* Logo + Back button for inner pages */}
            <div className="flex items-center gap-3">
              {isInnerPage && (
                <button
                  onClick={() => router.push(parentPath)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors press"
                  aria-label="Go back"
                >
                  <ArrowLeft className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
                </button>
              )}
              <Link href="/" className="flex items-center gap-2 press">
              {logoUrl && (
                <Image src={logoUrl} alt={storeName} width={36} height={36} className="h-9 w-9 rounded-lg object-contain" unoptimized />
              )}
              <span className="font-display text-2xl font-black tracking-tight text-neutral-900 dark:text-white uppercase">
                {storeName}
              </span>
            </Link>
            </div>

            {/* Navigation links */}
            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-semibold transition-colors ${
                    pathname === link.href || pathname.startsWith(link.href.split("?")[0])
                      ? "text-primary"
                      : "text-neutral-600 hover:text-neutral-900 dark:text-white"
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
                className="hidden xl:flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
                Help & Support
              </Link>

              <Link href="/account/favorites" className="relative flex items-center justify-center h-10 w-10 rounded-full bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors press">
                <Heart className="h-[18px] w-[18px] text-neutral-600 dark:text-neutral-300" />
              </Link>

              <Link href="/account/notifications" className="relative flex items-center justify-center h-10 w-10 rounded-full bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors press">
                <Bell className="h-[18px] w-[18px] text-neutral-600 dark:text-neutral-300" />
              </Link>

              <Link href="/cart" className="relative flex items-center justify-center h-10 w-10 rounded-full bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors press">
                <ShoppingBag className="h-[18px] w-[18px] text-neutral-600 dark:text-neutral-300" />
                {totalItems > 0 && (
                  <motion.span
                    key={totalItems}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary text-micro font-bold text-white px-1"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </Link>

              {user?.id ? (
                <Link
                  href="/account"
                  className="flex items-center gap-2 h-10 px-4 rounded-full bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors press"
                >
                  <User className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
                  <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">{user.name?.split(" ")[0] || "Account"}</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 h-10 px-4 rounded-full border border-neutral-200 dark:border-neutral-700 hover:border-primary/30 hover:bg-primary/5 transition-all press"
                >
                  <User className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
                  <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">Login/Signup</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="ios-sticky-tracking-header ios-glass md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          {/* Back button on inner pages OR store branding on home */}
          {isInnerPage ? (
            <button onClick={() => router.push(parentPath)} className="flex items-center gap-2 min-w-0 press group">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 transition-colors group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700">
                <ArrowLeft className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
              </div>
              <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300 truncate">Back</span>
            </button>
          ) : (
            <Link href="/" className="flex items-center gap-2.5 min-w-0 press">
            {logoUrl ? (
              <Image src={logoUrl} alt={storeName} width={32} height={32} className="h-8 w-8 rounded-xl object-contain" unoptimized />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-secondary-500 to-secondary-600 shadow-sm shadow-secondary-200 dark:shadow-secondary-900/30">
                <span className="text-sm font-black text-white">{storeName.charAt(0)}</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="font-display text-title font-black tracking-tight text-neutral-900 dark:text-white truncate">
                {storeName}
              </p>
              <p className="text-micro font-medium text-secondary-600 dark:text-secondary-400">Fresh & Fast Delivery</p>
            </div>
          </Link>
          )}

          {/* Right icons */}
          <div className="flex items-center gap-2.5">
            <Link href="/account/notifications" className="relative flex items-center justify-center h-9 w-9 rounded-full bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors press">
              <Bell className="h-[17px] w-[17px] text-neutral-600 dark:text-neutral-300" />
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
