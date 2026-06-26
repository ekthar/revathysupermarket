import { useEffect, useState, useCallback } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import { useAuthStore } from "@/stores/auth";
import { notificationService } from "@/services/notifications";
import { OfflineBanner } from "@/components/OfflineBanner";
import "../global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const { initialize } = useAuthStore();

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync({
          InterTight_400Regular: require("../assets/fonts/InterTight-Regular.ttf"),
          InterTight_500Medium: require("../assets/fonts/InterTight-Medium.ttf"),
          InterTight_600SemiBold: require("../assets/fonts/InterTight-SemiBold.ttf"),
          InterTight_700Bold: require("../assets/fonts/InterTight-Bold.ttf"),
          Manrope_500Medium: require("../assets/fonts/Manrope-Medium.ttf"),
          Manrope_600SemiBold: require("../assets/fonts/Manrope-SemiBold.ttf"),
          Manrope_700Bold: require("../assets/fonts/Manrope-Bold.ttf"),
        });

        await initialize();
        await notificationService.initialize();
      } catch (e) {
        console.warn("App initialization error:", e);
      } finally {
        setAppReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      await SplashScreen.hideAsync();
    }
  }, [appReady]);

  if (!appReady) return null;

  return (
    <View className="flex-1" onLayout={onLayoutRootView}>
      <StatusBar style="auto" />
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="dashboard" />
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
  );
}
