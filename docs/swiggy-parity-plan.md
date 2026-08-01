# Swiggy-Parity Plan

Roadmap for bringing the customer web app to the UI/UX standard of Swiggy Instamart / Blinkit / Zepto.

**Context:** this plan starts *after* the July 2026 UI/UX release (commits `2d33dbd`, `0d3c93a`, `0ad78b5`), which
delivered photographic category tiles, top-of-fold search, per-card delivery ETA, the `/category/[slug]`
two-pane browse, a sticky cart bill summary, checkout progressive disclosure, demand-driven trending
search, restock alerts, and a first pass of design-token and accessibility cleanup.

---

## The actual gap

The remaining distance to Swiggy is **not a feature list**. Three things separate this codebase from that
standard, in order of leverage:

1. **Nothing is enforced.** `lighthouserc.cjs` defines credible budgets (performance ≥ 0.85, accessibility
   ≥ 0.95, LCP ≤ 2.5 s, CLS ≤ 0.05, TBT ≤ 200 ms). No CI job runs it. The only GitHub workflow is a
   manually-triggered Capacitor build. There are 18 unit tests and 4 Playwright specs, and neither runs on
   a pull request. Swiggy's consistency is a product of gates, not of one good release.
2. **Demo data leaks into production paths.** `lib/products` is used as a silent fallback throughout, and in
   at least one place (the PDP) it wins over real data unconditionally.
3. **One structural product gap:** there is no variant / pack-size concept anywhere in the schema. Every
   quick-commerce competitor treats "500 g / 1 kg / pack of 6" as a first-class attribute.

Everything else is polish, performance and consolidation — real work, but lower risk.

---

## Phase 0 — Enforcement foundation

**Why first:** every later phase is a refactor. Without gates, refactors regress silently. The
"only 8 of 51 products render" bug shipped and survived because nothing asserted otherwise.

| Deliverable | Detail |
| --- | --- |
| `ci.yml` on pull request | `tsc --noEmit`, `eslint`, `npm test`, Playwright, `lhci autorun` |
| Wire up existing budgets | `lighthouserc.cjs` already has thresholds — just run it |
| `axe-core` in Playwright | Assert zero serious/critical violations on `/`, `/products`, `/category/[slug]`, `/cart`, `/checkout` |
| Regression test for the render bug | Assert rendered card count equals the reported total |
| Extend LHCI URLs | Add `/category/[slug]`, `/cart`, `/products/[slug]` |

**Acceptance:** a PR that regresses LCP, accessibility, or hides products fails CI.
**Effort:** ~2 days. **Blocks:** nothing. **Do this first.**

---

## Phase 1 — Correctness: stop shipping demo data

Found while auditing the PDP (`app/products/[slug]/page.tsx`):

- `getProduct()` checks static demo `products` **before** the database, so a demo slug collision serves
  fake data on a live store.
- `related` is computed **entirely** from the static array, so "You might also like" shows demo products
  regardless of the real catalogue.
- `generateStaticParams()` prerenders demo slugs — this is why the build prerenders 50 unrelated paths.

**Deliverables**
- Database first, demo data only as an explicitly-flagged development fallback
  (`NEXT_PUBLIC_USE_DEMO_DATA`), never an implicit production path.
- Derive `related` from the DB (same category, exclude self, respect `isActive`).
- `generateStaticParams()` from real categories, or drop it in favour of ISR.
- Audit every other `catch(() => fallbackProducts)` site for the same class of bug.

**Acceptance:** with a seeded database, no page renders an item that is not in the catalogue.
**Effort:** ~1 day. **Priority:** P0 — this is a correctness bug, not polish.

---

## Phase 2 — Variants and pack sizes

The single structural gap. `grep -niE "variant|weightOption|packSize" prisma/schema.prisma` returns nothing.

**Schema**
```prisma
model ProductVariant {
  id            String   @id @default(cuid())
  productId     String
  label         String   // "500 g", "1 kg", "Pack of 6"
  sku           String?  @unique
  price         Decimal  @db.Decimal(10, 2)
  discountPrice Decimal? @db.Decimal(10, 2)
  stock         Int      @default(0)
  unit          String
  isDefault     Boolean  @default(false)
  sortOrder     Int      @default(0)
  product       Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  @@index([productId])
}
```

**Sequencing matters** — this touches the whole order path:
1. Additive migration; back-fill one default variant per product from existing `price`/`stock`/`unit`.
2. Read paths (PDP selector, card "1 kg ⌄" affordance) against the default variant.
3. Cart keyed by `variantId` (needs a `cart-provider` migration for persisted carts).
4. `OrderItem.variantLabel` denormalised at order time, like the existing `name`.
5. Admin CRUD last.

**Acceptance:** a product with three pack sizes is selectable on card and PDP, priced independently, and
the chosen size survives cart → checkout → order → invoice.
**Effort:** ~1 week. **Risk:** highest in the plan; ship behind a feature flag.

---

## Phase 3 — Performance: perceived-instant

Current first-load JS (from the production build):

| Route | First load |
| --- | --- |
| shared baseline | 188 kB |
| `/track/[id]` | 330 kB |
| `/products` | 306 kB |
| `/checkout` | 305 kB |
| `/cart` | 297 kB |

