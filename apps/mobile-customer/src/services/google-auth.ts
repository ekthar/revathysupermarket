import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { useEffect } from "react";
import { Alert, Platform } from "react-native";
import { useAuthStore } from "@/stores/auth";

// Complete the auth session for web browser redirect
WebBrowser.maybeCompleteAuthSession();

// Google OAuth client IDs - replace with your real ones from Google Cloud Console
const GOOGLE_WEB_CLIENT_ID = "47754236417-n3n1a2395t9mcm1hfg6rsvqkehj1icgh.apps.googleusercontent.com";
const GOOGLE_ANDROID_CLIENT_ID = "47754236417-8aerlthrl09j4va69d620212u47ocpvh.apps.googleusercontent.com";
const GOOGLE_IOS_CLIENT_ID = "47754236417-2maistb30ua41m3dm5h2sf8jqit8onlh.apps.googleusercontent.com";
const GOOGLE_NATIVE_REDIRECT_URI = "in.revathysupermarket.customer:/oauthredirect";

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
  const isExpoGo =
    Platform.OS !== "web" &&
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    redirectUri:
      Platform.OS === "web" ? undefined : GOOGLE_NATIVE_REDIRECT_URI,
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      if (id_token) {
        loginWithGoogle(id_token).catch((error) => {
          console.warn("Google Sign-In failed:", error);
          Alert.alert(
            "Google Sign-In failed",
            "The app could not sign in with the server. Please try again."
          );
        });
      }
    }
  }, [response]);

  const signIn = async () => {
    if (isExpoGo) {
      Alert.alert(
        "Google Sign-In needs a development build",
        "Expo Go uses an exp:// redirect URL, which Google blocks. Build and run a development client so the app can use its native OAuth redirect."
      );
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
  };
}
