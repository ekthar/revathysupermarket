---
sessionId: session-260706-223126-169t
---

# Requirements

### Overview & Goals
Bring the Revathy/MSM Supermarket monorepo to production readiness by:
1. **Completing the customer app** (`apps/mobile-customer`) — finishing the remaining P2 polish items and wiring every backend API so it reaches full feature parity with the web app.
2. **Completing the staff app** (`apps/mobile-staff`) — finishing the Admin, Packing, and Delivery role flows, wiring all `/api/mobile/v1/admin` + delivery/packing endpoints, and hardening real-time assignment alerts.
3. **Making the PWA topnotch** (`apps/web`) — optimizing Core Web Vitals and reaching 90+ Lighthouse scores.

Across all three, the bar is **feature-complete + stable**: all APIs wired, crashes fixed, and consistent error/offline/loading states.

### Scope
**In Scope**
- `apps/mobile-customer`: remaining P2 items from `docs/MIGRATION_REPORT.md` (custom fonts, GPS/saved-address checkout wiring, wallet + loyalty redemption UI, order-success celebration, dark mode wired to NativeWind, profile editing, sort/filter, notification badge, cart swipe-to-delete).
- `apps/mobile-staff`: complete `(admin)`, `(packing)`, `(delivery)` route groups, wire `/api/mobile/v1/admin/*`, assignments, dispatch, alerts; harden real-time assignment alarm (audio + notifee).
- Cross-app stability: consistent `OfflineBanner`, `ErrorState`, skeleton/loading states, API error handling, token-refresh edge cases.
- `apps/web` PWA: performance/Lighthouse work (code-splitting, image optimization, caching, CWV).
- `packages/shared`: extend shared types/constants/utils where mobile needs parity with web logic.

**Out of Scope**
- Standalone `apps/mobile-delivery` app (staff app already covers the delivery role).
- EAS store-submission / signing / store-listing assets and observability (Sentry/analytics/OTA) — not selected for this pass.
- Automated test suite / CI setup — not selected for this pass.
- New net-new business features beyond web parity (voice search, subscriptions, etc.).

### User Stories
- As a **customer**, I can complete checkout with GPS-detected/saved addresses, distance-based delivery fee, wallet payment, and loyalty redemption, then see a success celebration.
- As a **customer**, I can toggle dark mode, edit my profile, sort/filter products, and always see clear loading/offline/error states.
- As a **packing staff**, I can see assigned orders, run stock checks, mark items, and complete packing with real-time alerts.
- As a **delivery partner (staff app)**, I can receive full-screen assignment alarms, navigate, collect payment, and complete delivery with OTP.
- As an **admin**, I can manage orders, products, dispatch, and reports from the staff app.
- As a **web/PWA user**, I get a fast, installable experience with 90+ Lighthouse scores.

### Functional Requirements
- Every screen has: loading skeletons, empty states, error states with retry, and offline awareness.
- All data comes from `/api/mobile/v1/*` (mobile apps) — no hardcoded addresses/slots/fees remain in customer checkout.
- Real-time flows: customer tracking (polling, 8s) and staff assignment alerts (SSE/push + audible alarm) work reliably in background/foreground.
- PWA meets Core Web Vitals thresholds (LCP, CLS, INP) and scores 90+ in Lighthouse Performance.

### Non-Functional Requirements
- 0 TypeScript errors and clean lint across all touched workspaces (parity with the existing `TypeScript Errors: 0` baseline).
- Design consistency with the web's black-dominant design system already ported to mobile theme tokens.
- No regressions to existing working flows (auth, cart, orders).

# Technical Design

