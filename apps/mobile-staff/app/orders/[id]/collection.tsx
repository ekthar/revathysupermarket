import { useState } from "react";
import { View, Text, TextInput, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { api } from "@/services/api";
import { PAYMENT_METHODS } from "@msm/shared/constants";
import { AnimatedScreen } from "@/components/AnimatedScreen";
import { AnimatedPressable } from "@/components/AnimatedPressable";

export default function CollectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("COD");
  const [isLoading, setIsLoading] = useState(false);

  const handleCollect = async () => {
    if (!amount || isNaN(Number(amount))) return;
    setIsLoading(true);
    try {
      await api.post(`/delivery/orders/${id}/collection`, { amount: Number(amount), method });
      router.back();
    } catch {}
    setIsLoading(false);
  };

  const methods = PAYMENT_METHODS.filter((m) => m.id !== "WALLET");

  return (
    <AnimatedScreen className="flex-1 bg-white dark:bg-slate-950 px-5 pt-6">
      <Text className="text-base font-heading text-slate-900 dark:text-white mb-4">Record Payment Collection</Text>
      <Text className="text-sm text-slate-600 dark:text-slate-300 mb-2">Amount Collected</Text>
      <TextInput value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" placeholderTextColor="#94a3b8" className="h-14 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-xl font-sans-bold mb-6 text-slate-900 dark:text-white" />

      <Text className="text-sm text-slate-600 dark:text-slate-300 mb-2">Method</Text>
      {methods.map((m) => (
        <AnimatedPressable key={m.id} onPress={() => setMethod(m.id)} className={`p-4 rounded-xl mb-2 border ${method === m.id ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30" : "border-slate-200 dark:border-slate-700"}`} accessibilityRole="radio" accessibilityState={{ selected: method === m.id }} accessibilityLabel={m.label}>
          <Text className={`font-sans-medium ${method === m.id ? "text-primary-700 dark:text-primary-300" : "text-slate-700 dark:text-slate-200"}`}>{m.label}</Text>
        </AnimatedPressable>
      ))}

      <AnimatedPressable onPress={handleCollect} disabled={isLoading} className={`h-14 rounded-xl items-center justify-center mt-6 ${isLoading ? "bg-purple-400" : "bg-purple-600"}`} accessibilityRole="button" accessibilityLabel="Confirm collection">
        {isLoading ? <ActivityIndicator color="white" /> : <Text className="text-white font-sans-bold">Confirm Collection</Text>}
      </AnimatedPressable>
    </AnimatedScreen>
  );
}
