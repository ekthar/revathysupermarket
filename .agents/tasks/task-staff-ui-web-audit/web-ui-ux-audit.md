# Web App (apps/web) UI/UX Audit

Scope: `apps/web` (Next.js 15 App Router, shadcn/ui, Tailwind, next-themes, framer-motion).
Method: findings are grounded in actual source. Each item lists the file/location, the problem,
the user impact, a severity, and the recommended fix. Items marked **[FIXED]** were implemented
in FEAT-005; items under *Deferred / follow-up* were intentionally left out of scope.

Dark-theme (black theme) defects were addressed separately in FEAT-004 and are referenced, not
re-audited, here.

---

## High severity

### H1 — Back navigation loses history and scroll position **[FIXED]**
- **Location:** `components/header.tsx`, `handleBack` region and the desktop + mobile back buttons.
- **Problem:** the back control called `router.push(parentPath)`. `push` creates a *new* forward
  navigation to a hardcoded parent (`/account`, `/cart`, or `/`) instead of returning to the page
  the user actually came from. This discards the browser history entry and the scroll position of
  the previous page.
- **User impact:** a user who taps into (say) `/account/loyalty` from a promo card and presses Back
  lands on the `/account` root scrolled to the top, not back on the page they were browsing. The
  browser Back button and the in-app Back button behave differently, which is disorienting.
- **Severity:** High (core navigation affordance).
- **Fix implemented:** introduced `handleBack()` which prefers `router.back()` when in-app history
  exists (`window.history.length > 1`) and falls back to `router.push(parentPath)` for direct/fresh
  loads where there is nothing to go back to. Both the desktop and mobile back buttons now use it.

### H2 — `/offers` (coupons/deals) page had no back affordance **[FIXED]**
- **Location:** `components/header.tsx`, the hardcoded `innerPages` array; page `app/offers/page.tsx`.
- **Problem:** `innerPages` enumerated `/account/*`, `/support`, and `/checkout`, but **omitted
  `/offers`**. `/offers` is a leaf/inner page (deals + promo codes) reached from home and banners,
  yet it rendered the top-level header (logo, nav) with no Back button on desktop or mobile.
- **User impact:** on the Offers page there was no consistent way back to the previous screen; the
  only exit was the logo (home) or the browser control, which is especially painful on mobile where
  the header is the primary navigation surface.
- **Severity:** High.
- **Fix implemented:** added `/offers` to `innerPages` so it now gets the persistent header + Back
  control on both breakpoints. Its `parentPath` resolves to `/` (safe fallback), and it benefits
  from the `router.back()` behavior from H1. Note: `/account/settings` and `/account/loyalty`
  (rewards) were already covered by the existing `pathname.startsWith("/account/")` clause; the real
  gap was `/offers`. The back affordance for settings/rewards/coupons is now consistent across all
  three.

### H3 — Header "Help & Support" link is invisible/low-contrast in dark mode **[FIXED]**
- **Location:** `components/header.tsx`, desktop "Help & Support" `Link`.
- **Problem:** the link used `text-neutral-600 hover:text-neutral-900` with **no `dark:` variant**,
  unlike every other control in the same header row (which all carry `dark:text-neutral-300` etc.).
  On the dark header (`dark:bg-neutral-950`) `text-neutral-900` is near-black on near-black.
- **User impact:** in dark mode the Help & Support link is effectively unreadable and its hover state
  makes it *darker*, i.e. even less visible.
- **Severity:** High for dark-mode users (a11y contrast).
- **Fix implemented:** added `dark:text-neutral-300 dark:hover:text-white` to match the sibling
  controls.

---

## Medium severity

### M1 — Offers page uses off-scale `slate-*` colors instead of design tokens **[FIXED]**
- **Location:** `app/offers/page.tsx` (headings, promo discount text, empty-state icon/heading).
- **Problem:** the page styled text with Tailwind's default `slate-*` palette
  (`text-slate-900 dark:text-white`, `text-slate-700 dark:text-slate-300`,
  `text-slate-200 dark:text-slate-700`). `slate` is **not part of this project's palette** —
  `tailwind.config.ts` defines a `neutral` scale plus semantic tokens
  (`foreground`, `muted-foreground`, `card`, `border`). Mixing `slate` in means the page can drift
  from the rest of the app if tokens are retuned, and it duplicates the light/dark pairing by hand.
- **User impact:** subtle color inconsistency vs. the rest of the app and a maintenance hazard;
  low direct user harm but a real token-consistency defect.
