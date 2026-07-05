import { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "@/stores/auth";
import { lightHaptic } from "@/lib/haptic";

export default function DeliveryLoginScreen() {
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loginWithPhone } = useAuthStore();

  const handleSendOtp = async () => {
    const cleaned = phone.replace(/\s|-/g, "");
    if (cleaned.length < 10) { setError("Enter a valid phone number"); return; }
    setError(null);
    setIsLoading(true);
    lightHaptic();
    try {
      await loginWithPhone(cleaned);
      router.push({ pathname: "/(auth)/otp", params: { phone: cleaned } });
    } catch (e: any) {
      setError(e.response?.data?.error || "Failed to send OTP");
    } finally { setIsLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
      <View className="flex-1 bg-white px-6 justify-center">
        <View className="mb-12">
          <View className="w-16 h-16 bg-primary-100 rounded-2xl items-center justify-center mb-6">
            <Text className="text-3xl">🛵</Text>
          </View>
          <Text className="text-3xl font-heading text-slate-900 mb-2">Delivery Partner</Text>
          <Text className="text-base text-slate-500">Sign in with your registered phone number</Text>
        </View>
        <View className="mb-6">
          <Text className="text-sm font-sans-semibold text-slate-700 mb-2">Phone Number</Text>
          <View className="flex-row items-center border border-slate-200 rounded-xl px-4 h-14 bg-slate-50">
            <Text className="text-base text-slate-600 mr-2">+91</Text>
            <View className="w-px h-6 bg-slate-200 mr-3" />
            <TextInput className="flex-1 text-base text-slate-900" placeholder="98765 43210" placeholderTextColor="#94a3b8" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={12} autoFocus />
          </View>
          {error && <Text className="text-sm text-red-500 mt-2">{error}</Text>}
        </View>
        <Pressable onPress={handleSendOtp} disabled={isLoading} className={`h-14 rounded-xl items-center justify-center ${isLoading ? "bg-primary-400" : "bg-primary-600"}`}>
          {isLoading ? <ActivityIndicator color="white" /> : <Text className="text-white text-base font-sans-bold">Send OTP</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
