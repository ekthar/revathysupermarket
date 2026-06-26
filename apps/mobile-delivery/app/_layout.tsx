import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useAuthStore } from "@/stores/auth";
import { notificationService } from "@/services/notifications";
import "../global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize().finally(() => SplashScreen.hideAsync());
    notificationService.initialize();
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="orders/[id]" options={{ headerShown: true, title: "Order" }} />
        <Stack.Screen name="orders/[id]/pickup" options={{ headerShown: true, title: "Pickup" }} />
        <Stack.Screen name="orders/[id]/damage" options={{ headerShown: true, title: "Damage Report" }} />
        <Stack.Screen name="orders/[id]/collection" options={{ headerShown: true, title: "Collection" }} />
        <Stack.Screen name="orders/[id]/complete" options={{ headerShown: true, title: "Complete" }} />
        <Stack.Screen name="alert-setup" options={{ headerShown: true, title: "Alert Setup" }} />
      </Stack>
    </>
  );
}
