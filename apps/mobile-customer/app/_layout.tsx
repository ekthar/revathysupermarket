import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useAuthStore } from "@/stores/auth";
import "../global.css";

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { status, initialize } = useAuthStore();

  useEffect(() => {
    initialize().finally(() => {
      SplashScreen.hideAsync();
    });
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="checkout"
          options={{
            headerShown: true,
            title: "Checkout",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="orders/[id]"
          options={{
            headerShown: true,
            title: "Order Details",
          }}
        />
        <Stack.Screen
          name="account/wallet"
          options={{ headerShown: true, title: "Wallet" }}
        />
        <Stack.Screen
          name="account/loyalty"
          options={{ headerShown: true, title: "Rewards" }}
        />
        <Stack.Screen
          name="account/favorites"
          options={{ headerShown: true, title: "Favorites" }}
        />
        <Stack.Screen
          name="account/addresses"
          options={{ headerShown: true, title: "Addresses" }}
        />
        <Stack.Screen
          name="account/notifications"
          options={{ headerShown: true, title: "Notifications" }}
        />
        <Stack.Screen
          name="account/settings"
          options={{ headerShown: true, title: "Settings" }}
        />
        <Stack.Screen
          name="account/support"
          options={{ headerShown: true, title: "Support" }}
        />
      </Stack>
    </>
  );
}
