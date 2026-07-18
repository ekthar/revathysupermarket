# Revathy Supermarket — Industry-Level UI/UX Overhaul Plans

Five comprehensive plans to transform the web app from "good mobile-friendly site" to "indistinguishable from a native app with Apple-grade design and GSAP-powered animations."

---

## Plans Overview

| # | Plan | Focus | Effort | Key Outcome |
|---|---|---|---|---|
| 1 | [GSAP Animation Overhaul](./01-gsap-animation-overhaul.md) | Scroll animations, text reveals, micro-interactions, parallax | ~40h | Awwwards-level visual engagement |
| 2 | [Apple Fluid Mobile Gestures](./02-apple-fluid-mobile-gestures.md) | Gesture physics, velocity handoff, rubber-band, 1:1 tracking | ~52h | "Feels like iOS" on mobile |
| 3 | [Visual Rewrite](./03-visual-rewrite-apple-design.md) | Colors, typography, shadows, borders, materials | ~8-10h | Every pixel looks premium |
| 4 | [Native Feel & Jank Fix](./04-native-feel-jank-fix.md) | Status bar, CLS, scroll smoothness, touch feedback | ~8h | Zero jank, native-level polish |
| 5 | [Capacitor Native Android](./05-capacitor-native-android.md) | Native shell, edge-to-edge, haptics, deep links, Play Store | ~26h | Real Android app with native APIs |

**Total: ~134 hours for complete transformation**

---

## Recommended Implementation Order

### Sprint 1: Foundation (Week 1) — ~16h
1. **Plan 4, Batch 1-2**: Status bar fix + CLS elimination
2. **Plan 3, Priority 1-6**: Color/typography/border visual overhaul

*Result: App immediately looks and feels premium. Zero visible jank.*

### Sprint 2: Smoothness (Week 2) — ~20h
3. **Plan 4, Batch 3-4**: Scroll smoothness + directional navigation
4. **Plan 2, Phase 1**: Gesture math utilities + velocity tracker (foundation)
5. **Plan 1, P0**: GSAP plugin expansion + smooth scroll + hero text animation

*Result: Navigation feels native. Hero section is stunning.*

### Sprint 3: Gestures (Week 3-4) — ~30h
6. **Plan 2, Phase 2**: SwipeBack rebuild (1:1 tracking + velocity)
7. **Plan 2, Phase 3**: Draggable sheet with Apple physics
8. **Plan 2, Phase 5**: Push/pop directional transitions
9. **Plan 1, P1**: Page transitions, marquee, magnetic buttons, countUp

*Result: Every touch interaction feels fluid and physical.*

### Sprint 4: Native App (Week 4-5) — ~26h
10. **Plan 5, Phase 1-5**: Capacitor setup, edge-to-edge, haptics, splash
11. **Plan 5, Phase 6-8**: Deep links, push notifications, performance
12. **Plan 5, Phase 9-10**: Build, sign, Play Store

*Result: Android app on Play Store with native-level experience.*

### Sprint 5: Polish (Week 5-6) — ~30h
13. **Plan 2, Phase 4+6**: Momentum carousel, pull-to-refresh, swipe-to-delete
14. **Plan 1, P2-P3**: 3D tilt, confetti, velocity blur, header shrink
15. **Plan 3, remaining**: Push-back sheets, scroll-edge masks, animation limits

*Result: Every detail is considered. Industry-leading grocery app.*

---

## Design Reference

All plans are guided by the Apple Design steering file at `.kiro/steering/apple-design.md`, which encodes principles from WWDC's *Designing Fluid Interfaces* talk:

- **Response**: Feedback on pointer-down, not release
- **Direct manipulation**: 1:1 tracking with finger
- **Interruptibility**: Every animation can be grabbed mid-flight
- **Springs over durations**: Behavior, not prescribed animation
- **Velocity handoff**: No seam between gesture and animation
- **Momentum projection**: Animate to where the gesture is going
- **Spatial consistency**: Enter and exit along the same path
- **Rubber-banding**: Soft boundaries, never hard stops
- **Materials & depth**: Translucency conveys hierarchy
- **Multimodal feedback**: Motion + haptic on same frame

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 |
| Animation (scroll/reveal) | GSAP 3.15 + @gsap/react + ScrollTrigger |
| Animation (gesture/layout) | Framer Motion 11 |
| Styling | Tailwind CSS 3 + custom design tokens |
| Native shell | Capacitor 8 (Android + iOS) |
| Components | shadcn/ui (Radix) + custom |
| Haptics | @capacitor/haptics (native) / Vibration API (web) |
| Drawer/Sheet | Vaul (base) → custom gesture sheet (target) |

---

## Non-Negotiables (All Plans)

- `prefers-reduced-motion` respected everywhere
- Core Web Vitals green (LCP < 2.5s, CLS < 0.1, INP < 200ms)
- Dark mode consistency across all new effects
- 60fps during any gesture or animation
- No memory leaks on unmount
- Compositor-only properties for animation (transform + opacity)
- Every GSAP context reverted on cleanup
- Mobile-first: simpler animations on low-end devices