### Current Implementation
Monorepo (Turborepo, npm workspaces) with:
- **`apps/web`** — Next.js 15 / React 19 PWA. ~201 API routes under `app/api/**`, plus a dedicated **mobile backend** at `app/api/mobile/v1/**` (~79 routes: auth, products, categories, orders, banners, cart/validate, devices, account, and full `admin/*` + delivery/packing endpoints).
- **`apps/mobile-customer`** — Expo Router app. Per `docs/MIGRATION_REPORT.md`, all P0 and most P1 done: design tokens (`src/theme/*`), UI library (`src/components/ui/*`), home sections, auth (email/phone/Google), tracking with map, favorites/settings stores, services for `location`, `promo`, `push-notifications`, `realtime`. P2 polish remains.
- **`apps/mobile-staff`** — Expo Router app with `(auth)`, `(admin)`, `(packing)`, `(delivery)` route groups, `AssignmentAlert`, `SlideToConfirm`, `alarm`/`fcm`/`notifee`/`notifications` services, `auth` + `delivery` stores, and a robust axios client with token refresh (`src/services/api.ts`).
- **`packages/shared`** — shared `types`, `constants`, `utils` consumed by both web and mobile.

### Key Decisions
1. **Reuse existing `/api/mobile/v1` backend** — no new backend surface; wire the mobile apps to the already-built endpoints (auth, admin, dispatch, assignments, account). Rationale: backend is mature; the gap is client wiring.
2. **Keep polling for customer tracking, SSE/push for staff alerts** — matches `MIGRATION_REPORT.md` decision #3 (no `EventSource` polyfill for RN); staff assignment uses push + audible alarm which is already scaffolded.
3. **Share business logic via `packages/shared`** — cart/fee/loyalty math and constants live in shared package so mobile matches web exactly; avoid duplicating logic in RN.
4. **Dark mode via NativeWind class strategy** — wire `useColorScheme` + settings store to toggle the `dark` class using the existing token system, rather than a parallel styling path.
5. **PWA performance via Next.js primitives** — use `next/image`, dynamic `import()`/`next/dynamic` for heavy client components (maps, charts, framer-motion), and route-level code-splitting; tune the existing service worker caching. No framework change.

### Proposed Changes
**Customer app (`apps/mobile-customer`)**
- Load custom fonts (Manrope + Inter) via `expo-font` `useFonts` in `app/_layout.tsx`, using scale already in `src/theme/typography.ts`.
- Wire checkout (`app/checkout/index.tsx`) to real data: saved addresses + GPS via `src/services/location.ts`, delivery-fee preview, radius validation, `settings` store for GST/thresholds, wallet balance + loyalty redemption UI.
- Add order-success celebration (confetti/Lottie) on successful order.
- Wire dark mode: `useColorScheme` + `stores/settings.ts` → NativeWind `dark` class in `_layout.tsx`.
- Add profile editing screen wiring (`updateProfile` in `stores/auth.ts`), product sort/filter (`?sort=`), cart swipe-to-delete, and dynamic notification tab badge from FCM/notifications.

**Staff app (`apps/mobile-staff`)**
- Complete Admin flows: `(admin)/orders`, `order/[id]` (assign, bill, stock-check), `reports`, `settings`, `dispatch` — wired to `/api/mobile/v1/admin/*` and `/assignments`, `/dispatch`.
- Complete Packing flows: `(packing)/index`, `order/[id]`, stock-check + damage + collection screens.
- Complete Delivery flows: `(delivery)` collect/complete/navigate + delivery OTP, location updates via `src/services/location.ts`.
- Harden real-time alerts: `AssignmentAlert` + `services/alarm.ts` + `services/notifee.ts`/`fcm.ts` for full-screen alarm, re-alert loop, background handling, and dismissal.

**Cross-app stability**
- Standardize `OfflineBanner`, `ErrorState`, skeleton components across screens; ensure every API call has loading + error + retry.
- Audit token-refresh edge cases and logout cart-clear.

**PWA (`apps/web`)**
- Convert heavy client components (Leaflet map, Recharts, framer-motion sections) to `next/dynamic` with `ssr:false` where appropriate.
- Replace raw `<img>` with `next/image`; add `sizes`/priority; enable image optimization for R2/S3 domains in `next.config.ts`.
- Tune service worker caching strategy and route-level splitting; audit and fix CWV (LCP image priority, font-display, layout shift).

