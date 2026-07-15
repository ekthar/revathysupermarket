"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE } from "@/lib/constants";

/**
 * Shared footer component for customer-facing pages.
 * Hidden on admin, staff, delivery, login, and welcome pages.
 */
export function Footer({ storeName, address }: { storeName?: string; address?: string }) {
  const pathname = usePathname();

  // Hide on non-customer routes
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/staff") ||
    pathname.startsWith("/delivery") ||
    pathname === "/login" ||
    pathname === "/welcome" ||
    pathname === "/register"
  ) {
    return null;
  }

  const name = storeName || SITE.name;

  return (
    <footer className="hidden md:block border-t border-neutral-100 dark:border-neutral-800 mt-4 print:hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-2 lg:grid-cols-4 footer-grid">
          <div>
            <h3 className="font-display text-lg font-black text-neutral-900 dark:text-white">{name}</h3>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Skip the long lines and heavy bags, we&apos;ll handle the delivery for you.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white">Main Pages</h4>
            <ul className="mt-3 space-y-2">
              <li><Link href="/" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">Home</Link></li>
              <li><Link href="/products" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">Shop All</Link></li>
              <li><Link href="/dashboard" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">My Orders</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white">Help</h4>
            <ul className="mt-3 space-y-2">
              <li><Link href="/support" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">Help Center</Link></li>
              <li><Link href="/account/settings" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">Account Settings</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white">Contact</h4>
            <ul className="mt-3 space-y-2">
              <li className="text-sm text-neutral-500 dark:text-neutral-400">{address || "Kerala, India"}</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800">
          <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center">
            &copy; {new Date().getFullYear()} {name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
