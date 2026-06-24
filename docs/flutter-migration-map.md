# Flutter Migration Map - MSM Supermarket

## 1. Executive Summary

This document provides a comprehensive audit of the existing MSM Supermarket Next.js 15 web application to guide the Flutter mobile migration. The app serves grocery delivery in Kerala, India, supporting three user roles on mobile: **Customers** (browse, order, track), **Delivery Partners** (accept, deliver, collect), and **Admin/Staff** (order management, not targeted for mobile initially).

### Migration Scope

- **Customer App**: Full-featured shopping experience including browsing, cart, checkout, live order tracking, wallet, loyalty, favorites, addresses, notifications, and support.
- **Delivery Partner App**: OTP-based login, assignment alerts, order pickup, GPS tracking, damage reporting, collection recording, and OTP-verified delivery completion.
- **Backend**: The existing Next.js API routes serve as the backend. Flutter apps will consume these endpoints via HTTP with bearer token authentication instead of cookie-based sessions.

### Key Technical Decisions

- Replace cookie/session auth with JWT bearer tokens for mobile
- Replace Web Push with Firebase Cloud Messaging (FCM)
- Replace SSE/polling with FCM push + periodic REST polling
- Use local SQLite/Hive for offline cart persistence (replacing localStorage)
- GPS tracking via platform-native location services

---

## 2. Customer Screens

| # | Screen | Web Route | Key Features | Notes |
|---|--------|-----------|--------------|-------|
| 1 | Home / Store Front | `app/page.tsx` | Banners carousel, category grid, featured products, offers section | Entry point after login |
| 2 | Categories / Browse | `app/products/page.tsx` | Category filter, search, product grid with prices | Query params for category filter |
| 3 | Product Detail | `app/products/[slug]/page.tsx` | Image, price, discount price, add-to-cart, related products | Dynamic route by slug |
| 4 | Offers | `app/offers/page.tsx` | Active offers listing, promo codes | Links to product pages |
| 5 | Cart | `app/cart/page.tsx` | Item list, quantity adjust, remove, subtotal, promo code input | Currently localStorage-based (see `components/cart/cart-provider.tsx`) |
| 6 | Checkout | `app/checkout/page.tsx` | Address selection, delivery slot picker, payment method, promo code, wallet/loyalty redemption, order placement | Complex form (see `components/checkout-form.tsx`) |
| 7 | Dashboard / Orders | `app/dashboard/page.tsx` | Active orders, order history, order status badges | Main post-login landing |
| 8 | Order Tracking (Live) | `app/track/[id]/page.tsx` | Real-time GPS map, status timeline, delivery partner info, ETA | Uses `app/api/orders/[id]/tracking/route.ts` |
| 9 | Account Hub | `app/account/page.tsx` | Profile summary, navigation to sub-sections | Menu page |
| 10 | Edit Profile | `app/account/edit/page.tsx` | Name, email, phone, avatar upload | See `app/api/account/profile/route.ts` |
| 11 | Wallet | `app/account/wallet/page.tsx` | Balance display, transaction history, top-up | See `app/api/account/wallet/route.ts` |
| 12 | Loyalty Points | `app/account/loyalty/page.tsx` | Points balance, earn/redeem history, tier status | See `app/api/account/loyalty/route.ts` |
| 13 | Favorites | `app/account/favorites/page.tsx` | Saved products grid, quick add-to-cart | See `app/api/favorites/route.ts` |
| 14 | Addresses | Embedded in account/checkout | Address list, add/edit/delete, set default, map picker | See `app/api/account/addresses/route.ts` |
| 15 | Notifications | `app/account/notifications/page.tsx` | Notification list with read/unread status | See `app/api/notifications/route.ts` |
| 16 | Settings | `app/account/settings/page.tsx` | Push preferences, language, dark mode toggle | See `app/api/account/settings/route.ts` |
| 17 | Support | `app/support/page.tsx` | Ticket list, create ticket, chat messages | See `app/api/support/route.ts` |
| 18 | Login | `app/login/page.tsx` | Phone + OTP login, Google OAuth | Primary customer auth flow |
| 19 | Register | `app/register/page.tsx` | New account with phone verification | See `app/api/register/route.ts` |
| 20 | Forgot Password | `app/forgot-password/page.tsx` | Email-based password reset (staff) | See `app/api/password/forgot/route.ts` |
| 21 | Welcome / Onboarding | `app/welcome/page.tsx` | First-time user onboarding | Shown after registration |
| 22 | Order Approval | Within dashboard | Approve/reject modified orders | See `app/api/orders/[id]/approval/route.ts` |
| 23 | Order Feedback | Within order detail | Star rating + comment after delivery | See `app/api/orders/[id]/feedback/route.ts` |
| 24 | Returns | Within order detail | Request return for items | See `app/api/orders/[id]/returns/route.ts` |
| 25 | Offline | `app/offline/page.tsx` | Offline fallback page | PWA service worker driven |

