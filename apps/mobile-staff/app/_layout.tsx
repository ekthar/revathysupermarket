import { useEffect } from "react";
import { View } from "react-native";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useAuthStore, getRoleGroup } from "@/stores/auth";
import { fcmService } from "@/services/fcm";
import { notifeeService } from "@/services/notifee";
import { OfflineBanner } from "@/components/OfflineBanner";
import "../global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { initialize, user, status } = useAuthStore();

  useEffect(() => {
    async function prepare() {
      try {
        await notifeeService.createChannels();
        await initialize();
        await fcmService.initialize();
      } catch (e) {
        console.warn("App initialization error:", e);
      } finally {
        SplashScreen.hideAsync().catch(() => {});
      }
    }

    prepare();
  }, []);

  // Role-based routing after auth resolves
  useEffect(() => {
    if (status === "authenticated" && user) {
      const group = getRoleGroup(user.role);
      router.replace(`/${group}` as any);
    } else if (status === "unauthenticated") {
      router.replace("/(auth)/login");
    }
  }, [status, user]);

  return (
    <View className="flex-1">
      <StatusBar style="auto" />
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(delivery)" />
        <Stack.Screen name="(packing)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen
          name="alert/[eventId]"
          options={{
            presentation: "fullScreenModal",
            headerShown: false,
            animation: "slide_from_bottom",
          }}
        />
      </Stack>
    </View>
  );
}
