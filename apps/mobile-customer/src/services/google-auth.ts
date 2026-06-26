import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth";

// Complete the auth session for web browser redirect
WebBrowser.maybeCompleteAuthSession();

// Google OAuth client IDs - replace with your real ones from Google Cloud Console
const GOOGLE_WEB_CLIENT_ID = "47754236417-n3n1a2395t9mcm1hfg6rsvqkehj1icgh.apps.googleusercontent.com";
const GOOGLE_ANDROID_CLIENT_ID = "47754236417-8aerlthrl09j4va69d620212u47ocpvh.apps.googleusercontent.com";
const GOOGLE_IOS_CLIENT_ID = "47754236417-2maistb30ua41m3dm5h2sf8jqit8onlh.apps.googleusercontent.com";

/**
 * Hook for Google Sign-In using expo-auth-session.
 * Returns { signIn, isLoading } for use in login screens.
 *
 * Usage:
 * ```tsx
 * const { signIn, isLoading } = useGoogleAuth();
 * <Pressable onPress={signIn}>...</Pressable>
 * ```
 */
export function useGoogleAuth() {
  const { loginWithGoogle } = useAuthStore();

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      if (id_token) {
        loginWithGoogle(id_token);
      }
    }
  }, [response]);

  const signIn = async () => {
    try {
      await promptAsync();
    } catch (e) {
      console.warn("Google Sign-In failed:", e);
    }
  };

  return {
    signIn,
    isLoading: !request,
  };
}
