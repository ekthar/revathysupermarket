# Spec 3 — Unified Staff React Native App: Design Document

## 1. Overview

Transform the existing `apps/mobile-delivery` into a unified **mobile-staff** app serving all staff roles: DELIVERY_PARTNER, PACKING_STAFF, ADMIN, OWNER, MANAGER, and STAFF. Role-based navigation routes each user to their role-specific screens after login.

**Key decisions:**
- Rename `apps/mobile-delivery` → `apps/mobile-staff`
- Retain existing Expo SDK 54, expo-router, NativeWind, Zustand stack
- Replace `expo-notifications` with `@react-native-firebase/messaging` + `notifee` for full-screen alerts
- Auth via existing mobile JWT API (`/api/mobile/v1/auth/login`) — no NextAuth sessions (those are web cookies, incompatible with native apps)
- Animations via `react-native-reanimated` (already installed) — Framer Motion is web-only
- Navigation to customer: Google Maps intent + in-app MapLibre static map
- Spec 4 (Capacitor admin wrapper) is cancelled — admin screens live here

---

## 2. File Structure (After Transformation)

```
apps/mobile-staff/
├── app.json
├── eas.json
├── package.json
├── global.css
├── tailwind.config.js
├── tsconfig.json
├── assets/
│   ├── audio/
│   │   ├── delivery_alarm.wav       (existing)
│   │   └── emergency_bell.wav       (new — admin reject alert)
│   └── images/
├── app/
│   ├── _layout.tsx                   ← Root: init auth + role router
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx                 ← Phone/email login (all roles)
│   │   └── otp.tsx                   ← OTP verification
│   ├── (delivery)/
│   │   ├── _layout.tsx               ← Tab layout: Orders | Profile
│   │   ├── index.tsx                 ← My assigned orders list
│   │   ├── order/[id]/
│   │   │   ├── index.tsx             ← Order detail + actions
│   │   │   ├── navigate.tsx          ← MapLibre map + Google Maps intent
│   │   │   ├── collect.tsx           ← Cash collection (human-language)
│   │   │   └── complete.tsx          ← OTP + swipe-to-deliver
│   │   └── profile.tsx               ← Delivery partner profile/logout
│   ├── (packing)/
│   │   ├── _layout.tsx               ← Tab layout: Queue | Profile
│   │   ├── index.tsx                 ← Order queue (ACCEPTED/PACKING)
│   │   ├── order/[id].tsx            ← Pack order (item checklist + mark ready)
│   │   └── profile.tsx               ← Packing staff profile/logout
│   ├── (admin)/
│   │   ├── _layout.tsx               ← Tab layout: Dashboard | Orders | Reports | Settings
│   │   ├── index.tsx                 ← Command centre (stats, alerts)
│   │   ├── orders.tsx                ← Order management list
│   │   ├── reports.tsx               ← Sales/profit/fast-moving (tables)
│   │   └── settings.tsx              ← Feature flag toggles
│   └── alert/
│       └── [eventId].tsx             ← Full-screen incoming order alert (delivery)
│       └── reject/[orderId].tsx      ← Full-screen reject alert (admin)
├── src/
│   ├── config/
│   │   └── api.ts                    ← API base URL config
│   ├── services/
│   │   ├── api.ts                    ← Axios + JWT interceptor (existing)
│   │   ├── fcm.ts                    ← Firebase Cloud Messaging setup (NEW)
│   │   ├── notifee.ts                ← Notifee full-screen channel setup (NEW)
│   │   ├── alarm.ts                  ← Audio alarm service (existing)
│   │   └── location.ts              ← Location tracking (existing)
│   ├── stores/
│   │   ├── auth.ts                   ← Multi-role auth store (MODIFIED)
│   │   ├── delivery.ts              ← Delivery state (existing)
│   │   ├── packing.ts               ← Packing queue state (NEW)
│   │   └── admin.ts                  ← Admin dashboard state (NEW)
│   └── components/
│       ├── SlideToConfirm.tsx         ← Reanimated swipe gesture (NEW)
│       ├── OrderCard.tsx              ← Shared order card component
│       ├── OfflineBanner.tsx          ← Network status (existing)
│       └── EmergencyAlert.tsx         ← Shared full-screen alert UI (NEW)
```

---

## 3. Authentication Flow

### 3.1 Multi-Role Auth Store

**File:** `src/stores/auth.ts`

```typescript
// Remove the DELIVERY_PARTNER-only gate
// Accept ALL staff roles: ADMIN, OWNER, MANAGER, STAFF, PACKING_STAFF, DELIVERY_PARTNER

const STAFF_ROLES = ["ADMIN", "OWNER", "MANAGER", "STAFF", "PACKING_STAFF", "DELIVERY_PARTNER"];

verifyOtp: async (phone, otp) => {
  const { data } = await api.post("/auth/login", { phone, otp, deviceId, platform });
  if (!STAFF_ROLES.includes(data.user.role)) {
    throw new Error("This app is for staff only");
  }
  // Register device token with correct role
  await registerDeviceToken(data.user.role);
  set({ user: data.user, status: "authenticated" });
}
```

