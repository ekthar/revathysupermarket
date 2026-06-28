import { useState } from "react";
import { View, Text, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { router, Stack } from "expo-router";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react-native";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const { forgotPassword } = useAuthStore();

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (e: any) {
      setError(e.response?.data?.error || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-white"
      >
        <View className="flex-1 px-6 pt-16">
          {/* Back Button */}
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 rounded-full bg-neutral-100 items-center justify-center mb-8"
          >
            <ArrowLeft size={18} color="#374151" />
          </Pressable>

          {sent ? (
            <Animated.View entering={FadeInDown.duration(400)} className="items-center pt-12">
              <View className="h-20 w-20 rounded-full bg-secondary-50 items-center justify-center mb-6">
                <CheckCircle size={36} color="#22C55E" />
              </View>
              <Text className="text-heading font-bold text-neutral-900 text-center">
                Check your email
              </Text>
              <Text className="text-body text-neutral-500 text-center mt-3 max-w-[280px]">
                We've sent password reset instructions to{" "}
                <Text className="font-bold text-neutral-700">{email}</Text>
              </Text>
              <View className="mt-8 w-full">
                <Button onPress={() => router.back()} fullWidth>
                  Back to Login
                </Button>
              </View>
            </Animated.View>
          ) : (
            <View>
              <Text className="text-heading font-bold text-neutral-900">
                Reset password
              </Text>
              <Text className="text-body text-neutral-500 mt-2 mb-8">
                Enter your email and we'll send you a link to reset your password.
              </Text>

              <Input
                label="Email"
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
                error={error}
                icon={<Mail size={16} color="#9CA3AF" />}
              />

              <View className="mt-6">
                <Button onPress={handleSubmit} loading={loading} fullWidth size="lg">
                  Send Reset Link
                </Button>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