### Data Models / Contracts
No schema changes. Mobile clients consume existing contracts, e.g.:
- `GET /api/mobile/v1/admin/orders`, `POST /api/mobile/v1/admin/orders/{id}/assign`, `GET /api/mobile/v1/admin/dispatch`
- `GET /api/mobile/v1/assignments`, `GET /api/mobile/v1/delivery/assignments/pending`, `POST /api/mobile/v1/delivery/acknowledge`
- Customer: `POST /promo-codes/validate`, delivery-fee preview, `GET /account/wallet`, `GET /account/loyalty`, `POST /devices`.
Shared types/constants extended in `packages/shared/src/{types,constants,utils}` as needed.

### File Structure
- `apps/mobile-customer/app/**`, `apps/mobile-customer/src/{components,services,stores,theme}/**` — modified/extended.
- `apps/mobile-staff/app/{(admin),(packing),(delivery)}/**`, `apps/mobile-staff/src/{components,services,stores}/**` — completed.
- `apps/web/{app,components,next.config.ts,public}` — performance/PWA changes.
- `packages/shared/src/**` — shared logic additions.

### Architecture Diagram
```mermaid
graph TD
  subgraph Clients
    C[mobile-customer Expo]
    S[mobile-staff Expo]
    P[web PWA Next.js]
  end
  API[/api/mobile/v1 backend]
  WAPI[/api web routes]
  DB[(PostgreSQL / Prisma)]
  RT[SSE + Web Push + FCM]
  SH[packages/shared]

  C -->|REST + polling| API
  S -->|REST + assignment alerts| API
  P -->|REST| WAPI
  API --> DB
  WAPI --> DB
  API --> RT
  RT -->|alarm/push| S
  RT -->|status| C
  C -. types/constants .-> SH
  S -. types/constants .-> SH
  P -. types/constants .-> SH
```

### Risks
- **Native modules require dev build** (maps, secure-store, notifee/FCM) — cannot fully verify in Expo Go; validate via typecheck + `expo start` and code review.
- **Real-time alarm reliability** on Android background (notifee channels, foreground service) — needs careful channel/permission setup.
- **PWA caching regressions** — aggressive service-worker caching can serve stale content; use versioned caches and test update flow.
- **Shared-package drift** — moving logic into `packages/shared` must not break web imports; verify web build after changes.

# Testing

### Validation Approach
Since store builds, CI, and automated test suites are out of scope, validation is done through **static + build-level checks the agent can run**, plus structured manual-flow verification notes.

- Run `npx tsc --noEmit` (or the workspace typecheck) for `apps/mobile-customer`, `apps/mobile-staff`, and `apps/web` — target **0 TypeScript errors** (matches existing baseline).
- Run `turbo lint` / per-app lint and fix all errors.
- Run `npx expo start` for each mobile app to confirm the bundler compiles with no module-resolution/runtime import errors.
- Run `npm run build:web` to confirm the PWA builds; run a Lighthouse audit (production build) and confirm **Performance 90+** and CWV thresholds.
- Verify `packages/shared` still builds and both web + mobile resolve its exports.

### Key Scenarios
- **Customer**: email/phone/Google login → home sections render → add to cart → floating bar → promo code → checkout with GPS/saved address + wallet + loyalty → order success celebration → live tracking.
- **Staff — packing**: login → see assigned orders → stock check → mark damage/collection → complete.
- **Staff — delivery**: receive full-screen assignment alarm → acknowledge → navigate → collect payment → complete with OTP.
- **Staff — admin**: orders list → assign partner → dispatch → reports.
- **PWA**: cold load LCP/CLS/INP within thresholds; installable; offline shell loads.

