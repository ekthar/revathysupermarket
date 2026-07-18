# Animation Library Guidelines

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
