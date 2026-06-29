"use client";

import { usePathname } from "next/navigation";
import { IntroController } from "./intro-controller";

// Routes where the intro should NOT appear
const EXCLUDED_PREFIXES = ["/admin", "/delivery", "/staff", "/api"];

/**
 * Gate component that only renders the IntroController on customer-facing routes.
 * This ensures the intro never ships into admin/delivery/staff routes.
 */
export function IntroGate() {
  const pathname = usePathname();

  // Don't render on excluded routes
  if (EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  return <IntroController />;
}