### 3.2 Role-Based Routing

**In `app/_layout.tsx`:**

```typescript
function getRoleGroup(role: string): string {
  switch (role) {
    case "DELIVERY_PARTNER": return "(delivery)";
    case "PACKING_STAFF": return "(packing)";
    case "ADMIN":
    case "OWNER":
    case "MANAGER":
    case "STAFF":
    default: return "(admin)";
  }
}

// After auth: router.replace(`/${getRoleGroup(user.role)}`);
```

### 3.3 Device Token Registration

On login, call:
```typescript
POST /api/mobile/v1/devices
{
  token: "<FCM token>",
  platform: "android",
  installationId: "staff-android-<uuid>",
  role: "staff" | "admin"   // maps from user.role
}
```

**Role mapping:**
- DELIVERY_PARTNER → `"staff"`
- PACKING_STAFF → `"staff"`
- ADMIN, OWNER, MANAGER, STAFF → `"admin"`

This ensures the reject route's FCM targets `role="admin"` devices correctly.

---

## 4. Push Notifications — Firebase + Notifee

### 4.1 FCM Service (`src/services/fcm.ts`)

```typescript
import messaging from "@react-native-firebase/messaging";

async function requestPermission(): Promise<string | null> {
  const authStatus = await messaging().requestPermission();
  if (authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL) {
    return messaging().getToken();
  }
  return null;
}

// Background message handler (registered in index.js)
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  // Route to appropriate notifee display based on message.data.type
});
```

### 4.2 Notifee Full-Screen Alert (`src/services/notifee.ts`)

```typescript
import notifee, { AndroidImportance, AndroidCategory } from "@notifee/react-native";

// Channel for delivery alerts (incoming order)
await notifee.createChannel({
  id: "delivery_alert",
  name: "Delivery Alerts",
  importance: AndroidImportance.HIGH,
  sound: "delivery_alarm",
  vibration: true,
  bypassDnd: true,
});

// Channel for admin emergency bell (order rejected)
await notifee.createChannel({
  id: "admin_emergency",
  name: "Emergency Alerts",
  importance: AndroidImportance.HIGH,
  sound: "emergency_bell",
  vibration: true,
  bypassDnd: true,
});

// Display full-screen alert for incoming delivery order
async function showDeliveryAlert(data: AssignmentEvent) {
  await notifee.displayNotification({
    title: `New Order #${data.orderNumber}`,
    body: "Tap to accept or reject",
    android: {
      channelId: "delivery_alert",
      category: AndroidCategory.CALL,
      fullScreenAction: { id: "accept_order", launchActivity: "default" },
      importance: AndroidImportance.HIGH,
      sound: "delivery_alarm",
      ongoing: true,
      autoCancel: false,
    },
    data: { type: "delivery_assignment", ...data },
  });
}

// Display full-screen alert for admin (order rejected)
async function showAdminRejectAlert(data: RejectEvent) {
  await notifee.displayNotification({
    title: "Order Rejected — Needs Reassignment",
    body: `Order #${data.orderNumber} was rejected by delivery partner`,
    android: {
      channelId: "admin_emergency",
      category: AndroidCategory.ALARM,
      fullScreenAction: { id: "view_rejected", launchActivity: "default" },
      importance: AndroidImportance.HIGH,
      sound: "emergency_bell",
      ongoing: false,
    },
    data: { type: "order_rejected", ...data },
  });
}
```

### 4.3 Ring Alert Rules Integration

On app startup (for delivery partners), fetch the `ring_alert_rules` config:
```
GET /api/feature-flags → find ring_alert_rules
```

Use `config.durationSeconds` to auto-dismiss the alert after timeout. Use `config.escalationAfterSeconds` to trigger escalation (re-ring or notify admin).

---

## 5. Delivery Partner Screens

### 5.1 Orders List (`(delivery)/index.tsx`)

- Shows ONLY orders assigned to this delivery partner
- Query: `GET /api/mobile/v1/delivery/dashboard` (existing endpoint)
- Card per order: order number, customer name, address, total, status badge
- Status-based actions: "Navigate", "Collect", "Complete"
- Real-time polling for new assignments (existing 30s poll)

### 5.2 Full-Screen Incoming Order Alert (`app/alert/[eventId].tsx`)

- Triggered by notifee full-screen action or deep link
- Shows: order number, customer address, item count, total
- Reanimated entering animation: `SlideInUp.springify()`
- Two buttons: **Accept** (green) / **Reject** (red)
- If `forced_accept_delivery` is enabled for this user: skip this screen entirely, auto-acknowledge
- Timer countdown from `ring_alert_rules.durationSeconds`
- On Accept: `POST /api/mobile/v1/assignments` (acknowledge)
- On Reject: `POST /api/orders/:id/reject` (Spec 1 endpoint → admin alert fires)

### 5.3 Navigation Screen (`(delivery)/order/[id]/navigate.tsx`)

- In-app: MapLibre static map showing customer pin + rider pin + store pin
- Primary CTA: "Open in Google Maps" → fires intent:
  ```
  Linking.openURL(`google.navigation:q=${lat},${lng}&mode=d`)
  ```
  Fallback for no Google Maps: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`

