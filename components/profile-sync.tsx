"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

/**
 * Syncs the pending name from onboarding (stored in localStorage)
 * to the server after Google OAuth completes.
 */
export function ProfileSync() {
  const { data: session, status } = useSession();
  const synced = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id || synced.current) return;

    const pendingName = localStorage.getItem("pending-name");
    if (!pendingName) return;

    synced.current = true;
    localStorage.removeItem("pending-name");

    // Only update if user doesn't already have a name
    if (session.user.name && session.user.name.trim().length > 0) return;

    fetch("/api/auth/complete-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: pendingName })
    }).catch(() => null);
  }, [session, status]);

  return null;
}
