"use client";

import Link from "next/link";
import { Bell, ChevronDown, Heart, HelpCircle, MapPin, Menu, Search, ShoppingBag, Truck, User, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { InAppNotifications } from "@/components/in-app-notifications";
import type { SessionIdentity } from "@/components/session-identity-card";

export function Header({
  user,
  storeName = "Revathy",
  storeAddress = "Neyyattinkara"
}: {
  user: SessionIdentity;
  storeName?: string;
  storeAddress?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/products?q=${encodeURIComponent(q)}`);
      setSearchQuery("");
    }
  }

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
      <header className="sticky top-0 z-40 hidden md:block bg-white border-b border-slate-100">
        {/* Top bar */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-[70px]">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 press">
              <span className="font-display text-2xl font-black tracking-tight text-slate-900 uppercase">
                {storeName}
              </span>
            </Link>

            {/* Search bar - functional */}
            <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Grocery Items..."
                  className="w-full h-11 rounded-full bg-slate-50 border border-slate-200 pl-11 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-primary/50 focus:bg-white focus:shadow-sm transition-all"
                />
              </div>
            </form>

            {/* Navigation links */}
            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-semibold transition-colors ${
                    pathname === link.href || pathname.startsWith(link.href.split("?")[0])
                      ? "text-primary"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-3 ml-6">
              <Link
                href="/products"
                className="hidden xl:flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
                Help & Support
              </Link>

              <Link href="/account" className="relative flex items-center justify-center h-10 w-10 rounded-full bg-slate-50 hover:bg-slate-100 transition-colors press">
                <Heart className="h-[18px] w-[18px] text-slate-600" />
              </Link>

              <Link href="/cart" className="relative flex items-center justify-center h-10 w-10 rounded-full bg-slate-50 hover:bg-slate-100 transition-colors press">
                <ShoppingBag className="h-[18px] w-[18px] text-slate-600" />
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
                  className="flex items-center gap-2 h-10 px-4 rounded-full bg-slate-50 hover:bg-slate-100 transition-colors press"
                >
                  <User className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-semibold text-slate-700">{user.name?.split(" ")[0] || "Account"}</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 h-10 px-4 rounded-full border border-slate-200 hover:border-primary/30 hover:bg-primary/5 transition-all press"
                >
                  <User className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-semibold text-slate-700">Login/Signup</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="sticky top-0 z-40 md:hidden bg-white/98 backdrop-blur-md border-b border-slate-100/80">
        <div className="flex items-center justify-between px-4 h-[56px]">
          {/* Delivery address */}
          <Link href="/" className="flex items-center gap-2.5 min-w-0 press">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50">
              <Truck className="h-4 w-4 text-slate-700" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 font-medium">Delivery to</p>
              <div className="flex items-center gap-0.5">
                <p className="text-[13px] font-bold text-slate-900 truncate">{shortAddress}</p>
                <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
              </div>
            </div>
          </Link>

          {/* Right icons */}
          <div className="flex items-center gap-2.5">
            <InAppNotifications />

            <Link href="/cart" className="relative flex items-center justify-center h-9 w-9 rounded-full bg-slate-50 press">
              <ShoppingBag className="h-[17px] w-[17px] text-slate-600" />
              {totalItems > 0 && (
                <motion.span
                  key={totalItems}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary text-[8px] font-bold text-white px-0.5 pointer-events-none"
                >
                  {totalItems}
                </motion.span>
              )}
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