**Deliverables**
- **Collapse to two animation runtimes.** Framer Motion + GSAP + 26 CSS keyframes ship today. `lib/motion.ts`
  is the best-designed of the three and should win. GSAP backs only `ScrollReveal`; replacing it with Framer
  `whileInView` removes a whole library.
- **Split the heavy leaves.** Leaflet, Razorpay and Recharts should never enter a customer bundle they
  aren't used in — verify Recharts is admin-only.
- **Image discipline.** Audit every `sizes` attribute; ensure the existing `product-image` blur/dominant-colour
  path is used everywhere, including the new category thumbs.
- **Budgets tightened** once Phase 0 is enforcing them.

**Targets:** LCP < 2.0 s and INP < 200 ms on mid-tier Android over throttled 4G; shared baseline < 150 kB.
**Effort:** ~1 week.

---

## Phase 4 — Merchandising and personalisation

Swiggy's home feed is contextual and dense. Ours is static ordering.

- **Offers strip on home.** `/offers` exists and is not surfaced on the homepage at all.
- **Time-of-day rails.** "Breakfast essentials" in the morning, "Dinner tonight" in the evening — cheap to
  implement, and the strongest signal of a live, curated store.
- **"Buy it again" promoted.** `RecentOrdersSection`, `SmartReorderPill` and `/api/orders/frequent-items`
  already exist; reorder is buried relative to how often customers want it.
- **Brand rails**, once `Product.brand` (already in the schema, unused in UI) is populated.
- **Zero-result merchandising.** A dead end today; should offer category entry points and substitutes.
- **PDP depth:** applicable offers, delivery promise, pack size (Phase 2), substitution preference.

**Acceptance:** homepage composition changes with time of day and returning-customer history.
**Effort:** ~1 week. **Depends on:** Phase 2 for pack sizes on the PDP.

---

## Phase 5 — Design system consolidation

`app/globals.css` is 1597 lines with **194 bespoke class selectors** — a second, undocumented design system
running alongside Tailwind. Three elevation vocabularies still coexist: `shadow-elevation-*`,
`.card-shadow` / `.card-elevated`, and inline `rgba()` shadows.

- **Component inventory**, then delete or fold each bespoke class into a component or token.
- **Storybook** for the ~15 primitives (card, stepper, chip, sheet, section, empty state). None exists today.
- **Visual regression** (Chromatic, or Playwright screenshots) — mandatory before touching `globals.css`,
  because nothing currently proves a CSS deletion was safe.
- Finish the token migration: `text-[8px]`/`text-[9px]` (6 sites) and admin's denser scale were deliberately
  left alone and need a decision rather than neglect.

**Acceptance:** one elevation vocabulary; `globals.css` under 600 lines; every primitive in Storybook.
**Effort:** ~1 week, then ongoing. **Depends on:** Phase 0 + visual regression.

---

## Phase 6 — Accessibility to WCAG 2.2 AA

Baseline is decent (152 `aria-label`s, focus-ring utility, reduced-motion handling). Gaps:

- Focus management and focus trapping across the sheet/drawer stack (vaul, BottomSheet, quick view).
- `prefers-reduced-motion` honoured consistently across *all* animation runtimes — currently CSS-only.
- Contrast audit on amber and neutral micro text at 11 px.
- Keyboard walkthrough of the whole purchase funnel.
- Screen-reader pass on cart mutations and the checkout step indicator.

**Acceptance:** axe clean in CI, plus a manual keyboard + VoiceOver run of browse → cart → checkout.
**Effort:** ~3 days.

---

## Phase 7 — Measurement

Polish without instrumentation regresses. Sentry is already configured; extend rather than add.

- **RUM** for real Core Web Vitals, segmented by device class — lab Lighthouse is not enough.
- **Funnel analytics** on browse → PDP → cart → checkout → order, with drop-off per checkout step
  (there is an `analytics-events.test.ts`, so some plumbing exists).
- **Search analytics:** zero-result queries are a free merchandising backlog.
- **Experimentation** hooks for merchandising changes in Phase 4.

**Effort:** ~3 days.

---

## Sequencing

```
Phase 0  Enforcement      ██                          ← start here, unblocks everything
Phase 1  Demo-data bugs    ██                         ← P0 correctness, parallel with 0
Phase 2  Variants            ████████                 ← highest risk, feature-flagged
Phase 3  Performance         ██████                   ← parallel with 2
Phase 4  Merchandising              ██████            ← needs 2 for pack sizes
Phase 5  Design system              ██████ →          ← needs 0 + visual regression
Phase 6  Accessibility                  ███
Phase 7  Measurement                    ███
```

Roughly 5–6 weeks of focused work. Phases 0 and 1 are ~3 days combined and deliver
disproportionate value: they stop regressions and stop shipping fake data.

---

## Deliberately out of scope

Being explicit, so "match Swiggy" doesn't quietly expand:

- **10-minute delivery.** A dark-store and logistics problem, not a UI one.
- **Live rider chat / voice call masking.** Order tracking already has live location and a call button.
- **In-app games, streaks, gamified loyalty.** Loyalty and wallet already exist; gamification is a
  retention strategy decision, not a parity gap.
- **Multi-store / multi-city routing.** Single-store today; a large architectural change with no current
  business driver.
- **Video content / reels.** Not a grocery-basket driver at this scale.
