import { useEffect, useState } from "react";
import { Tabs, router } from "expo-router";
import { View, Text } from "react-native";
import {
  Home,
  LayoutGrid,
  ShoppingBag,
  ClipboardList,
  User,
  Bell,
} from "lucide-react-native";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import { lightHaptic } from "@/lib/haptic";
import { api } from "@/services/api";

export default function TabsLayout() {
  const { status } = useAuthStore();
  const itemCount = useCartStore((s) => s.items.length);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") return;
    api.get("/notifications/unread/count").then(({ data }) => {
      setNotificationCount(data.count ?? 0);
    }).catch(() => {});
    const interval = setInterval(() => {
      api.get("/notifications/unread/count").then(({ data }) => {
        setNotificationCount(data.count ?? 0);
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [status]);

  // Guest browsing: allow unauthenticated users to browse Home, Categories, Cart
  // Only gate Orders and Account tabs — redirect to login on tap

  // Show loading only during initial auth check
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
        listeners={{ tabPress: () => lightHaptic() }}
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
        listeners={{ tabPress: () => lightHaptic() }}
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
        listeners={{ tabPress: () => lightHaptic() }}
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
        listeners={{ tabPress: (e) => {
          lightHaptic();
          if (status !== "authenticated") {
            e.preventDefault();
            router.push("/(auth)/login");
          }
        }}}
        options={{
          title: "Orders",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} badge={notificationCount}>
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
        listeners={{ tabPress: (e) => {
          lightHaptic();
          if (status !== "authenticated") {
            e.preventDefault();
            router.push("/(auth)/login");
          }
        }}}
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