---

## 3. Delivery Partner Screens

| # | Screen | Web Route | Key Features | Notes |
|---|--------|-----------|--------------|-------|
| 1 | Login (OTP) | `app/delivery/login/page.tsx` | Phone number entry, OTP verification | Uses `phone-otp` credential provider in `auth.ts` |
| 2 | Main Dashboard | `app/delivery/page.tsx` | Today's stats (deliveries, collections, earnings), pending alerts, active orders list | See `components/delivery/delivery-orders-client.tsx` |
| 3 | Alert Listener | Embedded component | Poll-based new assignment notifications, accept/acknowledge | See `components/delivery/delivery-alert-listener.tsx`, `app/api/delivery/poll/route.ts` |
| 4 | Order Detail | Within dashboard | Customer info, items list, address with map, payment method, collection amount | See `app/api/delivery/orders/[id]/route.ts` |
| 5 | Pickup Confirmation | Within order flow | Mark picked up from store, start delivery | Transition to OUT_FOR_DELIVERY |
| 6 | GPS Tracking (Active) | Background service | Continuous location reporting during delivery | See `app/api/delivery/location/route.ts` |
| 7 | Arrive Notification | Within delivery flow | Mark arrival at customer location | See `app/api/delivery/arrive/route.ts` |
| 8 | Collection Recording | Within delivery flow | Record cash/UPI collected, input amount | See `app/api/delivery/collect/route.ts` |
| 9 | Damage Reporting | Within delivery flow | Report damaged items with evidence photos | See `app/api/delivery/damage/route.ts`, `app/api/evidence/upload/route.ts` |
| 10 | Delivery Completion | Within delivery flow | Enter customer OTP, slide-to-deliver confirmation | See `app/api/delivery/complete/route.ts` |
| 11 | Order History | Within dashboard | Past deliveries, earnings summary | Filtered from `app/api/delivery/orders/[id]/route.ts` |

---

## 4. API Endpoints

### 4.1 Authentication

| Method | Endpoint | Auth Required | Description | File |
|--------|----------|---------------|-------------|------|
| POST | `/api/auth/otp/send` | No | Send OTP to phone number via WhatsApp | `app/api/auth/otp/send/route.ts` |
| POST | `/api/auth/otp/verify` | No | Verify OTP code for phone login | `app/api/auth/otp/verify/route.ts` |
| POST | `/api/auth/complete-profile` | Yes | Complete profile after social login | `app/api/auth/complete-profile/route.ts` |
| GET/POST | `/api/auth/[...nextauth]` | Varies | NextAuth handler (signin, signout, session, csrf) | `app/api/auth/[...nextauth]/route.ts` |
| POST | `/api/register` | No | Register new customer account | `app/api/register/route.ts` |
| POST | `/api/password/forgot` | No | Request password reset email | `app/api/password/forgot/route.ts` |
| POST | `/api/password/reset` | No | Reset password with token | `app/api/password/reset/route.ts` |

### 4.2 Account

