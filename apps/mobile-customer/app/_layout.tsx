import { useEffect, useRef } from "react";
import { View, AppState, type AppStateStatus } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import { useSettingsStore } from "@/stores/settings";
import { OfflineBanner } from "@/components/OfflineBanner";
import { registerForPushNotifications, setupNotificationListeners } from "@/services/push-notifications";
import { ThemeProvider, useTheme } from "@/theme/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import "../global.css";

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

function RootLayoutInner() {
  const { initialize, status } = useAuthStore();
  const { loadCart } = useCartStore();
  const { loadStoreConfig, loadPreferences } = useSettingsStore();
  const appState = useRef(AppState.currentState);
  const { theme } = useTheme();

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize auth, cart, and settings in parallel
        await Promise.all([
          initialize(),
          loadCart(),
          loadPreferences(),
        ]);
        // Non-blocking: load store config
        loadStoreConfig().catch(() => {});
      } catch (e) {
        console.warn("App initialization error:", e);
      } finally {
        SplashScreen.hideAsync().catch(() => {});
      }
    }

    prepare();
  }, []);

  // Register push notifications after auth completes
  useEffect(() => {
    if (status === "authenticated") {
      registerForPushNotifications().catch(() => {});
      setupNotificationListeners();
    }
  }, [status]);

  // Re-validate auth when app returns from background
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === "active"
      ) {
        // Silent re-check on foreground return — token refresh happens in interceptor
        // No-op: the axios interceptor handles 401 → refresh automatically
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, []);

  const isDark = theme === 'dark';

  return (
    <View className={`flex-1 bg-white dark:bg-neutral-900`}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <OfflineBanner />
      <Stack
        screenOptions={{
          headerShown: false,
          headerTintColor: "#050505",
          headerStyle: { backgroundColor: "#FFFFFF" },
          headerTitleStyle: { fontWeight: "700", color: "#111827" },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: "#FFFFFF" },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="product/[id]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="search"
          options={{ headerShown: false, animation: "fade" }}
        />
        <Stack.Screen
          name="checkout/index"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="orders/[id]"
          options={{ headerShown: true, title: "Order Details" }}
        />
        <Stack.Screen
          name="orders/[id]/tracking"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="account/wallet" options={{ headerShown: true, title: "Wallet" }} />
        <Stack.Screen name="account/loyalty" options={{ headerShown: true, title: "Rewards" }} />
        <Stack.Screen name="account/favorites" options={{ headerShown: true, title: "Favorites" }} />
        <Stack.Screen name="account/addresses" options={{ headerShown: true, title: "Addresses" }} />
        <Stack.Screen name="account/add-address" options={{ headerShown: true, title: "Add Address" }} />
        <Stack.Screen name="account/notifications" options={{ headerShown: true, title: "Notifications" }} />
        <Stack.Screen name="account/settings" options={{ headerShown: true, title: "Settings" }} />
        <Stack.Screen name="account/support" options={{ headerShown: true, title: "Support" }} />
        <Stack.Screen name="account/new-ticket" options={{ headerShown: true, title: "New Ticket" }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Manrope: require("../assets/fonts/Manrope-VariableFont_wght.ttf"),
    InterTight: require("../assets/fonts/InterTight-VariableFont_wght.ttf"),
  });

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <ToastProvider>
        <RootLayoutInner />
      </ToastProvider>
    </ThemeProvider>
  );
}