### 5.4 Cash Collection (`(delivery)/order/[id]/collect.tsx`)

- Shows amount due prominently at top
- Cash and UPI input fields
- Human-language balance wording (identical logic to web Spec 2):
  - `totalCollected > due` → "Give ₹X change to customer"
  - `due > totalCollected` → "Collect ₹X more from customer"
  - Equal → "Amount matches — no change needed"
- Submits to existing `/api/delivery/collect` endpoint

### 5.5 Complete Delivery (`(delivery)/order/[id]/complete.tsx`)

- OTP input (6-digit numeric)
- **SlideToConfirm** gesture (Reanimated + GestureHandler):
  - `PanGestureHandler` on thumb
  - `useSharedValue` for translateX
  - `withSpring` snap-back on release below threshold
  - `runOnJS(onConfirm)` when threshold reached
  - Haptic feedback via `react-native-haptic-feedback` or `Vibration`
- On complete: `POST /api/delivery/complete`

---

## 6. Packing Staff Screens

### 6.1 Order Queue (`(packing)/index.tsx`)

- Fetches orders with status `ACCEPTED` or `PACKING`
- API: `GET /api/admin/orders` with status filter (reuses existing admin endpoint with JWT auth)
- Or new lightweight endpoint: `GET /api/mobile/v1/packing/queue`
- Cards show: order number, customer name, item count, time since received
- Sorted by creation time (oldest first = highest priority)
- Pull-to-refresh, auto-poll every 15 seconds

### 6.2 Pack Order (`(packing)/order/[id].tsx`)

- Header: order number, customer name, total
- Item checklist: each item shows name, quantity, price
- Actions per item:
  - Tap to mark as packed (checkbox)
  - Long press → substitute options (triggers `POST /api/admin/orders/:id/edit`)
- Bottom button: "Mark as Ready for Delivery"
  - Calls `PATCH /api/admin/orders/:id` with `{ status: "READY_FOR_DELIVERY" }`
- Print button: calls `POST /api/orders/:id/print`, opens browser intent to invoice page

### 6.3 Profile (`(packing)/profile.tsx`)

- Name, phone, role badge
- Logout button

---

## 7. Admin Screens

### 7.1 Dashboard (`(admin)/index.tsx`)

- Simple metrics cards (no charts): today's orders, revenue, pending, delivered
- API: `GET /api/mobile/v1/delivery/dashboard` or direct calls to report endpoints
- Alert banner for unprinted orders (if `print_required_alert` enabled)
- Tappable: "X orders need attention" → navigates to orders screen

### 7.2 Orders (`(admin)/orders.tsx`)

- Full order list with tabs: New / Packing / Ready / Delivering / Delivered
- Search by order number
- Order card actions: Acknowledge, Assign Driver, Print
- Pull-to-refresh

### 7.3 Reports (`(admin)/reports.tsx`)

- Three sections (simple tables, no charts):
  - **Sales**: period picker (week/month/quarter) → `GET /api/reports/sales`
  - **Fast-Moving Items**: top 20 list → `GET /api/reports/fast-moving-items`
  - **Profit**: period picker → `GET /api/reports/profit`
- All values formatted to 2dp
- Warnings shown for products with missing costPrice

### 7.4 Settings (`(admin)/settings.tsx`)

- Feature flag toggles (same logic as web Spec 2 settings page):
  - stock_value_visible (toggle)
  - forced_accept_delivery (toggle + per-staff override list)
  - ring_alert_rules (config editor)
  - print_required_alert (threshold editor)
- API: `GET /api/feature-flags` + `PUT /api/feature-flags`

### 7.5 Admin Emergency Alert (`app/alert/reject/[orderId].tsx`)

- Full-screen alert when order is rejected (FCM `type: "order_rejected"`)
- Different styling from delivery alert: red background, "🔔 Order Rejected"
- Shows: order number, rejection reason, partner name
- Action buttons: "Reassign" (navigates to orders) / "Dismiss"
- Uses `emergency_bell.wav` audio file

