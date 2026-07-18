# Plan 2: Apple-Grade Fluid Interface — Mobile Web App

Based on Apple's *Designing Fluid Interfaces* (WWDC 2018) principles, translated to the web platform. Reference: `.kiro/steering/apple-design.md`

---

## Current Mobile State — Audit Against Apple Principles

### What's Already Right

| Apple Principle | Implementation | Score |
|---|---|---|
| Response on press | `.press:active { scale(0.97) }`, `whileTap` on cards/buttons | Good |
| Springs | `lib/motion.ts` has 7 spring presets (snappy, enter, gentle, etc.) | Excellent |
| Translucent materials | `.ios-glass` with `backdrop-filter: blur(22px) saturate(180%)` | Apple-grade |
| Reduced motion | Every GSAP component checks `prefersReducedMotion()` | Complete |
| Haptic feedback | `lib/haptics.ts` with vibrate API, used in cart/nav | Basic |
| Spatial consistency | `RouteTransition` soft-enters for tabs, animates for inner pages | Partial |
| Gesture: tap hysteresis | Bottom nav has optimistic highlight on tap | Good |
| Nav indicator | `layoutId="nav-active-indicator"` with spring physics | Apple-like |
| Fly-to-cart | Spring-driven image arc animation to cart icon | Exists |
| Vaul drawer | Bottom sheet with drag handle, rubber-band built-in | Foundation |
| Safe areas | Full `env(safe-area-inset-*)` support | PWA-ready |

### Critical Gaps

| Apple Principle | Gap | Severity |
|---|---|---|
| Direct manipulation | SwipeBack has NO visual feedback during swipe — threshold-and-fire, not 1:1 tracking | Critical |
| Interruptibility | Route transitions use AnimatePresence (fire-and-forget). Can't grab/cancel mid-transition | Critical |
| Velocity handoff | SwipeBack ignores velocity entirely — fires on threshold, not projection | Critical |
| Momentum projection | Horizontal product scroll has scroll-snap but no projected landing calculation | High |
| Rubber-banding | No rubber-band on pull-to-refresh, edge swipe, or overscroll indicators | High |
| Interruptibility | Floating cart bar enter/exit animation can't be interrupted if user navigates quickly | Medium |
| Gesture telegraphing | Bottom sheet open doesn't hint via progressive reveal during drag | Medium |
| Frame smoothness | Product grid uses box-shadow transitions (forces paint, not compositor) | Medium |
| Multimodal harmony | Haptic fires on tap but NOT in sync with spring animation start frame | Medium |

---

## Architecture: Fluid Gesture System

### New File Structure

```
components/ui/gestures/
├── use-gesture-spring.ts        Core hook: pointer tracking → spring handoff
├── use-velocity-tracker.ts      Tracks last N pointer events for velocity
├── use-rubber-band.ts           Progressive resistance at boundaries
├── use-momentum-snap.ts         Projection + snap to nearest target
├── swipe-back-fluid.tsx         Replaces current SwipeBack (1:1 tracking)
├── draggable-sheet.tsx          Replaces Vaul for full Apple-grade control
├── pull-to-refresh.tsx          Rubber-band + loading indicator
├── swipe-to-dismiss.tsx         Cart item / notification dismissal
├── momentum-carousel.tsx        Product scroll with velocity projection
└── gesture-provider.tsx         Coordinates concurrent gestures

lib/
├── springs.ts                   Extend with Apple-specific presets
├── haptics.ts                   Add timing sync + more patterns
├── gesture-math.ts              projection(), rubberband(), clamp()
└── animation-frame.ts           RAF-synced spring solver
```

---

## Implementation Phases

### Phase 1: Gesture Foundation (Core Hooks)

#### 1A. `use-velocity-tracker.ts`

```
Purpose: Track pointer position + timestamp history (last 5-8 events)
         to compute velocity at gesture release.

Key detail: Use the position delta between TWO events ~16-32ms ago
            (not the very last event — that's often a near-zero-distance
            touch-up artifact on mobile).
```

#### 1B. `gesture-math.ts`

```typescript
// Apple's exact momentum projection (exponential decay)
function project(velocity: number, decelerationRate = 0.998): number

// Progressive rubber-band resistance
function rubberband(offset: number, dimension: number, constant = 0.55): number

// Nearest snap point from projected endpoint
function nearestSnap(projected: number, snapPoints: number[]): number

// Normalized velocity for spring handoff
function normalizeVelocity(velocity: number, distance: number): number
```

