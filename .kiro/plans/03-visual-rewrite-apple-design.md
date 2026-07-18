# Plan 3: Apple-Grade Visual Rewrite

Every pixel audited against the Apple Design skill (Materials & Depth, Typography, Craft/Simplicity, Instant Response).

---

## Color System Changes

### Current → Target

```css
:root {
  /* Background: remove purple tint → pure neutral */
  --background: 0 0% 98%;          /* Was: 240 18% 97% */
  --card: 0 0% 100%;
  --border: 0 0% 92%;              /* Was: 220 13% 91% */
  --muted: 0 0% 96%;               /* Was: 220 14% 96% */
  --shadow-color: 0 0 0;           /* Was: 5 5 5 (warm) */

  /* Border approach: opacity-based */
  --border-subtle: rgba(0, 0, 0, 0.04);
  --border-default: rgba(0, 0, 0, 0.06);
  --border-strong: rgba(0, 0, 0, 0.12);
}

.dark {
  --background: 0 0% 7%;           /* Was: 222 47% 6% (blue tint) */
  --card: 0 0% 10%;                /* Was: 222 47% 9% */
  --border: 0 0% 15%;
  --border-subtle: rgba(255, 255, 255, 0.04);
  --border-default: rgba(255, 255, 255, 0.08);
  --border-strong: rgba(255, 255, 255, 0.15);
}
```

### Accent Color Rule
- `#22C55E` (green-500): Keep full saturation for CTAs only
- Desaturate for surfaces (use `secondary-50` / `secondary-900/30`)

---

## Typography Changes (Apple §15)

### Tracking (letter-spacing) — Must Vary With Size

```css
html { font-optical-sizing: auto; }

.display { letter-spacing: -0.04em; }   /* Was: -0.02em (32px+) */
.heading { letter-spacing: -0.03em; }   /* Was: -0.02em (24px) */
.title   { letter-spacing: -0.02em; }   /* Was: -0.015em (20px) */
.body    { letter-spacing: 0; }          /* Was: -0.01em (14px) */
.caption { letter-spacing: 0.005em; }    /* Was: 0 (12px) */
.micro   { letter-spacing: 0.02em; }     /* Was: 0.01em (11px) */

body { letter-spacing: 0; }  /* Was: -0.01em */
```

### Font Size Minimum
- `micro`: Change from `10px` → `11px` (readability)

### Weight Usage
- Use `font-bold` (700) for section headings
- Reserve `font-extrabold` (800) / `font-black` (900) only for hero/display text
- Currently over-indexed on `font-black` everywhere — dilutes hierarchy

---

## Border Radius Scale

### Current → Target (Tailwind Config)

```typescript
borderRadius: {
  sm: "6px",       // Chips, tiny elements
  DEFAULT: "8px",  // NEW: standard
  md: "12px",      // Form inputs, small cards
  lg: "16px",      // Was: 20px — main cards (Apple-proportional)
  xl: "20px",      // Was: 28px — large containers
  "2xl": "24px",   // Feature cards, promo banners
  "3xl": "32px",   // Bottom sheets top corners
  full: "9999px"   // Pills
}
```

### Rule: Scale radius with element size
- Small cards (product grid): `rounded-xl` (16px)
- Large containers (promo): `rounded-2xl` (24px)
- Bottom sheets: `rounded-t-3xl` (32px)
- Buttons/pills: `rounded-full`

---

## Shadow System (Apple Layered Depth)

```typescript
boxShadow: {
  "elevation-1": "0 1px 2px rgba(0,0,0,0.03), 0 4px 16px rgba(0,0,0,0.04)",
  "elevation-2": "0 2px 4px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.06)",
  "elevation-3": "0 4px 8px rgba(0,0,0,0.04), 0 16px 48px rgba(0,0,0,0.08)",
  "float": "0 8px 32px -4px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
  "premium": "0 24px 80px -20px rgba(0,0,0,0.20)",
  "glass": "0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.2)",
}
```

---

## Border Strategy (Apple Way)

Apple uses nearly invisible borders — they separate content zones, not decorate.

### Rules
1. **Cards in light mode**: No border — shadow provides separation
2. **Cards in dark mode**: `border: 1px solid rgba(255,255,255,0.06)`
3. **List dividers**: Inset (not full-width), `rgba(0,0,0,0.04)`
4. **Input fields**: Borderless until focus, then accent glow
5. **Floating elements**: No border — shadow defines edge

