import { View, Text, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "@/stores/auth";
import { useDeliveryStore } from "@/stores/delivery";
import { formatCurrency } from "@msm/shared/utils";
import { lightHaptic, successHaptic, mediumHaptic } from "@/lib/haptic";

export default function ProfileScreen() {
  const { user, logout, status } = useAuthStore();
  const { dashboard } = useDeliveryStore();

  const handleLogout = async () => {
    mediumHaptic();
    await logout();
  };

  if (status === "unauthenticated") return null;

  return (
    <ScrollView className="flex-1 bg-white dark:bg-neutral-900">
      {/* Header */}
      <View className="px-5 pt-16 pb-6 items-center border-b border-slate-100 dark:border-neutral-700">
        <View className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full items-center justify-center mb-4">
          <Text className="text-3xl">🛵</Text>
        </View>
        <Text className="text-xl font-heading text-slate-900 dark:text-white">{user?.name || "Delivery Partner"}</Text>
        <Text className="text-sm text-slate-500 dark:text-neutral-400 mt-1">{user?.phone || ""}</Text>
      </View>

      {/* Stats */}
      <View className="flex-row px-5 py-6 border-b border-slate-100 dark:border-neutral-700">
        <View className="flex-1 items-center">
          <Text className="text-2xl font-heading text-primary-600">{dashboard?.deliveriesToday ?? 0}</Text>
          <Text className="text-xs text-slate-400 dark:text-neutral-400 mt-1">Today</Text>
        </View>
        <View className="flex-1 items-center border-x border-slate-100 dark:border-neutral-700">
          <Text className="text-2xl font-heading text-primary-600">{formatCurrency(dashboard?.cashCollected ?? 0)}</Text>
          <Text className="text-xs text-slate-400 dark:text-neutral-400 mt-1">Cash</Text>
        </View>
        <View className="flex-1 items-center">
          <Text className="text-2xl font-heading text-primary-600">{formatCurrency(dashboard?.lifetimeTotal ?? 0)}</Text>
          <Text className="text-xs text-slate-400 dark:text-neutral-400 mt-1">Lifetime</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View className="px-5 pt-6 pb-10">
        <Pressable
          onPress={() => { lightHaptic(); router.push("/alert-setup"); }}
          className="flex-row items-center py-4 border-b border-slate-50 dark:border-neutral-700"
        >
          <Text className="text-lg mr-3">🔔</Text>
          <Text className="flex-1 text-base text-slate-800 dark:text-white font-sans-medium">Alert Settings</Text>
          <Text className="text-slate-400">›</Text>
        </Pressable>

        <Pressable
          onPress={handleLogout}
          className="flex-row items-center py-4 mt-4"
        >
          <Text className="text-lg mr-3">🚪</Text>
          <Text className="text-base text-red-500 font-sans-semibold">Logout</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
