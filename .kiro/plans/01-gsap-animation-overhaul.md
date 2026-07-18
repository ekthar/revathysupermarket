# Plan 1: Industry-Level GSAP & Motion Overhaul

## Current State

| Area | Status |
|------|--------|
| GSAP 3.15 + @gsap/react | Installed |
| Framer Motion 11 | Installed |
| ScrollTrigger (basic parallax, scroll reveals) | Basic |
| Reduced motion accessibility | Implemented |
| GPU acceleration utilities | CSS layer |
| Motion design tokens (springs, easings) | Well-structured |
| Reusable GSAP components (ScrollReveal, StickyStack, HorizontalPan) | Scaffolded |
| iOS-style glassmorphism | CSS only |
| Dark mode support | Complete |

## What's Missing (vs. Swiggy/Zepto/Blinkit Level)

| Area | Gap |
|------|-----|
| Page transitions | Only basic CSS fade — no GSAP-powered route transitions |
| Hero animations | Simple parallax only — no text splitting, mask reveals, kinetic typography |
| Scroll storytelling | No pinned narrative sections, no horizontal scroll galleries |
| Micro-interactions | Basic hover/press — no 3D tilt, magnetic buttons, cursor followers |
| Product card animations | Simple fade-up stagger — no flip, morph, shared-element transitions |
| Cart interactions | No add-to-cart fly animation improvement, no drawer spring physics |
| Loading states | Standard skeleton — no GSAP-driven progressive reveal |
| Number animations | No countUp for prices, loyalty points, totals |
| Scroll velocity effects | No speed-based blur, scale, or perspective changes |
| Text animations | No per-character/word animations, no typewriter effects |
| Image reveals | No clip-path wipes, no parallax layers within cards |
| Navigation | No morph between states, no liquid-pill active indicator |
| Marquee/Ticker | No infinite scroll announcements for offers/free delivery |
| Confetti/Particles | No success celebrations |

---

## Architecture

### Phase 1: GSAP Plugin Registration Expansion

**File: `lib/gsap.ts`** — Expand to register all needed plugins:

```
Plugins to add:
├── ScrollSmoother (smooth scroll wrapper)
├── SplitText (text splitting for per-char/word animations)
├── Flip (shared-element layout transitions)
├── DrawSVG (SVG path animations)
├── MotionPath (fly-to-cart animation paths)
├── Observer (velocity-based scroll detection)
├── CustomEase (brand-specific easing curves)
└── TextPlugin (typewriter effects)
```

> Note: SplitText, Flip, DrawSVG, MotionPath, CustomEase require GSAP Club/Business license. If using free tier, equivalent custom implementations will be built.

### Phase 2: Core Animation Infrastructure

#### 2A. Smooth Scroll Wrapper
```
components/providers/smooth-scroll-provider.tsx
├── Lenis or GSAP ScrollSmoother for buttery 120fps scrolling
├── Preserves native scroll for form inputs
├── Mobile: disable (keep native momentum)
└── Desktop: 0.08 lerp factor for silk-like feel
```

#### 2B. Page Transition System
```
components/ui/gsap/page-transition.tsx
├── Overlay clip-path wipe (circle-out from click point)
├── Content fade-up with stagger
├── Shared elements morph between pages (product image → detail page)
├── Exit: scale down + fade
└── Enter: mask-reveal from center
```

#### 2C. Cursor & Magnetic Effects (Desktop)
```
components/ui/gsap/magnetic-button.tsx
├── Element attracted to cursor within proximity radius
├── Spring physics for snapping back
├── Scale pulse on hover proximity
└── Custom cursor follower (optional)
```

#### 2D. Text Animation System
```
components/ui/gsap/split-text-reveal.tsx
├── Per-character reveal (hero headings)
├── Per-word stagger (section titles)
├── Per-line clip reveal (paragraphs)
├── Scramble text effect (promo codes)
└── Typewriter for search placeholders
```

### Phase 3: Section-by-Section Upgrades

#### Hero Section (Homepage)
| Effect | Implementation |
|--------|----------------|
| Text split reveal | Each word animates in with rotation + y offset |
| Parallax depth layers | Background image, mid-ground floating produce icons, foreground text |
| Counter animation | "Delivery in ~25–45 mins" counts up from 0 |
| Floating badges | "Free Delivery" badge bobs with yoyo |
| Scroll-triggered zoom | Image slowly zooms 1.0→1.05 as user scrolls past |
| CTA button pulse | Subtle scale pulse loop drawing attention |
| Background gradient shift | Slow hue rotation on the radial gradient |

#### Categories Section
| Effect | Implementation |
|--------|----------------|
| 3D flip reveal | Cards flip from back to front on scroll |
| Stagger wave | Cards animate in a wave pattern (sine curve offset) |
| Hover 3D tilt | rotateX/Y based on mouse position within card |
| Icon bounce | Category icon does elastic pop on hover |
| Active state morph | Selected category pill flows like liquid to new position |

#### Product Sections (Trending, On Sale, Staff Picks)
| Effect | Implementation |
|--------|----------------|
| Masonry reveal | Cards cascade in from alternating sides |
| Scroll velocity blur | Cards blur slightly when scrolling fast |
| Add-to-cart fly | Product image flies in an arc to cart icon |
| Price countUp | Discount price counts from original to discounted |
| Image parallax within card | Product image moves slower than card on scroll |
| Horizontal scroll momentum | Inertia-based scrolling with deceleration curve |

#### Promo Banners
| Effect | Implementation |
|--------|----------------|
| Auto-slide with GSAP timeline | Timed transitions with pause-on-hover |
| Parallax layers within each slide | Text + image at different scroll speeds |
| Mask transition | Circle/diamond/diagonal wipe between slides |
| Scale bounce on snap | Current slide scales up 1.02 on activation |

