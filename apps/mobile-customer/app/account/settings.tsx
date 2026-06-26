import { View, Text, Switch } from "react-native";
import { useState } from "react";

export default function SettingsScreen() {
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [promotions, setPromotions] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <View className="flex-1 bg-white px-5 pt-4">
      <Text className="text-base font-heading text-slate-900 mb-4">Notifications</Text>
      <View className="flex-row items-center justify-between py-4 border-b border-slate-50">
        <View>
          <Text className="text-sm font-sans-medium text-slate-700">Order Updates</Text>
          <Text className="text-xs text-slate-400">Get notified about order status</Text>
        </View>
        <Switch value={orderUpdates} onValueChange={setOrderUpdates} trackColor={{ true: "#059669" }} />
      </View>
      <View className="flex-row items-center justify-between py-4 border-b border-slate-50">
        <View>
          <Text className="text-sm font-sans-medium text-slate-700">Promotions</Text>
          <Text className="text-xs text-slate-400">Receive deals and offers</Text>
        </View>
        <Switch value={promotions} onValueChange={setPromotions} trackColor={{ true: "#059669" }} />
      </View>

      <Text className="text-base font-heading text-slate-900 mb-4 mt-6">Appearance</Text>
      <View className="flex-row items-center justify-between py-4 border-b border-slate-50">
        <View>
          <Text className="text-sm font-sans-medium text-slate-700">Dark Mode</Text>
          <Text className="text-xs text-slate-400">Use dark theme</Text>
        </View>
        <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ true: "#059669" }} />
      </View>
    </View>
  );
}