| Method | Endpoint | Auth Required | Description | File |
|--------|----------|---------------|-------------|------|
| GET/PATCH | `/api/account/profile` | Yes | Get/update user profile (name, email) | `app/api/account/profile/route.ts` |
| POST | `/api/account/avatar` | Yes | Upload profile avatar image | `app/api/account/avatar/route.ts` |
| POST | `/api/account/change-password` | Yes | Change account password | `app/api/account/change-password/route.ts` |
| GET/POST | `/api/account/addresses` | Yes | List addresses / create new address | `app/api/account/addresses/route.ts` |
| PATCH/DELETE | `/api/account/addresses/[id]` | Yes | Update/delete specific address | `app/api/account/addresses/[id]/route.ts` |
| GET | `/api/account/wallet` | Yes | Get wallet balance and transaction history | `app/api/account/wallet/route.ts` |
| GET | `/api/account/loyalty` | Yes | Get loyalty points balance and history | `app/api/account/loyalty/route.ts` |
| GET/PATCH | `/api/account/settings` | Yes | Get/update user settings (notifications, preferences) | `app/api/account/settings/route.ts` |
| PATCH | `/api/account/phone` | Yes | Update phone number with OTP verification | `app/api/account/phone/route.ts` |
| GET | `/api/account/referrals` | Yes | Get referral code and history | `app/api/account/referrals/route.ts` |
| GET | `/api/account/export` | Yes | Export personal data (GDPR-style) | `app/api/account/export/route.ts` |

### 4.3 Products & Categories

| Method | Endpoint | Auth Required | Description | File |
|--------|----------|---------------|-------------|------|
| GET | `/api/admin/products` | Staff | List/search products (admin) | `app/api/admin/products/route.ts` |
| GET | `/api/admin/categories` | Staff | List categories (admin) | `app/api/admin/categories/route.ts` |
| GET | `/api/offers` | No | List active offers | `app/api/offers/route.ts` |
| GET | `/api/store-settings` | No | Get store configuration (name, hours, status) | `app/api/store-settings/route.ts` |

> **Note**: Product listing for customers is currently server-rendered. A dedicated public product API endpoint will be needed for Flutter.

### 4.4 Favorites

| Method | Endpoint | Auth Required | Description | File |
|--------|----------|---------------|-------------|------|
| GET/POST | `/api/favorites` | Yes | List favorites / add product to favorites | `app/api/favorites/route.ts` |
| DELETE | `/api/favorites/[id]` | Yes | Remove product from favorites | `app/api/favorites/[id]/route.ts` |

### 4.5 Orders

| Method | Endpoint | Auth Required | Description | File |
|--------|----------|---------------|-------------|------|
| GET/POST | `/api/orders` | Yes | List user orders / place new order | `app/api/orders/route.ts` |
| GET | `/api/orders/history` | Yes | Get paginated order history | `app/api/orders/history/route.ts` |
| GET | `/api/orders/live` | Yes | Get currently active (non-delivered) orders | `app/api/orders/live/route.ts` |
| GET | `/api/orders/live-stream` | Yes | SSE stream for live order updates | `app/api/orders/live-stream/route.ts` |
| GET | `/api/orders/[id]/tracking` | Yes | Get order tracking data (GPS, status, timeline) | `app/api/orders/[id]/tracking/route.ts` |
| GET | `/api/orders/[id]/stream` | Yes | SSE stream for single order status updates | `app/api/orders/[id]/stream/route.ts` |
| POST | `/api/orders/[id]/approval` | Yes | Approve/reject order modifications | `app/api/orders/[id]/approval/route.ts` |
| POST | `/api/orders/[id]/feedback` | Yes | Submit order feedback/rating | `app/api/orders/[id]/feedback/route.ts` |
| POST | `/api/orders/[id]/returns` | Yes | Request item returns | `app/api/orders/[id]/returns/route.ts` |
| GET | `/api/orders/[id]/bill` | Yes | Get order bill/invoice details | `app/api/orders/[id]/bill/route.ts` |

