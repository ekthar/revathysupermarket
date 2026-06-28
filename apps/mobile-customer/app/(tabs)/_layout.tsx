import { Redirect, Tabs } from "expo-router";
import { View, Text } from "react-native";
import {
  Home,
  LayoutGrid,
  ShoppingBag,
  ClipboardList,
  User,
} from "lucide-react-native";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";

export default function TabsLayout() {
  const { status } = useAuthStore();
  const itemCount = useCartStore((s) => s.items.length);

  // Redirect unauthenticated users to login
  if (status === "unauthenticated") {
    return <Redirect href="/(auth)/login" />;
  }

  // Show loading
  if (status === "loading") {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-neutral-900 text-title font-bold">Loading...</Text>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#050505",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          borderTopWidth: 0.5,
          borderTopColor: "#E5E7EB",
          paddingTop: 8,
          paddingBottom: 8,
          height: 64,
          backgroundColor: "#FFFFFF",
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          marginTop: 2,
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused}>
              <Home
                size={20}
                color={color}
                strokeWidth={focused ? 2.2 : 1.8}
              />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: "Browse",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused}>
              <LayoutGrid
                size={20}
                color={color}
                strokeWidth={focused ? 2.2 : 1.8}
              />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} badge={itemCount}>
              <ShoppingBag
                size={20}
                color={color}
                strokeWidth={focused ? 2.2 : 1.8}
              />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused}>
              <ClipboardList
                size={20}
                color={color}
                strokeWidth={focused ? 2.2 : 1.8}
              />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "You",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused}>
              <User
                size={20}
                color={color}
                strokeWidth={focused ? 2.2 : 1.8}
              />
            </TabIcon>
          ),
        }}
      />
    </Tabs>
  );
}

/** Tab icon wrapper with optional badge and active indicator */
function TabIcon({
  focused,
  badge,
  children,
}: {
  focused: boolean;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <View className="items-center justify-center relative">
      {/* Active indicator dot */}
      {focused && (
        <View className="absolute -top-1 w-1 h-1 rounded-full bg-primary-900" />
      )}
      {children}
      {/* Cart badge */}
      {badge ? (
        <View className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-secondary-500 items-center justify-center">
          <Text className="text-[9px] font-black text-white">{badge}</Text>
        </View>
      ) : null}
    </View>
  );
}
