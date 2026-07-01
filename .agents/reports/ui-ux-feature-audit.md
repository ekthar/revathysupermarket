# UI/UX & Feature Audit Report
## Revathy Supermarket (MSM Supermarket)
**Date:** 2026-07-01  
**Scope:** Next.js web app (customer, admin, staff, delivery) + React Native mobile-staff app  
**Type:** Review only — no code changes made

---

## SECTION 1 — UI Consistency & Irregularities

### 1.1 Font & Typography Inconsistencies

| Issue | Location | Detail |
|-------|----------|--------|
| Heading weight variance | `app/admin/reports/page.tsx` vs `app/dashboard/page.tsx` | Reports page uses `font-display text-4xl font-black`, dashboard uses `font-display text-4xl font-black tracking-tighter`. Tracking differs without semantic reason. |
| Body text size mixing | `product-card.tsx` | Both `compact` and non-compact variants use `text-caption` for product name (the `cn()` call on line ~100 applies `text-caption` for both paths — dead branch). |
| Section title inconsistency | Homepage sections | `section-title` class (CSS: 1.5rem/900) used in some sections; others use inline `text-title font-bold` (Tailwind: 20px/700). Same semantic meaning, different rendering. |
| Mobile staff app | All screens | Uses raw Tailwind sizes (`text-2xl font-bold`, `text-sm`, `text-xs`) with no design-token abstraction. Inconsistent with web app's custom `text-display`/`text-heading`/`text-title`/`text-body`/`text-caption`/`text-micro` scale. |


### 1.2 Spacing & Padding Inconsistencies

| Issue | Location | Detail |
|-------|----------|--------|
| Page top padding variance | `app/account/page.tsx` uses `pt-8`; `app/dashboard/page.tsx` uses `pt-8 sm:py-10`; `app/checkout/page.tsx` uses `py-8 sm:py-10` | No consistent "page top" spacing token. |
| Card padding mix | Admin pages | `admin/reports/page.tsx` uses `p-5 sm:p-7`; `admin/orders/page.tsx` delegates to client component with different internal padding. Report metric cards use `p-4`; dashboard metric cards in `admin-dashboard-client.tsx` also use `p-4` (OK, but section wrappers differ). |
| Mobile staff screens | `(packing)/index.tsx` uses `pt-14 pb-4`; `(delivery)/index.tsx` uses `pt-14 pb-4`; `(admin)/index.tsx` uses `pt-10 mb-6` | Inconsistent safe-area top padding across mobile tab screens. |
| Grid gap variance | Homepage | Product grid uses `gap-2` on mobile, category grid uses `gap-3`, promo banners use their own spacing via the `PromoBanners` component. |

### 1.3 Color Inconsistencies

| Issue | Location | Detail |
|-------|----------|--------|
| Loading spinner colors differ by role | Mobile staff app | Packing screens: `#7c3aed` (purple). Delivery screens: `#059669` (green). Admin screens: `#059669` (green). No rationale documented for different colors within same app. |
| Status badge colors inconsistent | Web `admin-orders-client.tsx` vs mobile `(admin)/orders.tsx` | Web app has a rich status-color mapping with chips; mobile app just shows raw status text in a grey `bg-slate-100` pill regardless of status — no color coding. |
| Error text color variance | Web app | `checkout-form.tsx` uses toast for errors; `admin/new-order-alert.tsx` uses inline text. Mobile staff uses React Native `Alert.alert()`. No unified pattern. |
| Primary button color conflict | Mobile staff vs web | Mobile staff uses `bg-emerald-600` as the primary action color. Web app uses `bg-primary` (which resolves to `#050505` black). These represent fundamentally different brand identities. |


### 1.4 Button Styling Inconsistencies

| Issue | Location | Detail |
|-------|----------|--------|
| Button component underuse | Throughout admin pages | `components/ui/button.tsx` defines proper variants (default/secondary/outline/ghost/dark) with consistent sizing. However, many admin/staff pages use raw Tailwind classes instead (e.g., `app/admin/reports/page.tsx` export buttons: `inline-flex h-11 items-center rounded-2xl bg-primary px-5 text-sm font-black text-white`). |
| Destructive/danger button absent | `components/ui/button.tsx` | No `destructive` variant exists. Logout uses `text-red-500` on a white card; cancel/reject buttons in admin-orders use inline `bg-red-500` classes. |
| Mobile staff buttons | All screens | No shared button component. Each screen defines its own styling: login uses `bg-emerald-600 rounded-xl h-14`, packing uses `bg-purple-600 rounded-xl h-14`, delivery uses `bg-emerald-600 rounded-xl h-14`. Different corner radii in some places (`rounded-xl` vs `rounded-2xl`). |

### 1.5 Loading & Empty States

| Issue | Location | Detail |
|-------|----------|--------|
| Skeleton vs spinner mismatch | Web app | `app/loading.tsx` shows a branded loading screen. Individual sections use `content-visibility: auto` (no loading indication). Admin pages show no loading state (server-rendered). `app/admin/loading.tsx` exists but is separate. |
| Empty state only on some screens | Web: `components/ui/empty-states.tsx` | Cart and orders have beautiful animated empty states. Products page has no explicit empty state — falls back to "No results found". Admin orders list has no empty state if zero orders exist. |
| Mobile staff empty states | `(delivery)/index.tsx`, `(packing)/index.tsx` | Both have proper empty states with emojis and helper text. Admin orders shows a plain `<Text>No orders found</Text>` — inconsistent quality. |
| No error boundaries on mobile | Mobile staff app | No error boundary or fallback UI if an API call fails on initial load (just silently empty). Web app has `app/error.tsx` and `app/global-error.tsx`. |