### Edge Cases
- Offline: banner shows, cached data renders, actions queue/fail gracefully with retry.
- 401 token expiry mid-session → silent refresh, no logout loop.
- Delivery-radius exceeded → checkout blocked with clear message.
- Assignment alarm when app backgrounded / device locked.
- PWA service-worker update → new version served without stale cache lock.

### Test Changes
No automated test framework is added in this pass. Existing behavior must not regress; validation is via typecheck, lint, build, `expo start`, and Lighthouse.

# Delivery Steps

###   Step 1: Complete customer app P2 polish & full API wiring
mobile-customer reaches full web feature parity with all remaining P2 items done and every checkout/account API wired.

- Load Manrope + Inter via `expo-font` `useFonts` in `app/_layout.tsx` using `src/theme/typography.ts`.
- Wire `app/checkout/index.tsx` to real data: saved-address selector + GPS detection (`src/services/location.ts`), distance-based delivery-fee preview, delivery-radius validation, store settings (GST/thresholds) from `stores/settings.ts`.
- Add wallet-payment option (balance check) and loyalty-points redemption UI at checkout.
- Add order-success celebration (confetti/Lottie) after successful order.
- Add product sort/filter (`?sort=`), cart swipe-to-delete, and profile-editing screen wired to `stores/auth.ts` `updateProfile`.
- Remove all hardcoded addresses/slots/fees.

###   Step 2: Wire dark mode + cross-app stability (offline/error/loading)
Dark mode works app-wide and every screen has consistent offline/error/loading states across both mobile apps.

- Wire `useColorScheme` + `stores/settings.ts` to toggle the NativeWind `dark` class in `app/_layout.tsx` (customer app), using existing token system.
- Add dynamic notification badge on the tab icon from FCM/notifications state.
- Standardize `OfflineBanner`, `ErrorState`, and skeleton usage across customer + staff screens; ensure every API call has loading + error + retry.
- Audit token-refresh edge cases (silent refresh, no logout loop) and clear cart on logout.
- Extend `packages/shared` types/constants/utils where mobile needs parity with web business logic.

###   Step 3: Complete staff app: admin, packing & delivery role flows
mobile-staff is feature-complete for all three roles with every screen wired to the mobile backend.

- Admin: complete `(admin)/orders`, `order/[id]` (assign, bill, stock-check), `reports`, `settings`, and dispatch — wired to `/api/mobile/v1/admin/*`, `/assignments`, `/dispatch`.
- Packing: complete `(packing)/index`, `order/[id]`, stock-check, damage, and collection flows.
- Delivery: complete `(delivery)` collect/complete/navigate screens with delivery OTP and live location updates via `src/services/location.ts`.
- Ensure all screens use shared UI/error/loading patterns and the existing token-refresh axios client.

###   Step 4: Harden staff real-time assignment alerts & alarm
Delivery/packing staff reliably receive full-screen assignment alerts with audible alarm in foreground and background.

- Complete `AssignmentAlert` full-screen modal with re-alert loop and auto-dismiss.
- Wire `services/alarm.ts`, `services/notifee.ts`, and `services/fcm.ts` for audible alarm, vibration, notification channels, and background handling.
- Handle notification tap deep-linking to the assigned order.
- Register device tokens on login via `/api/mobile/v1/devices` and refresh on token change.

###   Step 5: Make the PWA topnotch: Core Web Vitals & 90+ Lighthouse
apps/web scores 90+ Lighthouse Performance with healthy LCP/CLS/INP and no regressions.

- Convert heavy client components (Leaflet map, Recharts, framer-motion sections) to `next/dynamic` with `ssr:false` where appropriate.
- Replace raw `<img>` with `next/image` (with `sizes`/priority) and enable image optimization for R2/S3 domains in `next.config.ts`.
- Add route-level code-splitting and tune the service-worker caching strategy (versioned caches, correct update flow).
- Fix CWV issues: LCP image priority, font-display, and layout-shift sources; verify via a production build + Lighthouse audit.