"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * LazyRender — renders children only when the placeholder enters the viewport.
 * Uses IntersectionObserver with a generous rootMargin so content is ready
 * before the user scrolls to it (no visible pop-in).
 *
 * Once visible, fades in content smoothly (native-feel morph).
 * Once rendered, stays rendered (no unmounting on scroll away).
 */
export function LazyRender({
  children,
  className,
  height = 200,
  rootMargin = "200px",
}: {
  children: ReactNode;
  className?: string;
  height?: number;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  if (visible) {
    return (
      <div
        className={className}
        style={{ animation: "lazyFadeIn 0.3s cubic-bezier(0.25, 0.1, 0.25, 1) both" }}
      >
        {children}
      </div>
    );
  }

  // Placeholder with estimated height to prevent layout shift
  return (
    <div
      ref={ref}
      className={className}
      style={{ minHeight: height }}
      aria-hidden="true"
    />
  );
}
