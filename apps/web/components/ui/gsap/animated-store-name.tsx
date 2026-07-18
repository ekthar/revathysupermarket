"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/**
 * AnimatedStoreName — continuous shine-sweep across the store name.
 *
 * A bright green highlight band sweeps across the text in a loop,
 * creating a metallic / premium feel. Dark-mode aware via CSS variables.
 * Honors `prefers-reduced-motion`: renders as solid colour, no animation.
 */
export function AnimatedStoreName({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !ref.current) return;

      // A3: Only animate on first visit per session
      const SESSION_KEY = "store-name-animated";
      if (typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY)) return;

      gsap.to(ref.current, {
        backgroundPositionX: "200%",
        duration: 3.5,
        ease: "none",
        repeat: 2,
        yoyo: true,
        onComplete: () => {
          try { sessionStorage.setItem(SESSION_KEY, "1"); } catch {}
        },
      });
    },
    { scope: ref }
  );

  return (
    <span
      ref={ref}
      className={cn("text-transparent bg-clip-text", className)}
      style={{
        backgroundImage:
          "linear-gradient(120deg, hsl(var(--foreground)) 0%, hsl(var(--foreground)) 30%, #22C55E 50%, hsl(var(--foreground)) 70%, hsl(var(--foreground)) 100%)",
        backgroundSize: "200% 100%",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
      }}
    >
      {name}
    </span>
  );
}
