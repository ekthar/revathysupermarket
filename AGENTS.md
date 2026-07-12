# Revathy Supermarket — Agent Guidelines

## Design System (Web App)

### Brand Palettes

**Light mode**
- Background: `#F7F7FA` (cool off-white)
- Surface / cards: `#FFFFFF` with `border-neutral-100` (1px)
- Text: `#0C0E16` (≈ neutral-900), soft text: `neutral-500`
- Accent: `#22C55E` (green-500) — used for "Add", delivery indicators, success states
- Sale / urgency: `#EF4444` (red-500) or `#F59E0B` (amber-500) — one per context, never both
- Primary CTA bg: near-black `#050505`, text white

**Dark mode**
- Background: `#020617` (≈ zinc-950)
- Surface: `hsl(222 47% 9%)`
- Text: `hsl(210 40% 98%)`
- Accent: `#22C55E` (green-500) at reduced opacity where needed
- Borders: `rgba(255,255,255,0.08)`

**One accent at a time.** If a page uses green accent, it does NOT randomly flip to blue / purple / orange. The only exception is sale badges (amber/red), and even those are gated by context.

### Corner Radius System

| Category | Radius |
|---|---|
| Interactive controls (buttons, chips, filter pills) | `rounded-full` |
| Cards & panels | `rounded-2xl` |
| Modals / sheets | `rounded-3xl` |
| Inputs, selects | `rounded-full` |
| Images inside cards | `rounded-2xl` |

### Typography

- **Body / general:** Inter Tight (variable, 14px body, 12px caption)
- **Display / headings:** Manrope (900 weight, tracking -0.03em)
- Heading classes: `.section-title` (1.5rem→2rem responsive), `.font-display` for Manrope
- Hero headline max 2 lines on desktop, never crosses beyond the initial viewport
- No emoji as design elements — use Lucide icons instead

### Shadows

- `shadow-elevation-1` — subtle cards (0/1px + 4px 12px)
- `shadow-elevation-2` — elevated panels
- `shadow-elevation-3` — modals
- All shadows use a tinted `rgba(5, 5, 5, ...)` (primary color as shadow base)
- Dark mode: shadows are near-black, border-based instead of glow

### Motion Strategy

**GSAP** (new) — for scroll-linked / cinematic moments:
- Hero parallax
- Section scroll-reveals
- Pinned sticky-stack or horizontal-pan sections (sparingly)
- All GSAP must go through `lib/gsap.ts` (no adhoc `gsap.registerPlugin` elsewhere)
- Every GSAP hook MUST check `prefersReducedMotion()` and degrade to static

**Framer Motion** (existing, preserved) — for UI micro-interactions:
- Button taps (`whileTap` with tapScale presets)
- Cart badge (enter/exit via `AnimatePresence`)
- Quantity stepper bounce
- Route transitions
- Modals/sheets

**CSS keyframes** — limited to:
- `shimmer` (skeleton loading)
- `float` (ambient bob, only when reduced motion is off)
- `fadeIn` / `fadeInUp` (fast route entry)
- All others migrated to GSAP or removed

### Layout Gameplan

- Max-width container: `max-w-7xl mx-auto`
- Sections above fold: fit within initial viewport on desktop
- Mobile: PT/Headline/CTA visible on a 360px-tall viewport
- Grid > flexbox percentage math (use `grid grid-cols-...`)
- No more than one horizontal-pan or sticky-stack per page
- "Eyebrow" labels (small uppercase tracking) ≤ 1 per 3 sections

### Homepage Sections (Overhaul)

1. **Hero** — split layout (text left, image right), GSAP parallax on image
2. **Promo Banners** — max 3, unified tinted backgrounds (no rainbow)
3. **Recent Orders** — hidden when empty
4. **Categories** — 6-column desktop, 4-column mobile, GSAP stagger reveal
5. **Trending** — scrollable product row on mobile, grid on desktop
6. **On Sale** — conditionally rendered only when discounts exist
7. **Staff Picks** — conditionally rendered only when featured products exist
8. **CTA Row** — a single "Browse all" link, not a duplicate grid

### Anti-Patterns (AVOID in this repo)

- No emojis in UI (use Lucide)
- No fake statistics ("50+ Products")
- No duplicate hero components
- No AI-purple / random colored gradients
- No `window.addEventListener("scroll")` — use GSAP ScrollTrigger or Framer's useScroll
- No pure-black (`#000`) or pure-white (`#FFF`) — use off-black / off-white
- No `h-screen` — use `min-h-[100dvh]`

### Hooks

- `useGSAP` (from `@gsap/react`) for GSAP effects
- `useReducedMotion` (from `framer-motion`) for Framer Motion
- `prefersReducedMotion()` (from `@/lib/gsap`) for GSAP

## File Conventions

- New GSAP components go in `components/ui/gsap/`
- Motion tokens stay in `lib/motion.ts` (Framer) and `lib/gsap.ts` (GSAP)
- `components/home/*` for homepage-specific sections
- `app/page.tsx` orchestrates homepage sections (data-fetching + component composition)
