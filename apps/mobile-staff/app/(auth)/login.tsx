import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "@/stores/auth";

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
      <View className="flex-1 bg-white px-6 justify-center">
        <View className="mb-10">
          <View className="w-16 h-16 bg-emerald-100 rounded-2xl items-center justify-center mb-6">
            <Text className="text-3xl">🏪</Text>
          </View>
          <Text className="text-3xl font-bold text-slate-900 mb-2">
            MSM Staff
          </Text>
          <Text className="text-base text-slate-500">
            Sign in to manage orders and deliveries
          </Text>
        </View>

        {/* Login mode toggle */}
        <View className="flex-row mb-6 bg-slate-100 rounded-xl p-1">
          <Pressable
            onPress={() => setMode("phone")}
            className={`flex-1 py-3 rounded-lg items-center ${
              mode === "phone" ? "bg-white shadow-sm" : ""
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                mode === "phone" ? "text-emerald-700" : "text-slate-500"
              }`}
            >
              Phone + OTP
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode("email")}
            className={`flex-1 py-3 rounded-lg items-center ${
              mode === "email" ? "bg-white shadow-sm" : ""
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                mode === "email" ? "text-emerald-700" : "text-slate-500"
              }`}
            >
              Email + Password
            </Text>
          </Pressable>
        </View>

        {mode === "phone" ? (
          <View className="mb-6">
            <Text className="text-sm font-semibold text-slate-700 mb-2">
              Phone Number
            </Text>
            <View className="flex-row items-center border border-slate-200 rounded-xl px-4 h-14 bg-slate-50">
              <Text className="text-base text-slate-600 mr-2">+91</Text>
              <View className="w-px h-6 bg-slate-200 mr-3" />
              <TextInput
                className="flex-1 text-base text-slate-900"
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
              <Text className="text-sm font-semibold text-slate-700 mb-2">
                Email
              </Text>
              <TextInput
                className="border border-slate-200 rounded-xl px-4 h-14 bg-slate-50 text-base text-slate-900"
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
              <Text className="text-sm font-semibold text-slate-700 mb-2">
                Password
              </Text>
              <TextInput
                className="border border-slate-200 rounded-xl px-4 h-14 bg-slate-50 text-base text-slate-900"
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

        <Pressable
          onPress={mode === "phone" ? handlePhoneLogin : handleEmailLogin}
          disabled={isLoading}
          className={`h-14 rounded-xl items-center justify-center ${
            isLoading ? "bg-emerald-400" : "bg-emerald-600"
          }`}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-base font-bold">
              {mode === "phone" ? "Send OTP" : "Sign In"}
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
