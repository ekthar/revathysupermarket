"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Unified Logo Component
 * =======================
 * Renders the store logo with automatic dark/light mode support.
 * Uses the SVG logos from /branding/ directory.
 *
 * To change the logo globally:
 * 1. Replace files in /branding/ directory (logo-light.svg, logo-dark.svg)
 * 2. Run `pnpm run generate:icons`
 * 3. Deploy
 *
 * Usage:
 * ```tsx
 * <Logo size={40} />
 * <Logo size={64} variant="icon" />
 * <Logo size={32} className="rounded-lg" />
 * ```
 */
export function Logo({
  size = 40,
  variant = "full",
  className,
  logoUrl,
}: {
  /** Size in pixels (width and height) */
  size?: number;
  /** "full" = rectangular logo, "icon" = square icon */
  variant?: "full" | "icon";
  /** Additional CSS classes */
  className?: string;
  /** Dynamic logo URL from admin settings (overrides static files) */
  logoUrl?: string | null;
}) {
  // If admin has uploaded a custom logo, use that (it works in both modes)
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt="Store logo"
        width={size}
        height={size}
        className={cn("object-contain", className)}
        unoptimized
      />
    );
  }

  // Use SVG logos with dark mode support via CSS
  // light mode → show logo-light.svg (dark logo)
  // dark mode → show logo-dark.svg (light logo)
  const lightSrc = variant === "icon" ? "/branding/logo-icon.svg" : "/branding/logo-light.svg";
  const darkSrc = variant === "icon" ? "/branding/logo-icon.svg" : "/branding/logo-dark.svg";

  return (
    <span className={cn("inline-flex shrink-0", className)} style={{ width: size, height: size }}>
      {/* Light mode logo */}
      <Image
        src={lightSrc}
        alt="Store logo"
        width={size}
        height={size}
        className="block dark:hidden object-contain w-full h-full"
        unoptimized
        priority
      />
      {/* Dark mode logo */}
      <Image
        src={darkSrc}
        alt="Store logo"
        width={size}
        height={size}
        className="hidden dark:block object-contain w-full h-full"
        unoptimized
        priority
      />
    </span>
  );
}

/**
 * LogoWithText - Logo alongside the store name
 */
export function LogoWithText({
  size = 36,
  storeName,
  logoUrl,
  className,
}: {
  size?: number;
  storeName?: string;
  logoUrl?: string | null;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Logo size={size} variant="icon" logoUrl={logoUrl} className="rounded-lg" />
      {storeName && (
        <span className="font-display text-2xl font-black tracking-tight text-neutral-900 dark:text-white uppercase">
          {storeName}
        </span>
      )}
    </span>
  );
}
