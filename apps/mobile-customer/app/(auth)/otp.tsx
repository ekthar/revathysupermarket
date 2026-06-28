import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/Button";

const OTP_LENGTH = 6;

export default function OtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const inputs = useRef<Array<TextInput | null>>([]);
  const { verifyOtp, loginWithPhone } = useAuthStore();

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];

    // Handle paste
    if (text.length > 1) {
      const digits = text.replace(/\D/g, "").slice(0, OTP_LENGTH).split("");
      digits.forEach((d, i) => {
        if (i + index < OTP_LENGTH) newOtp[i + index] = d;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
      inputs.current[nextIndex]?.focus();
      if (newOtp.every((d) => d !== "")) handleVerify(newOtp.join(""));
      return;
    }

    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }

    if (newOtp.every((d) => d !== "")) handleVerify(newOtp.join(""));
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (otpCode?: string) => {
    const code = otpCode || otp.join("");
    if (code.length !== OTP_LENGTH) {
      setError("Enter all 6 digits");
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await verifyOtp(phone || "", code);
      router.replace("/(tabs)/home");
    } catch (e: any) {
      setError(e.response?.data?.error || "Invalid OTP");
      setOtp(Array(OTP_LENGTH).fill(""));
      inputs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setCountdown(30);
    setError(null);
    try {
      await loginWithPhone(phone || "");
    } catch {
      setError("Failed to resend OTP");
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-white px-6"
      >
        {/* Back Button */}
        <Pressable
          onPress={() => router.back()}
          className="mt-16 h-10 w-10 rounded-full bg-neutral-100 items-center justify-center"
        >
          <ArrowLeft size={18} color="#374151" />
        </Pressable>

        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} className="mt-8 mb-10">
          <Text className="text-heading font-bold text-neutral-900">
            Verify OTP
          </Text>
          <Text className="text-body text-neutral-500 mt-2">
            Enter the 6-digit code sent to{" "}
            <Text className="font-bold text-neutral-700">+91 {phone}</Text>
          </Text>
        </Animated.View>

        {/* OTP Inputs */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)} className="flex-row justify-between mb-6">
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(ref) => { inputs.current[i] = ref; }}
              className={`w-12 h-14 border-2 rounded-xl text-center text-xl font-bold ${
                digit
                  ? "border-primary-900 bg-neutral-50"
                  : "border-neutral-200 bg-neutral-50"
              }`}
              value={digit}
              onChangeText={(t) => handleChange(t, i)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              autoComplete="one-time-code"
            />
          ))}
        </Animated.View>

        {error && (
          <View className="bg-error-50 rounded-xl p-3 mb-4">
            <Text className="text-caption text-error-700 font-medium">{error}</Text>
          </View>
        )}

        {/* Verify Button */}
        <Button
          onPress={() => handleVerify()}
          loading={isLoading}
          fullWidth
          size="lg"
        >
          Verify & Continue
        </Button>

        {/* Resend */}
        <View className="mt-6 items-center">
          {countdown > 0 ? (
            <Text className="text-caption text-neutral-400">
              Resend OTP in{" "}
              <Text className="font-bold text-neutral-600">{countdown}s</Text>
            </Text>
          ) : (
            <Pressable onPress={handleResend}>
              <Text className="text-caption font-bold text-primary-900">
                Resend OTP
              </Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
