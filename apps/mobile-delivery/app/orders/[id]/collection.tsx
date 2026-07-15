import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { api } from "@/services/api";
import { PAYMENT_METHODS } from "@msm/shared/constants";

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
    } catch (error) {
      console.error("Failed to record collection:", error);
      Alert.alert("Error", "Failed to record collection. Please try again.");
    }
    setIsLoading(false);
  };

  const methods = PAYMENT_METHODS.filter((m) => m.id !== "WALLET");

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        className="flex-1 px-5 pt-6"
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-base font-heading text-slate-900 mb-4">Record Payment Collection</Text>
        <Text className="text-sm text-slate-600 mb-2">Amount Collected</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="0"
          className="h-14 border border-slate-200 rounded-xl px-4 text-xl font-sans-bold mb-6"
        />

        <Text className="text-sm text-slate-600 mb-2">Method</Text>
        {methods.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => setMethod(m.id)}
            className={`p-4 rounded-xl mb-2 border ${method === m.id ? "border-primary-500 bg-primary-50" : "border-slate-200"}`}
          >
            <Text className={`font-sans-medium ${method === m.id ? "text-primary-700" : "text-slate-700"}`}>
              {m.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Fixed bottom button — always visible and tappable */}
      <View className="px-5 pb-6 pt-3 bg-white border-t border-slate-100">
        <Pressable
          onPress={handleCollect}
          disabled={isLoading}
          className={`h-14 rounded-xl items-center justify-center ${isLoading ? "bg-purple-400" : "bg-purple-600"}`}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-sans-bold">Confirm Collection</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
