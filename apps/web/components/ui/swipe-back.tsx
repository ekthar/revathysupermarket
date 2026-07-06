"use client";

import { useEffect, useRef } from "react";

const EDGE_THRESHOLD = 30;
const SWIPE_THRESHOLD = 80;

export function SwipeBack({ children }: { children: React.ReactNode }) {
  const startX = useRef(0);
  const startY = useRef(0);
  const isTracking = useRef(false);

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      if (startX.current <= EDGE_THRESHOLD) {
        isTracking.current = true;
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (!isTracking.current) return;
      const dx = e.touches[0].clientX - startX.current;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > dx) {
        isTracking.current = false;
        return;
      }
      if (dx > SWIPE_THRESHOLD) {
        isTracking.current = false;
        window.history.back();
      }
    }

    function onTouchEnd() {
      isTracking.current = false;
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd);

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return <>{children}</>;
}
