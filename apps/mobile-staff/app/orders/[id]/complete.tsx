import { useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { api } from "@/services/api";
import { useDeliveryStore } from "@/stores/delivery";
import { AnimatedScreen } from "@/components/AnimatedScreen";
import { AnimatedPressable } from "@/components/AnimatedPressable";

export default function CompleteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const { stopTracking } = useDeliveryStore();

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await api.post(`/delivery/orders/${id}/complete`);
      await stopTracking();
      router.replace("/dashboard");
    } catch {}
    setIsLoading(false);
  };

  return (
    <AnimatedScreen className="flex-1 bg-white dark:bg-slate-950 px-5 justify-center items-center">
      <View className="w-20 h-20 bg-green-50 dark:bg-green-950/40 rounded-full items-center justify-center mb-6">
        <Text className="text-4xl">✅</Text>
      </View>
      <Text className="text-xl font-heading text-slate-900 dark:text-white mb-2">Mark as Delivered</Text>
      <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mb-8">Confirm that the order has been successfully delivered to the customer.</Text>
      <AnimatedPressable onPress={handleComplete} disabled={isLoading} className={`w-full h-14 rounded-xl items-center justify-center ${isLoading ? "bg-primary-400" : "bg-primary-600"}`} accessibilityRole="button" accessibilityLabel="Confirm delivery">
        {isLoading ? <ActivityIndicator color="white" /> : <Text className="text-white font-sans-bold">Confirm Delivery</Text>}
      </AnimatedPressable>
      <AnimatedPressable onPress={() => router.back()} haptic={false} className="mt-4"><Text className="text-slate-500 dark:text-slate-400 text-sm">Cancel</Text></AnimatedPressable>
    </AnimatedScreen>
  );
}
