import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function DeliveryLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#059669",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 0,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Orders",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📦</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👤</Text>,
        }}
      />
      {/* Hide order sub-screens from tab bar */}
      <Tabs.Screen name="order/[id]/index" options={{ href: null }} />
      <Tabs.Screen name="order/[id]/navigate" options={{ href: null }} />
      <Tabs.Screen name="order/[id]/collect" options={{ href: null }} />
      <Tabs.Screen name="order/[id]/complete" options={{ href: null }} />
    </Tabs>
  );
}
