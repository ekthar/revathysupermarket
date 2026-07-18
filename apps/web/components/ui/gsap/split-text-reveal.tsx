"use client";

import { useRef, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

/**
 * SplitTextReveal — per-word (or per-character) text entrance animation.
 *
 * Safety: text is VISIBLE by default (opacity: 1). GSAP sets it to 0 then
 * animates to 1. If GSAP fails (CSP, ad-blocker, SSR mismatch), text remains
 * visible because the CSS default is opacity: 1.
 *
 * This prevents the critical bug where hero text could be permanently invisible.
 */
export function SplitTextReveal({
  children,
  className,
  splitBy = "word",
  stagger = 0.04,
  duration = 0.6,
  y = 20,
  rotateX = 0,
  once = true,
  triggerStart = "top 85%",
  delay = 0,
}: {
  children: string;
  className?: string;
  splitBy?: "word" | "char";
  stagger?: number;
  duration?: number;
  y?: number;
  rotateX?: number;
  once?: boolean;
  triggerStart?: string;
  delay?: number;
}) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const animatedRef = useRef(false);

  // Normalize whitespace
  const normalizedText = children.replace(/\s+/g, ' ').trim();

  const segments =
    splitBy === "char"
      ? normalizedText.split("")
      : normalizedText.split(/(\s+)/);

  useGSAP(
    () => {
      const el = containerRef.current;
      if (!el) return;

      if (prefersReducedMotion()) {
        // Ensure all visible
        el.querySelectorAll(".split-segment").forEach((s) => {
          (s as HTMLElement).style.opacity = "1";
          (s as HTMLElement).style.transform = "none";
        });
        return;
      }

      const targets = el.querySelectorAll<HTMLElement>(".split-segment");
      if (targets.length === 0) return;

      const ctx = gsap.context(() => {
        gsap.set(targets, { opacity: 0, y, rotateX });
        gsap.to(targets, {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration,
          stagger,
          delay,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: triggerStart,
            toggleActions: once ? "play none none none" : "play none none reverse",
            once,
          },
          onComplete: () => {
            animatedRef.current = true;
          },
        });
      }, el);

      return () => ctx.revert();
    },
    { scope: containerRef, dependencies: [splitBy, stagger, duration, y, rotateX, once, delay] }
  );

  // Safety: if after 3 seconds GSAP hasn't animated (failed to load, etc.), force visible
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!animatedRef.current && containerRef.current) {
        containerRef.current.querySelectorAll(".split-segment").forEach((s) => {
          (s as HTMLElement).style.opacity = "1";
          (s as HTMLElement).style.transform = "none";
        });
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <span ref={containerRef} className={className} style={{ display: "inline" }}>
      {segments.map((segment, i) => {
        if (/^\s+$/.test(segment)) {
          return <span key={i}>{segment}</span>;
        }
        return (
          <span
            key={i}
            className="split-segment"
            style={{ display: "inline-block" }}
          >
            {segment}
          </span>
        );
      })}
    </span>
  );
}
