# Web App vs Mobile Staff App - Gap Analysis Report

## Executive Summary

The **web app** (Next.js 15) is a comprehensive platform with 30+ admin pages, full delivery partner management, detailed packing workflows, customer-facing features, and extensive configuration. The **mobile-staff app** (React Native/Expo Router) covers only the essential daily operations for three roles: Admin (dashboard, orders list, reports, feature flags), Delivery Partner (order list, detail, navigate, collect, complete), and Packing Staff (queue, order detail with checklist).

**Key Findings:**
- The web admin panel has **26 distinct feature areas**; the mobile admin covers only **4** (dashboard, orders, reports, settings/flags)
- The web delivery portal has **8+ capabilities** (dashboard with earnings, navigation, collection with dual-mode payment, damage reporting, customer unavailability, arrival marking, adjustment reporting, real-time location); the mobile delivery covers **6** (dashboard, navigate, collect, complete, pickup, damage)
- The web packing system has **3+ workflow steps**; mobile packing covers the basics adequately
- At least **22 major feature groups** present in the web app have **no mobile equivalent**
- The mobile app is missing all marketing, catalogue management, customer management, finance, and administration features

---

## Feature Comparison Table

### Legend
- **Full** = Feature fully implemented with equivalent functionality
- **Partial** = Some capabilities present but not all sub-features
- **None** = Feature completely absent from mobile

