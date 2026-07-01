# Analysis & Plan: Tracking Bill, Map Design, ETA Logic, TWA Size, Feature Flags

**Date:** 2026-07-01

---

## 1. CUSTOMER TRACKING — BILL/INVOICE AS PDF

### Current State
The tracking page (`/track/[id]`) shows:
- Live status stepper (Order Received → Packing → Ready → Out for Delivery → Arriving → Delivered)
- Live map with rider GPS
- ETA countdown
- Rider name/phone
- OTP for delivery verification

**Missing:** No order bill/invoice visible to the customer on the tracking page. The admin can see and print bills, but customer cannot.

### Plan

| Task | Implementation |
|------|---------------|
| Generate PDF invoice | Use `@react-pdf/renderer` to create a React-based PDF layout matching admin invoice style |
| API endpoint | `GET /api/orders/[id]/invoice` — returns PDF buffer with auth check (only order owner or staff) |
| Tracking page integration | Add "View Bill" button below the status stepper that opens the invoice in a sheet/modal |
| Content | Store name, order number, date, items (name × qty × price), subtotal, delivery fee, tip, total, payment method, delivery address |
| Caching | Generate once on DELIVERED status, cache in S3/Vercel Blob for subsequent views |

### Design Reference (Swiggy-style)
```
┌─────────────────────────────────┐
│ 🧾 Order Bill                    │
│                                  │
│ MSM Supermarket                  │
│ Order #ORD-20260701-AB12         │
│ July 1, 2026 • 3:42 PM          │
│ ─────────────────────────────── │
│ Tomatoes × 2       ₹60.00       │
│ Milk 500ml × 1     ₹30.00       │
│ Rice 5kg × 1       ₹450.00      │
│ ─────────────────────────────── │
│ Subtotal            ₹540.00      │
│ Delivery Fee        ₹30.00       │
│ Tip                 ₹20.00       │
│ ─────────────────────────────── │
│ TOTAL              ₹590.00       │
│ Payment: COD                     │
│                                  │
│ [Download PDF]  [Share on WA]    │
└─────────────────────────────────┘
```

---

## 2. MAP DESIGN — SWITCH TO MapCN (dev/map pattern)

### Current Implementation
The current map uses:
- **Library:** `maplibregl` (MapLibre GL JS)
- **Tile source:** `https://tiles.openfreemap.org/styles/liberty` (free, no API key)
- **Markers:** Custom SVG elements (rider = black circle with arrow, customer = black square with white dot, store = grey circle)
- **Route:** Dashed line from rider to customer
- **Animation:** Smooth rider position interpolation with ease-out cubic

### Assessment
The current implementation is actually quite good! It has:
- ✅ Animated rider movement with heading rotation
- ✅ Pulsing ring on rider marker (Uber-style)
- ✅ Distance remaining overlay
- ✅ Route line from rider to customer
- ✅ Custom zoom controls
- ✅ Click-to-navigate on customer marker

### Recommended Improvements (MapCN/Premium Style)

