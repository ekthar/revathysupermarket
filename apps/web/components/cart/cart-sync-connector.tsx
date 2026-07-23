"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { cartSyncQueue } from "@/lib/cart-sync";

/**
 * CartSyncConnector — connects the CartSyncQueue to the auth state.
 *
 * When the user is authenticated, enables background sync.
 * When logged out, disables sync (cart stays local-only).
 *
 * Mount this component inside the Providers tree, after SessionProvider.
 * It has no visual output.
 */
export function CartSyncConnector() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      cartSyncQueue.setAuthenticated(true);
    } else {
      cartSyncQueue.setAuthenticated(false);
    }
  }, [session, status]);

  return null;
}
