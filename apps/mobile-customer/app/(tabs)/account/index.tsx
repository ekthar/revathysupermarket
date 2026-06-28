import { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";
import {
  Wallet,
  Gift,
  Heart,
  MapPin,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Pencil,
  User,
} from "lucide-react-native";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/services/api";
import { formatCurrency } from "@msm/shared/utils";
import { Button } from "@/components/ui/Button";

interface AccountStats {
  orderCount: number;
  walletBalance: number;
  favoriteCount: number;
}

const menuSections = [
  {
    title: "My Activity",
    items: [
      { label: "My Orders", icon: "📋", route: "/(tabs)/orders", Icon: null },
      { label: "Saved Addresses", icon: "", route: "/account/addresses", Icon: MapPin },
      { label: "Favorites", icon: "", route: "/account/favorites", Icon: Heart, iconColor: "#EF4444" },
      { label: "Wallet", icon: "", route: "/account/wallet", Icon: Wallet, iconColor: "#22C55E" },
      { label: "Rewards & Referrals", icon: "", route: "/account/loyalty", Icon: Gift, iconColor: "#F59E0B" },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Preferences", icon: "", route: "/account/settings", Icon: Settings },
      { label: "Notifications", icon: "", route: "/account/notifications", Icon: Bell },
      { label: "Help & Support", icon: "", route: "/account/support", Icon: HelpCircle },
    ],
  },
];

export default function AccountScreen() {
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState<AccountStats>({
    orderCount: 0,
    walletBalance: 0,
    favoriteCount: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const [ordersRes, walletRes, favsRes] = await Promise.all([
          api.get("/orders?limit=1").catch(() => ({ data: { total: 0 } })),
          api.get("/wallet").catch(() => ({ data: { balance: 0 } })),
          api.get("/favorites").catch(() => ({ data: { items: [] } })),
        ]);
        setStats({
          orderCount: ordersRes.data.total || ordersRes.data.items?.length || 0,
          walletBalance: walletRes.data.balance || 0,
          favoriteCount: favsRes.data.items?.length || 0,
        });
      } catch {}
    }
    fetchStats();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Profile Header */}
      <View className="pt-16 px-4 pb-6">
        <Text className="text-micro font-black uppercase tracking-widest text-neutral-400 text-center">
          Profile
        </Text>
        <Text className="text-heading font-bold text-neutral-900 text-center mt-1">
          Your account
        </Text>
      </View>

      {/* Premium Profile Card */}
      <Animated.View entering={FadeInDown.duration(400)} className="mx-4 mb-4">
        <View
          className="rounded-2xl overflow-hidden p-4"
          style={{
            backgroundColor: "#050505",
            shadowColor: "#050505",
            shadowOffset: { width: 0, height: 16 },
            shadowOpacity: 0.4,
            shadowRadius: 32,
            elevation: 12,
          }}
        >
          {/* Decorative circles */}
          <View className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/5" />
          <View className="absolute right-4 top-12 w-24 h-24 rounded-full bg-white/5" />

          <View className="flex-row items-center">
            <View className="h-14 w-14 rounded-2xl bg-white/20 items-center justify-center mr-3 border border-white/30">
              <User size={24} color="#FFFFFF" />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-heading font-black text-white" numberOfLines={1}>
                {user?.name || "Customer"}
              </Text>
              <Text className="text-caption font-semibold text-white/70" numberOfLines={1}>
                {user?.email || user?.phone || "No contact info"}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/account/edit-profile" as any)}
              className="h-9 w-9 rounded-full bg-white/15 items-center justify-center"
            >
              <Pencil size={14} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Stats Grid */}
          <View className="flex-row mt-4 gap-2">
            <StatCard value={String(stats.orderCount)} label="Orders" />
            <StatCard value={formatCurrency(stats.walletBalance)} label="Wallet" />
            <StatCard value={String(stats.favoriteCount)} label="Favorites" />
          </View>
        </View>
      </Animated.View>

      {/* Wallet Balance Card */}
      <Pressable
        onPress={() => router.push("/account/wallet")}
        className="mx-4 mb-4 rounded-xl bg-white p-4 border border-neutral-100"
        style={{ shadowColor: "#050505", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 rounded-full bg-secondary-50 items-center justify-center">
              <Wallet size={18} color="#22C55E" />
            </View>
            <View>
              <Text className="text-caption font-bold text-neutral-400">Wallet Balance</Text>
              <Text className="text-heading font-bold text-neutral-900">
                {formatCurrency(stats.walletBalance)}
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color="#D1D5DB" />
        </View>
      </Pressable>

      {/* Menu Sections */}
      {menuSections.map((section, sIndex) => (
        <Animated.View
          key={section.title}
          entering={FadeInDown.delay(100 + sIndex * 100).duration(400)}
          className="mx-4 mb-4 rounded-xl bg-white overflow-hidden border border-neutral-100"
          style={{ shadowColor: "#050505", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }}
        >
          <Text className="px-4 pt-3.5 pb-1 text-micro font-semibold text-neutral-400 uppercase tracking-wide">
            {section.title}
          </Text>
          {section.items.map((item) => {
            const IconComponent = item.Icon;
            return (
              <Pressable
                key={item.label}
                onPress={() => router.push(item.route as any)}
                className="flex-row items-center gap-3 px-4 py-3.5 border-t border-neutral-50"
              >
                <View className="h-9 w-9 rounded-xl bg-neutral-50 items-center justify-center">
                  {IconComponent ? (
                    <IconComponent size={16} color={item.iconColor || "#6B7280"} />
                  ) : (
                    <Text>{item.icon}</Text>
                  )}
                </View>
                <Text className="flex-1 text-body font-medium text-neutral-800">
                  {item.label}
                </Text>
                <ChevronRight size={16} color="#D1D5DB" />
              </Pressable>
            );
          })}
        </Animated.View>
      ))}

      {/* Logout */}
      <View className="mx-4 mt-2">
        <Button variant="outline" onPress={handleLogout} fullWidth icon={<LogOut size={16} color="#EF4444" />}>
          <Text className="text-error-500 font-bold">Logout</Text>
        </Button>
      </View>
    </ScrollView>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-1 rounded-xl border border-white/20 bg-white/10 px-2 py-3 items-center">
      <Text className="text-title font-black text-white leading-none">{value}</Text>
      <Text className="mt-1 text-micro font-bold uppercase tracking-wide text-white/70">
        {label}
      </Text>
    </View>
  );
}