### 4.6 Delivery Partner

| Method | Endpoint | Auth Required | Description | File |
|--------|----------|---------------|-------------|------|
| GET/POST | `/api/delivery/poll` | Delivery | GET: Poll for new assignments; POST: Acknowledge assignment | `app/api/delivery/poll/route.ts` |
| GET | `/api/delivery/alerts` | Delivery | SSE stream for delivery alerts (broken on Vercel) | `app/api/delivery/alerts/route.ts` |
| GET | `/api/delivery/orders/[id]` | Delivery | Get full order details for delivery | `app/api/delivery/orders/[id]/route.ts` |
| POST | `/api/delivery/location` | Delivery | Report GPS coordinates during delivery | `app/api/delivery/location/route.ts` |
| POST | `/api/delivery/arrive` | Delivery | Mark arrival at customer location | `app/api/delivery/arrive/route.ts` |
| POST | `/api/delivery/collect` | Delivery | Record collection amount (cash/UPI) | `app/api/delivery/collect/route.ts` |
| POST | `/api/delivery/damage` | Delivery | Report damaged items | `app/api/delivery/damage/route.ts` |
| POST | `/api/delivery/complete` | Delivery | Complete delivery with OTP verification | `app/api/delivery/complete/route.ts` |

### 4.7 Delivery Utilities

| Method | Endpoint | Auth Required | Description | File |
|--------|----------|---------------|-------------|------|
| GET | `/api/delivery-slots` | Yes | Get available delivery time slots | `app/api/delivery-slots/route.ts` |
| GET | `/api/delivery-fee/preview` | Yes | Calculate delivery fee for address | `app/api/delivery-fee/preview/route.ts` |
| GET | `/api/geocode/reverse` | Yes | Reverse geocode lat/lng to address | `app/api/geocode/reverse/route.ts` |

### 4.8 Promo Codes

| Method | Endpoint | Auth Required | Description | File |
|--------|----------|---------------|-------------|------|
| POST | `/api/promo-codes/validate` | Yes | Validate and preview promo code discount | `app/api/promo-codes/validate/route.ts` |

### 4.9 Notifications & Push

| Method | Endpoint | Auth Required | Description | File |
|--------|----------|---------------|-------------|------|
| GET/PATCH | `/api/notifications` | Yes | List notifications / mark as read | `app/api/notifications/route.ts` |
| POST | `/api/push-subscriptions` | Yes | Register push subscription endpoint | `app/api/push-subscriptions/route.ts` |

### 4.10 Support

| Method | Endpoint | Auth Required | Description | File |
|--------|----------|---------------|-------------|------|
| GET/POST | `/api/support` | Yes | List support tickets / create new ticket | `app/api/support/route.ts` |
| GET/POST | `/api/support/[id]` | Yes | Get ticket messages / send message | `app/api/support/[id]/route.ts` |

### 4.11 Evidence Upload

| Method | Endpoint | Auth Required | Description | File |
|--------|----------|---------------|-------------|------|
| POST | `/api/evidence/upload` | Yes | Upload image evidence (damage photos, etc.) | `app/api/evidence/upload/route.ts` |

### 4.12 Health

| Method | Endpoint | Auth Required | Description | File |
|--------|----------|---------------|-------------|------|
| GET | `/api/health/security` | No | Security health check | `app/api/health/security/route.ts` |

---

## 5. Prisma Models

