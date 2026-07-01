import { useState } from "react";
import { Text, TextInput, ActivityIndicator, ScrollView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { api } from "@/services/api";
import { AnimatedScreen } from "@/components/AnimatedScreen";
import { AnimatedPressable } from "@/components/AnimatedPressable";

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
    <AnimatedScreen className="flex-1 bg-white dark:bg-slate-950">
      <ScrollView className="flex-1 bg-white dark:bg-slate-950 px-5 pt-6">
        <Text className="text-base font-heading text-slate-900 dark:text-white mb-4">Report Damaged Items</Text>
        <Text className="text-sm text-slate-600 dark:text-slate-300 mb-2">Item Name</Text>
        <TextInput value={itemName} onChangeText={setItemName} placeholder="e.g. Milk 500ml" placeholderTextColor="#94a3b8" className="h-12 border border-slate-200 dark:border-slate-700 rounded-xl px-4 mb-4 text-slate-900 dark:text-white" />

        <Text className="text-sm text-slate-600 dark:text-slate-300 mb-2">Reason for Damage</Text>
        <TextInput value={reason} onChangeText={setReason} placeholder="e.g. Package was torn" placeholderTextColor="#94a3b8" multiline numberOfLines={4} textAlignVertical="top" className="h-24 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 mb-6 text-slate-900 dark:text-white" />

        <AnimatedPressable onPress={handleReport} disabled={isLoading} className={`h-14 rounded-xl items-center justify-center ${isLoading ? "bg-red-400" : "bg-red-500"}`} accessibilityRole="button" accessibilityLabel="Submit damage report">
          {isLoading ? <ActivityIndicator color="white" /> : <Text className="text-white font-sans-bold">Submit Report</Text>}
        </AnimatedPressable>
      </ScrollView>
    </AnimatedScreen>
  );
}
