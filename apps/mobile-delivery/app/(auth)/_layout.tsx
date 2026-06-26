import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/stores/auth";

export default function AuthLayout() {
  const { status } = useAuthStore();
  if (status === "authenticated") return <Redirect href="/dashboard" />;
  return <Stack screenOptions={{ headerShown: false }}><Stack.Screen name="login" /><Stack.Screen name="otp" /></Stack>;
}