| Model | Mobile Relevance | Description |
|-------|-----------------|-------------|
| `User` | High | Core user entity with role, phone, email, auth fields, loyalty points |
| `OtpToken` | High | Stores OTP codes for phone verification (customer + delivery login) |
| `Order` | High | Main order entity with status, amounts, delivery info, payment details |
| `OrderItem` | High | Individual items in an order with qty, price, substitution fields |
| `OrderEvent` | Medium | Status change history for orders (used in tracking timeline) |
| `OrderEditLog` | Medium | Tracks admin edits to orders (price adjustments, item changes) |
| `Product` | High | Product catalog with name, slug, price, discountPrice, images, stock |
| `Category` | High | Product categories with hierarchy support |
| `Address` | High | User delivery addresses with lat/lng, label, components |
| `WalletTransaction` | High | Wallet credit/debit transactions |
| `LoyaltyAccount` | High | User loyalty program membership and points balance |
| `LoyaltyTransaction` | High | Loyalty points earn/redeem history |
| `PushSubscription` | High | Push notification endpoints (Web Push currently, FCM for mobile) |
| `Notification` | High | In-app notifications with type, title, body, read status |
| `Favorite` | Medium | User's favorited products |
| `UserSettings` | Medium | Per-user preferences (push enabled, language, theme) |
| `SupportTicket` | Medium | Customer support tickets with status and priority |
| `SupportMessage` | Medium | Messages within support tickets |
| `DeliveryLocationEvent` | High | GPS coordinates logged during delivery (lat, lng, timestamp, accuracy) |
| `DeliveryCollection` | High | Records cash/UPI amounts collected by delivery partner |
| `DeliveryAdjustment` | Medium | Adjustments to delivery collections (damage, returns) |
| `DeliverySlot` | Medium | Available delivery time windows |
| `PromoCode` | Medium | Promo/coupon codes with conditions and limits |
| `PromoRedemption` | Low | Tracks individual promo code usage |
| `Offer` | Medium | Store-wide offers/deals displayed to customers |
| `Banner` | Medium | Promotional banners for home screen carousel |
| `Referral` | Low | Referral program tracking between users |
| `ReturnRequest` | Medium | Return/refund requests for delivered items |
| `OrderFeedback` | Low | Post-delivery ratings and comments |
| `DeliveryFeeSlab` | Low | Distance-based delivery fee calculation slabs |
| `StaffPermission` | Low | Staff role permissions (admin panel only) |
| `WhatsAppLog` | Low | WhatsApp message delivery logs |
| `Account` | Low | NextAuth OAuth account links |
| `Session` | Low | NextAuth sessions (not used in JWT mode) |
| `Setting` | Low | Global store settings (admin-managed) |
| `AuditLog` | Low | Admin action audit trail |
| `PasswordResetToken` | Low | Password reset token storage |
| `VerificationToken` | Low | Email verification tokens |

---

## 6. Auth Assumptions

### Current Web Implementation

The web app uses **NextAuth v5 (beta)** with the following configuration (see `auth.ts`):

- **Strategy**: JWT (not database sessions)
- **Providers**:
  - `staff-credentials`: Email + password for ADMIN/STAFF/OWNER/MANAGER/PACKING_STAFF
  - `phone-otp`: Phone + 6-digit OTP for CUSTOMER and DELIVERY_PARTNER
  - `Google`: OAuth for customers (limited, no auto-link)
- **Session delivery**: HTTP-only cookies with encrypted JWT
- **Token contents**: `id`, `role`, `name`, `email`, `phone`, `passwordVersion`, `authVersion`
- **Validation**: On every request, the session callback re-checks `passwordVersion`, `authVersion`, and `isActive` from the database. Mismatches return `role=INVALID`.
- **Rate limiting**: `enforceRateLimit()` in API routes (see `lib/authz.ts`)
- **CSRF**: NextAuth built-in CSRF token on mutations

### Flutter Mobile Auth Strategy

The mobile app cannot use cookie-based sessions. Required changes:

1. **Bearer Token Auth**: Issue a JWT access token on successful login (OTP verify or Google OAuth). Flutter sends `Authorization: Bearer <token>` header on every request.
2. **Token Refresh**: Implement a `/api/auth/refresh` endpoint. Access tokens should be short-lived (15-30 min), with a long-lived refresh token stored securely (Flutter Secure Storage).
3. **Token Invalidation**: The existing `passwordVersion`/`authVersion` mechanism already supports this. Increment these values to force re-login on all devices.
4. **Biometric Auth**: Optional local biometric unlock to retrieve stored refresh token, avoiding repeated OTP entry.
5. **Google Sign-In**: Use `google_sign_in` Flutter package, then exchange the Google ID token for an app JWT via a new endpoint.
6. **Device Registration**: On login, register the FCM token via a modified `/api/push-subscriptions` endpoint that accepts platform type (ios/android) and FCM registration token.

