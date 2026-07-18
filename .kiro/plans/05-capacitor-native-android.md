# Plan 5: Capacitor Native Android — True Native Feel

Transform the web app into a native Android experience with iOS design language and Apple-grade smoothness via Capacitor.

---

## Current State

| Component | Status | Notes |
|---|---|---|
| Capacitor project | Exists | BUT configured for delivery app only (com.revathysupermarket.delivery) |
| Customer config | Missing | Current config is delivery-only |
| Native React Native app | Exists separately | apps/mobile-customer/ (Expo — different codebase) |
| Android project | Scaffolded | MainActivity, AndroidManifest, gradle |
| Status bar handling | None | Default Capacitor (no edge-to-edge) |
| Navigation bar | None | System nav bar not customized |
| Haptics | Web vibrate only | No native Taptic Engine quality |
| Deep linking | Not configured | No intent filters |
| Biometric auth | Missing | No fingerprint/face login |

---

## Architecture Decision: Dual Capacitor Config

```
apps/web/
├── capacitor.config.ts            → Customer app (NEW - primary)
├── capacitor.delivery.config.ts   → Delivery app (rename existing)
├── android/                       → Customer Android project
├── android-delivery/              → Delivery Android project (move existing)
```

---

## Phase 1: Project Setup

### New Capacitor Config (Customer App)

```typescript
const config: CapacitorConfig = {
  appId: "in.revathysupermarket.customer",
  appName: "Revathy Supermarket",
  webDir: "out",
  server: {
    url: "https://revathysupermarket.vercel.app",
    cleartext: false,
    allowNavigation: ["revathysupermarket.vercel.app"],
  },
  android: {
    backgroundColor: "#FFFFFF",
    allowMixedContent: false,
    captureInput: true,
    windowSoftInputMode: "adjustResize",
    hardwareBackButton: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      launchAutoHide: true,
      backgroundColor: "#FFFFFF",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#FFFFFF",
      overlaysWebView: true,
    },
    Keyboard: { resize: "body", style: "LIGHT" },
    Haptics: {},
  },
};
```

### Required Plugins

```bash
npm install @capacitor/splash-screen
npm install @capacitor/status-bar
npm install @capacitor/keyboard
npm install @capacitor/haptics
npm install @capacitor/app
npm install @capacitor/push-notifications
npm install @capacitor/share
npm install @capacitor/browser
npm install @capacitor/network
npm install @capacitor/preferences
npm install @capacitor/device
npm install @capacitor/geolocation
npm install @capacitor-community/safe-area
```

---

## Phase 2: Edge-to-Edge (Most Important Visual Change)

### styles.xml

```xml
<style name="AppTheme" parent="Theme.Material3.DayNight.NoActionBar">
    <item name="android:windowDrawsSystemBarBackgrounds">true</item>
    <item name="android:statusBarColor">@android:color/transparent</item>
    <item name="android:navigationBarColor">@android:color/transparent</item>
    <item name="android:windowLightStatusBar">true</item>
    <item name="android:windowLightNavigationBar">true</item>
    <item name="android:enforceNavigationBarContrast">false</item>
    <item name="android:enforceStatusBarContrast">false</item>
</style>
```

### MainActivity.java

```java
@Override
protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    Window window = getWindow();
    WindowCompat.setDecorFitsSystemWindows(window, false);
    window.setStatusBarColor(android.graphics.Color.TRANSPARENT);
    window.setNavigationBarColor(android.graphics.Color.TRANSPARENT);
    WindowInsetsControllerCompat controller =
        WindowCompat.getInsetsController(window, window.getDecorView());
    controller.setAppearanceLightStatusBars(true);
    controller.setAppearanceLightNavigationBars(true);
}
```

---

## Phase 3: Native Bridge (lib/native-bridge.ts)

```typescript
import { Capacitor } from "@capacitor/core";

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform();

// Status bar control
export async function syncStatusBarToRoute(pathname, isDark) { ... }
export async function setStatusBarLight() { ... }
export async function setStatusBarDark() { ... }

// Native haptics (replaces web vibrate)
export async function hapticImpact(style: "light"|"medium"|"heavy") { ... }
export async function hapticNotification(type: "success"|"warning"|"error") { ... }
export async function hapticSelection() { ... }

// Keyboard control
export async function setKeyboardStyle(isDark: boolean) { ... }

// Back button handler
export function registerBackButton(handler: () => void) { ... }

// App lifecycle
export function onAppStateChange(cb: (isActive: boolean) => void) { ... }
```

---

## Phase 4: Native Haptics (Replace Web Vibrate)

