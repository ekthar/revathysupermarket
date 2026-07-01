import { useEffect, useState } from "react";
import { View, Text, Pressable, Vibration } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Animated, { SlideInDown, FadeIn } from "react-native-reanimated";
import { api } from "@/services/api";
import { alarmService } from "@/services/alarm";
import { notifeeService } from "@/services/notifee";

export default function DeliveryAlertScreen() {
  const { eventId, orderId, orderNumber } = useLocalSearchParams<{
    eventId: string;
    orderId: string;
    orderNumber: string;
  }>();
  const [countdown, setCountdown] = useState(30);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Start alarm sound
    alarmService.startAlarm();

    // Countdown timer (default 30s, could fetch from ring_alert_rules)
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleReject(); // Auto-reject on timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      alarmService.stopAlarm();
    };
  }, []);

  async function handleAccept() {
    setProcessing(true);
    await alarmService.stopAlarm();
    await notifeeService.cancel(`delivery-${eventId}`);
    try {
      await api.post("/delivery/acknowledge", { eventId, orderId });
      router.replace(`/(delivery)/order/${orderId}` as any);
    } catch {
      router.back();
    }
  }

  async function handleReject() {
    setProcessing(true);
    await alarmService.stopAlarm();
    await notifeeService.cancel(`delivery-${eventId}`);
    try {
      await api.post(`/orders/${orderId}/reject`, { reason: "Rejected from alert" });
    } catch {}
    router.back();
  }

  return (
    <View className="flex-1 bg-slate-900 justify-center items-center px-6">
      {/* Animated card */}
      <Animated.View
        entering={SlideInDown.springify().damping(15)}
        className="bg-white rounded-3xl p-6 w-full max-w-sm items-center"
      >
        {/* Pulsing indicator */}
        <Animated.View entering={FadeIn.delay(200)} className="w-16 h-16 bg-emerald-100 rounded-full items-center justify-center mb-4">
          <Text className="text-3xl">🛵</Text>
        </Animated.View>

        <Text className="text-xl font-bold text-slate-900 text-center">
          New Delivery Order
        </Text>
        <Text className="text-lg font-bold text-emerald-600 mt-2">
          #{orderNumber}
        </Text>

        {/* Countdown */}
        <View className="mt-4 bg-slate-100 rounded-full px-4 py-2">
          <Text className="text-sm font-bold text-slate-600">
            Auto-reject in {countdown}s
          </Text>
        </View>

        {/* Action buttons */}
        <View className="flex-row gap-3 mt-8 w-full">
          <Pressable
            onPress={handleReject}
            disabled={processing}
            className="flex-1 h-14 bg-red-500 rounded-xl items-center justify-center"
          >
            <Text className="text-white font-bold">✕ Reject</Text>
          </Pressable>
          <Pressable
            onPress={handleAccept}
            disabled={processing}
            className="flex-1 h-14 bg-emerald-500 rounded-xl items-center justify-center"
          >
            <Text className="text-white font-bold">✓ Accept</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}
