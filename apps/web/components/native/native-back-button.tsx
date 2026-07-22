"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { registerBackButton } from "@/lib/native-bridge";

/**
 * NativeBackButton — wires Android hardware back button to Next.js router.
 *
 * On Android, pressing the hardware/gesture back button triggers Capacitor's
 * "backButton" event. Without handling, it exits the app. This component
 * routes it through Next.js router.back() so it behaves like iOS swipe-back.
 */
export function NativeBackButton() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const cleanup = registerBackButton(() => {
      // If we're on the homepage, let Capacitor exit the app (default behavior).
      // Otherwise, navigate back.
      if (pathname !== "/") {
        router.back();
      }
    });

    return cleanup;
  }, [router, pathname]);

  return null;
}
