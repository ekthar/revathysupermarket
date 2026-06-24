# Flutter Mobile App Release Checklist

This checklist covers everything needed to ship the MSM Supermarket mobile app to production.

---

## 1. Environment Variables

Ensure all required environment variables are configured on the server:

### Existing Variables (from .env.example)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` / `AUTH_SECRET` | NextAuth.js session encryption |
| `NEXTAUTH_URL` / `AUTH_URL` | Canonical app URL |
| `NEXT_PUBLIC_SITE_URL` | Public-facing site URL |
| `NEXT_PUBLIC_STORE_NAME` | Store display name |
| `STORE_LAT` / `STORE_LNG` | Store coordinates for distance calculations |
| `CLOUDFLARE_R2_*` | Image storage configuration |
| `WHATSAPP_*` | WhatsApp Business API credentials |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `OTP_EXPIRY_SECONDS` / `OTP_MAX_ATTEMPTS` / `OTP_RATE_LIMIT_PER_10MIN` | OTP configuration |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Rate limiting |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps for delivery tracking |
| `WHATSAPP_APP_SECRET` | Webhook signature verification |

### New Variables (Mobile App)

| Variable | Purpose |
|----------|---------|
| `FIREBASE_PROJECT_ID` | Firebase project identifier for Admin SDK |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Service account JSON for sending FCM push notifications |
| `MOBILE_JWT_SECRET` | Secret key for signing mobile app JWT tokens |
| `MOBILE_JWT_EXPIRY` | Access token expiry (e.g., "15m") |
| `MOBILE_REFRESH_TOKEN_EXPIRY_DAYS` | Refresh token validity in days (e.g., 30) |

---

## 2. Database Migration Order

**Critical:** Run database migrations before deploying the new application code.

```bash
# 1. Back up the database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# 2. Run pending migrations
npx prisma migrate deploy

# 3. Verify migration succeeded
npx prisma migrate status

# 4. Deploy new application code
# (your deployment process here)
```

The mobile app migration adds these models:
- `MobileRefreshToken` - stores refresh tokens for mobile sessions
- `DeviceToken` - stores FCM device tokens for push notifications
- `AssignmentEvent` - tracks delivery assignment lifecycle events

---

## 3. Firebase / APNs Setup

Refer to [docs/firebase-setup.md](./firebase-setup.md) for detailed instructions.

### Quick Checklist

- [ ] Firebase project created
- [ ] Android app registered with package `com.msmsupermarket.msm_mobile`
- [ ] iOS app registered with bundle ID `com.msmsupermarket.msmMobile`
- [ ] `google-services.json` placed in `mobile/android/app/`
- [ ] `GoogleService-Info.plist` placed in `mobile/ios/Runner/`
- [ ] Cloud Messaging API (V1) enabled
- [ ] APNs authentication key uploaded to Firebase (for iOS)
- [ ] `FIREBASE_PROJECT_ID` set in production environment
- [ ] `FIREBASE_SERVICE_ACCOUNT_KEY` set in production environment

---

## 4. App Signing

### Android

1. **Generate a release keystore:**
   ```bash
   keytool -genkey -v -keystore msm-release.jks \
     -keyalg RSA -keysize 2048 -validity 10000 \
     -alias msm-release
   ```

2. **Configure signing in `mobile/android/app/build.gradle`:**
   - Add a `signingConfigs` block with the keystore path and credentials.
   - Reference it in the `release` build type.

3. **Upload to Play Console:**
   - Go to Play Console > App integrity > App signing.
   - Upload your upload key or use Google-managed signing.

4. **Store securely:** Never commit `.jks` or `.keystore` files. They are in `.gitignore`.

### iOS

1. **Apple Developer Account:** Ensure you have an active Apple Developer membership.
2. **Create an App ID** matching the bundle ID `com.msmsupermarket.msmMobile`.
3. **Generate provisioning profiles:**
   - Development profile for testing.
   - Distribution profile (App Store) for release.
4. **Xcode configuration:**
   - Open `mobile/ios/Runner.xcworkspace` in Xcode.
   - Set the team and signing certificate under Signing & Capabilities.
5. **Automatic signing** is recommended for development. Use manual signing for CI/CD.

---

## 5. Permissions and Privacy Disclosures

### Android Permissions

All permissions must be justified in the Play Store listing:

