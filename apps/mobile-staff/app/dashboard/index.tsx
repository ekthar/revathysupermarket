import { useEffect } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { Redirect, router } from "expo-router";
import { useAuthStore } from "@/stores/auth";
import { useDeliveryStore } from "@/stores/delivery";
import { formatCurrency, getGreeting } from "@msm/shared/utils";
import { STATUS_LABELS } from "@msm/shared/constants";
import { AssignmentAlert } from "@/components/AssignmentAlert";
import { StatCardSkeleton } from "@/components/ui";
import { AnimatedScreen } from "@/components/AnimatedScreen";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { AnimatedFadeIn } from "@/components/AnimatedFadeIn";

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
    <AnimatedScreen className="flex-1 bg-white dark:bg-slate-950">
      {/* Assignment Alert Overlay */}
      {pendingAssignment && <AssignmentAlert event={pendingAssignment} />}

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchDashboard} tintColor="#059669" />}
      >
        {/* Header */}
        <View className="px-5 pt-16 pb-4 flex-row justify-between items-center">
          <View>
            <Text className="text-sm text-slate-500 dark:text-slate-400">{getGreeting()}</Text>
            <Text className="text-xl font-heading text-slate-900 dark:text-white">{user?.name || "Partner"}</Text>
          </View>
          <AnimatedPressable onPress={() => router.push("/alert-setup")} className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl items-center justify-center" accessibilityRole="button" accessibilityLabel="Alert settings">
            <Text>🔔</Text>
          </AnimatedPressable>
        </View>

        {/* Stats Grid */}
        {isLoading && !dashboard ? (
          <View className="px-5 mb-6 flex-row flex-wrap justify-between">
            {[1, 2, 3, 4].map((i) => (
              <StatCardSkeleton key={i} />
            ))}
          </View>
        ) : (
          <View className="px-5 mb-6 flex-row flex-wrap justify-between">
            {stats.map((stat, i) => (
              <AnimatedFadeIn key={stat.label} index={i} delay={70} className="w-[48%] mb-3">
                <View className={`${stat.colors} rounded-2xl p-4`}>
                  <Text className="text-white/70 text-xs font-sans-medium">{stat.label}</Text>
                  <Text className="text-white text-lg font-heading mt-1">{stat.value}</Text>
                </View>
              </AnimatedFadeIn>
            ))}
          </View>
        )}

        {/* Alert Health */}
        <AnimatedPressable onPress={() => router.push("/alert-setup")} className="mx-5 mb-6 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex-row items-center" accessibilityRole="button" accessibilityLabel="Alerts active, open alert setup">
          <View className="w-3 h-3 rounded-full bg-green-500 mr-3" />
          <Text className="flex-1 text-sm font-sans-medium text-slate-700 dark:text-slate-200">Alerts Active</Text>
          <Text className="text-slate-400 dark:text-slate-500">›</Text>
        </AnimatedPressable>

        {/* Active Orders */}
        <View className="px-5 mb-4 flex-row justify-between items-center">
          <Text className="text-lg font-heading text-slate-900 dark:text-white">Active Orders</Text>
          {(dashboard?.activeOrders?.length ?? 0) > 0 && (
            <View className="bg-primary-100 dark:bg-primary-900/30 px-2.5 py-1 rounded-full">
              <Text className="text-xs font-sans-bold text-primary-700 dark:text-primary-300">{dashboard!.activeOrders.length}</Text>
            </View>
          )}
        </View>

        {(!dashboard?.activeOrders || dashboard.activeOrders.length === 0) ? (
          <View className="mx-5 py-12 bg-slate-50 dark:bg-slate-900 rounded-2xl items-center">
            <Text className="text-3xl mb-2">🛵</Text>
            <Text className="text-sm text-slate-400 dark:text-slate-500">No active orders</Text>
            <Text className="text-xs text-slate-300 dark:text-slate-600 mt-1">New orders will appear here</Text>
          </View>
        ) : (
          <View className="px-5 pb-8">
            {dashboard.activeOrders.map((order, i) => (
              <AnimatedFadeIn key={order.id} index={Math.min(i, 8)}>
                <AnimatedPressable onPress={() => router.push(`/orders/${order.id}`)} className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 mb-3 flex-row items-center" accessibilityRole="button" accessibilityLabel={`Order ${order.orderNumber}, ${order.customerName}`}>
                  <View className="w-10 h-10 bg-blue-50 dark:bg-blue-950/40 rounded-lg items-center justify-center mr-3">
                    <Text>🛵</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-sans-semibold text-slate-800 dark:text-slate-100">{order.customerName}</Text>
                    <Text className="text-xs text-slate-400 dark:text-slate-500 mt-0.5" numberOfLines={1}>{order.address}</Text>
                    <Text className="text-xs text-slate-300 dark:text-slate-600">#{order.orderNumber}</Text>
                  </View>
                  <View className="items-end">
                    <View className="bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
                      <Text className="text-xs font-sans-medium text-blue-700 dark:text-blue-300">
                        {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS] || order.status.replace(/_/g, " ")}
                      </Text>
                    </View>
                    {order.distance && <Text className="text-xs text-primary-600 dark:text-primary-400 mt-1">{order.distance}</Text>}
                  </View>
                </AnimatedPressable>
              </AnimatedFadeIn>
            ))}
          </View>
        )}

        {/* Logout */}
        <View className="px-5 pb-10">
          <AnimatedPressable onPress={logout} className="h-12 rounded-xl items-center justify-center border border-red-200 dark:border-red-900" accessibilityRole="button" accessibilityLabel="Logout">
            <Text className="text-red-500 dark:text-red-400 font-sans-semibold">Logout</Text>
          </AnimatedPressable>
        </View>
      </ScrollView>
    </AnimatedScreen>
  );
}
