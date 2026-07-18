# Animation Library Guidelines

## Decision: Keep Both (GSAP + Framer Motion)

**Rationale:** Each library excels at different things. The 60KB combined cost is
acceptable for a consumer grocery app where engagement and perceived quality
matter more than saving 30KB. Attempting to do everything with one library
would result in worse code quality and fighting against each library's design.

**Bundle impact:** ~60KB gzipped total (GSAP 28KB + Framer Motion 32KB).
This is less than a single product image and loads in parallel with content.

**Rule: Never remove one without migrating ALL its usages first.**

## When to use GSAP (lib/gsap.ts)
- Scroll-triggered animations (ScrollTrigger)
- Timeline sequences (orchestrated reveals)
- DOM manipulation animations (clip-path, drawSVG)
- Continuous animations (marquee, parallax)
- Performance-critical scroll effects

## When to use Framer Motion (lib/motion.ts)
- React component mount/unmount (AnimatePresence)
- Layout animations (layoutId, shared elements)
- Gesture responses (whileTap, whileHover, drag)
- Spring-physics for interactive elements
- Component-level state transitions

## Rule: Never mix both in the same component
A single component should use ONE animation library.
Cross-component: GSAP handles scroll sections, Framer handles interactive UI.
