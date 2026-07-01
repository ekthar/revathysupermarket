import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "@/stores/auth";
import { AnimatedScreen } from "@/components/AnimatedScreen";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { AnimatedFadeIn } from "@/components/AnimatedFadeIn";

export default function StaffLoginScreen() {
  const [mode, setMode] = useState<"phone" | "email">("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loginWithPhone, loginWithEmail } = useAuthStore();

  const handlePhoneLogin = async () => {
    const cleaned = phone.replace(/\s|-/g, "");
    if (cleaned.length < 10) {
      setError("Enter a valid phone number");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await loginWithPhone(cleaned);
      router.push({ pathname: "/(auth)/otp", params: { phone: cleaned } });
    } catch (e: any) {
      setError(e.response?.data?.error || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      setError("Enter email and password");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await loginWithEmail(email, password);
      // Role routing handled by root layout
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || "Login failed");
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
            <View className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl items-center justify-center mb-6">
              <Text className="text-3xl">🏪</Text>
            </View>
            <Text className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              MSM Staff
            </Text>
            <Text className="text-base text-slate-500 dark:text-slate-400">
              Sign in to manage orders and deliveries
            </Text>
          </View>
        </AnimatedFadeIn>

        <AnimatedFadeIn index={1}>
          {/* Login mode toggle */}
          <View className="flex-row mb-6 bg-slate-100 dark:bg-slate-900 rounded-xl p-1">
            <AnimatedPressable
              onPress={() => setMode("phone")}
              pressScale={0.98}
              className={`flex-1 py-3 rounded-lg items-center ${
                mode === "phone" ? "bg-white dark:bg-slate-800 shadow-sm" : ""
              }`}
              accessibilityRole="button"
              accessibilityLabel="Phone and OTP login"
              accessibilityState={{ selected: mode === "phone" }}
            >
              <Text
                className={`text-sm font-semibold ${
                  mode === "phone" ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"
                }`}
              >
                Phone + OTP
              </Text>
            </AnimatedPressable>
            <AnimatedPressable
              onPress={() => setMode("email")}
              pressScale={0.98}
              className={`flex-1 py-3 rounded-lg items-center ${
                mode === "email" ? "bg-white dark:bg-slate-800 shadow-sm" : ""
              }`}
              accessibilityRole="button"
              accessibilityLabel="Email and password login"
              accessibilityState={{ selected: mode === "email" }}
            >
              <Text
                className={`text-sm font-semibold ${
                  mode === "email" ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"
                }`}
              >
                Email + Password
              </Text>
            </AnimatedPressable>
          </View>
        </AnimatedFadeIn>

        <AnimatedFadeIn index={2}>
          {mode === "phone" ? (
            <View className="mb-6">
              <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                Phone Number
              </Text>
              <View className="flex-row items-center border border-slate-200 dark:border-slate-700 rounded-xl px-4 h-14 bg-slate-50 dark:bg-slate-900">
                <Text className="text-base text-slate-600 dark:text-slate-300 mr-2">+91</Text>
                <View className="w-px h-6 bg-slate-200 dark:bg-slate-700 mr-3" />
                <TextInput
                  className="flex-1 text-base text-slate-900 dark:text-white"
                  placeholder="98765 43210"
                  placeholderTextColor="#94a3b8"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={12}
                  autoFocus
                />
              </View>
            </View>
          ) : (
            <View className="mb-6 gap-4">
              <View>
                <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  Email
                </Text>
                <TextInput
                  className="border border-slate-200 dark:border-slate-700 rounded-xl px-4 h-14 bg-slate-50 dark:bg-slate-900 text-base text-slate-900 dark:text-white"
                  placeholder="admin@msmsupermarket.in"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <View>
                <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  Password
                </Text>
                <TextInput
                  className="border border-slate-200 dark:border-slate-700 rounded-xl px-4 h-14 bg-slate-50 dark:bg-slate-900 text-base text-slate-900 dark:text-white"
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>
          )}

          {error && (
            <Text className="text-sm text-red-500 mb-4">{error}</Text>
          )}

          <AnimatedPressable
            onPress={mode === "phone" ? handlePhoneLogin : handleEmailLogin}
            disabled={isLoading}
            className={`h-14 rounded-xl items-center justify-center ${
              isLoading ? "bg-emerald-400" : "bg-emerald-600"
            }`}
            accessibilityRole="button"
            accessibilityLabel={mode === "phone" ? "Send OTP" : "Sign in"}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-base font-bold">
                {mode === "phone" ? "Send OTP" : "Sign In"}
              </Text>
            )}
          </AnimatedPressable>
        </AnimatedFadeIn>
      </AnimatedScreen>
    </KeyboardAvoidingView>
  );
}