| # | Feature Area | Web App | Mobile Staff | Gap Level | Priority |
|---|---|---|---|---|---|
| **ADMIN - Operations** |||||
| 1 | Dashboard (Command Centre) | Full: metrics, charts, live order feed, unacknowledged alerts | Partial: today orders/revenue/pending/delivered/unprinted | Partial | P1 |
| 2 | Orders Management | Full: list with filters, status tabs, detail, edit order, acknowledge, assign delivery, print invoice, bill number, delivery OTP | Partial: list with status tabs + search, no actions, no detail view with admin actions | Major | P0 |
| 3 | Order Detail (Admin) | Full: timeline, edit items/prices, assign delivery partner, generate invoice, print, bill number, delivery OTP, reject | None: orders screen has no navigation to detail or action buttons | Critical | P0 |
| 4 | Customer Requests | Full: view/manage requests from customers | None | Critical | P1 |
| 5 | Dispatch Management | Full: assign/reassign delivery partners, view dispatch queue | None | Critical | P0 |
| 6 | Returns Management | Full: view return requests, approve/reject, print receipt | None | Critical | P1 |
| **ADMIN - Catalogue** |||||
| 7 | Product Management | Full: CRUD products, images, pricing, stock, variants, bulk import/export | None | Critical | P1 |
| 8 | Category Management | Full: create/edit/delete categories with images, ordering | None | Critical | P1 |
| 9 | Subcategory Management | Full: nested subcategories under categories | None | Critical | P2 |
| **ADMIN - Customers** |||||
| 10 | Customer Directory | Full: list all customers, view orders, spending history | None | Critical | P2 |
| 11 | Feedback Management | Full: view all product reviews/ratings, moderate | None | Critical | P2 |
| 12 | Rewards/Loyalty Config | Full: configure loyalty points rules, view point balances | None | Critical | P2 |
| **ADMIN - Marketing** |||||
| 13 | Offers Management | Full: create/edit percentage/flat/BOGO offers, schedule, target products | None | Critical | P1 |
| 14 | Promo Codes | Full: create/edit promo codes, usage limits, min order, expiry | None | Critical | P1 |
| 15 | Push Notifications (Broadcast) | Full: compose and send push broadcasts to segments | None | Critical | P1 |
| 16 | WhatsApp Log | Full: view sent WhatsApp messages, resend failed, test templates | None | Critical | P2 |
| **ADMIN - Finance** |||||
| 17 | Collections (Cash/UPI) | Full: daily collection summary per delivery partner, reconciliation | None | Critical | P0 |
| 18 | Billing Dashboard | Full: billing overview, payment tracking | None | Critical | P1 |
| 19 | Reports (Detailed) | Full: sales, profit, fast-moving items, cancelled orders, returns reports, collections report, date-range filters, export | Partial: sales/profit/fast-moving with period filters only | Moderate | P1 |
| 20 | Cancelled Orders Report | Full: dedicated cancelled orders analytics | None | Critical | P2 |
| 21 | Returns Report | Full: returns analytics and trends | None | Critical | P2 |
| 22 | Collections Report | Full: delivery partner collections by date | None | Critical | P2 |
| **ADMIN - Administration** |||||
| 23 | Staff Management | Full: CRUD staff, assign roles, set permissions per role | None | Critical | P1 |
| 24 | Delivery Slots Config | Full: create/edit time slots, capacity per slot, day-based rules | None | Critical | P1 |
| 25 | Delivery Pricing/Slabs | Full: distance-based pricing rules, free delivery threshold | None | Critical | P2 |
| 26 | Store Settings | Full: store name, logo, address, contact, currency, tax, operating hours, store open/close toggle | Partial: feature flags only (not general store settings) | Major | P1 |
| 27 | Audit Log | Full: view all admin actions, timestamped, filterable | None | Critical | P2 |
| 28 | Store Open/Close Toggle | Full: instant toggle on top bar | None | Critical | P0 |
| **DELIVERY PARTNER** |||||
| 29 | Dashboard with Earnings | Full: today delivered, cash collected, UPI collected, total lifetime | Partial: just assigned orders list | Moderate | P1 |
| 30 | Active Orders List | Full: all active orders with status pills, payment info | Full: order list with status pills | None | - |
| 31 | Order Detail | Full: items, customer info, address, payment method/status, collection info | Full: equivalent detail view | None | - |
| 32 | Navigation to Customer | Full: embedded map view with directions | Full: opens Google Maps externally | Partial | P2 |
| 33 | Payment Collection | Full: dual cash+UPI input, balance calculation, UPI reference | Full: cash+UPI with reference | None | - |
| 34 | Mark Arrival | Full: announce arrival before delivery | None: no separate arrival step | Minor | P2 |
| 35 | Customer Unavailable | Full: mark customer unreachable, return items, photo evidence | None | Critical | P0 |
| 36 | Delivery Adjustment/Damage | Full: report damaged items with product selection, quantity, evidence upload | Partial: basic damage report (text-only, no photo) | Moderate | P1 |
| 37 | Confirm Delivery (OTP) | Full: 6-digit OTP entry + slide to confirm | Full: OTP + slide (two implementations exist) | None | - |
| 38 | Earnings Summary | Full: today cash/UPI totals, delivered count, lifetime stats | None: no earnings tracking | Critical | P1 |
| 39 | Order Pickup Confirmation | Full: confirm pickup from store | Full: confirm pickup screen | None | - |
| **PACKING STAFF** |||||
| 40 | Packing Queue | Full: list of orders to pack with item counts | Full: equivalent queue | None | - |
| 41 | Pack Order (Checklist) | Full: item-by-item checklist, mark ready, print invoice | Full: checklist + mark ready + print | None | - |
| 42 | Scan/Barcode Verification | None in web | None in mobile | Equal | - |
| **CROSS-CUTTING** |||||
| 43 | Real-time Order Updates (SSE/Push) | Full: SSE for live order stream, new order alerts | Partial: polling every 15-30s, FCM push for assignments | Moderate | P1 |
| 44 | Dark Mode | Full: system-level dark mode | Full: nativewind dark mode | None | - |
| 45 | Accessibility | Full: ARIA labels, keyboard nav | Partial: accessibilityLabel on most elements | Minor | P2 |
| 46 | Multi-language (i18n) | Full: language switcher (Tamil/English) | None | Critical | P1 |
| 47 | Role-based Navigation | Full: permission-gated sidebar items | Full: role-based route groups | None | - |
| 48 | Offline Support | Partial: service worker, offline page | Partial: offline banner component | None | - |
| 49 | Photo/Evidence Upload | Full: image upload for damage, returns | None: text-only damage reports | Critical | P1 |
| 50 | Print Support | Full: invoice printing, thermal receipt format | Partial: print recording (no direct Bluetooth printer integration) | Moderate | P2 |

