import { View, Text, Pressable } from "react-native";
import { useAuthStore } from "@/stores/auth";

export default function DeliveryProfileScreen() {
  const { user, logout } = useAuthStore();

  return (
    <View className="flex-1 bg-white px-5 pt-14">
      <Text className="text-2xl font-bold text-slate-900 mb-6">Profile</Text>

      <View className="bg-slate-50 rounded-2xl p-5 mb-6">
        <Text className="text-lg font-bold text-slate-900">{user?.name ?? "Staff"}</Text>
        <Text className="text-sm text-slate-500 mt-1">{user?.phone}</Text>
        <View className="mt-3 bg-emerald-100 self-start px-3 py-1 rounded-full">
          <Text className="text-xs font-bold text-emerald-700">{user?.role ?? "DELIVERY_PARTNER"}</Text>
        </View>
      </View>

      <Pressable
        onPress={logout}
        className="h-14 border border-red-200 rounded-xl items-center justify-center"
      >
        <Text className="text-red-600 font-bold">Logout</Text>
      </Pressable>
    </View>
  );
}
