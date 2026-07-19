import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/stores/auth";

export default function AuthLayout() {
  const { status } = useAuthStore();

  // Already authenticated — redirect to home
  if (status === "authenticated") {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, presentation: "modal" }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
