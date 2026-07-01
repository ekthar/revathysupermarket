import { useState, useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import * as Notifications from "expo-notifications";
import * as Location from "expo-location";

export default function AlertSetupScreen() {
  const [notifGranted, setNotifGranted] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const notif = await Notifications.getPermissionsAsync();
    setNotifGranted(notif.status === "granted");
    const loc = await Location.getForegroundPermissionsAsync();
    setLocationGranted(loc.status === "granted");
  };

  const requestNotif = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setNotifGranted(status === "granted");
  };

  const requestLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationGranted(status === "granted");
    if (status === "granted") {
      await Location.requestBackgroundPermissionsAsync();
    }
  };

  return (
    <View className="flex-1 bg-white px-5 pt-6">
      <Text className="text-lg font-heading text-slate-900 mb-6">Alert Permissions</Text>
      <Text className="text-sm text-slate-500 mb-6">These permissions are needed to receive delivery alerts and track your location during deliveries.</Text>

      {/* Notification */}
      <View className="flex-row items-center p-4 border border-slate-200 rounded-xl mb-4">
        <View className={`w-3 h-3 rounded-full mr-3 ${notifGranted ? "bg-green-500" : "bg-red-400"}`} />
        <View className="flex-1">
          <Text className="text-sm font-sans-semibold text-slate-800">Push Notifications</Text>
          <Text className="text-xs text-slate-400">Receive new order alerts</Text>
        </View>
        {!notifGranted && (
          <Pressable onPress={requestNotif} className="bg-primary-100 px-3 py-1.5 rounded-lg">
            <Text className="text-xs font-sans-bold text-primary-700">Grant</Text>
          </Pressable>
        )}
      </View>

      {/* Location */}
      <View className="flex-row items-center p-4 border border-slate-200 rounded-xl mb-4">
        <View className={`w-3 h-3 rounded-full mr-3 ${locationGranted ? "bg-green-500" : "bg-red-400"}`} />
        <View className="flex-1">
          <Text className="text-sm font-sans-semibold text-slate-800">Location Access</Text>
          <Text className="text-xs text-slate-400">Share location during deliveries</Text>
        </View>
        {!locationGranted && (
          <Pressable onPress={requestLocation} className="bg-primary-100 px-3 py-1.5 rounded-lg">
            <Text className="text-xs font-sans-bold text-primary-700">Grant</Text>
          </Pressable>
        )}
      </View>

      {/* Status */}
      <View className="mt-8 items-center">
        {notifGranted && locationGranted ? (
          <>
            <Text className="text-4xl mb-3">✅</Text>
            <Text className="text-base font-heading text-green-700">All Set!</Text>
            <Text className="text-sm text-slate-500 mt-1 text-center">You'll receive alerts for new delivery assignments.</Text>
          </>
        ) : (
          <>
            <Text className="text-4xl mb-3">⚠️</Text>
            <Text className="text-base font-heading text-amber-700">Permissions Needed</Text>
            <Text className="text-sm text-slate-500 mt-1 text-center">Grant all permissions above to receive delivery alerts reliably.</Text>
          </>
        )}
      </View>
    </View>
  );
}
