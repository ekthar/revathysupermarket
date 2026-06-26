import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth";

// Complete the auth session for web browser redirect
WebBrowser.maybeCompleteAuthSession();

/**
 * Google OAuth Client IDs
 * 
 * For Expo Go testing: Only the WEB client ID is needed (works on all platforms)
 * For production native builds: Add Android/iOS client IDs too
 * 
 * Set these in apps/mobile-customer/.env:
 *   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-id.apps.googleusercontent.com
 *   EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-id.apps.googleusercontent.com (optional for Expo Go)
 *   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-id.apps.googleusercontent.com (optional for Expo Go)
 */
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "";
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "";

/**
 * Hook for Google Sign-In using expo-auth-session.
 * Returns { signIn, isLoading, isConfigured } for use in login screens.
 *
 * Usage:
 * ```tsx
 * const { signIn, isLoading, isConfigured } = useGoogleAuth();
 * {isConfigured && <Pressable onPress={signIn}>...</Pressable>}
 * ```
 */
export function useGoogleAuth() {
  const { loginWithGoogle } = useAuthStore();

  // Only create auth request if web client ID is configured
  const isConfigured = GOOGLE_WEB_CLIENT_ID.length > 0;

  const [request, response, promptAsync] = Google.useAuthRequest(
    isConfigured
      ? {
          webClientId: GOOGLE_WEB_CLIENT_ID,
          androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
          iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
        }
      : { webClientId: "not-configured" }
  );

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      if (id_token) {
        loginWithGoogle(id_token);
      }
    }
  }, [response]);

  const signIn = async () => {
    if (!isConfigured) {
      console.warn("Google Sign-In not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env");
      return;
    }
    try {
      await promptAsync();
    } catch (e) {
      console.warn("Google Sign-In failed:", e);
    }
  };

  return {
    signIn,
    isLoading: !request,
    isConfigured,
  };
}
