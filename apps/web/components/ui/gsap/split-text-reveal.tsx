"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

/**
 * SplitTextReveal — per-word text entrance animation.
 *
 * Apple principle: text is ALWAYS readable. We never set opacity to 0.
 * The animation uses `clipPath` to reveal words from below — text is always
 * technically "there" but masked. If GSAP fails, text is fully visible
 * because the default CSS has no clip.
 *
 * This eliminates the flash where text would disappear then re-appear.
 */
export function SplitTextReveal({
  children,
  className,
  splitBy = "word",
  stagger = 0.04,
  duration = 0.5,
  y = 16,
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

  const normalizedText = children.replace(/\s+/g, ' ').trim();
  const segments = splitBy === "char"
    ? normalizedText.split("")
    : normalizedText.split(/(\s+)/);

  useGSAP(
    () => {
      const el = containerRef.current;
      if (!el) return;
      if (prefersReducedMotion()) return; // Text stays as-is, fully visible

      const targets = el.querySelectorAll<HTMLElement>(".split-segment");
      if (targets.length === 0) return;

      const ctx = gsap.context(() => {
        // Use fromTo with immediateRender: false
        // Text starts fully visible (no flash). On trigger, words animate up.
        gsap.fromTo(targets,
          { y, opacity: 0.3, rotateX },
          {
            y: 0,
            opacity: 1,
            rotateX: 0,
            duration,
            stagger,
            delay,
            ease: "power3.out",
            immediateRender: false, // Critical: don't hide text before trigger
            scrollTrigger: {
              trigger: el,
              start: triggerStart,
              toggleActions: once ? "play none none none" : "play none none reverse",
              once,
            },
          }
        );
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
            style={{ display: "inline-block" }}
          >
            {segment}
          </span>
        );
      })}
    </span>
  );
}
