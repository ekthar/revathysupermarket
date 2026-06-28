# Mobile App Migration Backlog

> **Source of Truth:** Next.js Web App (`/apps/web`)
> **Target:** React Native / Expo Router Mobile App (`/apps/mobile-customer`)
> **Last Updated:** June 28, 2026

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Screen-by-Screen Gap Analysis](#screen-by-screen-gap-analysis)
4. [Design Language Specification](#design-language-specification)
5. [Missing Components Library](#missing-components-library)
6. [Missing API Integrations](#missing-api-integrations)
7. [Missing Business Logic](#missing-business-logic)
8. [Animation & Motion Gaps](#animation--motion-gaps)
9. [Priority Matrix](#priority-matrix)

---

## Executive Summary

The mobile app is approximately **35% complete** compared to the web app's feature set.


### What Exists (Mobile)
- Basic tab navigation (Home, Categories, Cart, Orders, Account)
- Product grid with add-to-cart
- Product detail page with quantity selector
- Cart with price breakdown
- 3-step checkout flow (address, payment, review)
- Order list and order detail with timeline
- Order tracking with polling
- Search with debounce
- Account menu with sub-pages (wallet, loyalty, favorites, addresses, notifications, settings, support)
- Google-only login (placeholder "construction" screen)
- OTP verification screen
- Zustand stores for auth and cart
- Axios API service with token refresh

### What's Missing (Critical Gaps)
- **Phone/Email login + registration** (web has full email/password auth)
- **Live order tracking banner on home** (SSE + polling fallback)
- **Delivery map** (web uses Leaflet for real-time rider tracking)
- **Promo banners carousel** (dynamic from admin)
- **Recent orders horizontal cards on home**
- **Hero section** with store branding
- **Animated product sections** (trending, offers, fresh picks)
- **Favorite button** on product cards (heart toggle)
- **Product detail: recently viewed, related products**
- **Cart: coupon/promo code validation, minimum order enforcement**
- **Checkout: saved address selection from API, GPS location detection, delivery fee preview, delivery mode selector (ASAP/Scheduled), loyalty points redemption, wallet payment**
- **Order success celebration** (confetti, animated checkmark)
- **First order celebration**
- **Dark mode** (toggle exists but not wired to NativeWind)
- **Push notifications** (FCM registration, device token management)
- **Offline banner** (exists but no offline data persistence)
- **Profile editing** (name, phone, email update)
- **Forgot password flow**
- **Delivery OTP** display on tracking page
- **Call/WhatsApp rider** from tracking
- **Pull-to-refresh** with proper loading states on all screens
- **Floating cart bar** on browse/home screens
- **Desktop/Tablet** responsive awareness

---

## Architecture Overview

### Web App (Next.js) - Source of Truth
```
/apps/web/
├── app/                    # App Router pages
│   ├── api/               # 30+ API routes (backend)
│   ├── account/           # Profile, favorites, loyalty, wallet, settings
│   ├── cart/              # Cart page
│   ├── checkout/          # Checkout page
│   ├── dashboard/         # Customer order dashboard
│   ├── products/          # Products listing + detail [slug]
│   ├── track/[id]/        # Live order tracking
│   ├── login/             # Auth pages
│   ├── register/          # Registration
│   └── support/           # Help & support
├── components/            # Reusable UI components
│   ├── ui/                # Design system primitives (35+ components)
│   ├── cart/              # Cart provider + cart page
│   ├── checkout/          # Address, payment, delivery mode, summary
│   ├── home/              # Hero, categories, product sections, search
│   ├── tracking/          # Map, live banner, live tracking
│   ├── account/           # All account sub-page clients
│   └── auth/              # Login, register, forgot password forms
├── lib/                   # Utilities, hooks, API helpers
└── prisma/                # Database schema
```


### Mobile App (Expo Router)
```
/apps/mobile-customer/
├── app/                    # File-based routing
│   ├── (auth)/            # Login + OTP screens
│   ├── (tabs)/            # Main tab navigator
│   │   ├── home/          # Home screen
│   │   ├── categories/    # Categories + products grid
│   │   ├── cart/          # Cart screen
│   │   ├── orders/        # Order list
│   │   └── account/       # Account menu
│   ├── account/           # Sub-screens (wallet, loyalty, etc.)
│   ├── checkout/          # Checkout flow
│   ├── orders/[id]/       # Order detail + tracking
│   ├── product/[id]       # Product detail
│   └── search             # Search screen
├── src/
│   ├── components/        # 3 components (AnimatedFadeIn, OfflineBanner, ui/)
│   ├── config/            # API base URL
│   ├── services/          # Axios instance + Google auth
│   ├── stores/            # Zustand (auth + cart)
│   └── theme/             # Colors only
```

### Shared Package (`/packages/shared`)
- **Types:** User, Product, Category, Cart, Order, Address, Wallet, Loyalty, Notification, Support
- **Constants:** Store coords, order statuses, cart thresholds, loyalty tiers, delivery slots, payment methods
- **Utils:** Currency formatting, date formatting, cart calculations, loyalty tier logic

---

## Screen-by-Screen Gap Analysis

### 1. LOGIN / AUTHENTICATION

| Feature | Web | Mobile | Gap |
|---------|-----|--------|-----|
| Email + Password login | ✅ | ❌ | **MISSING** |
| Phone + OTP login | ✅ (API exists) | ✅ (OTP screen exists) | Partially wired |
| Google Sign-In | ✅ | ✅ | Working |
| Registration (name, phone, email, password) | ✅ | ❌ | **MISSING** |
| Forgot password | ✅ | ❌ | **MISSING** |
| Role-based redirect (customer vs delivery) | ✅ | ❌ | **MISSING** |
| Login/Register toggle animation | ✅ (framer-motion) | ❌ | **MISSING** |
| Highlight badges ("Fresh local delivery" etc.) | ✅ | ❌ | **MISSING** |
| Staff login link | ✅ | N/A | Not needed |
| Biometric auth (FaceID/TouchID) | ❌ | ❌ | Future feature |

**Mobile Login Current State:** Placeholder "construction" screen with Google-only. No phone login flow despite OTP screen existing.


### 2. HOME SCREEN

| Feature | Web | Mobile | Gap |
|---------|-----|--------|-----|
| Store branding header (logo, name, tagline) | ✅ | ✅ (basic) | Missing logo + "Fresh & Fast Delivery" tagline |
| Search bar (inline, instant) | ✅ (HomeSearch with product list overlay) | ✅ (navigates to /search) | Different UX — web is inline |
| Live order tracking banner | ✅ (LiveOrderBanner with SSE) | ❌ | **MISSING** |
| Hero banner (dynamic from admin) | ✅ (parallax on desktop, mobile card) | ❌ | **MISSING** |
| Promo banners carousel (admin-managed) | ✅ (PromoBanners component) | ✅ (basic horizontal scroll) | Missing dynamic admin data |
| Recent orders horizontal cards | ✅ (RecentOrdersSection) | ❌ | **MISSING** |
| Animated categories with images + colors | ✅ (AnimatedCategories with stagger) | ✅ (basic horizontal scroll) | Missing images, colors, stagger |
| Weekly Best Selling Items section | ✅ (AnimatedProductSection) | ❌ | **MISSING** |
| "Just for you" / Offers section | ✅ | ❌ | **MISSING** |
| "Today's Fresh Picks" section | ✅ | ❌ | **MISSING** |
| Category pills filter | ✅ | ❌ | **MISSING** |
| "View all" link per section | ✅ | ❌ | **MISSING** |
| Floating cart bar (shows when items in cart) | ✅ (floating-cart-bar CSS) | ❌ | **MISSING** |
| Footer (desktop) | ✅ | N/A | Not needed on mobile |
| Greeting (time-based) | ❌ | ✅ | Mobile has this, web doesn't |
| Pull-to-refresh | ✅ (pull-to-refresh component) | ✅ | Both have it |

**Priority Missing:** Live order banner, hero banner, recent orders, multiple product sections with animations.

### 3. PRODUCT LISTING / CATEGORIES

| Feature | Web | Mobile | Gap |
|---------|-----|--------|-----|
| Grid layout (2-col mobile) | ✅ | ✅ | ✅ |
| Category filter chips | ✅ | ✅ | ✅ |
| Sort options (price, popularity, offers) | ✅ | ❌ | **MISSING** |
| Product card — discount badge | ✅ (animated badge with Clock icon) | ✅ (basic red badge) | Missing animation |
| Product card — favorite heart button | ✅ (FavoriteButton with animation) | ❌ | **MISSING** |
| Product card — quantity stepper (inline) | ✅ (animated pill stepper) | ❌ (only + button) | **MISSING** |
| Product card — "Sold Out" overlay | ✅ | ❌ | **MISSING** |
| Product card — hover/press animations | ✅ (whileTap, whileHover, spring) | ❌ | **MISSING** |
| Product card — unit display | ✅ | ✅ | ✅ |
| Skeleton loading grid | ✅ (ProductSkeletonGrid) | ✅ (ProductCardSkeleton) | Mobile exists |
| Empty state | ✅ | ✅ | ✅ |
| Pagination/infinite scroll | Web uses server-rendered | ❌ | **MISSING** |
| "Show All" pill button | ✅ | ❌ | **MISSING** |

### 4. PRODUCT DETAIL

| Feature | Web | Mobile | Gap |
|---------|-----|--------|-----|
| Large product image | ✅ | ✅ | ✅ |
| Discount badge | ✅ | ✅ | ✅ |
| Category breadcrumb | ✅ | ✅ (label above name) | ✅ |
| Price + savings display | ✅ | ✅ | ✅ |
| Quantity selector | ✅ | ✅ | ✅ |
| Add to cart (bottom fixed) | ✅ | ✅ | ✅ |
| Stock status indicator | ✅ | ✅ | ✅ |
| "Added to cart" feedback animation | ✅ (toast + haptic) | ✅ (button color change) | Mobile less polished |
| Favorite button | ✅ | ❌ | **MISSING** |
| Recently viewed products | ✅ (product-recently-viewed) | ❌ | **MISSING** |
| Related products section | ✅ | ❌ | **MISSING** |
| Share button | ❌ | ❌ | Future feature |
| Image zoom/gallery | ❌ | ❌ | Future feature |
| GST info card | ✅ | ✅ | ✅ |


### 5. SEARCH

| Feature | Web | Mobile | Gap |
|---------|-----|--------|-----|
| Debounced search | ✅ | ✅ (300ms) | ✅ |
| Inline results (overlay on home) | ✅ | ❌ (separate screen) | Different UX paradigm |
| Search results with product cards | ✅ | ✅ (list format) | ✅ |
| Add to cart from results | ✅ | ✅ | ✅ |
| Clear button | ✅ | ✅ | ✅ |
| Empty state (no results) | ✅ | ✅ | ✅ |
| Recent searches | ❌ | ❌ | Future feature |
| Voice search | ❌ | ❌ | Future feature |
| Search suggestions/autocomplete | ❌ | ❌ | Future feature |

### 6. CART

| Feature | Web | Mobile | Gap |
|---------|-----|--------|-----|
| Cart item list with images | ✅ | ✅ | ✅ |
| Quantity stepper (inline pill) | ✅ (animated black pill) | ✅ (basic) | Missing animation |
| Remove item (swipe or trash icon) | ✅ (trash icon with exit animation) | ❌ (only via quantity=0) | **MISSING** explicit remove |
| Coupon/promo code input + validation | ✅ (full API validation) | ❌ | **MISSING** |
| Promo discount display | ✅ | ❌ | **MISSING** |
| Bill details breakdown (subtotal, GST, delivery, total) | ✅ | ✅ | ✅ |
| Free delivery threshold indicator | ✅ | ✅ | ✅ |
| Minimum order value enforcement | ✅ (warning + disabled checkout) | ❌ | **MISSING** |
| Savings banner | ✅ | ✅ | ✅ |
| Empty cart state | ✅ (icon + CTA) | ✅ | ✅ |
| Fixed bottom checkout button | ✅ (floating action) | ✅ | ✅ |
| Cart validation (stock check before checkout) | ✅ (API call) | ✅ (validateCart in store) | Wired but unused |
| Item total in header | ✅ | ✅ | ✅ |
| Store config fetch (GST, delivery fee, thresholds) | ✅ | ❌ | **MISSING** |
| Back navigation to products | ✅ | ❌ | **MISSING** |
| Animated item removal | ✅ (AnimatePresence + motion.div) | ❌ | **MISSING** |

### 7. CHECKOUT

| Feature | Web | Mobile | Gap |
|---------|-----|--------|-----|
| Delivery ETA display | ✅ (25-45 min card) | ❌ | **MISSING** |
| Delivery mode selector (ASAP / Scheduled) | ✅ (DeliveryModeSelector) | ✅ (basic slot selection) | Mobile has slots but no ASAP toggle |
| Delivery slots from API | ✅ (dynamic from API) | ✅ (from shared constants) | Mobile uses hardcoded constants |
| Saved addresses from API | ✅ (AddressSelector with DB addresses) | ❌ (hardcoded 2 addresses) | **MISSING** |
| GPS location detection | ✅ (browser geolocation + distance calc) | ❌ | **MISSING** |
| Delivery radius validation | ✅ (isOutsideRadius check) | ❌ | **MISSING** |
| Delivery fee preview (distance-based) | ✅ (API call to /api/delivery-fee/preview) | ❌ | **MISSING** |
| Payment method selector | ✅ (COD, UPI, Wallet, Card) | ✅ (from constants) | ✅ |
| Wallet balance display + payment | ✅ (fetch balance, pay from wallet) | ❌ | **MISSING** |
| Promo code input | ✅ | ✅ (in step 2) | ✅ |
| Loyalty points redemption | ✅ (points input + rules display) | ❌ | **MISSING** |
| Order summary with items | ✅ (OrderSummary component) | ✅ (step 3) | ✅ |
| Order success modal (confetti + checkmark) | ✅ (animated modal + Confetti) | ❌ (just redirects) | **MISSING** |
| First order celebration | ✅ (FirstOrderCelebration) | ❌ | **MISSING** |
| Rate limiting error handling | ✅ (429/503 handling) | ❌ | **MISSING** |
| Customer info persistence (localStorage) | ✅ | N/A (uses auth) | Different approach |
| Step indicator (progress bar) | ✅ | ✅ | ✅ |
| Back button per step | ✅ | ✅ | ✅ |
| Notes field | ✅ | ❌ | **MISSING** |
| Minimum order validation | ✅ | ❌ | **MISSING** |


### 8. ORDERS LIST

| Feature | Web | Mobile | Gap |
|---------|-----|--------|-----|
| Order list with status badges | ✅ | ✅ | ✅ |
| Order number display | ✅ | ✅ | ✅ |
| Date formatting | ✅ | ✅ | ✅ |
| Item count | ✅ | ✅ | ✅ |
| Total amount | ✅ | ✅ | ✅ |
| Status color coding | ✅ | ✅ | ✅ |
| Pull-to-refresh | ✅ | ✅ | ✅ |
| Empty state | ✅ | ✅ | ✅ |
| Skeleton loading | ✅ | ✅ (OrderRowSkeleton) | ✅ |
| "Track Order" CTA for active orders | ✅ | ❌ (just navigates to detail) | **MISSING** |
| Reorder button | ❌ | ❌ | Future feature |
| Filter by status | ❌ | ❌ | Future feature |
| Pagination | ❌ | ❌ | Future feature |

### 9. ORDER DETAIL

| Feature | Web | Mobile | Gap |
|---------|-----|--------|-----|
| Status card (colored) | ✅ | ✅ | ✅ |
| Order number + date | ✅ | ✅ | ✅ |
| Items list with quantities | ✅ | ✅ | ✅ |
| Price breakdown | ✅ | ✅ | ✅ |
| Delivery address | ✅ | ✅ | ✅ |
| Status timeline with dots | ✅ | ✅ | ✅ |
| "Track Order" button (navigate to tracking) | ✅ | ❌ | **MISSING** |
| Cancel order button | ❌ | ❌ | Future feature |
| Rate order | ❌ | ❌ | Future feature |
| Invoice/bill download | ✅ (print button) | ❌ | **MISSING** |

### 10. LIVE ORDER TRACKING

| Feature | Web | Mobile | Gap |
|---------|-----|--------|-----|
| Real-time status updates (SSE + polling fallback) | ✅ | ✅ (polling only, 10s) | Missing SSE |
| Delivery map (Leaflet) | ✅ (DeliveryMap) | ❌ (placeholder text) | **MISSING** |
| Rider location on map | ✅ | ❌ | **MISSING** |
| ETA countdown display | ✅ (large number + "min") | ✅ (basic text) | Missing premium UI |
| Rider info card (name, phone) | ✅ (avatar + name + checkmark) | ✅ (basic) | Missing design polish |
| Call rider button | ✅ (tel: link) | ✅ (phone number shown) | Missing tap-to-call |
| WhatsApp message button | ✅ | ❌ | **MISSING** |
| Delivery OTP display | ✅ (large monospace code) | ❌ | **MISSING** |
| Progress steps (4-step timeline) | ✅ (animated with icons + ping) | ❌ | **MISSING** |
| "Live" pulse indicator | ✅ (animated green dot + ping) | ✅ (basic dot) | Missing animation |
| Status banner (gradient card at top) | ✅ (green gradient + decorative circles) | ❌ | **MISSING** |
| Back button | ✅ | ✅ (Stack.Screen header) | ✅ |
| Distance display ("X km away") | ✅ | ❌ | **MISSING** |
| Auto-redirect after delivery | ✅ (4s timeout) | ❌ | **MISSING** |

### 11. ACCOUNT / PROFILE

| Feature | Web | Mobile | Gap |
|---------|-----|--------|-----|
| Profile card (gradient, avatar, name, contact) | ✅ (premium gradient card) | ✅ (basic) | Missing premium design |
| Stats (orders count, wallet balance, favorites) | ✅ (3-stat grid) | ❌ | **MISSING** |
| Wallet balance card | ✅ (dedicated card) | ❌ (just menu item) | **MISSING** |
| Menu items list | ✅ (grouped sections) | ✅ (flat list) | Missing sections |
| Dark mode toggle (inline) | ✅ (ThemeToggleInline) | ✅ (Switch, not wired) | **INCOMPLETE** |
| "Install App" button | ✅ (InstallAppButton) | N/A | Not needed |
| Store info links (Maps, Instagram, Facebook) | ✅ | ❌ | **MISSING** |
| Logout button | ✅ | ✅ | ✅ |
| Edit profile navigation | ✅ (pencil button) | ❌ | **MISSING** |


### 12. FAVORITES

| Feature | Web | Mobile | Gap |
|---------|-----|--------|-----|
| Favorites list | ✅ | ✅ | ✅ |
| Add to cart from favorites | ✅ | ✅ | ✅ |
| Remove from favorites (swipe/toggle) | ✅ | ❌ | **MISSING** |
| Empty state | ✅ | ✅ | ✅ |
| Favorite toggle on product cards (global) | ✅ | ❌ | **MISSING** |

### 13. WALLET

| Feature | Web | Mobile | Gap |
|---------|-----|--------|-----|
| Balance card | ✅ | ✅ | ✅ |
| Transaction history | ✅ | ✅ | ✅ |
| Credit/debit indicators | ✅ | ✅ | ✅ |
| Empty state | ✅ | ✅ | ✅ |
| Add money to wallet | ❌ | ❌ | Future feature |

### 14. LOYALTY / REWARDS

| Feature | Web | Mobile | Gap |
|---------|-----|--------|-----|
| Tier card (Bronze/Silver/Gold/Platinum) | ✅ | ✅ | ✅ |
| Points display | ✅ | ✅ | ✅ |
| Progress bar to next tier | ✅ | ✅ | ✅ |
| Transaction history | ✅ | ✅ | ✅ |
| Referral section | ✅ (web account page mentions "Points and invites") | ❌ | **MISSING** |
| Redeem points at checkout | ✅ | ❌ | **MISSING** |

### 15. ADDRESSES

| Feature | Web | Mobile | Gap |
|---------|-----|--------|-----|
| Address list | ✅ | ✅ | ✅ |
| Default address indicator | ✅ | ✅ | ✅ |
| Add new address | ✅ | ✅ | ✅ |
| GPS location capture | ✅ (address selector with GPS) | ❌ (hardcoded coords) | **MISSING** |
| Edit address | ✅ | ❌ | **MISSING** |
| Delete address | ✅ | ❌ | **MISSING** |
| Set as default | ✅ | ❌ | **MISSING** |
| Map picker | ✅ (location-map component) | ❌ | **MISSING** |
| Delivery radius check on address | ✅ | ❌ | **MISSING** |

### 16. NOTIFICATIONS

| Feature | Web | Mobile | Gap |
|---------|-----|--------|-----|
| Notification list | ✅ | ✅ | ✅ |
| Read/unread styling | ✅ | ✅ | ✅ |
| Empty state | ✅ | ✅ | ✅ |
| Push notification registration (FCM) | ✅ (fcm-registration, push-notification-manager) | ❌ | **MISSING** |
| Device token management | ✅ (device-tokens API) | ❌ | **MISSING** |
| Mark as read | ✅ | ❌ | **MISSING** |
| Notification badge on tab icon | ❌ | ❌ | Future feature |

### 17. SETTINGS

| Feature | Web | Mobile | Gap |
|---------|-----|--------|-----|
| Order updates toggle | ✅ | ✅ (local state only) | **Not persisted** |
| Promotions toggle | ✅ | ✅ (local state only) | **Not persisted** |
| Dark mode toggle | ✅ (wired to theme) | ✅ (local state only) | **Not wired to NativeWind** |
| Language selection | ❌ | ❌ | Future feature |
| Delete account | ❌ | ❌ | Future feature |
| Notification preferences API sync | ✅ | ❌ | **MISSING** |

### 18. SUPPORT

| Feature | Web | Mobile | Gap |
|---------|-----|--------|-----|
| Support ticket list | ✅ | ✅ | ✅ |
| Create new ticket | ✅ | ✅ (button exists, no form) | **INCOMPLETE** |
| Ticket detail / conversation | ✅ | ❌ | **MISSING** |
| WhatsApp support link | ✅ | ❌ | **MISSING** |
| Status badges | ✅ | ✅ | ✅ |
| New ticket form (account/new-ticket.tsx exists) | ✅ | Exists but basic | Needs proper form |

---


## Design Language Specification

### Web App Design System (Target for Mobile)

#### Colors

| Token | Light Value | Usage |
|-------|-------------|-------|
| `primary` | `#050505` (near-black) | CTA buttons, active nav, bold text |
| `primary-foreground` | `#FFFFFF` | Text on primary |
| `secondary` | `#22C55E` (green-500) | Success states, accents, live indicators |
| `secondary-50` | `#EDFCF2` | Light green backgrounds |
| `secondary-600` | `#12A347` | Darker green for hover/text |
| `neutral-50` | `#F9FAFB` | Page backgrounds |
| `neutral-100` | `#F3F4F6` | Card backgrounds, borders |
| `neutral-400` | `#9CA3AF` | Muted text, captions |
| `neutral-900` | `#111827` | Primary text |
| `error` | `#EF4444` | Error states, validation |
| `warning` | `#F59E0B` | Warnings, pending states |
| `info` | `#3B82F6` | Info states |

**Dark Mode:**
| Token | Dark Value |
|-------|-----------|
| `background` | `hsl(222, 47%, 6%)` — deep navy |
| `card` | `hsl(222, 47%, 9%)` |
| `border` | `hsl(217, 33%, 17%)` |
| `muted-foreground` | `hsl(215, 20%, 65%)` |

#### Mobile Current State (WRONG — needs alignment):
- Uses `#10b981` (emerald-500) as primary — **should be `#050505`**
- Uses emerald palette for all interactive elements — **should use black + green accent**
- No dark mode colors defined beyond basic slate

#### Typography

| Token | Size | Weight | Letter-spacing | Line-height | Usage |
|-------|------|--------|----------------|-------------|-------|
| `display` | 32px | 900 (Black) | -0.02em | 1.1 | Page titles, hero text |
| `heading` | 24px | 700 (Bold) | -0.02em | 1.2 | Section headers |
| `title` | 20px | 700 (Bold) | -0.015em | 1.25 | Card titles, prices |
| `body` | 14px | 500 (Medium) | 0 | 1.5 | Body text, descriptions |
| `caption` | 12px | 500 (Medium) | 0 | 1.4 | Labels, metadata |
| `micro` | 10px | 500 (Medium) | 0 | 1.3 | Badges, tiny text |

**Fonts:**
- Display: `Manrope` (font-display, variable)
- Body: `Inter` (font-sans, variable)
- Fallback: `-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif`

**Mobile Current State:**
- Uses `System` font only — **should use custom Manrope + Inter**
- No font scale system — uses arbitrary `text-sm`, `text-lg`, etc.
- Missing `section-title` class (900 weight, -0.03em tracking)


#### Spacing

| Context | Value | Notes |
|---------|-------|-------|
| Page padding (mobile) | 16px (`px-4`) | Consistent edge spacing |
| Card padding | 12-16px (`p-3` to `p-4`) | Internal card spacing |
| Section gap | 20-24px (`pt-5` to `pt-6`) | Between major sections |
| Item gap in lists | 12px (`gap-3`) | Standard list spacing |
| Touch target minimum | 44px (`--touch-target: 2.75rem`) | All interactive elements |
| Bottom nav height | 82px (`--mobile-nav-height`) | Tab bar + safe area |
| Mobile header height | 56px (`--mobile-header-height`) | Top header |

#### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 6px | Tiny elements, badges |
| `md` | 12px | Standard cards, inputs |
| `lg` | 20px | Large cards, modals |
| `xl` | 28px | Hero sections, overlays |
| `2xl` | 24px (1.5rem) | Premium cards |
| `full` | 9999px | Pills, avatars, buttons |
| `--surface-radius` | 20px (1.25rem) | Default card radius |
| Squircle card | 26.4px (1.65rem) | iOS-style premium cards |

**Mobile Current State:**
- Uses `rounded-xl` (12px) and `rounded-2xl` (16px) — close but not matching
- Missing squircle card radius (1.65rem)
- Missing pill radius (9999px) for CTAs

#### Shadows / Elevation

| Token | Value | Usage |
|-------|-------|-------|
| `elevation-1` | `0 1px 3px rgba(5,5,5,0.04), 0 4px 12px rgba(5,5,5,0.06)` | Subtle cards |
| `elevation-2` | `0 4px 16px rgba(5,5,5,0.08), 0 12px 32px rgba(5,5,5,0.10)` | Standard cards |
| `elevation-3` | `0 8px 24px rgba(5,5,5,0.12), 0 24px 64px rgba(5,5,5,0.18)` | Prominent elements |
| `premium` | `0 24px 80px -42px rgba(5,5,5,0.65)` | Hero cards, modals |
| `soft` | `0 18px 45px -30px rgba(5,5,5,0.35)` | Floating elements |
| `card-shadow` | `0 12px 35px -24px rgba(var(--shadow-color), 0.35)` | Product cards |
| `card-elevated` | `0 18px 40px -30px rgba(var(--shadow-color), 0.45)` | Highlighted cards |

**Mobile Current State:**
- No shadow system defined — relies on default React Native elevation
- Missing glassmorphism (backdrop-filter: blur)
- Missing dark mode shadow adjustments

#### Icons

| Icon Source | Web | Mobile |
|-------------|-----|--------|
| Primary library | `lucide-react` | Emoji placeholders (🏠📦🛒📋👤) |
| Icon style | Outlined, 1.8-2.2px stroke | N/A |
| Icon size (nav) | 18-20px | Emoji (uncontrolled) |
| Icon size (buttons) | 14-16px | N/A |
| Icon size (small) | 12-14px | N/A |

**Mobile Current State:** Uses emoji for ALL icons including navigation. **Must migrate to `@expo/vector-icons` or `lucide-react-native`.**


#### Buttons

| Variant | Web Style | Mobile Current |
|---------|-----------|----------------|
| Primary CTA | Black bg, white text, rounded-full/2xl, h-[48-54px], font-bold, premium shadow | Green bg (`bg-primary-600`), rounded-xl, h-14 |
| Secondary | Border, transparent bg, rounded-full | Not implemented |
| Pill | `pill-btn` — rounded-full, px-5, py-2, font-bold 13px | Not implemented |
| Quantity Stepper | Black pill (`rounded-full bg-black`), +/- with animated count | Basic slate bg, rounded-lg |
| Add to Cart (card) | 34x34 black circle with Plus icon | 28x28 or 32x32 green square with "+" text |
| Pressed state | `scale(0.97)` with 0.1s spring | No press feedback |
| Loading state | ButtonSpinner component | ActivityIndicator |

#### Cards

| Card Type | Web Style | Mobile Current |
|-----------|-----------|----------------|
| Product Card | White bg, `elevation-2` shadow, `rounded-lg` (20px), image with hover zoom, favorite button overlay | White bg with `border border-slate-100`, `rounded-2xl` (16px), no shadow |
| Cart Item | Flat list with dividers, black pill quantity stepper | Similar but basic |
| Order Card | Horizontal scroll card (200px), rounded-2xl, border + shadow | Flat pressable row |
| Category Card | Square with image, gradient overlay, `aspect-ratio 1/1.1` | Circle icon with text below |
| iOS Squircle | `1.65rem` radius, white bg, premium shadow | Not implemented |
| Glass Card | `backdrop-filter: blur(20px)`, semi-transparent | Not implemented |

#### Inputs

| Element | Web Style | Mobile Current |
|---------|-----------|----------------|
| Text Input | `h-12 rounded-2xl border-border bg-background pl-11`, with icon prefix | `h-12 border border-slate-200 rounded-xl px-4 bg-slate-50` |
| OTP Input | Custom `otp-input` component with auto-advance | ✅ Implemented well |
| Search Bar | `h-12 bg-slate-50 rounded-xl`, icon + placeholder | Similar ✅ |

#### Motion / Animation

| Animation | Web Implementation | Mobile Current |
|-----------|-------------------|----------------|
| Page transitions | `framer-motion` AnimatePresence | None |
| Card entrance | `FadeInDown`, `FadeInUp` with stagger | Basic `FadeInDown` on some screens |
| Press feedback | `whileTap: { scale: 0.97 }` | None |
| Hover feedback | `whileHover: { y: -3 }` | N/A (no hover on mobile) |
| Quantity bounce | Spring animation on number change | None |
| Cart badge | Scale spring on count change | None |
| Category stagger | 0.05s delay per item | None |
| Product section entrance | Scroll-triggered visibility | None |
| Success modal | Scale + spring + confetti | None |
| Skeleton shimmer | CSS shimmer animation | ✅ Basic shimmer |
| Pull-to-refresh | Custom component | ✅ RefreshControl |
| Bottom nav pill | `layoutId` spring animation | None (static tabs) |
| Float/bob | Continuous Y translate | None |
| Live indicator | Ping + pulse animations | Basic pulse |

---

## Missing Components Library

Components that exist in web but are completely absent in mobile:

### Critical (Blocks core functionality)
1. **FavoriteButton** — Heart toggle with animation, API integration
2. **LiveOrderBanner** — Shows active order on home, navigates to tracking
3. **DeliveryMap** — Leaflet/MapView for rider tracking
4. **AddressSelector** — Saved addresses picker + GPS detect
5. **DeliveryModeSelector** — ASAP vs Scheduled toggle
6. **PaymentMethodSelector** — With wallet balance display
7. **OrderSummary** — Checkout right panel with all calculations
8. **PromoCodeValidator** — Input + API validation + discount display
9. **FloatingCartBar** — Persistent cart summary on browse screens
10. **PushNotificationManager** — FCM token registration

### Important (UX quality)
11. **AnimatedCheckmark** — Success state indicator
12. **Confetti** — Order success celebration
13. **FirstOrderCelebration** — Special modal for first-time buyers
14. **BottomSheet** — Modal sheet (for filters, actions)
15. **SkeletonLoader** — Generic skeleton component
16. **EmptyStates** — Consistent empty state patterns
17. **ProductRecentlyViewed** — Horizontal scroll of recent items
18. **AnimatedCounter** — Number animation for prices/counts
19. **ScrollProgress** — Scroll indicator
20. **ThemeToggle** — Wired dark mode toggle


### Nice-to-have (Polish)
21. **AnimatedPageWrapper** — Screen transition wrapper
22. **HapticButton** — Button with vibration feedback
23. **PullToRefresh** — Custom styled (web has custom, mobile uses native)
24. **ScrollToTop** — FAB to scroll back up
25. **OnboardingTour** — First-time user guide
26. **AnimatedList** — List with staggered entrance
27. **AnimatedSection** — Section with scroll-triggered visibility
28. **Badge** — Status badge component
29. **Carousel** — Banner carousel with dots
30. **ChartCard** — Stats visualization (for loyalty/wallet)

---

## Missing API Integrations

### Endpoints the mobile app should call but doesn't:

| Endpoint | Purpose | Used in Web | Mobile Status |
|----------|---------|-------------|---------------|
| `GET /api/store-settings` | Store config (fees, thresholds, GST) | Checkout, Cart | ❌ Not called |
| `POST /api/promo-codes/validate` | Validate coupon code | Cart page | ❌ Not called |
| `POST /api/delivery-fee/preview` | Distance-based fee quote | Checkout | ❌ Not called |
| `GET /api/delivery-slots` | Dynamic delivery slots | Checkout | ❌ Uses constants |
| `GET /api/account/wallet` | Wallet balance | Checkout | ❌ Not at checkout |
| `GET /api/account/loyalty` | Loyalty config + balance | Checkout | ❌ Not at checkout |
| `POST /api/favorites` | Toggle favorite | Product cards | ❌ Not called |
| `GET /api/favorites` | List favorites | Favorites page | ✅ Called |
| `POST /api/device-tokens` | Register FCM token | App init | ❌ Not called |
| `GET /api/orders/{id}/stream` | SSE live updates | Tracking | ❌ Uses polling |
| `GET /api/orders/{id}/tracking` | REST tracking data | Tracking (fallback) | ✅ Called |
| `POST /api/cart/validate` | Validate cart stock/prices | Pre-checkout | ❌ Exists in store, not called |
| `PUT /api/account/settings` | Save notification prefs | Settings | ❌ Local only |
| `POST /api/geocode` | Reverse geocode address | Address form | ❌ Not called |
| `GET /api/notifications` | Fetch notifications | Notifications page | ✅ Called (via mobile API) |
| `POST /api/support` | Create support ticket | Support | ❌ Button exists, no action |
| `GET /api/banners` | Fetch promo banners | Home | ✅ Called |

### Mobile-Specific API Routes (Already Built)

These exist in `/apps/web/app/api/mobile/v1/` and are ready:
- `POST /api/mobile/v1/auth/google` — Google sign-in ✅ Used
- `GET /api/mobile/v1/auth/me` — Profile fetch ✅ Used
- `GET /api/mobile/v1/products` — Product listing
- `GET /api/mobile/v1/categories` — Category listing
- `GET /api/mobile/v1/orders` — Order listing
- `GET /api/mobile/v1/banners` — Banner listing
- `POST /api/mobile/v1/cart/validate` — Cart validation
- `POST /api/mobile/v1/devices` — Device token registration
- `GET /api/mobile/v1/account/*` — Account sub-resources

---

## Missing Business Logic

### Cart Logic Gaps
1. **Minimum order validation** — `CART_CONSTANTS.MIN_ORDER_AMOUNT = 50` exists but not enforced in mobile checkout
2. **Stock validation before checkout** — `validateCart()` exists in store but never called
3. **Store settings fetch** — Mobile doesn't fetch dynamic GST rate, delivery fee, thresholds
4. **Promo code validation** — No API call for promo validation
5. **Cart persistence on logout** — Should clear cart on logout

### Checkout Logic Gaps
1. **Distance-based delivery fee** — Web calculates via API, mobile uses flat fee
2. **Delivery radius enforcement** — Web prevents checkout if outside radius
3. **Wallet payment deduction** — Web checks balance, mobile doesn't
4. **Loyalty points math** — Web enforces max redemption %, mobile ignores
5. **ASAP vs Scheduled toggle** — Web has distinct UX, mobile only has slots
6. **Saved address fetch** — Mobile uses hardcoded addresses instead of API

### Auth Logic Gaps
1. **Email/password login** — Backend supports it, mobile doesn't offer it
2. **Registration flow** — Backend has /api/register, mobile doesn't use it
3. **Token refresh race condition** — Mobile handles this ✅
4. **Role-based routing** — Web redirects delivery partners, mobile doesn't
5. **Session timeout UX** — No user-facing handling in mobile

### Notification Logic Gaps
1. **FCM token registration on app start** — Not implemented
2. **Token refresh on login** — Not implemented
3. **Background notification handling** — Not implemented
4. **Notification tap deeplink** — Not implemented


---

## Animation & Motion Gaps

### Web Motion System (to replicate with `react-native-reanimated`)

```typescript
// Spring presets from web (lib/motion.ts)
const springPresets = {
  default: { type: "spring", stiffness: 300, damping: 25 },
  snappy: { type: "spring", stiffness: 400, damping: 30 },
  bouncy: { type: "spring", stiffness: 300, damping: 15 },
};

// Tap scale variants
const tapScale = {
  primary: { scale: 0.97 },   // Buttons, cards
  secondary: { scale: 0.95 }, // Smaller elements
};
```

### Required Animations by Priority

**P0 — Must Have:**
1. Press feedback on all interactive elements (scale 0.97)
2. Cart badge count animation (spring scale)
3. Quantity stepper number bounce
4. Screen transition (fade + slide)
5. List item stagger entrance (0.05s delay each)

**P1 — Should Have:**
6. Product card entrance (FadeInUp with spring)
7. Category cards stagger
8. Floating cart bar entrance/exit
9. Order success confetti + checkmark
10. Live tracking pulse indicator
11. Bottom sheet slide up

**P2 — Nice to Have:**
12. Hero banner parallax (for home screen)
13. Pull-to-refresh custom animation
14. Skeleton shimmer (already basic)
15. Tab bar indicator spring transition
16. Promo banner auto-scroll
17. Product image zoom on detail

---

## Priority Matrix

### P0 — Critical Path (Must ship first)

| # | Item | Effort | Screen |
|---|------|--------|--------|
| 1 | Phone + Email login/register | M | Auth |
| 2 | Design system alignment (colors, typography, icons) | L | All |
| 3 | Live order tracking banner on home | S | Home |
| 4 | Delivery map integration (react-native-maps) | L | Tracking |
| 5 | Saved addresses from API in checkout | M | Checkout |
| 6 | GPS location detection | M | Checkout, Address |
| 7 | Delivery fee preview API | S | Checkout |
| 8 | Delivery radius validation | S | Checkout |
| 9 | Push notifications (FCM registration) | M | Global |
| 10 | Order success celebration | S | Checkout |

### P1 — High Priority (Feature parity)

| # | Item | Effort | Screen |
|---|------|--------|--------|
| 11 | Favorite button on product cards | S | Products, Detail |
| 12 | Product card quantity stepper (inline) | M | Products |
| 13 | Promo code validation in cart | S | Cart |
| 14 | Minimum order enforcement | S | Cart, Checkout |
| 15 | Hero banner section | S | Home |
| 16 | Recent orders horizontal section | M | Home |
| 17 | Multiple product sections (trending, offers, picks) | M | Home |
| 18 | Wallet payment at checkout | S | Checkout |
| 19 | Loyalty points redemption | S | Checkout |
| 20 | Delivery mode selector (ASAP/Scheduled) | S | Checkout |
| 21 | Delivery OTP display | S | Tracking |
| 22 | Call/WhatsApp rider buttons | S | Tracking |
| 23 | Progress steps timeline on tracking | M | Tracking |
| 24 | Dark mode wired to NativeWind | M | All |

### P2 — Polish & UX (Delight features)

| # | Item | Effort | Screen |
|---|------|--------|--------|
| 25 | Press feedback animations (all buttons) | M | Global |
| 26 | Card entrance animations (stagger) | M | Home, Products |
| 27 | Floating cart bar | M | Home, Products |
| 28 | Profile stats card (orders, wallet, favorites) | S | Account |
| 29 | Product recently viewed section | M | Detail |
| 30 | Store settings dynamic fetch | S | Cart, Checkout |
| 31 | Cart item animated removal | S | Cart |
| 32 | Out-of-stock overlay on product cards | S | Products |
| 33 | Notification preferences API sync | S | Settings |
| 34 | Edit/delete address | S | Addresses |
| 35 | Support ticket creation form | S | Support |
| 36 | Icon migration (emoji → vector icons) | M | All |
| 37 | Forgot password flow | S | Auth |
| 38 | SSE integration for live tracking | M | Tracking |
| 39 | Referral section in loyalty | S | Loyalty |
| 40 | Onboarding tour for new users | L | Global |

**Effort Key:** S = Small (< 1 day), M = Medium (1-3 days), L = Large (3-5 days)


---

## Design Token Migration Map

### Color Token Mapping (Web → Mobile)

```
Web                          → Mobile (current)    → Mobile (target)
─────────────────────────────────────────────────────────────────────
primary (#050505)            → primary-600 (#059669) → primary (#050505)
primary-foreground (#FFF)    → N/A                   → primary-foreground (#FFF)
secondary (#22C55E)          → N/A                   → secondary (#22C55E)
secondary-50 (#EDFCF2)      → primary-50 (#ecfdf5)  → secondary-50 (#EDFCF2)
neutral-50 (#F9FAFB)         → slate-50 (#f8fafc)    → neutral-50 (#F9FAFB)
neutral-900 (#111827)        → slate-900 (#0f172a)   → neutral-900 (#111827)
success (#22C55E)            → success (#10b981)     → success (#22C55E)
error (#EF4444)              → error (#ef4444)       → error (#EF4444) ✅
warning (#F59E0B)            → warning (#f59e0b)     → warning (#F59E0B) ✅
```

### Key Design Principle Shift

The web app uses a **black-dominant design** with green as accent:
- Primary buttons are BLACK (not green)
- CTAs use black background + white text
- Tab nav active state is BLACK pill
- Green is used for success, live indicators, and subtle accents

The mobile currently uses **green-dominant design** (emerald as primary):
- Primary buttons are GREEN
- Tab bar active color is green
- Everything interactive is green

**This is the single biggest visual discrepancy to fix.**

---

## File Structure Recommendation for Migration

```
/apps/mobile-customer/src/
├── components/
│   ├── ui/                    # Design system primitives
│   │   ├── Button.tsx         # All button variants
│   │   ├── Card.tsx           # Card variants (elevated, glass, squircle)
│   │   ├── Badge.tsx          # Status badges
│   │   ├── Input.tsx          # Text input with icon support
│   │   ├── Skeleton.tsx       # Generic skeleton loader
│   │   ├── EmptyState.tsx     # Reusable empty state
│   │   ├── BottomSheet.tsx    # Modal bottom sheet
│   │   ├── AnimatedList.tsx   # List with stagger entrance
│   │   ├── Toast.tsx          # Toast notifications
│   │   └── index.ts
│   ├── home/
│   │   ├── HeroBanner.tsx
│   │   ├── LiveOrderBanner.tsx
│   │   ├── RecentOrders.tsx
│   │   ├── CategoryGrid.tsx
│   │   ├── ProductSection.tsx
│   │   └── FloatingCartBar.tsx
│   ├── product/
│   │   ├── ProductCard.tsx     # Full-featured card
│   │   ├── FavoriteButton.tsx
│   │   ├── QuantityStepper.tsx
│   │   └── RecentlyViewed.tsx
│   ├── cart/
│   │   ├── CartItem.tsx
│   │   ├── PromoCode.tsx
│   │   └── BillDetails.tsx
│   ├── checkout/
│   │   ├── AddressSelector.tsx
│   │   ├── DeliveryModeSelector.tsx
│   │   ├── PaymentMethodSelector.tsx
│   │   ├── OrderSummary.tsx
│   │   └── SuccessCelebration.tsx
│   ├── tracking/
│   │   ├── DeliveryMap.tsx
│   │   ├── StatusTimeline.tsx
│   │   ├── RiderCard.tsx
│   │   └── DeliveryOTP.tsx
│   └── account/
│       ├── ProfileCard.tsx
│       └── StatsGrid.tsx
├── hooks/
│   ├── useStoreSettings.ts
│   ├── usePushNotifications.ts
│   ├── useLocation.ts
│   └── useLiveTracking.ts
├── services/
│   ├── api.ts                 # ✅ Exists
│   ├── google-auth.ts         # ✅ Exists
│   ├── push-notifications.ts  # NEW
│   └── location.ts            # NEW
├── stores/
│   ├── auth.ts                # ✅ Exists
│   ├── cart.ts                # ✅ Exists
│   ├── favorites.ts           # NEW
│   └── settings.ts            # NEW (theme, notification prefs)
├── theme/
│   ├── colors.ts              # REWRITE to match web
│   ├── typography.ts          # NEW
│   ├── spacing.ts             # NEW
│   ├── shadows.ts             # NEW
│   └── motion.ts              # NEW (spring presets)
└── config/
    └── api.ts                 # ✅ Exists
```

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total screens in web (customer-facing) | 18 |
| Total screens in mobile | 16 |
| Screens at feature parity | 3 (search, OTP, basic wallet) |
| Screens partially done | 10 |
| Screens completely missing | 5 (dashboard, offers, profile edit, forgot password, onboarding) |
| Missing components | 30+ |
| Missing API integrations | 17 |
| Missing animations | 17 types |
| Design token mismatches | 12 critical |
| Estimated total migration effort | 40-55 dev days |

---

*This document is the single source of truth for mobile app migration priorities. Do not begin implementation without reviewing the Priority Matrix above.*