### 1.6 Layout & Breakpoint Issues

| Issue | Location | Detail |
|-------|----------|--------|
| Desktop header missing on inner pages | Web `components/header.tsx` | Header hides entirely on `/staff`, `/admin`, `/delivery` routes. This is correct for admin (has its own layout) but means delivery partner web view has NO navigation chrome. |
| Footer only visible on homepage | `app/page.tsx` | The footer is rendered inline on the homepage. No other customer-facing page has a footer. Products page, account page, dashboard page all end abruptly. |
| Admin sidebar responsive behavior | `components/admin/admin-sidebar.tsx` | On mobile admin, the sidebar converts to a horizontal scroll-nav. However, with 20+ navigation items, this creates a very wide scrollable row that's hard to navigate on small screens. |
| Mobile bottom nav `pb-safe` padding | `globals.css` | All pages get `pb-safe` (82px + safe area) padding even on desktop (mitigated by `@media (min-width: 768px) { .pb-safe { padding-bottom: 0; } }`). However, the cart page content may render below the floating cart bar on mobile, creating potential overlap. |

### 1.7 Text Overflow / Truncation Issues

| Issue | Location | Detail |
|-------|----------|--------|
| Customer name truncation | `mobile-staff/(delivery)/index.tsx` | Customer name has no `numberOfLines` prop — will wrap and push layout on very long names. |
| Address overflow | `mobile-staff/(delivery)/index.tsx` | Uses `numberOfLines={1}` (good), but web delivery page renders full addresses without truncation in the order card. |
| Product name in cart | `product-card.tsx` | Grid variant uses `line-clamp-2`, horizontal variant uses `line-clamp-1`. This is intentional but the horizontal card may clip names like "Organic Cold-Pressed Coconut Oil 500ml" at ~15 characters on narrow screens. |
| Order number on mobile | Admin orders mobile | Long order numbers like `ORD-20260701-ABCD1234` are displayed at `text-sm font-bold` — could overflow the flex row on very narrow devices (320px). |

### 1.8 Dark Mode Issues

| Issue | Location | Detail |
|-------|----------|--------|
| Mobile staff app has NO dark mode support | All `apps/mobile-staff` screens | Every screen uses hardcoded light colors (`bg-white`, `bg-slate-50`, `text-slate-900`). NativeWind dark mode is not configured. |
| Dark mode utility overrides in CSS | `globals.css` lines ~315-340 | Manual `.dark .bg-white`, `.dark .bg-slate-50` global overrides are fragile — they override ALL instances of these classes in dark mode regardless of intent. |
| Promo banners dark mode | `components/home/promo-banners.tsx` | Uses `alt=""` (empty alt) which is technically correct for decorative images, but the banner card text styling doesn't account for dark mode gradient visibility. |


### 1.9 Icon Consistency

| Issue | Location | Detail |
|-------|----------|--------|
| Lucide icons throughout web | Web app | Consistent — all icons use Lucide React. Good. |
| Mobile staff uses emoji as icons | `(admin)/index.tsx`, `(packing)/index.tsx` | Metric cards use emoji (📦, 💰, ⏳, ✅) instead of proper icon components. This renders inconsistently across Android OEMs (Samsung vs Google vs Xiaomi emoji sets). |
| Mixed icon + emoji in action buttons | `(delivery)/order/[id]/index.tsx` | Uses `🗺️ Navigate`, `💰 Collect`, `✓ Complete` — mixing emoji with text characters for iconography. |

---

## SECTION 2 — UX Flow Issues

### 2.1 Unnecessary Friction / Extra Taps

| Issue | Location | Impact |
|-------|----------|--------|
| Reports require manual "Load Report" tap | `mobile-staff/(admin)/reports.tsx` | After selecting period and tab, user must explicitly tap "Load Report" button. Should auto-fetch on tab/period change like the web admin dashboard does. |
| No quick-add from search results | Web `components/home/home-search.tsx` | Search shows product results but requires navigating to product page to add to cart. A direct "+" button in search results would save a round-trip. |
| Checkout requires location detect on every visit | `components/checkout-form.tsx` | Even if user has a saved address with GPS coordinates, the location state starts as "idle" and the flow may re-validate. However, saved addresses do populate lat/lng, so this is partially mitigated. |

### 2.2 Missing Confirmation Dialogs

| Issue | Location | Impact |
|-------|----------|--------|
| No confirmation on order rejection | `mobile-staff/app/alert/[eventId].tsx` | The "Reject" button on the delivery alert immediately fires without confirming. Accidental rejection means losing the order. |
| No confirmation on cart clear | Web cart | If a user navigates away from checkout after partial input, there's no "are you sure?" prompt. Cart persists in localStorage (good), but form state (address fields) may be lost. |
| Mark Ready without confirmation | `mobile-staff/(packing)/order/[id].tsx` | "Mark Ready for Delivery" posts immediately — no "Are you sure all items are packed?" dialog before the irreversible action. Uses `Alert.alert` only for success feedback. |

### 2.3 Missing Action Feedback

| Issue | Location | Impact |
|-------|----------|--------|
| Silent failure on mobile API errors | All mobile staff screens | API calls in `fetchOrders`, `fetchStats` have empty `catch {}` blocks — user sees stale data with no indication that refresh failed. |
| No optimistic UI on status updates | Mobile staff delivery/packing | When marking order as ready or completing delivery, the button disables but there's no progress indication beyond `ActivityIndicator`. No optimistic list update. |
| Admin acknowledge has no list refresh | `components/admin/new-order-alert.tsx` | After acknowledging, the order disappears from the alert popup but the orders page doesn't automatically refresh (user must manually reload). |

### 2.4 Navigation Dead-Ends

