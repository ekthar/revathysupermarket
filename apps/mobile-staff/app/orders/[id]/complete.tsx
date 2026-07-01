import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { api } from "@/services/api";
import { useDeliveryStore } from "@/stores/delivery";

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
    <View className="flex-1 bg-white px-5 justify-center items-center">
      <View className="w-20 h-20 bg-green-50 rounded-full items-center justify-center mb-6">
        <Text className="text-4xl">✅</Text>
      </View>
      <Text className="text-xl font-heading text-slate-900 mb-2">Mark as Delivered</Text>
      <Text className="text-sm text-slate-500 text-center mb-8">Confirm that the order has been successfully delivered to the customer.</Text>
      <Pressable onPress={handleComplete} disabled={isLoading} className={`w-full h-14 rounded-xl items-center justify-center ${isLoading ? "bg-primary-400" : "bg-primary-600"}`}>
        {isLoading ? <ActivityIndicator color="white" /> : <Text className="text-white font-sans-bold">Confirm Delivery</Text>}
      </Pressable>
      <Pressable onPress={() => router.back()} className="mt-4"><Text className="text-slate-500 text-sm">Cancel</Text></Pressable>
    </View>
  );
}