---

## Detailed Gap Analysis by Role

### Admin Role Gaps (22 missing features)

The mobile admin currently has only 4 screens. The web admin has 26+ feature areas. The missing capabilities fall into these categories:

#### Critical Operations Gaps
1. **Order Detail with Admin Actions** - Cannot view detailed order, edit items/prices, assign delivery partner, mark printed, add bill number from mobile
2. **Dispatch Management** - Cannot assign/reassign delivery partners to orders from mobile
3. **Store Toggle** - Cannot open/close store from mobile (frequently needed feature)
4. **Collections Reconciliation** - Cannot view daily delivery partner collections

#### Catalogue Gaps  
5. **Product CRUD** - Cannot add/edit/delete products or manage stock from mobile
6. **Category Management** - Cannot create/edit categories and subcategories

#### Customer/Marketing Gaps
7. **Customer Requests** - Cannot view/respond to customer requests
8. **Returns Processing** - Cannot approve/reject return requests
9. **Offers Management** - Cannot create/edit special offers
10. **Promo Codes** - Cannot create/manage promotional codes
11. **Push Broadcast** - Cannot send push notifications to customers

#### Finance/Admin Gaps
12. **Billing Dashboard** - No billing overview on mobile
13. **Staff Management** - Cannot add/edit staff or manage permissions
14. **Delivery Slots** - Cannot configure delivery time slots
15. **Delivery Pricing** - Cannot set distance-based delivery fee rules
16. **Store Settings** - Cannot update store name, hours, contact, tax rates
17. **Audit Log** - Cannot view admin action history
18. **WhatsApp Log** - Cannot view messaging history
19. **Detailed Reports** - No cancelled orders, returns, or collections report views
20. **Customer Directory** - Cannot look up customer order history
21. **Feedback/Reviews** - Cannot moderate product reviews
22. **Rewards Configuration** - Cannot configure loyalty program

### Delivery Partner Role Gaps (5 missing features)

The delivery mobile flow is reasonably complete but missing:

1. **Customer Unavailable Flow** - No way to mark customer as unreachable and initiate return
2. **Earnings Dashboard** - No summary of today's/lifetime earnings and collections
3. **Photo Evidence Upload** - Damage reports are text-only; web supports image uploads
4. **Mark Arrival** - No dedicated "I'm arriving" status update before reaching customer
5. **Multi-language Support** - No i18n; web supports Tamil/English

### Packing Staff Role Gaps (2 missing features)

The packing workflow is well-covered but missing:

1. **Multi-language Support** - No Tamil/English toggle
2. **Bluetooth Printer Integration** - Web tracks prints via API; mobile could support direct Bluetooth thermal printer pairing

---

## Priority Ranking

### P0 - Critical (Must Have for Daily Operations)

These gaps block staff from performing essential daily tasks without a computer:

| # | Feature | Role | Reason |
|---|---|---|---|
| 1 | Order Detail with Admin Actions | Admin | Cannot manage individual orders (most frequent admin task) |
| 2 | Dispatch Management | Admin | Cannot assign delivery partners to orders |
| 3 | Store Open/Close Toggle | Admin | Daily operation, needs instant access |
| 4 | Collections View | Admin | Must reconcile delivery partner cash daily |
| 5 | Customer Unavailable Flow | Delivery | No fallback when customer is unreachable |

### P1 - Important (High Value, Needed Weekly+)

