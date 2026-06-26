import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuthStore } from "@/stores/auth";

export default function Index() {
  const { status } = useAuthStore();

  if (status === "loading") {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#059669" size="large" />
      </View>
    );
  }

  return (
    <Redirect
      href={status === "authenticated" ? "/(tabs)/home" : "/(auth)/login"}
    />
  );
}
