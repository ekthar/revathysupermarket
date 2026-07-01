import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, ScrollView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { api } from "@/services/api";

export default function DamageReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [itemName, setItemName] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleReport = async () => {
    if (!itemName || !reason) return;
    setIsLoading(true);
    try {
      await api.post(`/delivery/orders/${id}/damage`, {
        items: [{ productId: "unknown", name: itemName, quantity: 1, reason }],
      });
      router.back();
    } catch {}
    setIsLoading(false);
  };

  return (
    <ScrollView className="flex-1 bg-white px-5 pt-6">
      <Text className="text-base font-heading text-slate-900 mb-4">Report Damaged Items</Text>
      <Text className="text-sm text-slate-600 mb-2">Item Name</Text>
      <TextInput value={itemName} onChangeText={setItemName} placeholder="e.g. Milk 500ml" className="h-12 border border-slate-200 rounded-xl px-4 mb-4" />

      <Text className="text-sm text-slate-600 mb-2">Reason for Damage</Text>
      <TextInput value={reason} onChangeText={setReason} placeholder="e.g. Package was torn" multiline numberOfLines={4} textAlignVertical="top" className="h-24 border border-slate-200 rounded-xl px-4 py-3 mb-6" />

      <Pressable onPress={handleReport} disabled={isLoading} className={`h-14 rounded-xl items-center justify-center ${isLoading ? "bg-red-400" : "bg-red-500"}`}>
        {isLoading ? <ActivityIndicator color="white" /> : <Text className="text-white font-sans-bold">Submit Report</Text>}
      </Pressable>
    </ScrollView>
  );
}