### Security Considerations

- Never store raw JWT in SharedPreferences; use `flutter_secure_storage`
- Implement certificate pinning for production API calls
- OTP codes expire after 5 minutes (see `lib/otp.ts`)
- Account lockout after 5 failed attempts (15-minute cooldown)
- All money calculations are server-authoritative (see `lib/order-checkout.ts`)

---

## 7. Feature Parity Status

| Feature | Web Status | Flutter Target | Notes |
|---------|-----------|---------------|-------|
| Phone OTP Login | Done | MVP | Primary auth for customers and delivery partners |
| Google OAuth Login | Done | MVP | Use native Google Sign-In SDK |
| Email/Password Login | Done | Not Planned | Staff-only, not needed on mobile |
| Product Browsing | Done | MVP | Need public product API (currently SSR) |
| Product Search | Done | MVP | Full-text search with filters |
| Category Navigation | Done | MVP | Hierarchical categories |
| Cart Management | Done (localStorage) | MVP | Local persistence with Hive/SQLite |
| Checkout Flow | Done | MVP | Address + slot + payment + promo |
| Multiple Payment Methods | Done (COD, UPI, Wallet, Card) | MVP | COD and UPI first, wallet redemption |
| Delivery Slot Selection | Done | MVP | Show available slots from API |
| Promo Code Application | Done | MVP | Validate via API before applying |
| Order Placement | Done | MVP | Server-side price validation |
| Order History | Done | MVP | Paginated list with status |
| Live Order Tracking | Done (SSE + polling) | MVP | FCM push + periodic polling (no SSE) |
| GPS Map Tracking | Done (Google Maps embed) | MVP | Flutter Google Maps or Mapbox |
| Order Approval (edits) | Done | MVP | Push notification + approve/reject |
| Order Feedback | Done | Post-MVP | Star rating after delivery |
| Return Requests | Done | Post-MVP | Photo evidence + reason |
| Wallet Balance & History | Done | MVP | View balance, transaction list |
| Wallet Top-up | Partial | Post-MVP | Needs payment gateway integration |
| Loyalty Points | Done | MVP | View balance, earn/redeem |
| Favorites | Done | MVP | Heart icon, favorites list |
| Address Management | Done | MVP | CRUD with map picker |
| Push Notifications | Done (Web Push/VAPID) | MVP | Migrate to FCM for mobile |
| In-App Notifications | Done | MVP | Notification center with badges |
| User Settings | Done | MVP | Preferences, notification toggles |
| Support Tickets | Done | MVP | Create, list, chat interface |
| Referral Program | Done | Post-MVP | Share code, track rewards |
| Data Export | Done | Post-MVP | GDPR compliance |
| Dark Mode | Done (CSS) | MVP | System-aware + manual toggle |
| Offline Support | Done (PWA) | MVP | Offline cart, queue actions |
| Delivery: OTP Login | Done | MVP | Same phone-otp flow |
| Delivery: Assignment Alerts | Done (poll-based) | MVP | FCM push + periodic poll fallback |
| Delivery: Order Detail View | Done | MVP | Items, address, customer info, payment |
| Delivery: GPS Reporting | Done | MVP | Background location service |
| Delivery: Arrive Notification | Done | MVP | Single tap to notify customer |
| Delivery: Collection Recording | Done | MVP | Cash/UPI amount entry |
| Delivery: Damage Reporting | Done | MVP | Photo upload + item selection |
| Delivery: OTP Completion | Done | MVP | Verify customer OTP, slide to deliver |
| Delivery: Earnings Summary | Done | Post-MVP | Daily/weekly collection stats |
| Admin Panel | Done | Not Planned | Stays web-only |
| Staff Operations | Done | Not Planned | Stays web-only |

