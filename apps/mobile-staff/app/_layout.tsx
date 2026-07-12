import { useEffect, useCallback } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import notifee, { EventType } from "@notifee/react-native";
import { useAuthStore, getRoleGroup } from "@/stores/auth";
import { fcmService } from "@/services/fcm";
import { notifeeService } from "@/services/notifee";
import { OfflineBanner } from "@/components/OfflineBanner";
import "../global.css";

const deviceLanguage = "en";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { initialize, user, status } = useAuthStore();
  const [fontsLoaded] = useFonts({
    Manrope: require("../assets/fonts/Manrope-Medium.ttf"),
    "Manrope-Medium": require("../assets/fonts/Manrope-Medium.ttf"),
    "Manrope-SemiBold": require("../assets/fonts/Manrope-SemiBold.ttf"),
    "Manrope-Bold": require("../assets/fonts/Manrope-Bold.ttf"),
    InterTight: require("../assets/fonts/InterTight-Regular.ttf"),
    "InterTight-Bold": require("../assets/fonts/InterTight-Bold.ttf"),
  });

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

  useEffect(() => {
    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      if (
        type === EventType.PRESS ||
        type === EventType.ACTION_PRESS
      ) {
        const data = detail.notification?.data;
        if (!data?.type) return;

        if (data.type === "packing_assignment") {
          router.push(
            `/alert/packing/${data.eventId}?orderId=${data.orderId}&orderNumber=${data.orderNumber}` as any
          );
        } else if (data.type === "delivery_assignment") {
          router.push(
            `/alert/${data.eventId}?orderId=${data.orderId}&orderNumber=${data.orderNumber}` as any
          );
        }
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (status === "authenticated" && user) {
      const group = getRoleGroup(user.role);
      router.replace(`/${group}` as any);
    } else if (status === "unauthenticated") {
      router.replace("/(auth)/login");
    }
  }, [status, user]);

  const onLayoutRootView = useCallback(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded || status === "loading") return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-1" onLayout={onLayoutRootView}>
        <StatusBar style="auto" />
        <OfflineBanner />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        >
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
          <Stack.Screen
            name="alert/packing/[eventId]"
            options={{
              presentation: "fullScreenModal",
              headerShown: false,
              animation: "slide_from_bottom",
            }}
          />
        </Stack>
      </View>
    </GestureHandlerRootView>
  );
}
