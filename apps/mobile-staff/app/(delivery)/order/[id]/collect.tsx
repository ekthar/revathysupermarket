import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { api } from "@/services/api";
import { AnimatedScreen } from "@/components/AnimatedScreen";
import { AnimatedPressable } from "@/components/AnimatedPressable";

export default function CollectPaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [cash, setCash] = useState("");
  const [upi, setUpi] = useState("");
  const [upiReference, setUpiReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [expectedAmount] = useState(0); // Will be fetched from order

  // Fetch order amount
  const [orderTotal, setOrderTotal] = useState<number | null>(null);
  useState(() => {
    api.get(`/delivery/orders/${id}`).then(({ data }) => {
      setOrderTotal(Number(data.order?.total ?? 0));
    }).catch(() => null);
  });

  const totalCollected = Number(cash || 0) + Number(upi || 0);
  const amountDue = orderTotal ?? 0;
  const difference = totalCollected - amountDue;

  function getBalanceMessage(): { text: string; color: string } | null {
    if (!cash && !upi) return null;
    if (Math.abs(difference) < 0.01) {
      return { text: "Amount matches — no change needed", color: "text-emerald-700 dark:text-emerald-400" };
    }
    if (difference > 0) {
      return { text: `Give ₹${difference.toFixed(2)} change to customer`, color: "text-amber-700 dark:text-amber-400" };
    }
    return { text: `Collect ₹${Math.abs(difference).toFixed(2)} more from customer`, color: "text-blue-700 dark:text-blue-400" };
  }

  const balanceMsg = getBalanceMessage();

  async function handleSubmit() {
    setLoading(true);
    try {
      const { data } = await api.post("/delivery/collect", {
        orderId: id,
        cashCollected: Number(cash || 0),
        upiCollected: Number(upi || 0),
        upiReference: upiReference || undefined,
      });
      if (!data.balanced) {
        Alert.alert("Mismatch", data.error ?? "Collection amount does not match");
        return;
      }
      Alert.alert("Success", "Payment collected successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.error ?? "Failed to record collection");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatedScreen className="flex-1 bg-white dark:bg-slate-950">
      <ScrollView className="flex-1 bg-white dark:bg-slate-950" contentContainerStyle={{ padding: 20 }}>
        <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Record Payment</Text>

        {/* Amount Due Card */}
        <View className="bg-slate-100 dark:bg-slate-900 rounded-2xl p-5 items-center mb-6">
          <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Amount Due
          </Text>
          <Text className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
            ₹{amountDue.toFixed(2)}
          </Text>
        </View>

        {/* Cash Input */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Cash Collected (₹)</Text>
          <TextInput
            className="border border-slate-200 dark:border-slate-700 rounded-xl h-14 px-4 bg-slate-50 dark:bg-slate-900 text-lg text-slate-900 dark:text-white"
            value={cash}
            onChangeText={setCash}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* UPI Input */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">UPI Collected (₹)</Text>
          <TextInput
            className="border border-slate-200 dark:border-slate-700 rounded-xl h-14 px-4 bg-slate-50 dark:bg-slate-900 text-lg text-slate-900 dark:text-white"
            value={upi}
            onChangeText={setUpi}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* UPI Reference */}
        {Number(upi) > 0 && (
          <View className="mb-4">
            <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">UPI Reference</Text>
            <TextInput
              className="border border-slate-200 dark:border-slate-700 rounded-xl h-14 px-4 bg-slate-50 dark:bg-slate-900 text-base text-slate-900 dark:text-white"
              value={upiReference}
              onChangeText={setUpiReference}
              placeholder="Transaction ID"
              placeholderTextColor="#94a3b8"
            />
          </View>
        )}

        {/* Balance Message */}
        {balanceMsg && (
          <View className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 mb-6 border border-slate-200 dark:border-slate-700">
            <Text className={`text-base font-bold text-center ${balanceMsg.color}`}>
              {balanceMsg.text}
            </Text>
          </View>
        )}

        {/* Submit */}
        <AnimatedPressable
          onPress={handleSubmit}
          disabled={loading}
          className={`h-14 rounded-xl items-center justify-center ${
            loading ? "bg-emerald-400" : "bg-emerald-600"
          }`}
          accessibilityRole="button"
          accessibilityLabel="Save collection"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-base font-bold">Save Collection</Text>
          )}
        </AnimatedPressable>
      </ScrollView>
    </AnimatedScreen>
  );
}
