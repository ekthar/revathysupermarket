"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

/**
 * CountUp — animates a number from 0 (or start) to a target value.
 *
 * Triggers on scroll into view. Honors reduced motion (shows final value).
 */
export function CountUp({
  end,
  start = 0,
  duration = 1.2,
  prefix = "",
  suffix = "",
  className,
  triggerStart = "top 85%",
}: {
  end: number;
  start?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  triggerStart?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      if (prefersReducedMotion()) {
        el.textContent = prefix + end.toString() + suffix;
        return;
      }

      const obj = { value: start };
      el.textContent = prefix + start.toString() + suffix;

      const ctx = gsap.context(() => {
        gsap.to(obj, {
          value: end,
          duration,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: triggerStart,
            once: true,
          },
          onUpdate() {
            el.textContent = prefix + Math.round(obj.value).toString() + suffix;
          },
        });
      }, el);

      return () => ctx.revert();
    },
    { scope: ref, dependencies: [end, start, duration, prefix, suffix] }
  );

  return (
    <span ref={ref} className={className}>
      {prefix}{end}{suffix}
    </span>
  );
}
