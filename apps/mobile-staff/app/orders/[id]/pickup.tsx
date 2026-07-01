import { useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { api } from "@/services/api";
import { AnimatedScreen } from "@/components/AnimatedScreen";
import { AnimatedPressable } from "@/components/AnimatedPressable";

export default function PickupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await api.post(`/delivery/orders/${id}/pickup`);
      router.back();
    } catch {}
    setIsLoading(false);
  };

  return (
    <AnimatedScreen className="flex-1 bg-white dark:bg-slate-950 px-5 justify-center items-center">
      <View className="w-20 h-20 bg-blue-50 dark:bg-blue-950/40 rounded-full items-center justify-center mb-6">
        <Text className="text-4xl">📦</Text>
      </View>
      <Text className="text-xl font-heading text-slate-900 dark:text-white mb-2">Confirm Pickup</Text>
      <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mb-8">Confirm that you have picked up all items for this order from the store.</Text>
      <AnimatedPressable onPress={handleConfirm} disabled={isLoading} className={`w-full h-14 rounded-xl items-center justify-center ${isLoading ? "bg-blue-400" : "bg-blue-600"}`} accessibilityRole="button" accessibilityLabel="I've picked up the order">
        {isLoading ? <ActivityIndicator color="white" /> : <Text className="text-white font-sans-bold">I've Picked Up the Order</Text>}
      </AnimatedPressable>
      <AnimatedPressable onPress={() => router.back()} haptic={false} className="mt-4"><Text className="text-slate-500 dark:text-slate-400 text-sm">Cancel</Text></AnimatedPressable>
    </AnimatedScreen>
  );
}
