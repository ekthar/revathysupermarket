# MSM Supermarket — Design System

## Architecture

```
packages/shared/design-tokens.ts  ← Single source of truth
       ↓                    ↓
apps/web/lib/motion.ts     apps/mobile-customer/src/theme/motion.ts
apps/web/globals.css       apps/mobile-customer/src/theme/colors.ts
apps/web/tailwind.config   apps/mobile-customer/src/theme/typography.ts
```

## Color System

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#050505` (near-black) | CTAs, active states, bold text |
| Secondary | `#22C55E` (green) | Success, live indicators, accents |
| Neutral 50-950 | Gray scale | Text, backgrounds, borders |
| Error | `#EF4444` | Errors, destructive actions |
| Warning | `#F59E0B` | Caution states |
| Info | `#3B82F6` | Informational highlights |

## Typography

| Scale | Size | Weight | Usage |
|-------|------|--------|-------|
| Display | 32px | 900 | Hero headlines |
| Heading | 24px | 700 | Section headers |
| Title | 20px | 700 | Card titles |
| Body | 14px | 500 | General text |
| Caption | 12px | 500 | Labels, metadata |
| Micro | 10px | 500 | Badges, fine print |

**Fonts:** Manrope (display/headings) + Inter Tight (body)

## Motion System

All animations use spring physics calibrated to iOS system feel.

| Preset | Stiffness | Damping | Mass | Settle | Usage |
|--------|-----------|---------|------|--------|-------|
| snappy | 450 | 30 | 0.8 | ~180ms | Button press, quick interactions |
| enter | 280 | 26 | 1 | ~320ms | Modals, sheets appearing |
| gentle | 200 | 28 | 1 | ~420ms | Large panels, drawers |
| layout | 350 | 35 | 1 | ~250ms | Reordering, resize (no bounce) |
| indicator | 500 | 35 | 0.6 | ~120ms | Tab indicators, segments |
| tap | 600 | 32 | 0.4 | ~100ms | Small taps, icon feedback |
| bouncy | 300 | 15 | 1 | ~500ms | Playful, attention-getting |

### Tap Scale (Apple HIG)
- **Primary (0.97)** — Buttons, cards, cells
- **Subtle (0.94)** — Icon buttons, pills, chips
- **Gentle (0.985)** — Large areas, hero banners

## Component Parity

| Component | Web | Mobile | Status |
|-----------|-----|--------|--------|
| Button | `components/ui/button.tsx` | `components/ui/Button.tsx` | ✅ Aligned |
| Empty State | N/A (inline) | `components/ui/EmptyState.tsx` | ✅ Enhanced |
| Skeleton | CSS shimmer | `components/ui/Skeleton.tsx` | ✅ Enhanced |
| Error State | N/A (inline) | `components/ui/ErrorState.tsx` | ✅ Enhanced |
| Product Card | `components/product-card.tsx` | `home/ProductSection.tsx` | ✅ Aligned |
| Bottom Sheet | Radix Dialog | `ProductBottomSheet.tsx` | ✅ New |
| Quick View | `product-quick-view.tsx` | N/A (full page) | ✅ Desktop only |
| Mega Menu | `navigation/mega-menu.tsx` | N/A (tab-based) | ✅ Desktop only |
| Onboarding | `onboarding/welcome-onboarding.tsx` | `onboarding/OnboardingScreen.tsx` | ✅ Both |

## Dark Mode

Both platforms support dark mode with matching tokens:

| Layer | Light | Dark |
|-------|-------|------|
| Background | `#FFFFFF` | `#0A0A0A` |
| Card | `#FFFFFF` | `#111827` |
| Border subtle | `rgba(0,0,0,0.04)` | `rgba(255,255,255,0.04)` |
| Border default | `rgba(0,0,0,0.06)` | `rgba(255,255,255,0.08)` |
| Text primary | `#050505` | `rgba(255,255,255,0.95)` |
| Text secondary | `#6B7280` | `rgba(255,255,255,0.7)` |

## Accessibility

- All touch targets minimum 44×44px (WCAG 2.5.8)
- Focus rings: 3px solid with ring color
- Reduced motion: all animations respect `prefers-reduced-motion`
- Color contrast: minimum 4.5:1 for text
- Screen reader: all interactive elements have labels