| # | Feature | Role | Reason |
|---|---|---|---|
| 6 | Product Management (CRUD) | Admin | Stock updates, price changes needed regularly |
| 7 | Category Management | Admin | Menu organization |
| 8 | Customer Requests | Admin | Customer satisfaction |
| 9 | Returns Processing | Admin | Financial reconciliation |
| 10 | Offers Management | Admin | Promotional campaigns |
| 11 | Promo Code Management | Admin | Marketing tools |
| 12 | Push Notification Broadcast | Admin | Customer engagement |
| 13 | Staff Management | Admin | Onboarding/offboarding |
| 14 | Delivery Slots Config | Admin | Capacity planning |
| 15 | Store Settings | Admin | Configuration changes |
| 16 | Billing Dashboard | Admin | Financial oversight |
| 17 | Reports (Cancelled/Returns/Collections) | Admin | Business intelligence |
| 18 | Earnings Dashboard | Delivery | Partner motivation/transparency |
| 19 | Photo Evidence Upload | Delivery | Accountability for damages |
| 20 | Real-time Updates (WebSocket/SSE) | All | Reduce polling, instant alerts |
| 21 | Multi-language (i18n) | All | Tamil-speaking staff need native language |
| 22 | Delivery Adjustment/Damage (Enhanced) | Delivery | Complete damage reporting with photos |

### P2 - Nice to Have (Monthly or less frequent use)

| # | Feature | Role | Reason |
|---|---|---|---|
| 23 | Subcategory Management | Admin | Fine-grained organization |
| 24 | Customer Directory | Admin | Occasional lookup |
| 25 | Feedback Moderation | Admin | Quality control |
| 26 | Rewards Config | Admin | Loyalty program tuning |
| 27 | WhatsApp Log | Admin | Message verification |
| 28 | Delivery Pricing Slabs | Admin | Rare configuration |
| 29 | Audit Log | Admin | Security/compliance |
| 30 | Cancelled Orders Report | Admin | Periodic analysis |
| 31 | Returns Report | Admin | Periodic analysis |
| 32 | Collections Report | Admin | Periodic analysis |
| 33 | Mark Arrival | Delivery | Status refinement |
| 34 | Embedded Map (MapLibre) | Delivery | Currently uses external Google Maps |
| 35 | Bluetooth Printer | Packing | Direct thermal printing |
| 36 | Improved Accessibility | All | WCAG compliance |

---

## Implementation Plan

### Phase 1: P0 Critical Features (Estimated: 3-4 weeks)

#### 1.1 Admin Order Detail Screen
**New screens:** `app/(admin)/orders/[id]/index.tsx`, `app/(admin)/orders/[id]/edit.tsx`  
**Effort:** 5 days

- View full order detail (items, customer, address, payment, timeline)
- Mark as acknowledged
- Assign/reassign delivery partner (dropdown of available partners)
- Edit items/prices (add/remove items, change quantities)
- Generate/view invoice
- Mark as printed
- Add bill number
- Cancel order with reason

**API endpoints needed:**
- `GET /admin/orders/:id` (exists in web, needs mobile API wrapper)
- `PATCH /admin/orders/:id/acknowledge`
- `PATCH /admin/orders/:id/delivery` (assign partner)
- `PATCH /admin/orders/:id/edit` (edit items)
- `POST /orders/:id/print`
- `PATCH /admin/orders/:id/bill-number`

**Architecture:**
- Add Zustand store: `src/stores/adminOrders.ts`
- Reusable component: `src/components/OrderTimeline.tsx`
- Reusable component: `src/components/EditOrderModal.tsx`

#### 1.2 Dispatch Management Screen
**New screen:** `app/(admin)/dispatch.tsx`  
**Effort:** 3 days

- View unassigned orders (READY_FOR_DELIVERY without deliveryPartnerId)
- View available delivery partners with current load
- Assign partner to order (tap partner, tap order)
- Reassign functionality
- Auto-refresh

**API endpoints needed:**
- `GET /admin/dispatch` (list unassigned + available partners)
- `PATCH /admin/orders/:id/delivery` (assign partner)

**Architecture:**
- Shared types in `@msm/shared/types`
- Component: `src/components/PartnerSelector.tsx`

#### 1.3 Store Open/Close Toggle
**New component:** Add toggle to admin dashboard header  
**Effort:** 1 day

- Prominent toggle switch on admin dashboard
- Calls `POST /admin/store-toggle`
- Visual feedback: red (closed) / green (open)
- Haptic feedback on toggle

