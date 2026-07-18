---
name: apple-design
description: Apple's approach to interface design and fluid, physical motion, translated for the web. Use when building or reviewing gesture-driven UI, spring animations, drag/swipe/sheet interactions, momentum and interruptible transitions, translucent materials and depth, typography (optical sizing, tracking, leading), reduced-motion, or the design foundations (feedback, spatial consistency, restraint) behind Apple-style interfaces.
---

# Apple Design

How Apple builds interfaces that stop feeling like a computer and start feeling like an extension of you. This knowledge comes from Apple's WWDC design talks — chiefly *Designing Fluid Interfaces* (WWDC 2018) — distilled and translated into the web platform (CSS, Pointer Events, `requestAnimationFrame`, spring libraries like Motion/Framer Motion).

The through-line: **an interface feels alive when motion starts from the current on-screen value, inherits the user's velocity, projects momentum forward, and can be grabbed and reversed at any instant.** Springs are the tool that makes all of this natural, because they are inherently interruptible and velocity-aware.

## The Core Idea

> "When we align the interface to the way we think and move, something magical happens — it stops feeling like a computer and starts feeling like a seamless extension of us."

An interface is fluid when it behaves like the physical world: things respond instantly, move continuously, carry momentum, resist at boundaries, and can be redirected mid-motion. Everything below is a way to get closer to that.

Apple frames design as serving four human needs: **safety/predictability, understanding, achievement, and joy.** Every rule here serves one of them.

## 1. Response — kill latency

The moment lag appears, the feeling of directness "falls off a cliff." Response is the foundation everything else is built on.

- **Respond on pointer-down, not on release.** Highlight a button the instant it's pressed. Waiting for `click`/touch-up to show feedback feels dead.
- **Be vigilant about every latency.** Audit debounces, artificial timers, transition waits, and the ~300ms tap delay. Anything on the input path that isn't essential is a regression.
- **Feedback must be continuous *during* the interaction, not just at the end.** For a drag, slider, or drawer, update the UI 1:1 with the pointer the whole way through — never animate only when the gesture completes.

```css
/* Feedback lives on the press, and it's instant */
.button:active {
  transform: scale(0.97);
  transition: transform 100ms ease-out;
}
```

## 2. Direct manipulation — 1:1 tracking

> "Touch and content should move together."

When the user drags something, it must stay glued to the finger — and respect the offset from *where they grabbed it*. Snapping to the element's center on grab breaks the illusion immediately.

- Use Pointer Events with `setPointerCapture` so tracking continues even when the pointer leaves the element's bounds.
- Track a short **velocity/position history** (last few `pointermove` events), not just the current point — you'll need velocity at release.

## 3. Interruptibility — the single most important principle

> "The thought and the gesture happen in parallel."

Every animation must be interruptible and redirectable at any moment. A user must be able to grab a moving element mid-flight and reverse it without waiting for the animation to finish.

- **Never lock out input during a transition.**
- **Always animate from the *presentation* (current) value, never the target value.**
- **Avoid CSS transitions and `@keyframes` for anything gesture-driven** — springs animate from the current value by default.
- **When a gesture reverses, blend velocity — don't hard-cut it.**

## 4. Behavior over animation — use springs

A pre-scripted, fixed-duration animation can't respond to new input. A spring can — new input just changes the target, and the motion stays continuous.

- **Damping ratio** — controls overshoot. `1.0` = critically damped, no bounce.
- **Response** — how quickly the value reaches the target. Lower = snappier.

**Defaults:**
- Start most UI at **damping `1.0`** (critically damped).
- Add bounce (**damping ~`0.8`**) **only when the gesture itself carried momentum**.

## 5. Velocity handoff — the seam between drag and animation

When a gesture ends, the animation must **continue at the finger's exact velocity**, so there's no visible seam between dragging and animating.

## 6. Momentum projection — animate to where the gesture is *going*

Use velocity to **project the resting position** — exactly like scroll deceleration — then snap to the target nearest that projected point.

## 7. Spatial consistency — symmetric paths, anchored origins

- **Enter and exit along the same path.**
- **Anchor interactions to their source.**
- **Mirror the easing on reversible transitions.**

## 8. Hint in the direction of the gesture

Intermediate motion should telegraph where things are going.

## 9. Rubber-banding — soft boundaries

At an edge, resist progressively instead of stopping hard.

## 10. Gesture design details

- **Tap:** highlight on touch-*down*, commit on touch-*up*. Add ~10px hysteresis.
- **Drag/swipe:** require a small movement threshold before committing to a direction.
- **Detect all plausible gestures in parallel from the first move.**

## 11. Frame-level smoothness

- Keep the per-frame positional change below the perception threshold.
- Animate only compositor-friendly properties — `transform` and `opacity`.

## 12. Materials & depth — translucency conveys hierarchy

- Build nav/toolbars/sheets as translucent layers with content scrolling underneath.
- Material weight encodes hierarchy.
- Materialize, don't just fade — animate blur radius and scale together.

## 13. Multimodal feedback — motion + sound + haptics

1. **Causality** — obvious what caused the feedback.
2. **Harmony** — visual, sound, and haptic fire on the **same frame**.
3. **Utility** — add feedback only where it earns its place.

## 14. Reduced motion & accessibility

- `prefers-reduced-motion: reduce` — replace slides/springs with cross-fades.
- `prefers-reduced-transparency: reduce` — make translucent surfaces solid.
- `prefers-contrast: more` — near-solid backgrounds with contrasting borders.

## 15. Typography — optical sizing, tracking, leading

- Tracking is size-specific — tighten headings, body near `0`.
- Leading tracks size inversely — tight on headings, looser on body.
- Build hierarchy from weight + size + leading as a set.

## 16. Design foundations — the eight principles

1. Purpose  2. Agency  3. Responsibility  4. Familiarity
5. Flexibility  6. Simplicity  7. Craft  8. Delight

## Quick Reference

| Need | Technique | Concrete value |
| --- | --- | --- |
| Default UI spring | Critically damped | `damping 1.0`, `response 0.3–0.4` |
| Momentum / flick spring | Under-damped | `damping ~0.8`, `response 0.3–0.4` |
| Gesture → spring velocity | Hand off release velocity | pass raw px/s |
| Interrupt cleanly | Start from presentation value | read live transform |
| Boundary | Rubber-band | progressive resistance |
| Translucent chrome | `backdrop-filter` | content scrolls under |
| Reduced motion | Cross-fade, not slide/spring | `@media (prefers-reduced-motion)` |
