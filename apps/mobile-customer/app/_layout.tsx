import { useEffect } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import { OfflineBanner } from "@/components/OfflineBanner";
import "../global.css";

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { initialize } = useAuthStore();
  const { loadCart } = useCartStore();

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize auth and cart
        await Promise.all([initialize(), loadCart()]);
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
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="product/[id]"
          options={{ headerShown: true, title: "" }}
        />
        <Stack.Screen
          name="search"
          options={{ headerShown: false, animation: "fade" }}
        />
        <Stack.Screen
          name="checkout/index"
          options={{
            headerShown: true,
            title: "Checkout",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="orders/[id]"
          options={{ headerShown: true, title: "Order Details" }}
        />
        <Stack.Screen
          name="orders/[id]/tracking"
          options={{ headerShown: true, title: "Track Order" }}
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
          name="account/add-address"
          options={{ headerShown: true, title: "Add Address" }}
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
        <Stack.Screen
          name="account/new-ticket"
          options={{ headerShown: true, title: "New Ticket" }}
        />
      </Stack>
    </View>
  );
}