| Issue | Location | Impact |
|-------|----------|--------|
| Delivery web page has no navigation | `app/delivery/page.tsx` | The header is hidden on `/delivery`. There's no way to navigate to settings or logout except through the `DeliveryAppShell` component (which may or may not include it). |
| Mobile staff profile pages | `(delivery)/profile.tsx`, `(packing)/profile.tsx` | These exist in the file tree but weren't deeply audited — if they lack a back button or logout, they're dead ends. |
| Track page has no fallback | `app/track/[id]` | If an order doesn't exist or user isn't authenticated, there's no graceful redirect — may show a blank or error page. |

### 2.5 Status Clarity Issues

| Issue | Location | Impact |
|-------|----------|--------|
| Raw status strings on mobile | `mobile-staff/(admin)/orders.tsx` | Status is displayed as raw enum: `ORDER_RECEIVED`, `PACKING`, etc. Web admin has proper labels and color-coded pills. Mobile shows them in grey pills with no color differentiation. |
| ETA not visible until OUT_FOR_DELIVERY | `components/tracking/live-order-tracking.tsx` | This is correct per requirements (ETA only after rider accepts). However, the customer sees no time estimate during PACKING/READY states — could be confusing. A "preparing" time estimate would help. |
| No "pending approval" indicator for substitutions | Customer dashboard | `editApprovalStatus` is fetched but the UI for pending substitution approvals could be more prominent (currently buried in order detail). |

### 2.6 Inconsistent Action Labels

| Issue | Screens | Detail |
|-------|---------|--------|
| "Accept" vs "Acknowledge" | New order alert uses "Accept Order"; order detail uses "Acknowledge". These are the same action. |
| "Save" vs "Submit" vs "Place Order" | Checkout: "Place Order". Collection screen: "Save Collection". Settings: toggle switches (no explicit save). Report: "Load Report". No consistent verb pattern. |
| "Back" navigation label | Web header shows "Back" text on mobile. Desktop shows an ArrowLeft icon only. Mobile staff has no back button on most screens (relies on system gesture). |


---

## SECTION 3 — Accessibility Gaps

### 3.1 Missing Alt Text

| Issue | File | Detail |
|-------|------|--------|
| Empty alt on product images (admin dashboard) | `components/admin/admin-dashboard-client.tsx:464` | Low-stock product images use `alt=""`. Should use product name. |
| Empty alt on offer images | `components/admin/offer-management-client.tsx:184` | Offer thumbnails use `alt=""`. Should describe the offer. |
| Empty alt on promo banners | `components/home/promo-banners.tsx:75` | Banner images use `alt=""`. The banner `title` is available and should be used. |
| Empty alt on logo (onboarding) | `components/onboarding/onboarding-flow.tsx:84` | Logo uses `alt=""`. Should be store name or "Store logo". |
| Product images OK | `components/product-image.tsx`, `product-card.tsx` | Pass `alt={product.name}` — correct. |

### 3.2 Color Contrast Concerns