#### 1C. `use-gesture-spring.ts`

```
Pattern:
1. On pointer-down → enter "tracking" mode
2. While tracking → element follows finger 1:1 (with rubber-band at edges)
3. On pointer-up → compute velocity, project endpoint, pick snap target
4. Animate to target via spring, passing release velocity as initialVelocity
5. At ANY point during step 4, if user touches again → interrupt, go to step 1
```

### Phase 2: SwipeBack Rebuild (Most Critical Gap)

**Current:** Binary threshold-check → `history.back()` — no visual feedback.

**Target:** Full iOS-like page-peel with parallax, shadow, and velocity-aware commit/cancel.

| Feature | Implementation |
|---|---|
| 1:1 tracking | Page translates exactly with finger from left edge |
| Background layer | Previous page visible at 80% scale + dimmed underneath |
| Edge shadow | Dynamic shadow on the peeling edge |
| Velocity commit | Fast swipe (>300px/s) commits even if <50% distance |
| Projection-based decision | Use project(velocity) to decide commit vs. cancel |
| Cancel spring | Released before threshold with low velocity → spring back |
| Rubber-band start | First 15px of movement is rubber-banded (disambiguation) |
| Concurrent gesture | Detect vertical scroll intent in first 10px and abort swipe |
| Reduced motion | Simple opacity cross-fade on back navigation |

### Phase 3: Draggable Sheet (Replace Vaul's Default)

| Feature | Implementation |
|---|---|
| Snap points | Closed (0%), half (50%), full (90%) — with momentum projection |
| Velocity-aware snap | Fast downward flick → dismiss even from full height |
| Rubber-band at top | When at max height, further drag is rubber-banded |
| Content scroll handoff | When content is at scroll-top, drag begins to move sheet |
| Dismiss velocity | <300px/s cancel, 300-800px/s snap to nearest, >800px/s dismiss |
| Background push-back | Parent content scales to 0.96 + blur as sheet opens |
| Spring on release | damping: 0.82, stiffness: 300 — slight overshoot on expand |
| Haptic on snap | vibrate(5) the exact frame the spring passes snap point |

### Phase 4: Momentum Carousel (Product Scrolling)

| Feature | Implementation |
|---|---|
| Touch tracking | Pointer events track drag, suppress native scroll |
| Deceleration | On release, apply project(velocity, 0.997) for natural coast |
| Snap alignment | Coast to projected position, then snap to nearest card edge |
| Overscroll rubber-band | Past first/last card, progressive resistance |
| Velocity-scaled spring | Snap spring uses release velocity as initial velocity |
| Current item scale | Centered card is scale(1.02), neighbors scale(0.96) |
| Parallax within cards | Product image moves slower than card during drag |
| Haptic tick | Subtle vibrate(3) each time a card center crosses viewport center |

### Phase 5: Navigation & Route Transitions

#### Tab Switching (Home, Browse, Cart, Account)
- Instant content swap — no animation on same-level tabs
- Scroll position restore (already implemented)
- Nav indicator slide (already excellent)
- Content cross-fade: 80ms opacity transition only

#### Push/Pop (Inner Pages)
| Feature | Implementation |
|---|---|
| Push: slide from right | New page enters from x: 100% with springs.enter |
| Pop: slide to right | Page exits to x: 100% when navigating back |
| Previous page parallax | Background page shifts to x: -30% + scale(0.95) + dim |
| Interruptible | If user swipes back during push animation, reverse immediately |
| Direction detection | Track navigation direction via history depth |
| Shared element | Product image morphs position from grid → detail hero |
| Reduced motion | Opacity-only cross-fade |

#### Header Collapse (iOS-Style)
| Scroll State | Header Behavior |
|---|---|
| At top | Full height (56px), logo + delivery ETA visible |
| Scrolling down | Shrinks to 44px, logo + compact actions only |
| Scrolling up | Immediately reveals full header (iOS Safari behavior) |
| Fast scroll | Hides completely with translateY(-100%) |
| Spring settle | Header reveal uses springs.enter |

### Phase 6: Micro-Interactions

