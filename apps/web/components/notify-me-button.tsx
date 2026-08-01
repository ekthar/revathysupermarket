"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellRing, Check, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { springs, tapScale } from "@/lib/motion";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

type State = "idle" | "saving" | "done" | "signin";

/**
 * NotifyMeButton — restock alert request for sold-out products.
 *
 * Replaces a disabled add-to-cart button, which is a dead end. Unauthenticated
 * users are routed to sign-in (with a return path) rather than being shown an
 * error, since the alert needs a delivery channel.
 */
export function NotifyMeButton({
  productId,
  productName,
  compact = false,
}: {
  productId: string;
  productName: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<State>("idle");

  const handleClick = useCallback(async () => {
    if (state === "saving" || state === "done") return;

    if (state === "signin") {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setState("saving");
    haptic("light");

    try {
      const res = await fetch("/api/stock-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      if (res.status === 401) {
        setState("signin");
        return;
      }

      const data = (await res.json().catch(() => null)) as { status?: string } | null;

      // Restocked between render and tap — refresh so the card becomes buyable.
      if (data?.status === "in_stock") {
        router.refresh();
        setState("idle");
        return;
      }

      if (!res.ok) {
        setState("idle");
        return;
      }

      setState("done");
      haptic("medium");
    } catch {
      setState("idle");
    }
  }, [state, productId, router]);

  const label =
    state === "done"
      ? "We'll notify you"
      : state === "signin"
        ? "Sign in to get alerts"
        : "Notify me";

  const ariaLabel =
    state === "done"
      ? `You will be notified when ${productName} is back in stock`
      : `Notify me when ${productName} is back in stock`;

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={state === "saving"}
      whileTap={state === "saving" ? undefined : tapScale.primary}
      transition={springs.tap}
      aria-label={ariaLabel}
      aria-live="polite"
      title={label}
      className={cn(
        // 44px min touch target, matching --touch-target.
        "press inline-flex h-11 items-center justify-center gap-1.5 rounded-full border font-bold transition-colors",
        compact ? "w-11 px-0" : "px-3.5 text-caption",
        state === "done"
          ? "border-secondary-200 bg-secondary-50 text-secondary-700 dark:border-secondary-800 dark:bg-secondary-900/30 dark:text-secondary-300"
          : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
      )}
    >
      {state === "saving" ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
      ) : state === "done" ? (
        <Check className="h-4 w-4 shrink-0" />
      ) : state === "signin" ? (
        <BellRing className="h-4 w-4 shrink-0" />
      ) : (
        <Bell className="h-4 w-4 shrink-0" />
      )}
      {!compact && <span className="truncate">{label}</span>}
    </motion.button>
  );
}