**API endpoint:** `POST /admin/store-toggle` (exists)

#### 1.4 Collections View Screen
**New screen:** `app/(admin)/collections.tsx`  
**Effort:** 3 days

- Date picker for selecting day
- Per-partner collection summary (cash + UPI totals)
- Expandable detail showing individual collections
- Total collected vs expected comparison
- Mark as reconciled

**API endpoints needed:**
- `GET /admin/collections?date=YYYY-MM-DD`
- `PATCH /admin/collections/:id/reconcile`

#### 1.5 Customer Unavailable Flow (Delivery)
**New screen:** `app/(delivery)/order/[id]/unavailable.tsx`  
**Effort:** 2 days

- "Customer Unavailable" button on order detail
- Reason selection (not reachable, refused, wrong address)
- Optional photo evidence
- Timer showing attempted contact (called X times)
- Submit returns order to store

**API endpoints needed:**
- `POST /delivery/unavailable` (exists in web)
- `POST /delivery/unavailable/return`
- `POST /evidence/upload`

---

### Phase 2: P1 Important Features (Estimated: 5-6 weeks)

#### 2.1 Product Management
**New screens:** `app/(admin)/products/index.tsx`, `app/(admin)/products/[id].tsx`, `app/(admin)/products/create.tsx`  
**Effort:** 5 days

- Product list with search, category filter
- Create product: name, description, price, MRP, stock, category, images
- Edit product: all fields
- Delete product (with confirmation)
- Stock quick-update (inline editing)
- Image upload with compression

**API endpoints:** Use existing `/admin/products` CRUD routes

#### 2.2 Category Management
**New screens:** `app/(admin)/categories/index.tsx`, `app/(admin)/categories/create.tsx`  
**Effort:** 3 days

- List categories with drag-to-reorder
- Create/edit category (name, image, order)
- Delete category (with product count warning)

#### 2.3 Customer Requests & Returns
**New screens:** `app/(admin)/requests.tsx`, `app/(admin)/returns.tsx`  
**Effort:** 4 days

- Customer requests list with status filters
- Respond to request (approve/reject)
- Returns list with photos
- Approve/reject return, set refund amount

#### 2.4 Marketing Suite (Offers + Promos + Push)
**New screens:** `app/(admin)/marketing/offers.tsx`, `app/(admin)/marketing/promos.tsx`, `app/(admin)/marketing/push.tsx`  
**Effort:** 5 days

- Offers CRUD: type, discount value, products, date range
- Promo codes CRUD: code, discount, min order, usage limit, expiry
- Push notification composer: title, body, segment, send

#### 2.5 Staff Management
**New screen:** `app/(admin)/staff/index.tsx`, `app/(admin)/staff/[id].tsx`  
**Effort:** 3 days

- Staff list with role badges
- Create staff: name, phone, role, permissions
- Edit permissions via toggle switches
- Deactivate staff

#### 2.6 Delivery Partner Earnings Dashboard
**Enhancement to:** `app/(delivery)/index.tsx`  
**Effort:** 2 days

- Add earnings summary card at top: today cash, today UPI, today delivered, lifetime total
- Pull from existing delivery stats API
- Weekly/monthly earnings history chart

#### 2.7 Photo Evidence Upload
**New service:** `src/services/camera.ts`  
**Effort:** 3 days

- Camera/gallery picker using expo-image-picker
- Image compression before upload
- Upload to `/evidence/upload` endpoint
- Integrate into damage report and unavailable flows
- Show thumbnail previews

#### 2.8 Settings & Slots Config
**New screens:** `app/(admin)/store-settings.tsx`, `app/(admin)/delivery-slots.tsx`  
**Effort:** 3 days

- Store settings form: name, address, phone, tax %, operating hours
- Delivery slots: day grid with time ranges and capacity
- Save/update configuration

#### 2.9 Multi-language (i18n)
**New infrastructure:** `src/i18n/` directory  
**Effort:** 4 days