#### Add-to-Cart Experience
- Haptic on quantity change: vibrate(5) on increment/decrement
- Cart icon bounce when fly animation lands
- Number roll: quantity slides up/down (slot machine style)

#### Pull-to-Refresh
- Content rubber-bands down from top (max 80px)
- Circular progress draws proportional to pull distance
- Past 60px release → triggers refresh
- Haptic at threshold: vibrate(10) the frame user crosses 60px

#### Swipe-to-Delete (Cart Items)
- Item follows finger horizontally (1:1 tracking)
- Background reveals red "Delete" label
- Fast left swipe (>500px/s) → instant delete + fly-out
- Remaining items spring into new positions (GSAP Flip)

#### Long Press (Product Card)
- After 500ms hold, card scales up to 1.05 + haptic
- Quick view sheet rises from card's position (spatial origin)
- Cancel by drag: if user moves >10px during hold, cancel peek

---

## Performance Contract

| Metric | Target | How |
|---|---|---|
| Touch-to-frame | < 16ms | RAF-driven, no React state in hot path |
| Gesture FPS | 60fps steady | Only transform/opacity, no layout |
| Spring computation | < 1ms per frame | Pre-computed spring math |
| Memory | No leaks on gesture abort | Cleanup all listeners on unmount |
| Battery | No animation when offscreen | IntersectionObserver gating |

### Critical Rules
1. Never use setState in the gesture hot loop — write directly to ref.current.style.transform
2. RAF-batched updates only — coalesce multiple pointermove events per frame
3. Spring solver runs in RAF — not in event handler, not in useEffect
4. Avoid layout reads during animation — cache getBoundingClientRect() on gesture start
5. Clean up will-change after animation settles

---

## Haptic Design System

```typescript
export const haptics = {
  tap: () => vibrate(5),              // Button press
  impact: {
    light: () => vibrate(8),          // Selection change
    medium: () => vibrate(12),        // Commit action
    heavy: () => vibrate(20),         // Destructive action
  },
  notification: {
    success: () => vibrate([10, 30, 10]),  // Order placed
    warning: () => vibrate([10, 20, 10, 20, 10]),
    error: () => vibrate([20, 40, 20]),
  },
  selection: () => vibrate(3),        // Picker/scroll snap
};
```

---

## Priority Matrix

| # | Task | Apple Principle | Impact | Effort |
|---|---|---|---|---|
| 1 | Rebuild SwipeBack with 1:1 tracking + velocity | §2, §3, §5, §6 | Massive | 6h |
| 2 | Push/Pop transitions with directional slide | §7, §3 | High | 4h |
| 3 | Gesture math utilities (project, rubberband, snap) | §6, §9 | Foundation | 2h |
| 4 | Velocity tracker hook | §5 | Foundation | 2h |
| 5 | Header collapse on scroll | §12, §11 | High | 3h |
| 6 | Pull-to-refresh with rubber-band | §9, §2, §13 | High | 4h |
| 7 | Momentum carousel for products | §5, §6 | High | 5h |
| 8 | Draggable sheet with multi-snap + projection | §2, §3, §5, §6 | High | 6h |
| 9 | Swipe-to-delete cart items | §2, §6 | Medium | 3h |
| 10 | Number roll for quantity stepper | §8, §11 | Medium | 2h |
| 11 | Cart bar materialize animation | §12 | Polish | 1h |
| 12 | Long press context peek | §10, §13 | Medium | 4h |
| 13 | Haptic system expansion | §13 | Polish | 2h |
| 14 | Shared element product image morph | §7 | Delight | 5h |
| 15 | Scroll-proportional nav blur | §12 | Polish | 1h |
| 16 | Press-depth shadows on cards | §1 | Delight | 2h |

**Total: ~52 hours**

---

## Testing Checklist (Per Component)

- [ ] 1:1 tracking — element follows finger exactly
- [ ] Velocity handoff — release velocity is inherited by the spring
- [ ] Interruptible — grab mid-animation and it responds immediately
- [ ] No "brick wall" — reversing direction is smooth
- [ ] Rubber-band at edges — overshooting a boundary feels soft
- [ ] 60fps steady — no jank during gesture
- [ ] Reduced motion — provides alternative
- [ ] Haptic timing — vibration fires on the causal event frame
- [ ] Memory clean — no listeners/timers leak on unmount
- [ ] Spatial exit — element exits in the same direction it entered
