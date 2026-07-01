import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/stores/auth";
import { AnimatedScreen } from "@/components/AnimatedScreen";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { AnimatedFadeIn } from "@/components/AnimatedFadeIn";

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
      <AnimatedScreen className="flex-1 bg-white dark:bg-slate-950 px-6 justify-center">
        <AnimatedFadeIn index={0}>
          <View className="mb-10">
            <Text className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Verify OTP
            </Text>
            <Text className="text-base text-slate-500 dark:text-slate-400">
              Enter the 6-digit code sent to +91 {phone}
            </Text>
          </View>
        </AnimatedFadeIn>

        <AnimatedFadeIn index={1}>
          <View className="mb-6">
            <TextInput
              ref={inputRef}
              className="border border-slate-200 dark:border-slate-700 rounded-2xl h-16 bg-slate-50 dark:bg-slate-900 text-center text-2xl font-bold text-slate-900 dark:text-white tracking-[8px]"
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

          <AnimatedPressable
            onPress={handleVerify}
            disabled={isLoading || otp.length !== 6}
            className={`h-14 rounded-xl items-center justify-center ${
              isLoading || otp.length !== 6 ? "bg-emerald-400" : "bg-emerald-600"
            }`}
            accessibilityRole="button"
            accessibilityLabel="Verify and login"
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-base font-bold">Verify & Login</Text>
            )}
          </AnimatedPressable>
        </AnimatedFadeIn>
      </AnimatedScreen>
    </KeyboardAvoidingView>
  );
}