| Issue | Location | Detail |
|-------|----------|--------|
| `text-micro` (10px) on light backgrounds | Throughout customer pages | 10px text at font-weight 500 in `text-neutral-400` on white backgrounds may fail WCAG AA for normal text (requires 4.5:1 ratio). `#9CA3AF` on `#FFFFFF` = 2.9:1 — **fails**. |
| White text on green gradient | `components/tracking/live-order-banner.tsx` | `text-white/80` and `text-white/60` on `secondary-500` (#22C55E) — the `/60` variant is ~3.1:1 contrast — **fails AA**. |
| Muted foreground on card backgrounds | Various admin cards | `text-muted-foreground` (hsl 220 9% 46%) on white card = ~4.3:1 — borderline pass for large text only. Small `text-xs` usage would fail. |
| Orange text on orange-50 background | `components/admin/new-order-alert.tsx` | `text-orange-600` on `bg-orange-50` — likely passes but should be verified. |

### 3.3 Touch Target Sizes

| Issue | Location | Detail |
|-------|----------|--------|
| Quantity stepper buttons (grid variant) | `components/product-card.tsx` | Horizontal stepper buttons are `w-7 h-[30px]` = 28x30px. Below the 44x44px minimum for WCAG 2.5.8 (mobile). |
| Cart badge dismiss | Various | The `X` dismiss button on new-order-alert is `h-7 w-7` = 28x28px. Too small for touch. |
| Admin sidebar nav items on mobile | `components/admin/admin-sidebar.tsx` | Horizontal scroll pills — likely small touch targets in a scrollable row. |
| Mobile staff tab bar pills | `mobile-staff/(admin)/orders.tsx` `ScrollableTabBar` | Pills are `px-3 py-1.5` with `text-xs` — effective height ~28px. Below minimum. |

### 3.4 Missing Form Labels

| Issue | Location | Detail |
|-------|----------|--------|
| Checkout form inputs | `components/checkout-form.tsx` | Uses `<label>` elements wrapping inputs — **correct**. |
| Admin search inputs | `mobile-staff/(admin)/orders.tsx` | `TextInput` has `placeholder` but no associated label element. Screen readers won't announce the field purpose. |
| All mobile staff TextInputs | Throughout | No `accessibilityLabel` prop on any `TextInput` component. React Native requires explicit accessibility props. |
| OTP input | `mobile-staff/(auth)/otp.tsx` | Assumed to have placeholder only — needs `accessibilityLabel="One-time password"`. |

### 3.5 Keyboard Navigation (Web)

| Issue | Location | Detail |
|-------|----------|--------|
| Skip-to-content link present | `components/ui/skip-to-content.tsx` | Correct implementation — good. |
| Focus ring on all interactive elements | `globals.css` | `:focus-visible` has a 3px ring. Good global default. |
| Framer Motion animations respect reduced-motion | `globals.css` | `@media (prefers-reduced-motion: reduce)` disables transitions. Good. But Framer Motion `animate` props still fire — would need `useReducedMotion()` hook in components. |
| Bottom navigation keyboard access | `components/mobile-bottom-nav.tsx` | Uses `<Link>` elements — naturally focusable. Has `focus-visible:ring-2`. Good. |

### 3.6 Mobile Staff App — Zero Accessibility

| Issue | Scope | Detail |
|-------|-------|--------|
| No `accessibilityLabel` anywhere | All mobile-staff screens | grep for `aria-label|accessibilityLabel|accessible` returns zero results. This means screen readers cannot meaningfully navigate any screen. |
| No `accessibilityRole` on pressables | All Pressable components | Missing `role="button"` annotations — TalkBack/VoiceOver won't announce these as actionable. |
| No live region for alerts | `app/alert/[eventId].tsx` | The countdown timer changes every second but has no `accessibilityLiveRegion` — screen reader users won't know time is running out. |


---

## SECTION 4 — Feature Completeness Check

### Legend
- **(a)** Fully implemented
- **(b)** Partially implemented (detail on what's missing)
- **(c)** Not started

| # | Feature | Status | Evidence / Notes |
|---|---------|--------|------------------|
| 1 | ETA shown only after rider accepts order | **(a)** Fully implemented | `components/tracking/live-order-tracking.tsx:126` — checks `["OUT_FOR_DELIVERY", "ARRIVING"]` before showing ETA. |
| 2 | Collect-payment popup with human-language change/balance wording | **(a)** Fully implemented | Both web (`delivery-orders-client.tsx` CollectionDialog) and mobile (`(delivery)/order/[id]/collect.tsx`) show clear messages: "Give ₹X change to customer", "Collect ₹X more from customer", "Amount matches — no change needed". |
| 3 | Swipe-to-deliver working cross-platform | **(b)** Partially implemented | `mobile-staff/src/components/SlideToConfirm.tsx` uses Reanimated + GestureHandler. **Known bug:** `dragConstraints` uses `trackWidth` state which starts at 300 before `onLayout` fires, causing the thumb to snap back on first render. See PR #42 learnings. iOS works; Android has the snap-back issue. |
| 4 | Substitute/swap approval asked every time | **(b)** Partially implemented | Admin can substitute items via `admin-orders-client.tsx` edit panel (`action: "substitute"`). Customer approval is tracked via `editLogs` with `requiresCustomerApproval: true, customerDecision: null`. **Missing:** No enforcement that approval is asked every single time — admin can substitute without requiring approval if they choose. The system supports it but doesn't force it. |
| 5 | Thermal printer integration (ESC/POS, multi-connection) | **(c)** Not started | No ESC/POS library, no Bluetooth/USB printer code, no thermal receipt formatting. The only "print" is `window.print()` (browser print dialog) in `print-button.tsx`. Mobile staff has a `printInvoice` function that just calls `api.post(/orders/${id}/print)` to track the event — no actual printer communication. |
| 6 | Printed/unprinted status chip and high-visibility alert | **(a)** Fully implemented | `admin-orders-client.tsx` receives `printedAt`, `printCount`; feature flag `print_required_alert` with configurable threshold minutes; mobile admin dashboard shows unprinted order count with red alert banner. Web admin orders page shows printed/unprinted badge. |
| 7 | 2-decimal formatting on all monetary values | **(a)** Fully implemented | `lib/utils.ts` `formatCurrency()` uses `Intl.NumberFormat` with `minimumFractionDigits: 2, maximumFractionDigits: 2`. Mobile staff uses `.toFixed(2)` consistently. |
| 8 | GST hidden from dashboard views | **(b)** Partially implemented | GST is **calculated and passed** to `AdminDashboardClient` as `todayGstCollection` and `monthGstCollection`. The dashboard client renders these values (visible to users with `canSeeFinancials`). **Not hidden** — it's displayed. The checkout page correctly shows GST as part of the bill. The requirement to "hide from dashboard" is NOT met. |
| 9 | Stock value visibility behind feature flag | **(a)** Fully implemented | `stock_value_visible` feature flag in Prisma seed, checked in `app/admin/page.tsx`, conditionally renders `inventoryValuation` metric card only when flag is enabled. |
| 10 | Forced-accept delivery logic with per-staff overrides | **(a)** Fully implemented | Feature flag `forced_accept_delivery` with `config.overrides[]` per userId. `feature-flag-settings.tsx` has UI for managing overrides. Logic is flag-gated. |
| 11 | Full-screen incoming-order ringing alert (delivery + packing) | **(b)** Partially implemented | Delivery alert: `mobile-staff/app/alert/[eventId].tsx` — full-screen modal with alarm sound, countdown, accept/reject. **Packing alert: NOT implemented.** Packing staff has no equivalent incoming-order alert screen — they only see the queue list. |
| 12 | Emergency bell alert for admin on order rejection | **(a)** Fully implemented | `mobile-staff/src/services/notifee.ts` creates an "Admin Emergency" channel with `emergency_bell` sound, HIGH importance, vibration pattern. Triggered on order rejection events. |
| 13 | Cost price / brand fields on products, actual profit reporting | **(b)** Partially implemented | Schema has `costPrice Decimal?` and `brand String?` fields (`prisma/schema.prisma:270-271`). Profit report API (`app/api/reports/profit/route.ts`) uses `costPrice` for margin calculation. **Missing:** No admin UI to input/edit cost price or brand on the product form. No brand-filtered views. Profit report exists on mobile but not on web admin reports page. |
| 14 | Sales reports by week/month/quarter, fast-moving items report | **(b)** Partially implemented | Mobile staff `(admin)/reports.tsx` has sales by week/month/quarter + fast-moving items tab. Web admin `reports/page.tsx` only shows today's data, popular items, and delivery stats — no week/month/quarter toggle. No time-range selector on web. |
| 15 | Role-based navigation (STAFF/OWNER/MANAGER/PACKING_STAFF/DELIVERY_PARTNER/ADMIN) | **(a)** Fully implemented | `lib/permissions.ts` defines full RBAC with `ROLE_PRESETS`, `PERMISSION_GROUPS`, per-permission checks. Admin layout filters nav by `can()`. Mobile staff routes by role via `getRoleGroup()`. |
| 16 | Samsung Knox / older Android compatibility | **(b)** Partially implemented | Web app has Samsung Internet PWA hints in meta tags, `COOP/COEP` set for Samsung install prompts, and security headers accommodate Samsung WebView. **Missing:** No actual Knox MDM integration, no Android API level targeting in mobile app, no explicit backward-compatibility testing config in `eas.json` or `build.gradle`. |


---

## SECTION 5 — What Could Reasonably Be Added (Low-Effort, High-Value)

Given the existing infrastructure, these additions require minimal new code:

### 5.1 Reorder from Past Orders (Customer Web)
**Effort:** Low — cart provider already supports `addItem()`.  
**Value:** High — grocery customers frequently repeat orders.  
**How:** Add a "Reorder" button on each completed order in `CustomerOrdersClient`. Loop `order.items` and call `addItem()` for each. Product data is already embedded in the order response.

### 5.2 Auto-Fetch Reports on Tab/Period Change (Mobile Staff)
**Effort:** Trivial — add `useEffect` dependency on `activeTab` and `period`.  
**How:** Remove the "Load Report" button; trigger `fetchReport()` inside `useEffect([activeTab, period])`.  
**Value:** Eliminates one tap per report view and matches user expectations.

### 5.3 Delivery Partner Earnings Summary (Mobile Staff)
**Effort:** Low — API endpoint (`/delivery/dashboard`) already returns order data.  
**How:** Add a daily/weekly earnings card at the top of `(delivery)/index.tsx` showing total COD collected + UPI. The web delivery page already calculates `todayEarnings`.

### 5.4 Out-of-Stock Toast with "Notify Me" Option (Customer Web)
**Effort:** Medium-low — product schema already has `stock` field.  
**How:** When clicking "Add to Cart" on a sold-out item (currently disabled), show a toast with "Notify when back in stock" that saves a `StockAlert` record. Requires one new Prisma model + one API endpoint.

### 5.5 Order Preparation Time Estimate (Customer Dashboard)
**Effort:** Low — `estimateOrderEta()` already exists in `lib/live-order.ts`.  
**How:** Show a soft estimate like "~15 min" during ACCEPTED/PACKING states on the live order banner. Currently shows nothing until OUT_FOR_DELIVERY.

### 5.6 Batch Print All Unprinted Orders (Admin)
**Effort:** Low — individual print tracking already exists.  
**How:** Add a "Print All Unprinted" button in admin orders that opens a print-optimized view of all unprinted order invoices in a single browser tab. CSS `@media print` rules are already defined.

### 5.7 Customer Delivery Address Map Preview (Checkout)
**Effort:** Low — latitude/longitude already collected.  
**How:** `LocationMap` component already exists (`components/location-map.tsx`). Embed a small static map preview showing the pin after GPS is detected, so customers can verify the location visually.

### 5.8 Haptic Feedback on Mobile Staff Actions
**Effort:** Trivial — React Native `Vibration` API already used in `SlideToConfirm`.  
**How:** Add `Vibration.vibrate(10)` on order accept, pack complete, and status change taps for tactile confirmation.

---

## PRIORITIZED TOP-10 ISSUES TO FIX FIRST

Ranked by (impact to user x effort to fix), highest priority first:

| Rank | Issue | Section | Impact | Effort | Why Fix First |
|------|-------|---------|--------|--------|---------------|
| **1** | Thermal printer integration not started | S4 #5 | Critical for operations — staff currently can't print receipts from the app | High (days) | Core business requirement; blocks daily operations for the store. Without this, staff must use browser print which is slow and error-prone. |
| **2** | SlideToConfirm snap-back bug on Android | S4 #3 | Delivery partners can't complete deliveries reliably | Low (hours) | Known fix: use `onLayout` callback to set `maxX` and don't render gesture until width is measured. Blocks the most common staff action. |
| **3** | Mobile staff app has ZERO accessibility | S3.6 | Completely unusable by staff with vision impairments; may violate accessibility laws | Medium (1-2 days) | Add `accessibilityLabel` to all Pressables, TextInputs, and dynamic content. Straightforward but requires touching every screen. |
| **4** | GST shown on dashboard (should be hidden) | S4 #8 | Confuses staff who see inflated "revenue" that includes tax they'll remit | Trivial (minutes) | Conditionally hide the GST metric cards or relabel them. One-line change in `admin-dashboard-client.tsx`. |
| **5** | Packing staff has no incoming order alert | S4 #11 | Packing staff miss new orders, causing delays | Medium (hours) | Reuse delivery alert pattern (`alert/[eventId].tsx`) with packing-specific routing. FCM channel already exists. |
| **6** | Mobile admin orders show raw status enums | S1.3, S2.5 | Staff see "ORDER_RECEIVED" instead of "New" — confusing and unprofessional | Trivial (30 min) | Add a `STATUS_LABELS` map (already exists in delivery screen — just copy it). Add color-coded pills. |
| **7** | Quantity stepper touch targets too small | S3.3 | Users misfire taps, accidentally adding wrong quantities | Low (30 min) | Increase stepper button width from 28px to 44px. Adjust the container layout proportionally. |
| **8** | Reports auto-load on mobile staff | S2.1, S5.2 | Staff waste a tap on every report view | Trivial (10 min) | Move `fetchReport()` into a `useEffect` dependent on `activeTab` and `period`. Delete the "Load Report" button. |
| **9** | Missing cost price / brand admin UI | S4 #13 | Data fields exist in schema but can't be populated through the UI | Medium (hours) | Add `costPrice` and `brand` inputs to the product edit form in admin. Fields exist in Prisma schema — just need form inputs + API update. |
| **10** | Empty alt text on product/offer images | S3.1 | Screen readers announce "image" with no context; SEO penalty for decorative-marked meaningful images | Trivial (15 min) | Replace `alt=""` with `alt={product.name}` or `alt={offer.title}` in the 4 identified locations. |

---

*End of audit. No code was modified. Issues above are ready for prioritized implementation.*


---
---

# UI/UX IMPROVEMENT PLAN

## Execution Strategy

This plan is organized into **4 sprints** (1 week each), grouped by dependency and impact. Each item references the audit section it resolves.

---

## SPRINT 1 — Critical Fixes & Operational Blockers (Week 1)

> **Theme:** Unblock daily operations and fix broken interactions

| # | Task | Files to Change | Resolves | Est. Hours |
|---|------|----------------|----------|------------|
| 1.1 | **Fix SlideToConfirm snap-back on Android** | `mobile-staff/src/components/SlideToConfirm.tsx` | S4 #3 | 2h |
| | Fix: Guard gesture rendering with `trackWidth > 0` check; compute `maxX` from measured layout, not initial state of 300. Add `if (!trackWidth) return <LoadingThumb />`. | | | |
| 1.2 | **Hide GST from admin dashboard** | `apps/web/components/admin/admin-dashboard-client.tsx` | S4 #8 | 0.5h |
| | Remove or gate the GST metric cards behind a separate `showGstBreakdown` feature flag. Revenue numbers should show net-of-GST by default. | | | |
| 1.3 | **Add STATUS_LABELS + color pills to mobile admin orders** | `mobile-staff/app/(admin)/orders.tsx` | S1.3, S2.5 | 1h |
| | Copy the `STATUS_LABELS` and `STATUS_COLORS` maps from `(delivery)/index.tsx`. Replace the grey `bg-slate-100` pill with the color-coded version. | | | |
| 1.4 | **Add confirmation dialog to order rejection** | `mobile-staff/app/alert/[eventId].tsx` | S2.2 | 1h |
| | Wrap `handleReject()` in `Alert.alert("Reject Order?", "This cannot be undone.", [{text:"Cancel"}, {text:"Reject", style:"destructive", onPress: handleReject}])` | | | |
| 1.5 | **Add confirmation to "Mark Ready for Delivery"** | `mobile-staff/app/(packing)/order/[id].tsx` | S2.2 | 0.5h |
| | Add `Alert.alert("Mark as ready?", "Ensure all items are packed.", [...])` before calling `markReady()`. | | | |
| 1.6 | **Auto-fetch reports on tab/period change** | `mobile-staff/app/(admin)/reports.tsx` | S2.1, S5.2 | 0.5h |
| | Add `useEffect(() => { fetchReport() }, [activeTab, period])`. Remove "Load Report" button. | | | |
| 1.7 | **Fix empty alt text (4 instances)** | `admin-dashboard-client.tsx`, `offer-management-client.tsx`, `promo-banners.tsx`, `onboarding-flow.tsx` | S3.1 | 0.5h |
| | Replace `alt=""` with `alt={product.name}`, `alt={offer.title}`, `alt={banner.title}`, `alt="Store logo"`. | | | |
| 1.8 | **Add error feedback to mobile API failures** | All mobile staff fetch calls | S2.3 | 2h |
| | Replace empty `catch {}` with `catch (e) { showError("Could not load data. Pull to refresh.") }`. Add a simple error banner component. | | | |

**Sprint 1 Total: ~8 hours**

---

## SPRINT 2 — Design System Unification (Week 2)

> **Theme:** Establish consistent design tokens and shared components for mobile-staff

| # | Task | Files to Change | Resolves | Est. Hours |
|---|------|----------------|----------|------------|
| 2.1 | **Create mobile-staff shared Button component** | `mobile-staff/src/components/Button.tsx` (new) | S1.4 | 3h |
| | Variants: `primary` (emerald-600), `secondary` (outline), `danger` (red-500), `ghost`. Sizes: `sm` (h-10), `md` (h-12), `lg` (h-14). Replace all inline button styles across screens. | | | |
| 2.2 | **Create mobile-staff typography tokens** | `mobile-staff/src/components/Text.tsx` (new) | S1.1 | 2h |
| | Variants matching web: `display`, `heading`, `title`, `body`, `caption`, `micro`. Ensures consistent sizing. Apply across all screens. | | | |
| 2.3 | **Unify page layout padding** | All mobile-staff screen headers | S1.2 | 2h |
| | Create a `ScreenHeader` component with consistent `pt-14 pb-4 px-5 border-b border-slate-100` pattern. Replace the 3 different header patterns. | | | |
| 2.4 | **Replace emoji icons with proper icon set** | `mobile-staff/app/(admin)/index.tsx`, `(delivery)/order/[id]/index.tsx` | S1.9 | 2h |
| | Install `lucide-react-native` or `@expo/vector-icons`. Replace 📦, 💰, ⏳, ✅, 🗺️ with proper `<Package />`, `<Wallet />`, `<Clock />`, `<Check />`, `<Map />` icons. | | | |
| 2.5 | **Add destructive button variant to web** | `apps/web/components/ui/button.tsx` | S1.4 | 1h |
| | Add `destructive: "bg-red-600 text-white hover:bg-red-700 shadow-elevation-2"` variant. Update logout and cancel buttons to use `<Button variant="destructive">`. | | | |
| 2.6 | **Standardize loading colors on mobile** | All `ActivityIndicator` usages | S1.3 | 1h |
| | Define `BRAND_COLOR = "#059669"` in a shared constants file. Replace all hardcoded color strings. Remove the purple variant (packing) — use one consistent brand color. | | | |
| 2.7 | **Increase touch targets to 44px minimum** | `product-card.tsx` stepper, `new-order-alert.tsx` dismiss, `(admin)/orders.tsx` tabs | S3.3 | 2h |
| | Quantity stepper: increase `w-7` → `w-11`, `h-[30px]` → `h-11`. Dismiss button: `h-7 w-7` → `h-10 w-10`. Tab pills: add `min-h-[44px]`. | | | |
| 2.8 | **Add consistent empty states to all screens** | `mobile-staff/(admin)/orders.tsx`, web admin orders | S1.5 | 2h |
| | Create reusable `EmptyState` component with icon + title + subtitle. Apply to admin orders (mobile and web) for zero-order state. | | | |

**Sprint 2 Total: ~15 hours**

---

## SPRINT 3 — Accessibility & UX Polish (Week 3)

> **Theme:** Make the app usable for everyone and smooth rough UX edges

| # | Task | Files to Change | Resolves | Est. Hours |
|---|------|----------------|----------|------------|
| 3.1 | **Add accessibilityLabel to all mobile-staff interactive elements** | Every screen in `mobile-staff/app/` | S3.6 | 8h |
| | Systematic pass: every `<Pressable>` gets `accessibilityRole="button" accessibilityLabel="..."`. Every `<TextInput>` gets `accessibilityLabel="..."`. FlatList items get `accessibilityLabel`. | | | |
| 3.2 | **Add accessibilityLiveRegion to countdown** | `mobile-staff/app/alert/[eventId].tsx` | S3.6 | 0.5h |
| | Add `accessibilityLiveRegion="assertive"` to the countdown `<Text>` so screen readers announce time remaining. | | | |
| 3.3 | **Fix color contrast — text-micro on neutral-400** | `globals.css`, various components | S3.2 | 2h |
| | Change `text-neutral-400` → `text-neutral-500` for small text (10px/12px). Neutral-500 (#6B7280) on white = 4.6:1 — passes AA. Update live-order-banner `text-white/60` → `text-white/80`. | | | |
| 3.4 | **Add Framer Motion reduced-motion hook** | Key animated components | S3.5 | 2h |
| | Import `useReducedMotion()` from Framer Motion. In components with heavy animation (product-card, checkout success, home hero), conditionally set `animate={false}` when reduced motion is preferred. | | | |
| 3.5 | **Add footer to all customer pages** | `apps/web/app/layout.tsx` or create `components/footer.tsx` | S1.6 | 2h |
| | Extract the footer from `page.tsx` into a shared `<Footer>` component. Render it in the root layout for customer pages (exclude admin/staff/delivery routes). | | | |
| 3.6 | **Add "Reorder" button to completed orders** | `components/dashboard/customer-orders-client.tsx` | S5.1 | 3h |
| | Add a "Reorder All Items" button on DELIVERED orders. On tap: loop through `order.items`, call `addItem()` for each (skip unavailable), show toast with count of items added, navigate to cart. | | | |
| 3.7 | **Add packing staff incoming alert** | `mobile-staff/app/alert/[eventId].tsx`, `services/notifee.ts` | S4 #11 | 4h |
| | Extend the delivery alert pattern: when packing staff receives FCM `type: "packing_assignment"`, navigate to alert screen with "New Packing Order" title. Add "Start Packing" action that routes to `/(packing)/order/[id]`. | | | |
| 3.8 | **Standardize action labels** | Multiple screens | S2.6 | 1h |
| | Establish verb conventions: `Accept` (for new orders), `Confirm` (for destructive/final actions), `Save` (for form data). Rename "Acknowledge" → "Accept", "Load Report" → removed (auto-loads), "Save Collection" → "Confirm Collection". | | | |

**Sprint 3 Total: ~22.5 hours**

---

## SPRINT 4 — Feature Completion & Platform Polish (Week 4)

> **Theme:** Close the remaining feature gaps and add high-value additions

| # | Task | Files to Change | Resolves | Est. Hours |
|---|------|----------------|----------|------------|
| 4.1 | **Add cost price + brand fields to admin product form** | `components/admin/product-form.tsx`, `app/api/admin/products/[id]/route.ts` | S4 #13 | 4h |
| | Add two input fields: "Cost Price (₹)" (decimal) and "Brand" (text). Include in product create/update API. Show brand as a filter chip on product list. | | | |
| 4.2 | **Add time-range selector to web admin reports** | `apps/web/app/admin/reports/page.tsx` | S4 #14 | 4h |
| | Add week/month/quarter buttons (same pattern as mobile). Call the existing `/api/reports/sales` endpoint with period param. Display results in the existing card layout. | | | |
| 4.3 | **Enforce substitute approval on every occurrence** | `app/api/admin/orders/[id]/edit/route.ts` | S4 #4 | 3h |
| | When `action === "substitute"`, always set `requiresCustomerApproval: true` regardless of admin intent. Remove the ability to substitute silently. Add a migration if needed to make this field non-nullable for substitution actions. | | | |
| 4.4 | **Add dark mode to mobile-staff app** | `mobile-staff/tailwind.config.ts`, all screen files | S1.8 | 8h |
| | Enable NativeWind dark mode class strategy. Replace hardcoded `bg-white` with `bg-white dark:bg-slate-900`, `text-slate-900` with `text-slate-900 dark:text-white`, etc. across all 12 screens. Add a theme toggle in settings. | | | |
| 4.5 | **Preparation time estimate on live order banner** | `components/tracking/live-order-banner.tsx`, `lib/live-order.ts` | S5.5 | 2h |
| | Extend `estimateOrderEta()` to return a preparation estimate for ACCEPTED/PACKING states (e.g., "~15 min"). Show in the banner with a different label ("Preparing" vs "Arriving"). | | | |
| 4.6 | **Batch print unprinted orders** | `components/admin/admin-orders-client.tsx`, new print view component | S5.6 | 3h |
| | Add "Print All Unprinted" button that filters unprinted orders, opens a new tab with print-optimized multi-invoice layout, and marks all as printed after `window.print()`. | | | |
| 4.7 | **Admin sidebar mobile UX improvement** | `components/admin/admin-sidebar.tsx` | S1.6 | 3h |
| | Replace horizontal scroll with a collapsible hamburger menu that groups nav items by category (Operations, Catalogue, Finance, Admin). Show badges inline. Much more navigable than a 20+ item horizontal scroll. | | | |
| 4.8 | **Add haptic feedback to mobile staff actions** | All action handlers in mobile-staff | S5.8 | 1h |
| | Import `Vibration` from 'react-native'. Add `Vibration.vibrate(10)` to: order accept, mark ready, pack item check, start delivery. Subtle but improves tactile confidence. | | | |

**Sprint 4 Total: ~28 hours**

---

## ONGOING / FUTURE SPRINTS

These are larger efforts that should be planned after Sprints 1-4:

| Task | Resolves | Est. Effort | Notes |
|------|----------|-------------|-------|
| **Thermal Printer Integration (ESC/POS)** | S4 #5 | 2-3 weeks | Requires: selecting a React Native BLE/USB library (e.g., `react-native-esc-pos-printer`), building receipt template formatter, supporting multiple connection types (Bluetooth, USB, network). Should be its own spec. |
| **Samsung Knox MDM Integration** | S4 #16 | 1 week | Requires: Knox SDK enrollment, device policy configuration, kiosk mode lock for delivery devices. Only needed if deploying managed devices. |
| **Web accessibility audit (WCAG 2.1 AA)** | S3 | 1 week | Professional audit tool pass (axe-core, Lighthouse). Fix remaining contrast issues, ensure all interactive elements are keyboard-reachable, add `aria-live` regions for dynamic content. |
| **Performance optimization pass** | — | 1 week | Measure Core Web Vitals on production. Optimize LCP (hero image), FID (hydration), CLS (font loading). The `content-visibility: auto` is a good start but needs measurement. |

---

## DESIGN SYSTEM RECOMMENDATIONS

To prevent future inconsistencies, establish these foundations:

### 1. Color Tokens (Cross-Platform)
```
brand-primary:    #050505 (black)
brand-secondary:  #22C55E (green)
brand-accent:     #A7D129 (lime)
status-success:   #16A34A
status-warning:   #F59E0B
status-error:     #EF4444
status-info:      #3B82F6
surface-primary:  #FFFFFF / #0F172A (dark)
surface-secondary: #F9FAFB / #1E293B (dark)
text-primary:     #111827 / #F9FAFB (dark)
text-secondary:   #6B7280 / #9CA3AF (dark)
text-muted:       #9CA3AF / #6B7280 (dark)
```

### 2. Typography Scale (enforce everywhere)
```
display:  32px / 1.1 / 900 weight
heading:  24px / 1.2 / 700 weight
title:    20px / 1.25 / 700 weight
body:     14px / 1.5 / 500 weight
caption:  12px / 1.4 / 500 weight
micro:    10px / 1.3 / 500 weight
```

### 3. Spacing Scale
```
page-padding-x:   16px (mobile) / 24px (tablet) / 32px (desktop)
page-padding-top: 32px (mobile) / 40px (desktop)
card-padding:     16px (compact) / 20px (standard) / 28px (hero)
section-gap:      20px (between sections)
element-gap:      8px (within a section)
```

### 4. Component Library Checklist (Mobile Staff)
- [ ] `Button` (primary/secondary/danger/ghost, sm/md/lg)
- [ ] `Text` (display/heading/title/body/caption/micro)
- [ ] `ScreenHeader` (title + optional back button + optional badge)
- [ ] `Card` (standard/elevated with consistent border + shadow)
- [ ] `StatusPill` (color-coded with label map)
- [ ] `EmptyState` (icon + title + subtitle + optional action)
- [ ] `ErrorBanner` (dismissible, pull-to-refresh hint)
- [ ] `ConfirmDialog` (title + message + cancel/confirm)

---

## METRICS TO TRACK

After implementing this plan, measure:

| Metric | Current State | Target |
|--------|---------------|--------|
| Time to complete delivery (mobile) | Blocked by snap-back bug | < 30 seconds from arriving to "delivered" |
| Order acknowledgement time | Unknown (no packing alert) | < 60 seconds after assignment |
| Mobile staff app crash rate | Unknown | < 0.5% session crash rate |
| Accessibility score (Lighthouse) | ~65 (estimated, no audit run) | > 90 |
| Admin task completion time | Multiple taps for reports | Reduced by 1-2 taps per flow |
| Customer reorder conversion | 0% (feature doesn't exist) | 15%+ of repeat customers use it |

---

*Plan complete. Ready for sprint-by-sprint execution on your signal.*
