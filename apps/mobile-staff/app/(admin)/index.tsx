import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { api } from "@/services/api";
import { useAuthStore } from "@/stores/auth";

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

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/stats");
      setStats(data);
    } catch {} finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerStyle={{ padding: 20 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStats(); }} colors={["#059669"]} />}
    >
      <View className="pt-10 mb-6">
        <Text className="text-sm text-slate-500">Hello, {user?.name ?? "Admin"}</Text>
        <Text className="text-2xl font-bold text-slate-900 mt-1">Dashboard</Text>
      </View>

      {/* Metrics Grid */}
      <View className="flex-row flex-wrap gap-3">
        <MetricCard label="Orders Today" value={stats?.todayOrders ?? 0} emoji="📦" />
        <MetricCard label="Revenue Today" value={`₹${(stats?.todayRevenue ?? 0).toFixed(2)}`} emoji="💰" />
        <MetricCard label="Pending" value={stats?.pendingOrders ?? 0} emoji="⏳" />
        <MetricCard label="Delivered" value={stats?.deliveredOrders ?? 0} emoji="✅" />
      </View>

      {/* Unprinted alert */}
      {(stats?.unprintedOrders ?? 0) > 0 && (
        <View className="mt-4 bg-red-50 border border-red-200 rounded-2xl p-4">
          <Text className="text-sm font-bold text-red-700">
            🖨️ {stats!.unprintedOrders} order{stats!.unprintedOrders > 1 ? "s" : ""} unprinted
          </Text>
          <Text className="text-xs text-red-600 mt-1">
            Orders have exceeded the print threshold. Print them from the Orders tab.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function MetricCard({ label, value, emoji }: { label: string; value: number | string; emoji: string }) {
  return (
    <View className="flex-1 min-w-[45%] bg-white rounded-2xl p-4 border border-slate-100">
      <Text className="text-2xl">{emoji}</Text>
      <Text className="text-xl font-bold text-slate-900 mt-2">{value}</Text>
      <Text className="text-xs text-slate-500 mt-1">{label}</Text>
    </View>
  );
}
