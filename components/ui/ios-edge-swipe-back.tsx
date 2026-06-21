"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const EDGE_WIDTH_PX = 28;
const MIN_DISTANCE_PX = 72;
const MAX_VERTICAL_DRIFT_PX = 56;

export function IosEdgeSwipeBack() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let tracking = false;

    function isInteractiveTarget(target: EventTarget | null) {
      if (!(target instanceof Element)) return false;
      return Boolean(target.closest("input, textarea, select, button, a, [role='button'], [data-disable-edge-swipe='true']"));
    }

    function onTouchStart(event: TouchEvent) {
      if (event.touches.length !== 1 || isInteractiveTarget(event.target)) return;
      const touch = event.touches[0];
      tracking = touch.clientX <= EDGE_WIDTH_PX;
      startX = touch.clientX;
      startY = touch.clientY;
    }

    function onTouchMove(event: TouchEvent) {
      if (!tracking || event.touches.length !== 1) return;
      const touch = event.touches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = Math.abs(touch.clientY - startY);
      if (deltaX > 18 && deltaY < MAX_VERTICAL_DRIFT_PX) event.preventDefault();
    }

    function onTouchEnd(event: TouchEvent) {
      if (!tracking) return;
      tracking = false;
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = Math.abs(touch.clientY - startY);
      if (deltaX >= MIN_DISTANCE_PX && deltaY < MAX_VERTICAL_DRIFT_PX && window.history.length > 1) {
        router.back();
      }
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [pathname, router]);

  return null;
}