#### Navigation & Header
| Effect | Implementation |
|--------|----------------|
| Shrink on scroll | Height reduces 70px→56px, logo shrinks, smooth spring |
| Background blur interpolation | Blur increases with scroll depth |
| Active nav pill | GSAP Flip — pill morphs/slides to active item |
| Cart count pop | Number scales up with spring when count changes |
| Search expand | Input grows from icon to full width with spring |

#### Cart Page
| Effect | Implementation |
|--------|----------------|
| Item add/remove | GSAP Flip for smooth layout shifts |
| Quantity stepper | Number bounces/rolls (slot machine style) |
| Total price countUp | Price animates smoothly between values |
| Swipe-to-delete | GSAP Draggable with snap-back spring |

#### Checkout Flow
| Effect | Implementation |
|--------|----------------|
| Step progress | Animated progress bar with spring physics |
| Form field focus | Label floats up with spring, border glows |
| Order placed success | Full-screen confetti + check mark draw (DrawSVG) |
| Receipt animation | Bill "prints" from top with clip-path |

### Phase 4: Global Micro-Interactions

```
lib/gsap-effects.ts — Register reusable GSAP effects
├── gsap.effects.fadeUp (standard entrance)
├── gsap.effects.splitReveal (text splitting)
├── gsap.effects.countUp (number animation)
├── gsap.effects.magneticHover (proximity attraction)
├── gsap.effects.elasticPop (button press)
├── gsap.effects.clipReveal (mask reveal)
├── gsap.effects.flyToCart (arc animation)
└── gsap.effects.confetti (celebration)
```

### Phase 5: Performance Safeguards

| Strategy | Implementation |
|----------|----------------|
| Intersection Observer gating | Only init GSAP timelines when section is near viewport |
| Kill on unmount | Every useGSAP returns cleanup via ctx.revert() |
| will-change management | Add before animation, remove after to free GPU layers |
| Content-visibility | Keep cv-auto pattern |
| Reduced motion | All new animations check prefersReducedMotion() |
| Mobile throttle | Simpler animations on mobile (no 3D tilt, no cursor effects) |
| ScrollTrigger batch | Use ScrollTrigger.batch() for grids instead of per-item triggers |
| Dynamic imports | Heavy GSAP plugins loaded only on pages that need them |

---

## New File Structure

```
components/ui/gsap/
├── index.ts                    (exports all)
├── scroll-reveal.tsx           EXISTS
├── sticky-stack.tsx            EXISTS
├── horizontal-pan.tsx          EXISTS
├── animated-store-name.tsx     EXISTS
├── split-text-reveal.tsx       NEW
├── magnetic-button.tsx         NEW
├── count-up.tsx                NEW
├── clip-reveal.tsx             NEW
├── parallax-image.tsx          NEW
├── fly-to-cart.tsx             NEW (enhanced)
├── infinite-marquee.tsx        NEW
├── confetti-burst.tsx          NEW
├── tilt-card.tsx               NEW
├── scroll-progress.tsx         NEW
├── stagger-grid.tsx            NEW
├── text-scramble.tsx           NEW
├── morph-indicator.tsx         NEW
└── smooth-scroll.tsx           NEW

lib/
├── gsap.ts                     EXPAND (add more plugins)
├── gsap-effects.ts             NEW
├── motion.ts                   EXISTS (extend with GSAP presets)
└── animation-config.ts         NEW
```

---

## Implementation Priority

| Priority | Task | Impact | Effort |
|----------|------|--------|--------|
| P0 | Expand lib/gsap.ts + register effects | Foundation | 2h |
| P0 | SplitText hero heading animation | High visual impact | 3h |
| P0 | Smooth scroll (Lenis) for desktop | Premium feel | 2h |
| P1 | Page transition (clip-path wipe) | Premium routing | 4h |
| P1 | Infinite marquee for offers bar | Engagement | 2h |
| P1 | Magnetic buttons on CTAs | Delight | 2h |
| P1 | CountUp for prices/loyalty points | Trust + polish | 2h |
| P2 | 3D tilt cards on categories | Engagement | 3h |
| P2 | Add-to-cart fly animation | Conversion signal | 4h |
| P2 | Nav pill morph animation | Navigation polish | 3h |
| P2 | Advanced stagger patterns (wave, cascade) | Visual variety | 2h |
| P3 | Checkout confetti/success animation | Delight | 2h |
| P3 | Scroll velocity blur effect | Premium differentiation | 3h |
| P3 | Parallax layers within product cards | Depth | 2h |
| P3 | Header shrink animation | Polished navigation | 2h |
| P3 | Background aurora/gradient animation | Ambient premium | 2h |

**Total estimated: ~40 hours**

---

## Industry Benchmarks

| Reference | What to Adopt |
|-----------|---------------|
| Apple.com | Pinned scroll sections, text split reveals, smooth camera zoom |
| Stripe.com | Gradient meshes, noise texture, magnetic hover |
| Linear.app | Page transitions, aurora backgrounds, spring physics |
| Swiggy/Zepto | Add-to-cart fly, floating cart bar springs, category pill morph |
| Framer.com | Scroll-driven animations, velocity effects |
| Vercel.com | Text scramble, gradient borders, glass depth |

---

## Non-Negotiables

- Every animation checks `prefersReducedMotion()`
- Every GSAP context is reverted on unmount
- Mobile gets simplified versions (no 3D, no cursor effects)
- Core Web Vitals must stay green (LCP < 2.5s, CLS < 0.1, INP < 200ms)
- No animation blocks interactivity (all on compositor thread)
- ScrollTrigger refreshes on route change and resize
- Dark mode consistency for all new effects
