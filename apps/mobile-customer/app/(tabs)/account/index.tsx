import { View, Text, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "@/stores/auth";

const menuItems = [
  { label: "Wallet", icon: "💰", route: "/account/wallet" },
  { label: "Rewards", icon: "🏆", route: "/account/loyalty" },
  { label: "Favorites", icon: "❤️", route: "/account/favorites" },
  { label: "Addresses", icon: "📍", route: "/account/addresses" },
  { label: "Notifications", icon: "🔔", route: "/account/notifications" },
  { label: "Settings", icon: "⚙️", route: "/account/settings" },
  { label: "Help & Support", icon: "💬", route: "/account/support" },
];

export default function AccountScreen() {
  const { user, logout } = useAuthStore();

  return (
    <ScrollView className="flex-1 bg-white pt-14">
      {/* Profile Header */}
      <View className="px-5 pb-6 border-b border-slate-50">
        <View className="flex-row items-center">
          <View className="w-14 h-14 bg-primary-100 rounded-full items-center justify-center mr-4">
            <Text className="text-xl">👤</Text>
          </View>
          <View className="flex-1">
            <Text className="text-lg font-heading text-slate-900">
              {user?.name || "Customer"}
            </Text>
            <Text className="text-sm text-slate-500">
              {user?.phone || user?.email || ""}
            </Text>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <View className="px-5 py-4">
        {menuItems.map((item) => (
          <Pressable
            key={item.label}
            onPress={() => router.push(item.route as any)}
            className="flex-row items-center py-4 border-b border-slate-50"
          >
            <Text className="text-xl mr-4">{item.icon}</Text>
            <Text className="flex-1 text-base text-slate-700 font-sans-medium">
              {item.label}
            </Text>
            <Text className="text-slate-300">›</Text>
          </Pressable>
        ))}
      </View>

      {/* Logout */}
      <View className="px-5 pb-10">
        <Pressable
          onPress={logout}
          className="h-12 rounded-xl items-center justify-center border border-red-200 mt-4"
        >
          <Text className="text-red-500 font-sans-semibold">Logout</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
