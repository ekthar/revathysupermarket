import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { api } from "@/services/api";
import { useAuthStore } from "@/stores/auth";
import { ErrorBanner } from "@/components/ErrorBanner";
import { AnimatedScreen } from "@/components/AnimatedScreen";
import { AnimatedFadeIn } from "@/components/AnimatedFadeIn";

interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  deliveredOrders: number;
  unprintedOrders: number;
}

export default function AdminDashboardScreen() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const { data } = await api.get("/admin/stats");
      setStats(data);
    } catch {
      setError("Could not load dashboard. Pull to refresh.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <AnimatedScreen className="flex-1 bg-slate-50 dark:bg-slate-900">
      <ScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-900"
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStats(); }} colors={["#059669"]} />}
      >
        <View className="pt-10 mb-6">
          <Text className="text-sm text-slate-500 dark:text-slate-400">Hello, {user?.name ?? "Admin"}</Text>
          <Text className="text-2xl font-bold text-slate-900 dark:text-white mt-1" accessibilityRole="header">Dashboard</Text>
        </View>

        {error && <ErrorBanner message={error} onRetry={fetchStats} />}

        {/* Metrics Grid */}
        <View className="flex-row flex-wrap gap-3">
          <MetricCard index={0} label="Orders Today" value={stats?.todayOrders ?? 0} color="bg-blue-50 dark:bg-blue-950/30" textColor="text-blue-700 dark:text-blue-300" />
          <MetricCard index={1} label="Revenue Today" value={`₹${(stats?.todayRevenue ?? 0).toFixed(2)}`} color="bg-emerald-50 dark:bg-emerald-950/30" textColor="text-emerald-700 dark:text-emerald-300" />
          <MetricCard index={2} label="Pending" value={stats?.pendingOrders ?? 0} color="bg-amber-50 dark:bg-amber-950/30" textColor="text-amber-700 dark:text-amber-300" />
          <MetricCard index={3} label="Delivered" value={stats?.deliveredOrders ?? 0} color="bg-purple-50 dark:bg-purple-950/30" textColor="text-purple-700 dark:text-purple-300" />
        </View>

        {/* Unprinted alert */}
        {(stats?.unprintedOrders ?? 0) > 0 && (
          <AnimatedFadeIn index={4}>
            <View className="mt-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-4" accessibilityRole="alert">
              <Text className="text-sm font-bold text-red-700 dark:text-red-300">
                🖨️ {stats!.unprintedOrders} order{stats!.unprintedOrders > 1 ? "s" : ""} unprinted
              </Text>
              <Text className="text-xs text-red-600 dark:text-red-400 mt-1">
                Orders have exceeded the print threshold. Print them from the Orders tab.
              </Text>
            </View>
          </AnimatedFadeIn>
        )}
      </ScrollView>
    </AnimatedScreen>
  );
}

function MetricCard({ index, label, value, color, textColor }: { index: number; label: string; value: number | string; color: string; textColor: string }) {
  return (
    <AnimatedFadeIn index={index} delay={70} className="flex-1 min-w-[45%]">
      <View
        className={`rounded-2xl p-4 border border-slate-100 dark:border-slate-800 ${color}`}
        accessibilityLabel={`${label}: ${value}`}
      >
        <Text className={`text-xl font-bold ${textColor}`}>{value}</Text>
        <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{label}</Text>
      </View>
    </AnimatedFadeIn>
  );
}
