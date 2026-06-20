# Mobile App Build Guide (APK & IPA)

This project uses **Capacitor** to wrap the deployed Vercel web app inside native Android/iOS shells.

## Architecture

The app works as a **WebView wrapper** around the live Vercel URL:
- The native app loads `https://revathysupermarket.vercel.app` in a full-screen WebView
- Push notifications, splash screen, and status bar are handled natively
- No local build of the Next.js app is needed — it always loads the latest deployed version

## Quick Start

### Build APK (GitHub Actions - Recommended)

1. Go to **Actions** tab in GitHub
2. Select **"Build Mobile Apps (APK & IPA)"** workflow
3. Click **"Run workflow"**
4. Choose `debug` or `release`
5. Download the APK from the workflow artifacts

### Build APK via Tag (Auto-release)

```bash
git tag v1.0.0
git push origin v1.0.0
```
This auto-builds APK + IPA and attaches them to the GitHub Release.

---

## Local Development (Optional)

### Prerequisites
- Node.js 20+
- Android Studio (for APK)
- Xcode 15+ (for IPA, macOS only)
- Java JDK 17

### Setup

```bash
# Install dependencies
npm install

# Create the web directory (Capacitor needs it)
mkdir -p out
echo "<html><body>Loading...</body></html>" > out/index.html

# Add Android platform
npx cap add android

# Sync configuration
npx cap sync android

# Open in Android Studio
npx cap open android
```

### Build APK Locally

```bash
cd android
./gradlew assembleDebug     # Debug APK
./gradlew assembleRelease   # Release APK (unsigned)
```

APK output: `android/app/build/outputs/apk/debug/app-debug.apk`

### iOS Setup (macOS only)

```bash
npx cap add ios
npx cap sync ios
cd ios/App && pod install
npx cap open ios
```

---

## Configuration

### Change App URL

Edit `capacitor.config.ts`:
```typescript
server: {
  url: "https://your-new-url.vercel.app"
}
```

### Change App ID / Name

Edit `capacitor.config.ts`:
```typescript
appId: "com.yourcompany.appname",
appName: "Your App Name",
```

### App Icons

Place your icons in:
- Android: `android/app/src/main/res/mipmap-*` (after first `cap add android`)
- iOS: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

Or use [capacitor-assets](https://github.com/nickvdyck/capacitor-assets) tool:
```bash
npx @capacitor/assets generate --iconBackgroundColor '#0F8A5F'
```

---

## Signing for Production

### Android (Google Play)

1. Generate a keystore:
```bash
keytool -genkey -v -keystore release-key.jks -alias release -keyalg RSA -keysize 2048 -validity 10000
```

2. Add to `android/app/build.gradle`:
```groovy
android {
    signingConfigs {
        release {
            storeFile file("release-key.jks")
            storePassword "your-password"
            keyAlias "release"
            keyPassword "your-password"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

### iOS (App Store)

For App Store distribution, you need:
1. Apple Developer account ($99/year)
2. Distribution certificate
3. Provisioning profile

Add these GitHub Secrets:
- `IOS_CERTIFICATE_BASE64` - P12 certificate as base64
- `IOS_CERTIFICATE_PASSWORD` - P12 password
- `APPSTORE_ISSUER_ID` - App Store Connect API issuer ID
- `APPSTORE_KEY_ID` - API key ID
- `APPSTORE_PRIVATE_KEY` - API private key

Then uncomment the `build-ios-signed` job in `.github/workflows/build-mobile.yml`.

---

## Troubleshooting

### APK shows blank white screen
- Check that `capacitor.config.ts` has the correct `server.url`
- Ensure the Vercel deployment is live and accessible

### iOS build fails with signing errors
- For unsigned builds (testing), the workflow uses `CODE_SIGNING_REQUIRED=NO`
- For App Store, proper certificates are required

### Push notifications not working
- Configure Firebase Cloud Messaging for Android
- Configure Apple Push Notification service for iOS
- The web push already works in the browser PWA

---

## File Structure

```
capacitor.config.ts          # Main Capacitor configuration
.github/workflows/
  build-mobile.yml           # GitHub Actions for APK & IPA
android/                     # Generated (not in git)
ios/                         # Generated (not in git)
out/                         # Minimal HTML for Capacitor init
```
