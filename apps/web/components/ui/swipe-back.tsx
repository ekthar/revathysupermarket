"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { project, rubberband, clamp } from "@/lib/gesture-math";
import { useVelocityTracker } from "@/components/ui/gestures/use-velocity-tracker";

/**
 * SwipeBack — Apple-grade edge-swipe navigation with 1:1 tracking.
 *
 * Principles from Apple's "Designing Fluid Interfaces" (WWDC 2018):
 * - §2 Direct manipulation: page follows finger exactly from edge
 * - §3 Interruptibility: can grab/reverse at any point
 * - §5 Velocity handoff: fast swipe commits even if distance is small
 * - §6 Momentum projection: uses velocity to decide commit vs. cancel
 * - §9 Rubber-banding: first 15px is disambiguation zone
 *
 * Reduced motion: instant opacity cross-fade on back navigation.
 */

const EDGE_ZONE = 30; // px from left edge to start swipe
const DISAMBIGUATION_DISTANCE = 12; // px before committing to horizontal swipe
const COMMIT_VELOCITY = 300; // px/s — fast swipe commits regardless of distance
const COMMIT_DISTANCE_RATIO = 0.35; // 35% of screen width → commits

export function SwipeBack({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { track, getVelocity, reset } = useVelocityTracker();

  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const isTrackingRef = useRef(false);
  const isCommittedRef = useRef(false); // committed to horizontal swipe
  const isCommittingBackRef = useRef(false); // B10: animation in progress, block input
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentXRef = useRef(0);
  const rafRef = useRef<number>(0);

  const getWidth = useCallback(() => {
    return typeof window !== "undefined" ? window.innerWidth : 375;
  }, []);

  // Apply transform directly (no React state for 60fps)
  const applyTransform = useCallback((x: number) => {
    const container = containerRef.current;
    const overlay = overlayRef.current;
    if (!container || !overlay) return;

    const width = getWidth();
    const progress = clamp(x / width, 0, 1);

    // Page slides with finger
    container.style.transform = `translate3d(${x}px, 0, 0)`;

    // Overlay dims as page peels away
    overlay.style.opacity = String(1 - progress);
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

  // Spring-back animation (cancel)
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

  // Commit animation (navigate back)
  const commitBack = useCallback(() => {
    const container = containerRef.current;
    const overlay = overlayRef.current;
    if (!container || !overlay) return;

    // B10: Block new gestures during commit animation
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

    // Respect reduced motion
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function onTouchStart(e: TouchEvent) {
      const touch = e.touches[0];
      if (touch.clientX > EDGE_ZONE) return;
      // B10: Block new gestures during commit animation
      if (isCommittingBackRef.current) return;
      // Don't interfere with elements that opt out
      const target = e.target as HTMLElement;
      if (target.closest("[data-disable-edge-swipe]")) return;

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

      // Track velocity
      track(touch.clientX, touch.clientY);

      // Disambiguation: determine if this is a horizontal or vertical gesture
      if (!isCommittedRef.current) {
        const totalDist = Math.sqrt(dx * dx + dy * dy);
        if (totalDist < DISAMBIGUATION_DISTANCE) return;

        // If more vertical than horizontal, abort — let scroll happen normally
        if (Math.abs(dy) > Math.abs(dx)) {
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

      // B4 FIX: Only prevent default AFTER we've confirmed horizontal intent
      // This preserves scroll performance for vertical gestures
      if (isCommittedRef.current) {
        e.preventDefault();
      }

      // 1:1 tracking with slight rubber-band in the first few px
      // B6 FIX: Clamp dx to reasonable range (prevent unrealistic velocities)
      let x = Math.min(dx, getWidth());
      if (x < 0) {
        x = -rubberband(-x, getWidth(), 0.3); // resist backward
      }

      currentXRef.current = x;

      // Apply transform on RAF for compositor-thread perf
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
      // B6 FIX: Clamp velocity to reasonable max (prevents unrealistic projections)
      const vx = Math.min(Math.max(velocity.x, -2000), 2000);
      const x = currentXRef.current;
      const width = getWidth();

      // Decision: commit or cancel (Apple's velocity-based approach)
      const projectedEnd = x + project(vx);
      const commitByVelocity = vx > COMMIT_VELOCITY;
      const commitByDistance = x / width > COMMIT_DISTANCE_RATIO;
      const commitByProjection = projectedEnd / width > 0.5;

      if (prefersReduced) {
        // Reduced motion: just navigate without animation
        if (commitByVelocity || commitByDistance) {
          router.back();
        }
        return;
      }

      if (commitByVelocity || commitByDistance || commitByProjection) {
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
      {/* Dark overlay behind the page (visible during swipe) */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/30 pointer-events-none z-[-1]"
        style={{ opacity: 0 }}
        aria-hidden="true"
      />
      {/* Page content (transforms during swipe) */}
      <div ref={containerRef} style={{ willChange: "transform" }}>
        {children}
      </div>
    </>
  );
}