### Enhanced lib/haptics.ts

```typescript
// Auto-detects native vs web and uses appropriate API
export async function haptic(type) {
  if (isNative) {
    await Haptics.impact({ style: map[type] });
  } else {
    navigator.vibrate?.(durations[type]);
  }
}
```

### Haptic Touchpoints
| Interaction | Type | File |
|---|---|---|
| Add to cart | impact.medium | product-card.tsx |
| Quantity +/- | selectionChanged | QuantityStepper |
| Tab switch | selectionChanged | mobile-bottom-nav.tsx |
| Place order | notification.success | checkout-form.tsx |
| Error | notification.error | Form validation |
| Pull-to-refresh threshold | impact.light | pull-to-refresh |
| Swipe-to-delete threshold | impact.medium | cart swipe |
| Scroll snap | selectionChanged | carousel |

---

## Phase 5: Splash Screen (Zero Flash)

### Strategy
1. Native splash shows immediately (Android 12+ Splash Screen API)
2. Keep splash visible until WebView fires first meaningful paint
3. Fade out splash with 300ms animation

```typescript
// Hide splash AFTER hero content renders
useEffect(() => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      SplashScreen.hide({ fadeOutDuration: 300 });
    });
  });
}, []);
```

---

## Phase 6: Deep Linking

### AndroidManifest.xml
```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" android:host="revathysupermarket.vercel.app" />
</intent-filter>
<intent-filter>
    <data android:scheme="revathy" />
</intent-filter>
```

### Asset Links
```json
// public/.well-known/assetlinks.json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "in.revathysupermarket.customer",
    "sha256_cert_fingerprints": ["SIGNING_KEY_FINGERPRINT"]
  }
}]
```

---

## Phase 7: Performance Optimization

### Native HTTP (Skip WebView CORS)
```typescript
// Replace fetch() for API calls in native mode
import { CapacitorHttp } from "@capacitor/core";
```

### Native Storage (Faster than localStorage)
```typescript
import { Preferences } from "@capacitor/preferences";
// Use for cart, auth tokens, settings
```

### Network State Awareness
```typescript
import { Network } from "@capacitor/network";
// Show offline banner with faster detection
```

---

## Phase 8: Native Push Notifications

Replace web push with native push for:
- Richer notifications (images, action buttons)
- More reliable delivery
- Background notification handling

```typescript
import { PushNotifications } from "@capacitor/push-notifications";
// Register, get FCM token, handle taps
```

---

## Phase 9: WebView Performance

### Gradle Optimizations
- `minSdkVersion 24` (Chrome 89+ WebView guaranteed)
- `android:hardwareAccelerated="true"`
- `android:largeHeap="true"`

### CSS for Android WebView
```css
@supports not (-webkit-touch-callout: none) {
  html { overscroll-behavior: none; }
  * { -webkit-tap-highlight-color: transparent; }
}
```

---

## Phase 10: iOS Design on Android

The web app already uses iOS design patterns. Ensure Android WebView doesn't break them:
- Disable native overscroll glow (we have custom rubber-band)
- Disable tap highlight color (we have custom press states)
- Handle gesture navigation edge swipe conflicts

---

## Build & Distribution

### Signing
```bash
keytool -genkey -v -keystore release-key.jks -keyalg RSA -keysize 2048 -validity 10000
```

### Play Store Readiness
- Target SDK 35 (latest)
- 64-bit support (arm64-v8a + x86_64)
- App Bundle (AAB) format
- Digital Asset Links verification
- Play Protect appeal after upload

### CI/CD
- GitHub Actions workflow: build signed APK/AAB on tag
- Fastlane for automated Play Store deployment

---

## Priority Order

| # | Task | Impact | Effort |
|---|---|---|---|
| 1 | New capacitor.config.ts for customer app | Foundation | 1h |
| 2 | Edge-to-edge theme (styles.xml + MainActivity) | Huge visual | 2h |
| 3 | Status bar dynamic control | Native feel | 2h |
| 4 | Native haptics integration | Premium touch | 3h |
| 5 | Splash screen (zero flash) | First impression | 2h |
| 6 | Android back button handler | Navigation | 1h |
| 7 | Deep linking setup | UX | 2h |
| 8 | Native push notifications | Engagement | 3h |
| 9 | WebView performance tuning | Speed | 2h |
| 10 | Native HTTP + storage | Performance | 2h |
| 11 | Network state awareness | Reliability | 1h |
| 12 | Build signing + CI/CD | Distribution | 3h |
| 13 | Play Store listing | Distribution | 2h |

**Total: ~26 hours**