- Install and configure `i18next` + `react-i18next`
- Create translation files: `en.json`, `ta.json` (Tamil)
- Language selector in profile/settings screens
- Persist selection in AsyncStorage
- Translate all UI strings for admin, delivery, and packing flows

#### 2.10 Real-time Order Updates
**Enhancement to:** polling mechanism  
**Effort:** 3 days

- Replace 15-30s polling with WebSocket/SSE connection
- Use existing `/api/realtime/orders/:id` and `/api/realtime/delivery` SSE endpoints
- Automatic reconnection with exponential backoff
- Fallback to polling when WebSocket unavailable
- Vibration + sound on new assignment

#### 2.11 Enhanced Reports
**Enhancement to:** `app/(admin)/reports.tsx`  
**Effort:** 2 days

- Add tabs: Cancelled, Returns, Collections
- Cancelled: order count, reasons breakdown, refund total
- Returns: items returned, reasons, refund amount
- Collections: partner-wise daily collections

---

### Phase 3: P2 Nice-to-Have (Estimated: 3-4 weeks)

#### 3.1 Additional Admin Screens
- Subcategory management (2 days)
- Customer directory with order history (2 days)
- Feedback/review moderation (2 days)
- Rewards/loyalty configuration (2 days)
- WhatsApp log viewer (1 day)
- Delivery pricing slabs (2 days)
- Audit log viewer (2 days)

#### 3.2 Delivery Enhancements
- Mark arrival status (1 day)
- Embedded MapLibre/MapView for in-app navigation (3 days)
- Route optimization suggestions (2 days)

#### 3.3 Packing Enhancements
- Bluetooth thermal printer integration via expo-print or react-native-ble (3 days)
- Barcode scanning for item verification (2 days)

#### 3.4 Cross-cutting
- Enhanced accessibility (WCAG AA compliance) (2 days)
- Offline-first with optimistic updates + sync queue (5 days)
- Biometric login (1 day)

---

## Suggested Architecture

### Shared API Layer

```
src/services/
  api.ts                  # Axios instance with auth (exists)
  admin.api.ts            # Admin-specific endpoints
  delivery.api.ts         # Delivery-specific endpoints
  packing.api.ts          # Packing-specific endpoints
  upload.api.ts           # File upload utilities (new)
```

### Zustand Stores

```
src/stores/
  auth.ts                 # Auth state (exists)
  delivery.ts             # Delivery state (exists)
  adminOrders.ts          # Admin orders state (new)
  adminProducts.ts        # Product management state (new)
  adminCollections.ts     # Collections state (new)
  settings.ts             # App settings + i18n preference (new)
  ui.ts                   # UI state (toasts, modals, sheet) (new)
```

### Component Structure

```
src/components/
  ui/                     # Base UI (exists: Shimmer, ErrorState)
    Modal.tsx             # Reusable modal (new)
    BottomSheet.tsx       # Bottom sheet for actions (new)
    DatePicker.tsx        # Date selector (new)
    ImagePicker.tsx       # Camera/gallery (new)
    SearchInput.tsx       # Debounced search (new)
    Badge.tsx             # Status badge (new)
    Toggle.tsx            # Switch with labels (new)
  admin/                  # Admin-specific components (new)
    OrderTimeline.tsx
    PartnerSelector.tsx
    ProductForm.tsx
    StaffPermissions.tsx
  delivery/               # Delivery-specific (new)
    EarningsCard.tsx
    UnavailableForm.tsx
    EvidenceCapture.tsx
  shared/                 # Shared across roles (new)
    OrderItemList.tsx
    CustomerInfo.tsx
    PaymentBadge.tsx
```

### Navigation Enhancement

