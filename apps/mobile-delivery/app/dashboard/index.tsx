import { useEffect } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Redirect, router } from "expo-router";
import { useAuthStore } from "@/stores/auth";
import { useDeliveryStore } from "@/stores/delivery";
import { formatCurrency, getGreeting } from "@msm/shared/utils";
import { STATUS_LABELS } from "@msm/shared/constants";
import { AssignmentAlert } from "@/components/AssignmentAlert";
import { StatCardSkeleton, ListItemSkeleton } from "@/components/ui";

export default function DashboardScreen() {
  const { user, status, logout } = useAuthStore();
  const { dashboard, isLoading, error, pendingAssignment, fetchDashboard, startPolling, stopPolling } = useDeliveryStore();

  useEffect(() => { startPolling(); return () => stopPolling(); }, []);

  if (status === "unauthenticated") return <Redirect href="/(auth)/login" />;

  const stats = [
    { label: "Deliveries Today", value: `${dashboard?.deliveriesToday ?? 0}`, colors: "bg-blue-500" },
    { label: "Cash Collected", value: formatCurrency(dashboard?.cashCollected ?? 0), colors: "bg-green-500" },
    { label: "UPI Collected", value: formatCurrency(dashboard?.upiCollected ?? 0), colors: "bg-purple-500" },
    { label: "Lifetime Total", value: formatCurrency(dashboard?.lifetimeTotal ?? 0), colors: "bg-amber-500" },
  ];

  return (
    <View className="flex-1 bg-white">
      {/* Assignment Alert Overlay */}
      {pendingAssignment && <AssignmentAlert event={pendingAssignment} />}

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchDashboard} tintColor="#059669" />}
      >
        {/* Header */}
        <View className="px-5 pt-16 pb-4 flex-row justify-between items-center">
          <View>
            <Text className="text-sm text-slate-500">{getGreeting()}</Text>
            <Text className="text-xl font-heading text-slate-900">{user?.name || "Partner"}</Text>
          </View>
          <Pressable onPress={() => router.push("/alert-setup")} className="w-10 h-10 bg-slate-100 rounded-xl items-center justify-center">
            <Text>🔔</Text>
          </Pressable>
        </View>

        {/* Stats Grid */}
        {isLoading && !dashboard ? (
          <View className="px-5 mb-6 flex-row flex-wrap justify-between">
            {[1, 2, 3, 4].map((i) => (
              <StatCardSkeleton key={i} />
            ))}
          </View>
        ) : (
          <Animated.View entering={FadeInDown.duration(400)} className="px-5 mb-6 flex-row flex-wrap justify-between">
            {stats.map((stat) => (
              <View key={stat.label} className={`w-[48%] mb-3 ${stat.colors} rounded-2xl p-4`}>
                <Text className="text-white/70 text-xs font-sans-medium">{stat.label}</Text>
                <Text className="text-white text-lg font-heading mt-1">{stat.value}</Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Alert Health */}
        <Pressable onPress={() => router.push("/alert-setup")} className="mx-5 mb-6 border border-slate-200 rounded-xl p-4 flex-row items-center">
          <View className="w-3 h-3 rounded-full bg-green-500 mr-3" />
          <Text className="flex-1 text-sm font-sans-medium text-slate-700">Alerts Active</Text>
          <Text className="text-slate-400">›</Text>
        </Pressable>

        {/* Active Orders */}
        <View className="px-5 mb-4 flex-row justify-between items-center">
          <Text className="text-lg font-heading text-slate-900">Active Orders</Text>
          {(dashboard?.activeOrders?.length ?? 0) > 0 && (
            <View className="bg-primary-100 px-2.5 py-1 rounded-full">
              <Text className="text-xs font-sans-bold text-primary-700">{dashboard!.activeOrders.length}</Text>
            </View>
          )}
        </View>

        {(!dashboard?.activeOrders || dashboard.activeOrders.length === 0) ? (
          <View className="mx-5 py-12 bg-slate-50 rounded-2xl items-center">
            <Text className="text-3xl mb-2">🛵</Text>
            <Text className="text-sm text-slate-400">No active orders</Text>
            <Text className="text-xs text-slate-300 mt-1">New orders will appear here</Text>
          </View>
        ) : (
          <View className="px-5 pb-8">
            {dashboard.activeOrders.map((order) => (
              <Pressable key={order.id} onPress={() => router.push(`/orders/${order.id}`)} className="border border-slate-100 rounded-xl p-4 mb-3 flex-row items-center">
                <View className="w-10 h-10 bg-blue-50 rounded-lg items-center justify-center mr-3">
                  <Text>🛵</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-sans-semibold text-slate-800">{order.customerName}</Text>
                  <Text className="text-xs text-slate-400 mt-0.5" numberOfLines={1}>{order.address}</Text>
                  <Text className="text-xs text-slate-300">#{order.orderNumber}</Text>
                </View>
                <View className="items-end">
                  <View className="bg-blue-50 px-2 py-0.5 rounded">
                    <Text className="text-xs font-sans-medium text-blue-700">
                      {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS] || order.status.replace(/_/g, " ")}
                    </Text>
                  </View>
                  {order.distance && <Text className="text-xs text-primary-600 mt-1">{order.distance}</Text>}
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Logout */}
        <View className="px-5 pb-10">
          <Pressable onPress={logout} className="h-12 rounded-xl items-center justify-center border border-red-200">
            <Text className="text-red-500 font-sans-semibold">Logout</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
