import { useState } from "react";
import { View, Text, TextInput, Alert, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { api } from "@/services/api";
import { SlideToConfirm } from "@/components/SlideToConfirm";

export default function CompleteDeliveryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleComplete() {
    if (otp.length !== 6) {
      setError("Enter the 6-digit OTP from customer");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post("/delivery/complete", { orderId: id, otp });
      Alert.alert("Delivery Complete! 🎉", "Order has been delivered successfully.", [
        { text: "OK", onPress: () => router.replace("/(delivery)/" as any) },
      ]);
    } catch (e: any) {
      setError(e.response?.data?.error ?? "Failed to complete delivery");
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-white px-5 pt-14 justify-center">
      <Text className="text-2xl font-bold text-slate-900 mb-2">Complete Delivery</Text>
      <Text className="text-sm text-slate-500 mb-8">
        Enter the OTP shared by the customer, then slide to confirm.
      </Text>

      {/* OTP Input */}
      <View className="mb-8">
        <Text className="text-sm font-semibold text-slate-700 mb-2">Customer OTP</Text>
        <TextInput
          className="border border-slate-200 rounded-2xl h-16 bg-slate-50 text-center text-2xl font-bold text-slate-900 tracking-[8px]"
          value={otp}
          onChangeText={(text) => setOtp(text.replace(/\D/g, "").slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="••••••"
          placeholderTextColor="#cbd5e1"
        />
      </View>

      {/* Error */}
      {error && (
        <Text className="text-sm text-red-500 mb-4 text-center">{error}</Text>
      )}

      {/* Loading indicator */}
      {loading && (
        <View className="items-center mb-4">
          <ActivityIndicator size="small" color="#059669" />
          <Text className="text-xs text-slate-500 mt-2">Completing delivery...</Text>
        </View>
      )}

      {/* Slide to confirm */}
      <SlideToConfirm
        label="Slide to deliver"
        onConfirm={handleComplete}
        disabled={loading || otp.length !== 6}
      />
    </View>
  );
}
