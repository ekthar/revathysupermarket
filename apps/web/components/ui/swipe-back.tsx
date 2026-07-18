"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { project, rubberband, clamp } from "@/lib/gesture-math";
import { useVelocityTracker } from "@/components/ui/gestures/use-velocity-tracker";

/**
 * SwipeBack — Apple-grade edge-swipe navigation with 1:1 tracking.
 *
 * Apple "Designing Fluid Interfaces" (WWDC 2018):
 * - §2 Direct manipulation: page follows finger exactly from edge
 * - §3 Interruptibility: can grab/reverse at any point
 * - §5 Velocity handoff: fast swipe commits even if distance is small
 * - §6 Momentum projection: uses velocity to decide commit vs. cancel
 * - §9 Rubber-banding: first pixels are disambiguation zone
 *
 * Safety: disabled on checkout/cart/admin routes to prevent accidental navigation.
 * Reduced motion: instant opacity cross-fade on back navigation.
 */

const EDGE_ZONE = 20; // px from left edge to start swipe (narrower = fewer false positives)
const DISAMBIGUATION_DISTANCE = 20; // px before committing to horizontal swipe (increased for safety)
const COMMIT_VELOCITY = 400; // px/s — fast swipe commits (raised threshold)
const COMMIT_DISTANCE_RATIO = 0.4; // 40% of screen width → commits (raised from 35%)

/** Routes where swipe-back is dangerous (form loss, payment interruption) */
const DISABLED_ROUTES = [
  "/checkout",
  "/cart",
  "/admin",
  "/delivery",
  "/staff",
  "/login",
  "/register",
  "/account/add-address",
  "/account/edit-address",
  "/account/edit-profile",
  "/account/new-ticket",
];

function isSwipeDisabled(pathname: string): boolean {
  return DISABLED_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function SwipeBack({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { track, getVelocity, reset } = useVelocityTracker();

  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const isTrackingRef = useRef(false);
  const isCommittedRef = useRef(false);
  const isCommittingBackRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentXRef = useRef(0);
  const rafRef = useRef<number>(0);
  const pathnameRef = useRef(pathname);

  // Keep pathname ref in sync
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const getWidth = useCallback(() => {
    return typeof window !== "undefined" ? window.innerWidth : 375;
  }, []);

  const applyTransform = useCallback((x: number) => {
    const container = containerRef.current;
    const overlay = overlayRef.current;
    if (!container || !overlay) return;

    const width = getWidth();
    const progress = clamp(x / width, 0, 1);

    container.style.transform = `translate3d(${x}px, 0, 0)`;
    overlay.style.opacity = String(0.3 * (1 - progress));
    overlay.style.pointerEvents = progress > 0 ? "auto" : "none";
  }, [getWidth]);

  const resetTransform = useCallback(() => {
    const container = containerRef.current;
    const overlay = overlayRef.current;
    if (!container || !overlay) return;

    container.style.transform = "";
    container.style.transition = "";
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    overlay.style.transition = "";
  }, []);

  const springBack = useCallback(() => {
    const container = containerRef.current;
    const overlay = overlayRef.current;
    if (!container || !overlay) return;

    container.style.transition = "transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)";
    overlay.style.transition = "opacity 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)";
    container.style.transform = "translate3d(0, 0, 0)";
    overlay.style.opacity = "0";

    setTimeout(() => {
      container.style.transition = "";
      overlay.style.transition = "";
    }, 320);
  }, []);

  const commitBack = useCallback(() => {
    const container = containerRef.current;
    const overlay = overlayRef.current;
    if (!container || !overlay) return;

    isCommittingBackRef.current = true;

    const width = getWidth();
    container.style.transition = "transform 0.25s cubic-bezier(0.25, 0.1, 0.25, 1)";
    overlay.style.transition = "opacity 0.25s cubic-bezier(0.25, 0.1, 0.25, 1)";
    container.style.transform = `translate3d(${width}px, 0, 0)`;
    overlay.style.opacity = "0";

    setTimeout(() => {
      isCommittingBackRef.current = false;
      resetTransform();
      router.back();
    }, 260);
  }, [getWidth, resetTransform, router]);

  useEffect(() => {
    // In standalone PWA mode, iOS provides its own back gesture
    const isStandalone =
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as any).standalone);
    if (isStandalone) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length > 1) return;
      const touch = e.touches[0];
      if (touch.clientX > EDGE_ZONE) return;
      if (isCommittingBackRef.current) return;

      // Route-level opt-out: don't swipe on sensitive routes
      if (isSwipeDisabled(pathnameRef.current)) return;

      // Don't interfere with elements that opt out
      const target = e.target as HTMLElement;
      if (target.closest("[data-disable-edge-swipe]")) return;

      // Don't start if user is in an input/textarea (form safety)
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") return;

      startXRef.current = touch.clientX;
      startYRef.current = touch.clientY;
      currentXRef.current = 0;
      isTrackingRef.current = true;
      isCommittedRef.current = false;
      reset();
    }

    function onTouchMove(e: TouchEvent) {
      if (!isTrackingRef.current) return;

      const touch = e.touches[0];
      const dx = touch.clientX - startXRef.current;
      const dy = touch.clientY - startYRef.current;

      track(touch.clientX, touch.clientY);

      // Disambiguation: determine if horizontal or vertical
      if (!isCommittedRef.current) {
        const totalDist = Math.sqrt(dx * dx + dy * dy);
        if (totalDist < DISAMBIGUATION_DISTANCE) return;

        // If more vertical than horizontal (use 1.5x ratio for safety), abort
        if (Math.abs(dy) > Math.abs(dx) * 0.7) {
          isTrackingRef.current = false;
          return;
        }

        // If swiping left (wrong direction), abort
        if (dx < 0) {
          isTrackingRef.current = false;
          return;
        }

        isCommittedRef.current = true;
      }

      // Only prevent default AFTER horizontal intent confirmed
      if (isCommittedRef.current) {
        e.preventDefault();
      }

      // 1:1 tracking with rubber-band resistance
      let x = Math.min(dx, getWidth());
      if (x < 0) {
        x = -rubberband(-x, getWidth(), 0.3);
      }

      currentXRef.current = x;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (!prefersReduced) {
          applyTransform(Math.max(0, x));
        }
      });
    }

    function onTouchEnd() {
      if (!isTrackingRef.current || !isCommittedRef.current) {
        isTrackingRef.current = false;
        return;
      }

      isTrackingRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      const velocity = getVelocity();
      const vx = clamp(velocity.x, -2000, 2000);
      const x = currentXRef.current;
      const width = getWidth();

      // Decision: commit or cancel
      const commitByVelocity = vx > COMMIT_VELOCITY;
      const commitByDistance = x / width > COMMIT_DISTANCE_RATIO;

      if (prefersReduced) {
        if (commitByVelocity || commitByDistance) {
          router.back();
        }
        return;
      }

      if (commitByVelocity || commitByDistance) {
        commitBack();
      } else {
        springBack();
      }
    }

    function onTouchCancel() {
      if (isTrackingRef.current) {
        isTrackingRef.current = false;
        springBack();
      }
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchCancel);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [track, getVelocity, reset, getWidth, applyTransform, springBack, commitBack, router]);

  return (
    <>
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/30 pointer-events-none z-[1]"
        style={{ opacity: 0 }}
        aria-hidden="true"
      />
      <div ref={containerRef} className="z-[2] relative">
        {children}
      </div>
    </>
  );
}
