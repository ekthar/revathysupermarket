import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert } from "react-native";
import { router, Stack } from "expo-router";
import { ArrowLeft, User } from "lucide-react-native";
import { useAuthStore } from "@/stores/auth";

export default function EditProfileScreen() {
  const { user, updateProfile } = useAuthStore();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setIsLoading(true);
    try {
      await updateProfile({ name: name.trim(), email: email.trim() || undefined });
      Alert.alert("Success", "Profile updated");
      router.back();
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Edit Profile", headerTintColor: "#050505" }} />
      <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16 }}>
        <View className="items-center mb-8 mt-4">
          <View className="h-20 w-20 rounded-full bg-primary-900 items-center justify-center mb-3">
            <User size={36} color="#FFFFFF" />
          </View>
          <Text className="text-heading font-bold text-neutral-900">{user?.name || "Customer"}</Text>
          <Text className="text-caption text-neutral-500">{user?.phone || ""}</Text>
        </View>

        <Text className="text-body font-bold text-neutral-700 mb-2">Name</Text>
        <TextInput
          className="border border-neutral-200 rounded-xl px-4 py-3.5 text-body text-neutral-900 mb-4"
          placeholder="Your name"
          placeholderTextColor="#9CA3AF"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        <Text className="text-body font-bold text-neutral-700 mb-2">Email</Text>
        <TextInput
          className="border border-neutral-200 rounded-xl px-4 py-3.5 text-body text-neutral-900 mb-4"
          placeholder="your@email.com"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text className="text-body font-bold text-neutral-700 mb-2">Phone</Text>
        <View className="border border-neutral-100 bg-neutral-50 rounded-xl px-4 py-3.5 mb-6">
          <Text className="text-body text-neutral-500">{user?.phone || "Not provided"}</Text>
        </View>

        {error && (
          <View className="bg-error-50 p-3 rounded-xl mb-4">
            <Text className="text-caption text-error-700">{error}</Text>
          </View>
        )}

        <Pressable
          onPress={handleSave}
          disabled={isLoading}
          className={`h-12 rounded-xl items-center justify-center ${isLoading ? "bg-primary-900/50" : "bg-primary-900"}`}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-body font-bold text-white">Save Changes</Text>
          )}
        </Pressable>
      </ScrollView>
    </>
  );
}
