import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAuthStore } from "@/stores/auth";

const OTP_LENGTH = 6;

export default function OtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const inputs = useRef<Array<TextInput | null>>([]);
  const { verifyOtp } = useAuthStore();

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

      // Auto-submit if all filled
      if (newOtp.every((d) => d !== "")) {
        handleVerify(newOtp.join(""));
      }
      return;
    }

    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }

    // Auto-submit
    if (newOtp.every((d) => d !== "")) {
      handleVerify(newOtp.join(""));
    }
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
      const { loginWithPhone } = useAuthStore.getState();
      await loginWithPhone(phone || "");
    } catch {
      setError("Failed to resend OTP");
    }
  };

  return (
    <View className="flex-1 bg-white px-6 justify-center">
      {/* Back Button */}
      <Pressable
        onPress={() => router.back()}
        className="absolute top-16 left-6"
      >
        <Text className="text-primary-600 text-base font-sans-medium">
          ← Back
        </Text>
      </Pressable>

      {/* Header */}
      <View className="mb-10">
        <Text className="text-2xl font-heading text-slate-900 mb-2">
          Verify OTP
        </Text>
        <Text className="text-base text-slate-500">
          Enter the 6-digit code sent to{" "}
          <Text className="font-sans-semibold text-slate-700">
            +91 {phone}
          </Text>
        </Text>
      </View>

      {/* OTP Inputs */}
      <View className="flex-row justify-between mb-6">
        {otp.map((digit, i) => (
          <TextInput
            key={i}
            ref={(ref) => {
              inputs.current[i] = ref;
            }}
            className={`w-12 h-14 border-2 rounded-xl text-center text-xl font-sans-bold ${
              digit
                ? "border-primary-500 bg-primary-50"
                : "border-slate-200 bg-slate-50"
            }`}
            value={digit}
            onChangeText={(t) => handleChange(t, i)}
            onKeyPress={({ nativeEvent }) =>
              handleKeyPress(nativeEvent.key, i)
            }
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            autoComplete="one-time-code"
          />
        ))}
      </View>

      {error && <Text className="text-sm text-red-500 mb-4">{error}</Text>}

      {/* Verify Button */}
      <Pressable
        onPress={() => handleVerify()}
        disabled={isLoading}
        className={`h-14 rounded-xl items-center justify-center ${
          isLoading ? "bg-primary-400" : "bg-primary-600"
        }`}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-base font-sans-bold">
            Verify & Continue
          </Text>
        )}
      </Pressable>

      {/* Resend */}
      <View className="mt-6 items-center">
        {countdown > 0 ? (
          <Text className="text-sm text-slate-400">
            Resend OTP in{" "}
            <Text className="font-sans-semibold text-slate-600">
              {countdown}s
            </Text>
          </Text>
        ) : (
          <Pressable onPress={handleResend}>
            <Text className="text-sm font-sans-semibold text-primary-600">
              Resend OTP
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
