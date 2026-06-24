# Firebase Setup Guide

This guide walks through setting up Firebase Cloud Messaging (FCM) for the MSM Supermarket mobile app.

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project**.
3. Enter a project name (e.g., "MSM Supermarket").
4. Optionally enable Google Analytics.
5. Click **Create project**.

## 2. Add Android App

1. In the Firebase Console, click the **Android** icon to add an Android app.
2. Enter the package name: `com.msmsupermarket.msm_mobile`
3. (Optional) Enter a nickname: "MSM Mobile Android"
4. (Optional) Add the SHA-1 debug signing certificate:
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
5. Click **Register app**.
6. Download the `google-services.json` file.
7. Place it at: `mobile/android/app/google-services.json`

> **IMPORTANT:** Never commit `google-services.json` to version control. It is listed in `.gitignore`. Use the placeholder file at `mobile/android/app/google-services.json.example` as a reference for the expected structure.

## 3. Add iOS App

1. In the Firebase Console, click the **iOS** icon to add an iOS app.
2. Enter the bundle ID: `com.msmsupermarket.msmMobile`
3. (Optional) Enter a nickname: "MSM Mobile iOS"
4. Click **Register app**.
5. Download the `GoogleService-Info.plist` file.
6. Place it at: `mobile/ios/Runner/GoogleService-Info.plist`

> **IMPORTANT:** Never commit `GoogleService-Info.plist` to version control. It is listed in `.gitignore`. Use the placeholder file at `mobile/ios/Runner/GoogleService-Info.plist.example` as a reference.

## 4. Enable Cloud Messaging

1. In the Firebase Console, go to **Project settings** > **Cloud Messaging**.
2. Ensure the Cloud Messaging API (V1) is enabled.
3. For iOS, you must upload an APNs authentication key:
   - Go to [Apple Developer](https://developer.apple.com/account/resources/authkeys/list).
   - Create a new key with **Apple Push Notifications service (APNs)** enabled.
   - Download the `.p8` file.
   - In Firebase Console > Cloud Messaging > Apple app configuration, upload the APNs key.
   - Enter your Key ID and Team ID.

## 5. Server-Side Setup (Firebase Admin SDK)

The backend uses the Firebase Admin SDK to send push notifications to mobile devices.

### Environment Variables

Add the following to your `.env` file (see `.env.example` for placeholders):

```
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
```

### Generating a Service Account Key

1. In the Firebase Console, go to **Project settings** > **Service accounts**.
2. Click **Generate new private key**.
3. Download the JSON file.
4. Copy the entire JSON content into the `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable (as a single-line JSON string).

> **NEVER** commit the service account key file or its contents to version control. Store it only in environment variables or a secrets manager (e.g., Vercel Environment Variables, AWS Secrets Manager, Google Secret Manager).

### Usage in Code

The backend initializes the Firebase Admin SDK using these environment variables to send FCM messages to device tokens stored in the `DeviceToken` model. See `lib/mobile-push.ts` for the implementation.

## 6. Security Best Practices

- **Never commit** `google-services.json`, `GoogleService-Info.plist`, or service account keys.
- Use environment variables for all server-side credentials.
- Restrict API keys in the Google Cloud Console to specific apps/IPs.
- Rotate service account keys periodically.
- Use Firebase App Check to protect your backend from abuse.
- The `.gitignore` file blocks Firebase credential files from being committed.

## 7. Testing Without Firebase

For local development and CI, the app works without real Firebase credentials:

- The mobile app uses placeholder example files for reference.
- Push notifications will not be delivered in development.
- All other features (auth, orders, delivery) work without Firebase.
- Flutter tests mock the FCM layer and do not require real credentials.
