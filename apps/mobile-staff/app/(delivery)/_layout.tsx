import { Tabs } from "expo-router";
import { AnimatedTabIcon } from "@/components/AnimatedTabIcon";
import { ACTIVE_TINT, INACTIVE_TINT } from "@/config/theme";

export default function DeliveryLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_TINT,
        tabBarInactiveTintColor: INACTIVE_TINT,
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
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon icon="📦" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon icon="👤" color={color} focused={focused} />
          ),
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
