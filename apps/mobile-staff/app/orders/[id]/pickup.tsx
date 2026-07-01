import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { api } from "@/services/api";

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
    <View className="flex-1 bg-white px-5 justify-center items-center">
      <View className="w-20 h-20 bg-blue-50 rounded-full items-center justify-center mb-6">
        <Text className="text-4xl">📦</Text>
      </View>
      <Text className="text-xl font-heading text-slate-900 mb-2">Confirm Pickup</Text>
      <Text className="text-sm text-slate-500 text-center mb-8">Confirm that you have picked up all items for this order from the store.</Text>
      <Pressable onPress={handleConfirm} disabled={isLoading} className={`w-full h-14 rounded-xl items-center justify-center ${isLoading ? "bg-blue-400" : "bg-blue-600"}`}>
        {isLoading ? <ActivityIndicator color="white" /> : <Text className="text-white font-sans-bold">I've Picked Up the Order</Text>}
      </Pressable>
      <Pressable onPress={() => router.back()} className="mt-4"><Text className="text-slate-500 text-sm">Cancel</Text></Pressable>
    </View>
  );
}
