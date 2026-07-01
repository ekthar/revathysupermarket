import { View, Text } from "react-native";
import { useAuthStore } from "@/stores/auth";
import { AnimatedScreen } from "@/components/AnimatedScreen";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { AnimatedFadeIn } from "@/components/AnimatedFadeIn";

export default function DeliveryProfileScreen() {
  const { user, logout } = useAuthStore();

  return (
    <AnimatedScreen className="flex-1 bg-white dark:bg-slate-950 px-5 pt-14">
      <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Profile</Text>

      <AnimatedFadeIn>
        <View className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 mb-6">
          <Text className="text-lg font-bold text-slate-900 dark:text-white">{user?.name ?? "Staff"}</Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1">{user?.phone}</Text>
          <View className="mt-3 bg-emerald-100 dark:bg-emerald-900/30 self-start px-3 py-1 rounded-full">
            <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{user?.role ?? "DELIVERY_PARTNER"}</Text>
          </View>
        </View>
      </AnimatedFadeIn>

      <AnimatedPressable
        onPress={logout}
        className="h-14 border border-red-200 dark:border-red-900 rounded-xl items-center justify-center"
        accessibilityRole="button"
        accessibilityLabel="Logout"
      >
        <Text className="text-red-600 dark:text-red-400 font-bold">Logout</Text>
      </AnimatedPressable>
    </AnimatedScreen>
  );
}
