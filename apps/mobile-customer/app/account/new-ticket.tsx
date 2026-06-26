import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router, Stack } from "expo-router";
import { api } from "@/services/api";
import { createTicketSchema } from "@msm/shared/schemas";

export default function NewTicketScreen() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    setErrors({});
    const result = createTicketSchema.safeParse({
      subject,
      message,
      orderId: orderId || undefined,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        fieldErrors[e.path[0] as string] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/support/tickets", {
        subject,
        message,
        orderId: orderId || undefined,
      });
      router.back();
    } catch (e: any) {
      setErrors({ form: e.response?.data?.error || "Failed to create ticket" });
    }
    setIsLoading(false);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "New Ticket" }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 bg-white px-5 pt-4">
          {/* Subject */}
          <Text className="text-sm font-sans-semibold text-slate-700 mb-1">
            Subject
          </Text>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="Brief description of your issue"
            className="h-12 border border-slate-200 rounded-xl px-4 mb-1 bg-slate-50"
            placeholderTextColor="#94a3b8"
          />
          {errors.subject && (
            <Text className="text-xs text-red-500 mb-3">{errors.subject}</Text>
          )}
          <View className="mb-4" />

          {/* Message */}
          <Text className="text-sm font-sans-semibold text-slate-700 mb-1">
            Message
          </Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Describe your issue in detail..."
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            className="h-32 border border-slate-200 rounded-xl px-4 py-3 mb-1 bg-slate-50"
            placeholderTextColor="#94a3b8"
          />
          {errors.message && (
            <Text className="text-xs text-red-500 mb-3">{errors.message}</Text>
          )}
          <View className="mb-4" />

          {/* Order ID (optional) */}
          <Text className="text-sm font-sans-semibold text-slate-700 mb-1">
            Order Number (optional)
          </Text>
          <TextInput
            value={orderId}
            onChangeText={setOrderId}
            placeholder="e.g. MSM-2024-001"
            className="h-12 border border-slate-200 rounded-xl px-4 mb-4 bg-slate-50"
            placeholderTextColor="#94a3b8"
          />

          {errors.form && (
            <View className="mt-2 bg-red-50 p-3 rounded-xl">
              <Text className="text-sm text-red-600">{errors.form}</Text>
            </View>
          )}

          {/* Submit */}
          <Pressable
            onPress={handleSubmit}
            disabled={isLoading}
            className={`h-14 rounded-xl items-center justify-center mt-8 mb-10 ${
              isLoading ? "bg-primary-400" : "bg-primary-600"
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-base font-sans-bold">
                Submit Ticket
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
