import { useState, useEffect } from "react";
import { View, Text } from "react-native";
import notifee, { AuthorizationStatus } from "@notifee/react-native";
import * as Location from "expo-location";
import { AnimatedScreen } from "@/components/AnimatedScreen";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { AnimatedFadeIn } from "@/components/AnimatedFadeIn";

export default function AlertSetupScreen() {
  const [notifGranted, setNotifGranted] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const settings = await notifee.getNotificationSettings();
    setNotifGranted(settings.authorizationStatus === AuthorizationStatus.AUTHORIZED);
    const loc = await Location.getForegroundPermissionsAsync();
    setLocationGranted(loc.status === "granted");
  };

  const requestNotif = async () => {
    const settings = await notifee.requestPermission();
    setNotifGranted(settings.authorizationStatus === AuthorizationStatus.AUTHORIZED);
  };

  const requestLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationGranted(status === "granted");
    if (status === "granted") {
      await Location.requestBackgroundPermissionsAsync();
    }
  };

  return (
    <AnimatedScreen className="flex-1 bg-white dark:bg-slate-950 px-5 pt-6">
      <Text className="text-lg font-heading text-slate-900 dark:text-white mb-6">Alert Permissions</Text>
      <Text className="text-sm text-slate-500 dark:text-slate-400 mb-6">These permissions are needed to receive delivery alerts and track your location during deliveries.</Text>

      {/* Notification */}
      <AnimatedFadeIn index={0}>
        <View className="flex-row items-center p-4 border border-slate-200 dark:border-slate-800 rounded-xl mb-4">
          <View className={`w-3 h-3 rounded-full mr-3 ${notifGranted ? "bg-green-500" : "bg-red-400"}`} />
          <View className="flex-1">
            <Text className="text-sm font-sans-semibold text-slate-800 dark:text-slate-100">Push Notifications</Text>
            <Text className="text-xs text-slate-400 dark:text-slate-500">Receive new order alerts</Text>
          </View>
          {!notifGranted && (
            <AnimatedPressable onPress={requestNotif} className="bg-primary-100 dark:bg-primary-900/30 px-3 py-1.5 rounded-lg" accessibilityRole="button" accessibilityLabel="Grant notification permission">
              <Text className="text-xs font-sans-bold text-primary-700 dark:text-primary-300">Grant</Text>
            </AnimatedPressable>
          )}
        </View>
      </AnimatedFadeIn>

      {/* Location */}
      <AnimatedFadeIn index={1}>
        <View className="flex-row items-center p-4 border border-slate-200 dark:border-slate-800 rounded-xl mb-4">
          <View className={`w-3 h-3 rounded-full mr-3 ${locationGranted ? "bg-green-500" : "bg-red-400"}`} />
          <View className="flex-1">
            <Text className="text-sm font-sans-semibold text-slate-800 dark:text-slate-100">Location Access</Text>
            <Text className="text-xs text-slate-400 dark:text-slate-500">Share location during deliveries</Text>
          </View>
          {!locationGranted && (
            <AnimatedPressable onPress={requestLocation} className="bg-primary-100 dark:bg-primary-900/30 px-3 py-1.5 rounded-lg" accessibilityRole="button" accessibilityLabel="Grant location permission">
              <Text className="text-xs font-sans-bold text-primary-700 dark:text-primary-300">Grant</Text>
            </AnimatedPressable>
          )}
        </View>
      </AnimatedFadeIn>

      {/* Status */}
      <View className="mt-8 items-center">
        {notifGranted && locationGranted ? (
          <>
            <Text className="text-4xl mb-3">✅</Text>
            <Text className="text-base font-heading text-green-700 dark:text-green-400">All Set!</Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1 text-center">You'll receive alerts for new delivery assignments.</Text>
          </>
        ) : (
          <>
            <Text className="text-4xl mb-3">⚠️</Text>
            <Text className="text-base font-heading text-amber-700 dark:text-amber-400">Permissions Needed</Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1 text-center">Grant all permissions above to receive delivery alerts reliably.</Text>
          </>
        )}
      </View>
    </AnimatedScreen>
  );
}