---

## 8. Platform Limitations

### iOS Restrictions

| Constraint | Impact | Mitigation |
|-----------|--------|------------|
| Push notification permission required | Users must opt-in; no silent push without prior permission | Request permission at first order, explain value proposition |
| Background location limited | iOS throttles background GPS updates aggressively | Use `allowsBackgroundLocationUpdates` + significant location changes; batch upload on foreground resume |
| No persistent background services | Cannot run always-on polling service | Use APNs push to wake app for delivery assignments |
| App Store payment rules | In-app purchases for digital goods require IAP | Wallet top-up may need to use Apple IAP or be web-only |
| Camera/photo permissions | Required for damage evidence, avatar upload | Request just-in-time before first use |
| Clipboard access notification | iOS shows banner when reading clipboard | Avoid auto-reading clipboard for promo codes |

### Android Restrictions

| Constraint | Impact | Mitigation |
|-----------|--------|------------|
| Exact alarm restrictions (Android 12+) | `SCHEDULE_EXACT_ALARM` permission required for precise delivery slot reminders | Use `USE_EXACT_ALARM` for delivery apps or fall back to inexact alarms |
| Background location (Android 11+) | Separate permission request, Play Store review required | Request foreground location first, explain background need for delivery tracking, submit Play Store declaration |
| Battery optimization (Doze mode) | Background tasks deferred during Doze | Use Firebase Cloud Messaging high-priority messages to wake device for delivery alerts |
| Notification channels (Android 8+) | Must define channels for different notification types | Create channels: order_updates, delivery_alerts, promotions, support |
| Scoped storage (Android 10+) | Cannot access arbitrary file paths | Use `image_picker` and `file_picker` packages for evidence uploads |
| Foreground service requirements (Android 14+) | Must declare foreground service type for GPS tracking | Use `location` foreground service type with persistent notification |

### Cross-Platform Considerations

| Concern | Details |
|---------|---------|
| Network connectivity | Must handle offline gracefully; queue cart changes and order actions for retry |
| Deep linking | Support `msmsupermarket.in/track/[id]` links opening in app via App Links (Android) and Universal Links (iOS) |
| App size | Keep initial download under 30MB; load product images lazily |
| Minimum OS versions | iOS 14+, Android 6.0+ (API 23) recommended for broad Kerala market coverage |
| Localization | Malayalam and English support required; RTL not needed |
| Accessibility | VoiceOver/TalkBack support for screen readers; minimum touch target 48x48dp |
| Biometric auth | Face ID / Touch ID (iOS), Fingerprint / Face (Android) for session unlock |
| Certificate pinning | Pin API server certificates to prevent MITM attacks |
| WebSocket fallback | If SSE replacement is needed, consider WebSocket for real-time features; otherwise FCM + polling suffices |

---

## Appendix: File Reference Index

Key source files for Flutter developers to understand backend behavior:

- **Auth configuration**: `auth.ts`, `auth.config.ts`
- **Authorization helpers**: `lib/authz.ts`
- **OTP logic**: `lib/otp.ts`
- **Validation schemas (Zod)**: `lib/validations.ts`
- **Order checkout logic**: `lib/order-checkout.ts`
- **Delivery fee calculation**: `lib/delivery-fee.ts`
- **Delivery money handling**: `lib/delivery-money.ts`
- **Push notification sending**: `lib/push.ts`
- **Delivery alerts (SSE)**: `lib/delivery-alerts.ts`
- **Constants (store coords, statuses)**: `lib/constants.ts`
- **Prisma schema**: `prisma/schema.prisma`
- **Cart provider (client-side)**: `components/cart/cart-provider.tsx`
- **Checkout form**: `components/checkout-form.tsx`
- **Delivery alert listener**: `components/delivery/delivery-alert-listener.tsx`
- **Delivery orders client**: `components/delivery/delivery-orders-client.tsx`
