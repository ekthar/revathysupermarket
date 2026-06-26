import { useEffect } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useAuthStore } from "@/stores/auth";
import { notificationService } from "@/services/notifications";
import { OfflineBanner } from "@/components/OfflineBanner";
import "../global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { initialize } = useAuthStore();

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

  return (
    <View className="flex-1">
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