---

## Materials & Translucency (Apple §12)

### Material Upgrades

```css
/* Materialize animations: animate blur + scale, not just opacity */
@keyframes materialize {
  from { backdrop-filter: blur(0px); transform: scale(0.98); opacity: 0; }
  to { backdrop-filter: blur(22px); transform: scale(1); opacity: 1; }
}

/* Scroll-edge mask instead of hard border */
.scroll-edge-mask {
  mask-image: linear-gradient(to bottom, transparent 0px, black 8px, black calc(100% - 8px), transparent 100%);
}

/* Glass text: heavier weight for legibility over blur */
.glass-text { font-weight: 600; letter-spacing: 0.005em; }
```

### Changes
- Bottom sheet overlay: `backdrop-blur-sm` → `backdrop-blur-[20px]`
- Floating cart bar: Add translucency `rgba(5,5,5,0.85)` + `blur(16px)`
- Search bar: Remove explicit border, use only bg fill contrast

---

## Component-by-Component Changes

### Product Card
- Remove explicit `border border-neutral-100` — use shadow only
- Radius: `rounded-2xl` → `rounded-xl` (16px)
- Shadow only on hover — flat at rest (cleaner grid)
- Price: `font-black` → `font-bold`
- Hover lift: reduce from `-3px` to `-2px`

### Header (Mobile)
- Stop continuous store name animation after 2 loops (not infinite)
- Notification icon: transparent bg over glass (not neutral-50)

### Bottom Navigation
- Press scale: `0.88` → `0.92` (less aggressive, more Apple)

### Floating Cart Bar
- Add translucency: `rgba(5,5,5,0.85)` + `backdrop-filter: blur(16px)`

### Bottom Sheet
- Overlay blur: increase to `blur-[20px]`
- Add parent push-back: `scale(0.96) + border-radius: 12px` on content behind

### Promo Banners
- "Offer" badge: tone down from screaming green to subtle

### Account Page
- Profile card: simplify gradient, remove decorative circles/orbs

---

## Files to Modify

| File | Changes |
|---|---|
| `tailwind.config.ts` | Color tokens, shadows, radius, typography scales |
| `globals.css` | CSS variables, body gradient, border strategy, material animations |
| `lib/motion.ts` | Adjust tapScale.subtle from 0.95→0.92 |
| `components/product-card.tsx` | Remove border, adjust radius, reduce price weight |
| `components/header.tsx` | Notification icon transparency |
| `components/mobile-bottom-nav.tsx` | Press scale 0.88→0.92 |
| `components/cart/floating-cart-bar.tsx` | Add translucency + blur |
| `components/ui/bottom-sheet.tsx` | Increase overlay blur, add parent push-back |
| `components/home/hero-section.tsx` | Heading tracking, badge brightness |
| `components/home/animated-categories.tsx` | Remove card border |
| `components/home/promo-banners.tsx` | Tone down badge |
| `components/home/loyalty-progress-bar.tsx` | Reduce border visibility |
| `components/home/home-search.tsx` | Remove border, inline filter button |
| `components/checkout-form.tsx` | Borderless inputs until focus |
| `components/ui/gsap/animated-store-name.tsx` | Add repeat: 2 (not infinite) |
| `app/account/page.tsx` | Simplify profile card |
| `components/footer.tsx` | Lighten border opacity |

---

## Priority Order

| # | Change | Impact | Effort |
|---|---|---|---|
| 1 | Remove blue/purple tint from backgrounds | Huge | 30min |
| 2 | Adopt opacity-based borders | Large | 1h |
| 3 | Fix typography tracking per size | Medium | 30min |
| 4 | Adjust border-radius scale | Large | 30min |
| 5 | Expand shadow system | Large | 1h |
| 6 | Add font-optical-sizing | Small | 5min |
| 7 | Bottom sheet translucency | Medium | 30min |
| 8 | Cart bar translucency | Small | 15min |
| 9 | Product card: remove border, shadow-only | Medium | 30min |
| 10 | Stop continuous store name animation | Small | 10min |
| 11 | Input field borderless design | Medium | 30min |
| 12 | Account page: simplify profile card | Small | 20min |
| 13 | Reduce font-black usage | Medium | 30min |
| 14 | Parent push-back on sheet open | Medium | 30min |
| 15 | Scroll-edge masks | Small | 15min |

**Total: ~8-10 hours**
