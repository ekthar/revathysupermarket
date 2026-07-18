"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

/**
 * SplitTextReveal — per-word (or per-character) text entrance animation.
 *
 * Splits text into <span> wrappers and staggers them in with GSAP.
 * Supports ScrollTrigger for on-scroll reveals.
 *
 * Honors `prefers-reduced-motion`: shows text immediately with a simple fade.
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

  // Normalize whitespace before splitting (A18)
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
        gsap.set(el.querySelectorAll(".split-segment"), { opacity: 1, y: 0 });
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
        });
      }, el);

      return () => ctx.revert();
    },
    { scope: containerRef, dependencies: [splitBy, stagger, duration, y, rotateX, once, delay] }
  );

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
            style={{ display: "inline-block", willChange: "transform, opacity" }}
          >
            {segment}
          </span>
        );
      })}
    </span>
  );
}
