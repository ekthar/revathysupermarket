"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE } from "@/lib/constants";

/**
 * Footer — minimal, clean, Apple-style.
 * Mobile: just copyright (bottom nav handles navigation).
 * Desktop: compact grid with essential links.
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
    <footer className="border-t border-neutral-100 dark:border-neutral-800 mt-8 print:hidden">
      {/* Mobile: minimal — bottom nav handles navigation */}
      <div className="md:hidden py-5 px-4">
        <p className="text-xs text-neutral-500 dark:text-neutral-500 text-center">
          &copy; {new Date().getFullYear()} {name}
        </p>
      </div>

      {/* Desktop: compact links + copyright */}
      <div className="hidden md:block max-w-7xl mx-auto px-6 lg:px-8 py-10">
        <div className="flex flex-wrap items-start justify-between gap-8">
          {/* Brand */}
          <div className="max-w-xs">
            <h3 className="font-display text-base font-black text-neutral-900 dark:text-white">{name}</h3>
            <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Fresh groceries delivered to your door.
            </p>
            {address && (
              <p className="mt-2 text-xs text-neutral-400 dark:text-neutral-500">{address}</p>
            )}
          </div>

          {/* Links */}
          <div className="flex gap-12">
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">Shop</h4>
              <ul className="mt-3 space-y-2">
                <FooterLink href="/">Home</FooterLink>
                <FooterLink href="/products">All Products</FooterLink>
                <FooterLink href="/offers">Deals</FooterLink>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">Account</h4>
              <ul className="mt-3 space-y-2">
                <FooterLink href="/dashboard">Orders</FooterLink>
                <FooterLink href="/account/settings">Settings</FooterLink>
                <FooterLink href="/support">Help</FooterLink>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-5 border-t border-neutral-100 dark:border-neutral-800">
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            &copy; {new Date().getFullYear()} {name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
        {children}
      </Link>
    </li>
  );
}