---

## 8. Swipe-to-Deliver Component

**File:** `src/components/SlideToConfirm.tsx`

```typescript
// PanGesture + Reanimated
const translateX = useSharedValue(0);
const gesture = Gesture.Pan()
  .onUpdate((e) => { translateX.value = clamp(e.translationX, 0, maxX); })
  .onEnd(() => {
    if (translateX.value > maxX * 0.85) {
      translateX.value = withSpring(maxX);
      runOnJS(onConfirm)();
    } else {
      translateX.value = withSpring(0);
      runOnJS(hapticFeedback)();
    }
  });
```

---

## 9. Samsung Knox / Older Android Compatibility

| Item | Setting |
|------|---------|
| `minSdkVersion` | 24 (Android 7.0, Knox 2.7+) |
| `targetSdkVersion` | 34 (Android 14 — required for Play Store) |
| `SCHEDULE_EXACT_ALARM` | Already declared (Android 12+) |
| `USE_EXACT_ALARM` | Already declared (Samsung OneUI) |
| `FOREGROUND_SERVICE_LOCATION` | Already declared |
| Battery optimization | Document: user must whitelist app in battery settings for reliable background notifications |
| `notifee` full-screen | Requires `SYSTEM_ALERT_WINDOW` or `USE_FULL_SCREEN_INTENT` — add to permissions |

Add to `app.json` android.permissions:
```json
"USE_FULL_SCREEN_INTENT"
```

---

## 10. EAS Build Configuration

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "env": { "EXPO_PUBLIC_API_URL": "https://revathysupermarket.vercel.app/api/mobile/v1" }
    },
    "production": {
      "autoIncrement": true,
      "android": { "buildType": "app-bundle" }
    }
  }
}
```

Run `eas build --platform android --profile preview` to generate testable APK without Android Studio.

---

## 11. Backend Additions Required (Additive Only)

| Route | Purpose |
|-------|---------|
| `GET /api/mobile/v1/packing/queue` | Orders in ACCEPTED/PACKING status for packing staff |
| `PATCH /api/mobile/v1/packing/orders/:id/ready` | Mark order as READY_FOR_DELIVERY |
| `GET /api/mobile/v1/admin/stats` | Dashboard stats for admin (today orders/revenue/pending) |

These are lightweight wrappers around existing Prisma queries, using `authenticateMobileRequest()` for auth and role-checking.

---

## 12. Package Additions

```json
{
  "@react-native-firebase/app": "^21.x",
  "@react-native-firebase/messaging": "^21.x",
  "@notifee/react-native": "^9.x",
  "react-native-haptic-feedback": "^2.x",
  "@maplibre/maplibre-react-native": "^10.x"
}
```

**Removals:**
- `expo-notifications` (replaced by Firebase + Notifee)

---

## 13. Task Breakdown (Implementation Order)

| # | Task | Scope |
|---|------|-------|
| 1 | Rename app: mobile-delivery → mobile-staff, update package.json/app.json | Config |
| 2 | Multi-role auth store + remove DELIVERY_PARTNER gate | Auth |
| 3 | Role-based root layout routing | Navigation |
| 4 | Add Firebase + Notifee dependencies, create FCM/notifee services | Push |
| 5 | Update device token registration to include role | API |
| 6 | Full-screen delivery alert screen + forced_accept logic | Delivery |
| 7 | Delivery order list (partner's assigned orders only) | Delivery |
| 8 | Cash collection screen with human-language wording | Delivery |
| 9 | Swipe-to-deliver component (Reanimated + GestureHandler) | Delivery |
| 10 | Navigation screen (MapLibre static + Google Maps intent) | Delivery |
| 11 | Packing: order queue screen | Packing |
| 12 | Packing: pack order detail + mark ready | Packing |
| 13 | Admin: dashboard + emergency bell alert | Admin |
| 14 | Admin: orders management screen | Admin |
| 15 | Admin: reports screen (tables, no charts) | Admin |
| 16 | Admin: settings screen (feature flags) | Admin |
| 17 | Backend: add packing/admin mobile API routes | Backend |
| 18 | EAS config + Samsung Knox fixes + permissions | Build |

Each task is testable independently on a real Android device.

---

## 14. Non-Breaking Contract Verification

| Existing Feature | Impact |
|------------------|--------|
| `/api/mobile/v1/auth/login` | No change — already accepts all roles |
| `/api/mobile/v1/devices` | Extended to pass `role` (backward compatible) |
| `/api/mobile/v1/delivery/*` | No change — delivery partner screens use as-is |
| `/api/mobile/v1/assignments` | No change |
| Web admin dashboard | No change — stays for desktop browser use |
| Existing mobile-customer app | No change — separate app |