| Improvement | Detail |
|-------------|--------|
| **Differentiated markers with labels** | Add text labels below markers: "🛵 Rider", "🏠 Your Home", "🏪 Store" |
| **Color differentiation** | Rider: emerald green (#059669), Customer: blue (#3B82F6), Store: neutral (#6B7280) |
| **Better tile style** | Switch to `https://tiles.openfreemap.org/styles/positron` (lighter, less visual noise) or MapTiler streets if API key available |
| **Route with gradient** | Solid line (not dashed) with gradient from green (rider) to blue (destination) |
| **ETA on map** | Show ETA badge directly on the rider marker |
| **Rider heading indicator** | Already implemented (good!) — the arrow rotates with heading |
| **Map dark mode** | Switch to dark tile style when `prefers-color-scheme: dark` |
| **3D building extrusion** | Optional: enable building extrusion for a premium feel near the destination |

### Marker Redesign Plan

```
RIDER (Emerald):
┌──────────────┐
│ 🟢 48x48px   │ — Emerald circle with white delivery icon
│ Pulse ring   │ — Green pulse animation
│ Arrow inside │ — Rotates with GPS heading
│ "2 min" tag  │ — ETA badge above marker
└──────────────┘

CUSTOMER HOME (Blue):
┌──────────────┐
│ 🔵 44x44px   │ — Blue rounded-square with home icon
│ Pulse ring   │ — Subtle blue pulse
│ "Your Home"  │ — Label below
└──────────────┘

STORE (Grey):
┌──────────────┐
│ ⚫ 24x24px   │ — Small grey dot (de-emphasized)
│ "Store"      │ — Label below
└──────────────┘
```

---

## 3. DELIVERY ETA LOGIC — HOW IT WORKS BEFORE RIDER ACCEPTS

### Current Logic (`apps/web/lib/live-order.ts`)

```typescript
export function estimateOrderEta(status: string) {
  const minutes: Record<string, number> = {
    ORDER_RECEIVED: 20,     // Just placed
    AWAITING_CUSTOMER_APPROVAL: 18,
    ACCEPTED: 16,           // Store confirmed
    PACKING: 14,            // Being packed
    READY_FOR_DELIVERY: 10, // Waiting for rider
    OUT_FOR_DELIVERY: 8,    // Rider has it
    ARRIVING: 3             // Almost there
  };
  return minutes[status] ?? 15;
}
```

### How It Works BEFORE Rider Accepts

**The ETA is a STATIC LOOKUP TABLE based on status alone.** It is NOT calculated from:
- ❌ Distance between store and customer
- ❌ Historical delivery times
- ❌ Current rider load
- ❌ Traffic conditions
- ❌ Time of day

**Before rider accepts (ORDER_RECEIVED → PACKING):** The system shows a countdown based purely on which step the order is at. `ORDER_RECEIVED = 20 min` means "we estimate 20 minutes total from now to your door."

**After rider accepts (OUT_FOR_DELIVERY):** The tracking page switches to a DISTANCE-BASED calculation:
```typescript
// In live-order-tracking.tsx:
const dist = distanceKm(riderLoc, data.destination);
return Math.max(2, Math.ceil((dist / 18) * 60)); // Assumes 18 km/h average speed
```

### Problems with Current Approach

| Issue | Impact |
|-------|--------|
| Static times regardless of distance | A 1km delivery and a 5km delivery both show "20 min" at ORDER_RECEIVED |
| No learning from historical data | Store that averages 35 min still shows 20 min |
| Speed assumption (18 km/h) is fixed | Traffic, rain, hills not considered |
| No "range" shown | "20 min" sounds like a promise, "15-25 min" is more honest |

### Recommended Improved ETA Algorithm

```typescript
export function estimateOrderEta(status: string, options?: {
  distanceKm?: number;
  avgPackingMinutes?: number; // from store settings
  avgDeliverySpeed?: number; // km/h, from historical data
  rushHourMultiplier?: number; // 1.0 normal, 1.3 peak
}) {
  const {
    distanceKm = 3,
    avgPackingMinutes = 8,
    avgDeliverySpeed = 18,
    rushHourMultiplier = 1.0
  } = options ?? {};

  const deliveryMinutes = Math.ceil((distanceKm / avgDeliverySpeed) * 60 * rushHourMultiplier);

  const baseMinutes: Record<string, number> = {
    ORDER_RECEIVED: avgPackingMinutes + deliveryMinutes + 5, // pack + deliver + buffer
    AWAITING_CUSTOMER_APPROVAL: avgPackingMinutes + deliveryMinutes + 3,
    ACCEPTED: avgPackingMinutes + deliveryMinutes,
    PACKING: Math.ceil(avgPackingMinutes * 0.7) + deliveryMinutes,
    READY_FOR_DELIVERY: deliveryMinutes + 2,    // waiting for pickup
    OUT_FOR_DELIVERY: deliveryMinutes,
    ARRIVING: Math.min(3, deliveryMinutes),
  };

  return baseMinutes[status] ?? 15;
}
```

This gives DISTANCE-AWARE estimates even before the rider accepts. Store settings could provide `avgPackingMinutes` based on historical order data.

---

## 4. TWA SIZE & ALTERNATIVES

### Current TWA Size: 44KB (source only)

The built APK will be approximately **1.5-3 MB** because:
- The APK contains just the Android shell (LauncherActivity + AndroidBrowserHelper library)
- No app logic — it just opens Chrome/Chromium Custom Tab pointing to the web app URL
- The actual "app content" loads from the web (your Next.js deployment)

### Why TWA is Small (and that's GOOD)

| Aspect | TWA | React Native (Expo) |
|--------|-----|---------------------|
| APK size | ~2 MB | 25-50 MB |
| Update speed | Instant (web deploys) | App store review (1-7 days) |
| Maintenance | Zero — web changes reflect immediately | Must release new build for every change |
| Performance | Chrome's V8 engine | Hermes JS engine |
| Native APIs | Limited (no BLE, camera, sensors) | Full access |
| Play Store | ✅ Can be published | ✅ Can be published |
| Offline | Service worker caching | Built-in |

### Will It Work Well?

**YES** for a grocery delivery customer app, because:
1. Customers primarily browse, add to cart, and track orders — all web-native tasks
2. Chrome on Android is fast and supports all PWA features
3. Push notifications work via Firebase Cloud Messaging (web push)
4. GPS location works via Web Geolocation API
5. Payment works via UPI deep links / web payment gateways

**When TWA won't work:**
- If you need Bluetooth (thermal printer) — staff app needs React Native
- If you need background GPS tracking — delivery partner needs React Native
- If you need complex offline-first — heavy caching requirements

### Alternatives Comparison

| Option | Size | Effort | Pros | Cons |
|--------|------|--------|------|------|
| **TWA (current)** | ~2 MB | Done ✅ | Instant updates, tiny, no maintenance | Limited native APIs, depends on Chrome |
| **Capacitor** | ~5-8 MB | 2-3 days | More native plugin access, web-based | Another build system to maintain |
| **Expo Web → EAS Build** | ~25 MB | 1 week | Full React Native, shared code with staff app | Heavy, slower updates, overkill for customer app |
| **PWA only (no APK)** | 0 MB | Already done | No Play Store, Add to Home Screen only | Not in app stores, less discoverable |

### Recommendation

**Keep TWA for customer app.** It's the right choice because:
1. Customer app is 95% read/browse/order — web is perfect
2. You get instant updates (deploy web → app updates automatically)
3. Play Store listing gives discoverability
4. 2 MB install is a HUGE advantage in India (low storage devices)

**For staff/delivery apps:** Keep React Native (Expo) because they need:
- Background GPS tracking
- Bluetooth printer access
- Persistent push notification channels
- Alarm/vibration for incoming orders

---

## 5. INDUSTRY-GRADE FEATURE FLAGS

### Current Feature Flags

```
stock_value_visible     — Show inventory valuation on dashboard
forced_accept_delivery  — Auto-assign without accept/reject choice
ring_alert_rules        — Ringtone/duration for incoming alerts  
print_required_alert    — Alert when orders are unprinted
```

### Recommended Additional Feature Flags

| # | Flag Key | Type | Purpose | Example Config |
|---|----------|------|---------|----------------|
| 1 | `delivery_mode` | enum | Control delivery mode globally | `"instant"` / `"scheduled_only"` / `"both"` |
| 2 | `instant_delivery_enabled` | bool | Toggle quick/instant delivery on/off | `true` — when off, only slots shown |
| 3 | `minimum_order_value` | number | Dynamic minimum order amount | `{ "value": 149 }` — change without deploy |
| 4 | `free_delivery_threshold` | number | Dynamic free delivery amount | `{ "value": 499 }` |
| 5 | `delivery_radius_km` | number | Expandable service area | `{ "value": 5 }` |
| 6 | `max_orders_per_hour` | number | Rate limiting for peak hours | `{ "value": 50, "action": "queue" }` |
| 7 | `surge_pricing_enabled` | bool+config | Enable surge during high demand | `{ "multiplier": 1.5, "message": "High demand" }` |
| 8 | `tip_enabled` | bool | Toggle tip feature for delivery | `true` |
| 9 | `wallet_topup_enabled` | bool | Allow self-service wallet loading | `false` (until payment gateway ready) |
| 10 | `reviews_enabled` | bool | Toggle product review feature | `true` |
| 11 | `referral_enabled` | bool+config | Enable referral rewards | `{ "senderReward": 50, "receiverReward": 50 }` |
| 12 | `multi_language_enabled` | bool | Toggle language switcher visibility | `true` |
| 13 | `express_checkout_enabled` | bool | Toggle one-tap ordering | `true` |
| 14 | `store_open_hours` | config | Auto open/close store by time | `{ "open": "07:00", "close": "22:00", "autoToggle": true }` |
| 15 | `maintenance_mode` | bool+config | Show maintenance screen to customers | `{ "message": "Back in 30 minutes", "eta": "2026-07-01T12:00:00Z" }` |
| 16 | `cod_enabled` | bool | Toggle COD payment option | `true` — disable to go digital-only |
| 17 | `upi_on_delivery_enabled` | bool | Toggle UPI on delivery | `true` |
| 18 | `new_user_discount` | config | First-order promo configuration | `{ "percent": 20, "maxDiscount": 100, "minOrder": 199 }` |
| 19 | `delivery_partner_assignment` | enum | How orders are assigned | `"round_robin"` / `"nearest"` / `"manual"` |
| 20 | `order_edit_window_minutes` | number | How long after placing customer can edit | `{ "value": 5 }` |
| 21 | `substitute_approval_mode` | enum | How substitutions work | `"always_ask"` / `"auto_approve_same_price"` / `"never_substitute"` |
| 22 | `dark_store_mode` | bool | Hide store address, delivery-only branding | `false` |
| 23 | `slot_only_mode` | bool | Disable ASAP delivery, slots only | `false` — when `true`, customers must pick a slot |
| 24 | `max_items_per_order` | number | Cart item limit | `{ "value": 50 }` |
| 25 | `live_tracking_enabled` | bool | Toggle map tracking for customers | `true` |

### Critical Business Scenario Flags

**"Disable quick delivery and add slot only" use case:**

Set these flags:
```json
{
  "instant_delivery_enabled": false,
  "slot_only_mode": true,
  "delivery_mode": "scheduled_only"
}
```
Result: Checkout only shows slot picker, no "ASAP" option. Useful when:
- Staff shortage
- Festival rush (controlled flow)
- Planned maintenance on delivery fleet
- Night hours (take morning slot orders only)

**"Emergency: store overwhelmed":**
```json
{
  "max_orders_per_hour": 20,
  "surge_pricing_enabled": true,
  "maintenance_mode": false
}
```

**"Soft launch in new area":**
```json
{
  "delivery_radius_km": 3,
  "minimum_order_value": 299,
  "free_delivery_threshold": 999,
  "cod_enabled": false,
  "referral_enabled": false
}
```

---

## 6. IMPLEMENTATION PRIORITY

| Priority | Task | Effort |
|----------|------|--------|
| **P0** | Add feature flags (items 1-7, 14-15, 23) — immediate business control | 2 days |
| **P1** | Customer bill/invoice on tracking page (PDF generation + "View Bill" button) | 3 days |
| **P2** | Map marker redesign (colored, labeled, dark mode tiles) | 2 days |
| **P2** | Improved ETA algorithm (distance-aware before rider accepts) | 1 day |
| **P3** | Additional flags (items 8-25) — ongoing, add as features ship | Ongoing |

---

*End of analysis. Ready for implementation on your signal.*
