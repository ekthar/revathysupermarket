/**
 * GSAP Registered Effects — reusable animation presets.
 *
 * Usage:
 *   import "@/lib/gsap-effects"; // side-effect: registers effects
 *   gsap.effects.fadeUp(element);
 *   gsap.effects.countUp(element, { endValue: 45 });
 *   gsap.effects.clipReveal(element);
 *
 * Safety: gracefully no-ops if imported on the server (no throw).
 * Effects are registered once at module evaluation time.
 */

// D2: Window guard — prevents server-side crash
if (typeof window === "undefined") {
  // No-op on server: effects won't be registered but won't crash either
} else {
  const { gsap } = require("@/lib/gsap");

  // ─── fadeUp: standard entrance animation ─────────────────────────────────────
  gsap.registerEffect({
    name: "fadeUp",
    effect(targets: any, config: { y?: number; duration?: number; delay?: number }) {
      return gsap.from(targets, {
        opacity: 0,
        y: config.y ?? 24,
        duration: config.duration ?? 0.6,
        delay: config.delay ?? 0,
        ease: "power3.out",
      });
    },
    defaults: { y: 24, duration: 0.6, delay: 0 },
    extendTimeline: true,
  });

  // ─── countUp: animate a number from 0 to target ─────────────────────────────
  gsap.registerEffect({
    name: "countUp",
    effect(targets: any, config: { endValue?: number; duration?: number; prefix?: string; suffix?: string }) {
      const el = (targets as HTMLElement[])[0] || targets;
      const end = config.endValue ?? Number(((el as HTMLElement).textContent || "0").replace(/[^0-9.-]/g, ""));
      const obj = { value: 0 };
      return gsap.to(obj, {
        value: end,
        duration: config.duration ?? 1.2,
        ease: "power2.out",
        onUpdate() {
          (el as HTMLElement).textContent =
            (config.prefix ?? "") + Math.round(obj.value).toString() + (config.suffix ?? "");
        },
      });
    },
    defaults: { endValue: 0, duration: 1.2, prefix: "", suffix: "" },
    extendTimeline: true,
  });

  // ─── clipReveal: mask reveal from bottom ─────────────────────────────────────
  gsap.registerEffect({
    name: "clipReveal",
    effect(targets: any, config: { duration?: number; delay?: number; direction?: string }) {
      const dir = config.direction ?? "bottom";
      const clipFrom =
        dir === "bottom" ? "inset(100% 0 0 0)" :
        dir === "top" ? "inset(0 0 100% 0)" :
        dir === "left" ? "inset(0 100% 0 0)" :
        "inset(0 0 0 100%)";
      return gsap.fromTo(
        targets,
        { clipPath: clipFrom },
        {
          clipPath: "inset(0 0 0 0)",
          duration: config.duration ?? 0.8,
          delay: config.delay ?? 0,
          ease: "power3.inOut",
        }
      );
    },
    defaults: { duration: 0.8, delay: 0, direction: "bottom" },
    extendTimeline: true,
  });

  // ─── elasticPop: scale bounce for buttons ────────────────────────────────────
  gsap.registerEffect({
    name: "elasticPop",
    effect(targets: any, config: { scale?: number; duration?: number }) {
      return gsap.from(targets, {
        scale: config.scale ?? 0.5,
        opacity: 0,
        duration: config.duration ?? 0.5,
        ease: "elastic.out(1, 0.5)",
      });
    },
    defaults: { scale: 0.5, duration: 0.5 },
    extendTimeline: true,
  });
}

export {};
