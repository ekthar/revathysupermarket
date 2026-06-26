# Google Sign-In Setup Guide

This app uses **NextAuth.js** with the **Google OAuth provider** for customer sign-in. No Firebase Auth is required for the login flow.

---

## Required Environment Variables

Add these to your `.env.local` (local dev) or Vercel dashboard (production):

```env
# NextAuth core
AUTH_SECRET="generate-with: openssl rand -base64 32"
NEXTAUTH_SECRET="same-value-as-AUTH_SECRET"
NEXTAUTH_URL="http://localhost:3000"
AUTH_URL="http://localhost:3000"

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

---

## Step-by-Step: Google Cloud Console Setup

### 1. Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your project (or create one)
3. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
4. Application type: **Web application**
5. Name: `MSM Supermarket Web`

### 2. Configure Authorized Origins

Add these to **Authorized JavaScript origins**:

```
http://localhost:3000          (local development)
https://your-domain.vercel.app (production)
https://yourdomain.com         (custom domain, if any)
```

### 3. Configure Authorized Redirect URIs

Add these to **Authorized redirect URIs**:

```
http://localhost:3000/api/auth/callback/google
https://your-domain.vercel.app/api/auth/callback/google
https://yourdomain.com/api/auth/callback/google
```

> **Important:** The redirect URI format is always `{YOUR_URL}/api/auth/callback/google` — this is the NextAuth callback route.

### 4. Copy Credentials

After creating, copy:
- **Client ID** → `GOOGLE_CLIENT_ID`
- **Client secret** → `GOOGLE_CLIENT_SECRET`

---

## Vercel Deployment

On your Vercel dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add all variables from the section above
3. For `AUTH_URL` / `NEXTAUTH_URL`, use your production URL (e.g., `https://revathysupermarket.vercel.app`)
4. Redeploy after adding env vars

---

## How It Works

```
User clicks "Continue with Google"
        ↓
signIn("google", { callbackUrl: "/" })
        ↓
NextAuth redirects to Google consent screen
        ↓
User authorizes → Google redirects back to /api/auth/callback/google
        ↓
NextAuth creates/finds user in database (via PrismaAdapter)
        ↓
JWT session created → user is authenticated
```

### Auth Providers Active

| Provider | ID | Used For |
|----------|----|---------| 
| Google OAuth | `google` | Customer sign-in (primary) |
| Phone OTP | `phone-otp` | Customer sign-in via WhatsApp OTP |
| Staff Credentials | `staff-credentials` | Admin/staff email+password login |

---

## Troubleshooting

### "OAuthCallbackError" or redirect mismatch
- Verify your redirect URI in Google Console matches exactly: `{NEXTAUTH_URL}/api/auth/callback/google`
- Check there's no trailing slash mismatch

### "client_id is required" error
- `GOOGLE_CLIENT_ID` env var is not set or empty
- On Vercel, make sure it's added for the correct environment (Production/Preview/Development)

### User created but role is wrong
- New Google sign-in users get default role from PrismaAdapter (based on your schema)
- The JWT callback in `auth.ts` enriches the session with `role`, `permissions`, etc.

### COOP warnings in console
- `Cross-Origin-Opener-Policy policy would block the window.closed call` — these are harmless browser warnings during the OAuth popup/redirect flow. They don't affect functionality.

---

## Firebase (Disabled)

Firebase Auth was previously used as a proxy for Google Sign-In (popup → Firebase ID token → NextAuth credentials). This has been **disabled** because:

1. It requires `FIREBASE_SERVICE_ACCOUNT_KEY` on the server to verify tokens
2. The extra hop (Firebase popup → token verification → session) adds complexity
3. Direct NextAuth Google OAuth is simpler and more reliable

Firebase is still used for:
- **Push notifications** (FCM) — requires `FIREBASE_SERVICE_ACCOUNT_KEY` for sending
- **Firebase Messaging** on client — requires `NEXT_PUBLIC_FIREBASE_*` vars

To re-enable Firebase Auth in the future, see the `firebase-token` provider that was in `auth.ts` (removed in this PR).

---

## Mobile App (Expo)

The mobile app (`apps/mobile-customer`) uses a separate auth flow:
- `expo-auth-session` for Google Sign-In → gets ID token
- Sends token to `/api/mobile/v1/auth/google` backend endpoint
- Backend validates token and issues JWT access/refresh tokens

The mobile auth is **independent** of the NextAuth web flow and has its own client IDs configured in `apps/mobile-customer/src/services/google-auth.ts`.
