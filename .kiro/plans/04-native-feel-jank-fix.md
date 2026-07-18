# Plan 4: Native Feel & Jank Elimination

Fixing UI shifts, status bar mismatches, scroll jank, and making the web app indistinguishable from native.

---

## Problem 1: Status Bar / Theme Color Mismatch

### Current Issue
| State | Status Bar Color | Header Color | Match? |
|---|---|---|---|
| Light mode | `#F7F7FA` (purple-gray) | ios-glass (white 78% + blur) | NO |
| Dark mode | `#020617` (blue-black) | ios-glass dark (slate 74%) | NO |

### Fix

**Files:** `theme-color-sync.tsx`, `layout.tsx`, `manifest.ts`

```typescript
// Light: status bar = #FFFFFF (glass APPEARS white)
// Dark: status bar = #0A0A0A (glass appears dark)
function getThemeColor(pathname: string, isDark: boolean): string {
  if (pathname.startsWith("/admin")) return "#1e293b";
  if (pathname.startsWith("/delivery")) return "#059669";
  return isDark ? "#0A0A0A" : "#FFFFFF";
}
```

Also sync theme-color change with RAF to avoid flash on route transition.

---

## Problem 2: UI Shifts / Layout Instability (CLS)

### Sources of Shift

| Source | Cause | Fix |
|---|---|---|
| Font loading | Inter Tight + Manrope download → reflow | Add `size-adjust` fallback |
| Image loading | No explicit aspect-ratio → collapse | Enforce aspect-ratio on ALL containers |
| Live order mini bar | Conditionally renders → pushes nav | Reserve space or absolute positioning |
| Location prompt | Renders after hydration → flash | Show after 500ms delay |
| Skeleton → content swap | Height mismatch | Audit every loading.tsx |
| Promo banner carousel | Embla inits after hydration → dots late | Set slideCount from props |
| Loyalty bar / streak | Only for logged-in → shifts content | Reserve min-height |

### Key Fixes

#### Font Size-Adjust
```css
@font-face {
  font-family: "Inter Tight Fallback";
  src: local("Arial");
  size-adjust: 100.5%;
  ascent-override: 91%;
  descent-override: 23%;
  line-gap-override: 0%;
}
```

#### Reserve Conditional Element Space
```tsx
<div style={{ minHeight: session?.user?.id ? '56px' : '0px' }}>
  {session?.user?.id && <LoyaltyProgressBar />}
</div>
```

#### Carousel Dot Count from Props
```tsx
const [slideCount, setSlideCount] = useState(banners.length); // immediate
```

---

## Problem 3: Scroll Smoothness & Jank

### Issues
| Issue | Root Cause |
|---|---|
| Scroll jank on product grid | box-shadow transitions force paint layer |
| Header repaint on scroll | backdrop-filter recalculates every frame |
| Sticky search bar repaint | Not on compositor layer |
| Bottom nav flicker | Opacity/transform toggle during keyboard detection |

### Fixes

#### Compositor-Only Sticky Elements
```css
.ios-glass, .ios-sticky-tracking-header, .ios-bottom-bar,
.floating-cart-bar, .sticky-category-rail {
  will-change: transform;
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  contain: strict;
}
```

#### Backdrop-Filter Isolation
```css
.ios-glass {
  contain: paint layout style;
  isolation: isolate;
}
```

---

## Problem 4: Navigation Doesn't Feel Instant

### Fixes

#### Directional Page Transitions
```tsx
// Detect push vs. pop via popstate
const variants = {
  push: { initial: { x: "100%" }, exit: { x: "-30%", scale: 0.95 } },
  pop: { initial: { x: "-30%", scale: 0.95 }, exit: { x: "100%" } }
};
```

#### Skeleton Show-Delay (Prevent Flash)
```css
.skeleton-delayed {
  animation: fadeIn 200ms 150ms both;
}
```

---

## Problem 5: Overscroll / Bounce Issues

### Fixes

#### Match Body Background to Header
```css
html { background: white; }
body { background: hsl(var(--background)); }
.dark html { background: #0A0A0A; }
```

#### Bottom Overscroll Match
```css
body::after {
  content: "";
  display: block;
  height: env(safe-area-inset-bottom, 0px);
  background: hsl(var(--background));
}
```

---

## Problem 6: Touch Feedback Gaps

### Universal Touch Feedback
```css
a:active, button:active, [role="button"]:active, .press:active {
  transform: scale(0.97);
  opacity: 0.85;
}
```

### Disambiguate Touch from Scroll
```css
@media (pointer: coarse) {
  .product-card-animated:active {
    transition-delay: 70ms;
  }
}
```

---

## Problem 7: PWA / Standalone Mode Gaps

### Fixes
- `manifest.ts`: `background_color: "#FFFFFF"`, `theme_color: "#FFFFFF"`
- Disable custom SwipeBack in standalone PWA mode (iOS provides its own)
- Add `apple-touch-startup-image` meta tags for iOS splash

---

## Master Fix List — Prioritized

| # | Fix | Impact | Effort |
|---|---|---|---|
| 1 | Theme-color match header | Huge | 30min |
| 2 | Overscroll background match | Huge | 15min |
| 3 | Remove font reflow (size-adjust) | High | 30min |
| 4 | Carousel dot count from props | Medium | 10min |
| 5 | Compositor-only sticky elements | High | 30min |
| 6 | Directional page transitions | High | 2h |
| 7 | Skeleton show-delay | Medium | 30min |
| 8 | Universal touch :active feedback | Medium | 30min |
| 9 | Disambiguate touch from scroll | Medium | 20min |
| 10 | Reserve space for conditional elements | Medium | 30min |
| 11 | Manifest colors alignment | Medium | 10min |
| 12 | Disable SwipeBack in PWA mode | Medium | 15min |
| 13 | Backdrop-filter containment | Medium | 15min |
| 14 | iOS splash screen images | Polish | 1h |
| 15 | AnimatedStoreName: limit loops | Polish | 5min |
| 16 | Theme-color transition timing | Polish | 15min |
| 17 | Bottom sheet parent push-back | Polish | 30min |

**Total: ~8 hours**

---

## Implementation Batches

### Batch 1: "The Status Bar Fix" (1 hour)
1. theme-color-sync.tsx → Light: #FFFFFF, Dark: #0A0A0A
2. layout.tsx viewport → Match new colors
3. manifest.ts → background_color/theme_color
4. globals.css → `html { background: white }`

### Batch 2: "The Shift Fix" (1.5 hours)
5. Font size-adjust fallback
6. Promo banner dot count from props
7. Reserve conditional element space
8. Skeleton show-delay CSS

### Batch 3: "The Smoothness Fix" (1.5 hours)
9. Compositor-only sticky elements
10. Backdrop-filter isolation
11. Universal touch :active + scroll disambiguation

### Batch 4: "The Navigation Fix" (2.5 hours)
12. Directional push/pop page transitions
13. Disable SwipeBack in standalone PWA
14. Theme-color transition timing

### Batch 5: "Polish" (1.5 hours)
15. Bottom sheet parent push-back
16. AnimatedStoreName loop limit
17. iOS splash screen images
