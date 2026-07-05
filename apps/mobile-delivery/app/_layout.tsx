import { useEffect, useCallback } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { useAuthStore } from "@/stores/auth";
import { notificationService } from "@/services/notifications";
import { OfflineBanner } from "@/components/OfflineBanner";
import { ThemeProvider } from "@/theme/ThemeProvider";
import "../global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { initialize } = useAuthStore();
  const [fontsLoaded] = useFonts({
    "InterTight-Regular": require("../assets/fonts/InterTight-Regular.ttf"),
    "InterTight-Medium": require("../assets/fonts/InterTight-Medium.ttf"),
    "InterTight-SemiBold": require("../assets/fonts/InterTight-SemiBold.ttf"),
    "InterTight-Bold": require("../assets/fonts/InterTight-Bold.ttf"),
    "Manrope-Medium": require("../assets/fonts/Manrope-Medium.ttf"),
    "Manrope-SemiBold": require("../assets/fonts/Manrope-SemiBold.ttf"),
    "Manrope-Bold": require("../assets/fonts/Manrope-Bold.ttf"),
  });

  useEffect(() => {
    async function prepare() {
      try {
        await initialize();
        await notificationService.initialize();
      } catch (e) {
        console.warn("App initialization error:", e);
      } finally {
        SplashScreen.hideAsync().catch(() => {});
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <View className="flex-1" onLayout={onLayoutRootView}>
        <StatusBar style="auto" />
        <OfflineBanner />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="orders/[id]/index"
          options={{ headerShown: true, title: "Order" }}
        />
        <Stack.Screen
          name="orders/[id]/pickup"
          options={{ headerShown: true, title: "Pickup Confirmation" }}
        />
        <Stack.Screen
          name="orders/[id]/damage"
          options={{ headerShown: true, title: "Damage Report" }}
        />
        <Stack.Screen
          name="orders/[id]/collection"
          options={{ headerShown: true, title: "Payment Collection" }}
        />
        <Stack.Screen
          name="orders/[id]/complete"
          options={{ headerShown: true, title: "Complete Delivery" }}
        />
        <Stack.Screen
          name="alert-setup"
          options={{ headerShown: true, title: "Alert Setup" }}
        />
      </Stack>
    </View>
    </ThemeProvider>
  );
}
