/**
 * GSAP foundation — single registration point for the whole web app.
 *
 * Import from here: `import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap"`.
 * Never call `gsap.registerPlugin(...)` anywhere else; plugins are registered
 * exactly once at module load so client bundles stay deterministic.
 *
 * Reduced-motion handling is centralized too: every GSAP hook/component must
 * check `prefersReducedMotion()` (or use `useReducedMotionGSAP`) and degrade
 * to a static layout when the user has requested reduced motion.
 */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Make ScrollTrigger refresh less aggressive on this app's route transitions.
ScrollTrigger.config({ ignoreMobileResize: true });

/** Runtime reduced-motion check (SSR-safe). */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export { gsap, ScrollTrigger };
