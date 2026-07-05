import { Tabs } from "expo-router";
import { Text } from "react-native";
import { lightHaptic } from "@/lib/haptic";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { height: 64, paddingTop: 8, paddingBottom: 8, backgroundColor: "#fff", borderTopWidth: 0.5, borderTopColor: "#e2e8f0" },
        tabBarActiveTintColor: "#059669",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
      screenListeners={{ tabPress: () => lightHaptic() }}
    >
      <Tabs.Screen name="dashboard" options={{ title: "Dashboard", tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>📋</Text> }} />
      <Tabs.Screen name="history" options={{ title: "History", tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>📦</Text> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>👤</Text> }} />
    </Tabs>
  );
}
