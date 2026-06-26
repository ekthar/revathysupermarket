import { Redirect, Tabs } from "expo-router";
import { View, Text } from "react-native";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";

// Simple icon components (replace with expo-vector-icons in prod)
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    home: "🏠",
    categories: "📦",
    cart: "🛒",
    orders: "📋",
    account: "👤",
  };
  return (
    <Text className={`text-lg ${focused ? "opacity-100" : "opacity-50"}`}>
      {icons[name] || "•"}
    </Text>
  );
}

export default function TabsLayout() {
  const { status, user } = useAuthStore();

  // Redirect unauthenticated users to login
  if (status === "unauthenticated") {
    return <Redirect href="/(auth)/login" />;
  }

  // Show loading
  if (status === "loading") {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-primary-600 text-lg font-heading">Loading...</Text>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#059669",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: {
          borderTopWidth: 0.5,
          borderTopColor: "#e2e8f0",
          paddingTop: 6,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: "Categories",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="categories" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ focused }) => <TabIcon name="cart" focused={focused} />,
          tabBarBadge: useCartStore.getState().items.length || undefined,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="orders" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="account" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
