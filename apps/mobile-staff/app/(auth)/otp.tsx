import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/stores/auth";

export default function OtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { verifyOtp } = useAuthStore();
  const inputRef = useRef<TextInput>(null);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError("Enter the 6-digit OTP");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await verifyOtp(phone ?? "", otp);
      // Role routing handled by root layout effect
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <View className="flex-1 bg-white px-6 justify-center">
        <View className="mb-10">
          <Text className="text-3xl font-bold text-slate-900 mb-2">
            Verify OTP
          </Text>
          <Text className="text-base text-slate-500">
            Enter the 6-digit code sent to +91 {phone}
          </Text>
        </View>

        <View className="mb-6">
          <TextInput
            ref={inputRef}
            className="border border-slate-200 rounded-2xl h-16 bg-slate-50 text-center text-2xl font-bold text-slate-900 tracking-[8px]"
            value={otp}
            onChangeText={(text) => setOtp(text.replace(/\D/g, "").slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />
        </View>

        {error && (
          <Text className="text-sm text-red-500 mb-4">{error}</Text>
        )}

        <Pressable
          onPress={handleVerify}
          disabled={isLoading || otp.length !== 6}
          className={`h-14 rounded-xl items-center justify-center ${
            isLoading || otp.length !== 6 ? "bg-emerald-400" : "bg-emerald-600"
          }`}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-base font-bold">Verify & Login</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
