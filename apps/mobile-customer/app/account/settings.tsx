import { View, Text, Switch } from "react-native";
import { Stack } from "expo-router";
import { useSettingsStore } from "@/stores/settings";

export default function SettingsScreen() {
  const { preferences, updatePreferences } = useSettingsStore();

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Settings", headerTintColor: "#050505" }} />
      <View className="flex-1 bg-white px-4 pt-4">
        <Text className="text-body font-bold text-neutral-900 mb-4">Notifications</Text>
        <View className="flex-row items-center justify-between py-4 border-b border-neutral-50">
          <View className="flex-1 mr-4">
            <Text className="text-body font-medium text-neutral-700">Order Updates</Text>
            <Text className="text-micro text-neutral-400">Get notified about order status</Text>
          </View>
          <Switch
            value={preferences.orderUpdates}
            onValueChange={(v) => updatePreferences({ orderUpdates: v })}
            trackColor={{ false: "#E5E7EB", true: "#050505" }}
            thumbColor="#FFFFFF"
          />
        </View>
        <View className="flex-row items-center justify-between py-4 border-b border-neutral-50">
          <View className="flex-1 mr-4">
            <Text className="text-body font-medium text-neutral-700">Promotions</Text>
            <Text className="text-micro text-neutral-400">Receive deals and offers</Text>
          </View>
          <Switch
            value={preferences.promotions}
            onValueChange={(v) => updatePreferences({ promotions: v })}
            trackColor={{ false: "#E5E7EB", true: "#050505" }}
            thumbColor="#FFFFFF"
          />
        </View>

        <Text className="text-body font-bold text-neutral-900 mb-4 mt-8">Appearance</Text>
        <View className="flex-row items-center justify-between py-4 border-b border-neutral-50">
          <View className="flex-1 mr-4">
            <Text className="text-body font-medium text-neutral-700">Dark Mode</Text>
            <Text className="text-micro text-neutral-400">Use dark theme</Text>
          </View>
          <Switch
            value={preferences.themeMode === "dark"}
            onValueChange={(v) => updatePreferences({ themeMode: v ? "dark" : "system" })}
            trackColor={{ false: "#E5E7EB", true: "#050505" }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>
    </>
  );
}