- **Severity:** Medium.
- **Fix implemented:** converted the headings/body to semantic tokens (`text-foreground`,
  `text-muted-foreground`, `text-muted-foreground/40`). Rendering is equivalent in light mode and
  now derives dark values from the token layer instead of hand-written `dark:` pairs.

### M2 — Dark-theme toggle duplication and blanket overrides *(handled in FEAT-004)*
- **Location:** previously `components/theme-toggle.tsx` + `components/ui/theme-toggle.tsx` +
  `components/ui/theme-toggle-inline.tsx`; `app/globals.css` blanket `.dark .bg-white{}` rules.
- **Status:** Already fixed in FEAT-004 (toggles consolidated into one canonical file; dead "System"
  option removed; blanket overrides narrowed with a `stay-light` opt-out; `.dark ::selection` added;
  light-only components given dark styling). Recorded here for completeness only — **not** re-done in
  FEAT-005 to avoid duplicating that work.

---

## Low severity

### L1 — Header nav "active" detection is brittle for query-based routes
- **Location:** `components/header.tsx`, `navLinks` + the `isActive` computation.
- **Problem:** nav items point at query-string routes (`/products?view=categories`,
  `/products?sort=offers`). Active state is derived from `pathname` + `link.href.split("?")[0]`,
  which ignores the query string, so "Shop", "Categories", and "Deals" all light up together on any
  `/products` URL. `usePathname()` does not expose the query, so distinguishing them would require
  `useSearchParams()`.
- **User impact:** minor — the active pill is imprecise on the products routes.
- **Severity:** Low. Not fixed (would add a `useSearchParams()` read and Suspense considerations;
  low benefit, out of the low-risk fix budget).

### L2 — `LocationIndicator` can cause a small layout shift
- **Location:** `components/header.tsx`, `LocationIndicator` returns `null` until the
  `useEffect`-loaded saved location resolves.
- **Problem:** the indicator mounts empty then appears after hydration, nudging adjacent header
  actions. Impact is small because it sits at the end of the row.
- **Severity:** Low. Not fixed (reserving space would require a skeleton and is cosmetic).

---

## Deferred / follow-up (intentionally NOT changed in FEAT-005)

These are either out of scope (data/auth/API/realtime), structurally larger than a low-risk UI
tweak, or better handled as their own feature.

- **Delivery route has no shared header/back affordance.** `app/delivery/` contains only
  `page.tsx` and `login/page.tsx` with **no `layout.tsx`**, and the customer `Header`/`MobileBottomNav`
  explicitly `return null` for `/delivery` (and `/admin`, `/staff`). The admin area *does* have a
  full shell (`app/admin/layout.tsx` → `AdminSidebar`), but delivery does not. Adding a delivery
  shell/header is a structural change to a staff-facing operational surface and risks affecting the
  realtime delivery flow, so it is deferred.
- **SSE / realtime delivery-alert listeners** (e.g. `lib/hooks/use-order-tracking-socket.ts`,
  `app/api/realtime/*`, `app/api/delivery/alerts`). Explicitly out of scope — backend/realtime
  behavior must not be touched here.
- **Pre-existing lint warnings** (baseline, not regressions): `no-img-element` in
  `components/dashboard/customer-orders-client.tsx`; `react-hooks/exhaustive-deps` in
  `components/product-grid.tsx` and `lib/hooks/use-order-tracking-socket.ts`. Left as-is to keep the
  change focused and avoid behavior changes to data-fetching hooks.
- **Pre-existing failing tests** (baseline): `tests/order-checkout.test.ts` (#47
  DELIVERY_OUT_OF_RANGE) and `tests/scroll-preservation.test.ts` (#54 `touch-action`). Not UI-token
  issues; unrelated to this feature.
- **Broader `slate-*` → token migration.** Many other components still use `slate-*` with hand-paired
  `dark:` variants. They render correctly today, so a full palette migration is deferred to avoid a
  large, risky sweep; `/offers` was migrated as the representative high-traffic case.

---

## Verification (FEAT-005)

Run from `apps/web`:

1. `npx prisma generate` (required before typecheck — a fresh client is not checked in).
2. `npx tsc --noEmit` — expect 0 errors.
3. `npm run lint` — expect 0 errors, 3 pre-existing warnings.
4. `npm test` — expect 61 pass / 2 fail (the two pre-existing baseline failures only; no new
   failure). The `/offers` and `header.tsx` edits do not touch `globals.css`, so the
   `scroll-preservation` test (#54) is unaffected.