| Permission | Justification |
|-----------|---------------|
| `INTERNET` | Required for API communication, loading product images, and real-time order updates |
| `ACCESS_FINE_LOCATION` | Used by delivery partners to share precise GPS location with customers during active deliveries |
| `ACCESS_COARSE_LOCATION` | Fallback location for delivery zone detection when precise GPS is unavailable |
| `POST_NOTIFICATIONS` | Displays push notifications for order status updates, delivery alerts, and promotional offers |
| `USE_FULL_SCREEN_INTENT` | Shows full-screen delivery assignment alerts that require immediate attention from delivery partners |
| `SCHEDULE_EXACT_ALARM` | Triggers time-sensitive delivery reminders and pickup window alerts |
| `VIBRATE` | Haptic feedback for incoming delivery assignments and urgent notifications |
| `WAKE_LOCK` | Keeps device awake during active delivery navigation to prevent GPS loss |
| `RECEIVE_BOOT_COMPLETED` | Re-registers FCM token and reschedules pending alarms after device restart |

### iOS Privacy Descriptions (Info.plist)

| Key | Description String |
|-----|-------------------|
| `NSLocationWhenInUseUsageDescription` | "MSM Supermarket uses your location to show delivery progress and calculate distance to the store." |
| `NSLocationAlwaysAndWhenInUseUsageDescription` | "MSM Supermarket uses your background location to provide real-time delivery tracking to customers while you are on an active delivery." |
| `NSUserTrackingUsageDescription` | (Not used - app does not track users across other apps) |

### Data Safety (Play Store)

Declare in the Data Safety form:
- **Location:** Collected for delivery tracking (shared with customers during active deliveries only).
- **Personal info:** Name, phone number, email (for account management).
- **Financial info:** Not collected (payments handled by external gateway).

---

## 6. Staged Rollout

Follow this phased release strategy:

### Phase 1: Internal Testing
- Deploy to internal testing track (Play Console) / TestFlight (iOS).
- Test all critical flows: login, browse, cart, checkout, delivery assignment, tracking.
- Verify push notifications arrive on real devices.
- Duration: 3-5 days.

### Phase 2: Limited Release (5%)
- Promote to production at 5% rollout.
- Monitor crash rate (target: < 0.5%).
- Monitor ANR rate (target: < 0.1%).
- Check push notification delivery rate.
- Duration: 2-3 days.

### Phase 3: Expanded Release (25%)
- Increase to 25% if Phase 2 metrics are healthy.
- Monitor customer support tickets for mobile-specific issues.
- Duration: 2-3 days.

### Phase 4: Full Release (100%)
- Roll out to all users.
- Continue monitoring for 7 days before considering stable.

### Halt Criteria
- Crash rate exceeds 2%.
- Critical flow (checkout, delivery) broken.
- Data loss or security vulnerability discovered.
- Halt the rollout and investigate before continuing.

---

## 7. Monitoring

### Firebase Crashlytics
- Enabled by default in the Flutter app.
- Monitor crash-free rate in Firebase Console.
- Set up alerts for new crash clusters.
- Target: 99.5%+ crash-free sessions.

### Analytics
- Track key events: `login`, `add_to_cart`, `checkout_complete`, `delivery_accepted`, `delivery_completed`.
- Monitor funnel drop-off rates.
- Compare mobile vs web conversion rates.

### Push Notification Delivery
- Monitor FCM delivery reports in Firebase Console.
- Track `DeviceToken` freshness (tokens older than 30 days may be stale).
- Alert if delivery success rate drops below 90%.
- Clean up invalid tokens on 404/410 responses (already implemented in backend).

### API Health
- Monitor `/api/mobile/v1/*` endpoint response times.
- Alert on 5xx error rate > 1%.
- Track token refresh success rate.
- Monitor rate limit hits (potential abuse indicator).

---

## 8. Rollback Plan

The mobile app and backend are independently versioned, allowing independent rollback.

### Backend Rollback
- Revert to previous deployment (Vercel instant rollback or redeploy previous commit).
- Mobile API v1 endpoints are versioned; old app versions continue working.
- Database migrations are forward-only; if a migration must be reverted, write a new migration.

### Mobile App Rollback
- **Android:** Use Play Console staged rollout halt + previous version promotion.
- **iOS:** App Store does not support true rollback. Submit a new build with the previous code.
- The versioned API (`/api/mobile/v1/`) ensures old app versions remain functional.

### Compatibility Matrix
- Always maintain backward compatibility in API v1.
- If breaking changes are needed, create API v2 and support both versions during migration.
- Use feature flags to disable new features server-side without requiring an app update.

### Emergency Procedures
1. **Critical bug in mobile app:** Halt rollout + force-update prompt via remote config.
2. **Backend API failure:** Rollback deployment; mobile app retries automatically.
3. **Push notification storm:** Disable FCM sending in environment variables (`FIREBASE_SERVICE_ACCOUNT_KEY=""`) without redeployment.