```
app/
  (admin)/
    _layout.tsx           # Add bottom tabs: Dashboard, Orders, Products, More
    index.tsx             # Dashboard (exists)
    orders.tsx            # Orders list (exists)
    orders/[id]/
      index.tsx           # Order detail (new)
      edit.tsx            # Edit order (new)
    dispatch.tsx          # Dispatch (new)
    collections.tsx       # Collections (new)
    products/
      index.tsx           # Product list (new)
      [id].tsx            # Product detail/edit (new)
      create.tsx          # Create product (new)
    categories/
      index.tsx           # Categories list (new)
    marketing/
      offers.tsx          # Offers (new)
      promos.tsx          # Promo codes (new)
      push.tsx            # Push broadcast (new)
    staff/
      index.tsx           # Staff list (new)
      [id].tsx            # Staff detail (new)
    returns.tsx           # Returns (new)
    requests.tsx          # Customer requests (new)
    store-settings.tsx    # Store configuration (new)
    delivery-slots.tsx    # Slot configuration (new)
    more.tsx              # "More" menu linking to P2 features (new)
  (delivery)/
    order/[id]/
      unavailable.tsx     # Customer unavailable (new)
```

### Mobile API Versioning

Extend the existing `/api/mobile/v1/` namespace for new endpoints:

```
/api/mobile/v1/admin/orders/:id         # GET: order detail
/api/mobile/v1/admin/orders/:id/assign  # PATCH: assign partner
/api/mobile/v1/admin/orders/:id/edit    # PATCH: edit items
/api/mobile/v1/admin/dispatch           # GET: dispatch queue
/api/mobile/v1/admin/collections        # GET: collections summary
/api/mobile/v1/admin/products           # GET/POST: products CRUD
/api/mobile/v1/admin/products/:id       # GET/PATCH/DELETE
/api/mobile/v1/admin/categories         # GET/POST: categories CRUD
/api/mobile/v1/admin/staff              # GET/POST: staff CRUD
/api/mobile/v1/admin/settings           # GET/PATCH: store settings
/api/mobile/v1/admin/offers             # GET/POST: offers CRUD
/api/mobile/v1/admin/promos             # GET/POST: promo CRUD
/api/mobile/v1/admin/push               # POST: send broadcast
/api/mobile/v1/admin/returns            # GET/PATCH: returns
/api/mobile/v1/admin/requests           # GET/PATCH: requests
/api/mobile/v1/delivery/unavailable     # POST: customer unavailable
/api/mobile/v1/delivery/earnings        # GET: earnings summary
/api/mobile/v1/evidence/upload          # POST: multipart image upload
```

---

## Effort Summary

| Phase | Features | Estimated Effort | Cumulative |
|---|---|---|---|
| Phase 1 (P0) | 5 critical features | 14 dev-days (3 weeks) | 3 weeks |
| Phase 2 (P1) | 11 important features | 34 dev-days (6 weeks) | 9 weeks |
| Phase 3 (P2) | 10 nice-to-have features | 22 dev-days (4 weeks) | 13 weeks |
| **Total** | **26 feature groups** | **70 dev-days (~13 weeks)** | |

### Recommended Team
- 1 Senior RN developer (architecture + complex features)
- 1 Mid-level RN developer (CRUD screens + UI)
- 1 Backend developer (mobile API endpoints, part-time)
- 1 QA/Testing (manual + basic E2E)

### Quick Wins (can ship in 1 week)
1. Store Open/Close toggle on admin dashboard (1 day)
2. Earnings card on delivery dashboard (1 day)
3. Customer Unavailable button + basic flow (2 days)
4. Admin order detail (read-only first) (2 days)

---

## Technical Recommendations

1. **Shared Package Enhancement** - Extend `@msm/shared` to include all type definitions, constants, and validation schemas used by both web and mobile
2. **API Response Standardization** - Ensure all mobile API endpoints return consistent `{ data, error, meta }` format
3. **Optimistic Updates** - Use Zustand middleware for optimistic state updates on mutations
4. **Image Handling** - Use `expo-image-picker` + `expo-image-manipulator` for compression before upload
5. **Navigation** - Admin role needs a "More" tab with a grid of less-used features to avoid overcrowded bottom nav
6. **Testing** - Add Detox or Maestro E2E tests for critical flows (order management, collection, delivery complete)
7. **Performance** - Implement list virtualization (FlashList) for orders/products with 100+ items
8. **Security** - All admin mutations should verify permissions server-side using the same `hasPermission()` system as web
