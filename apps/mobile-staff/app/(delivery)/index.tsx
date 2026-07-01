import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Vibration,
} from "react-native";
import { router } from "expo-router";
import { api } from "@/services/api";
import { useAuthStore } from "@/stores/auth";
import { ErrorBanner } from "@/components/ErrorBanner";
import { AnimatedScreen } from "@/components/AnimatedScreen";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { AnimatedFadeIn } from "@/components/AnimatedFadeIn";
import { OrderRowSkeleton } from "@/components/ui";

interface DeliveryOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  address: string;
  total: number;
  status: string;
  itemCount: number;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  READY_FOR_DELIVERY: "Ready for Pickup",
  OUT_FOR_DELIVERY: "Out for Delivery",
  ARRIVING: "Arriving",
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  READY_FOR_DELIVERY: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300" },
  OUT_FOR_DELIVERY: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" },
  ARRIVING: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300" },
};

export default function DeliveryOrdersScreen() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setError(null);
      const { data } = await api.get("/delivery/dashboard");
      setOrders(data.orders ?? []);
    } catch {
      setError("Could not load deliveries. Pull to refresh.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    // Poll every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-900" accessibilityLabel="Loading deliveries">
        <View className="bg-white dark:bg-slate-950 px-5 pt-14 pb-4 border-b border-slate-100 dark:border-slate-800">
          <Text className="text-sm text-slate-500 dark:text-slate-400">Hello, {user?.name ?? "Partner"}</Text>
          <Text className="text-2xl font-bold text-slate-900 dark:text-white mt-1" accessibilityRole="header">My Deliveries</Text>
        </View>
        <View className="px-4 pt-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <OrderRowSkeleton key={i} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <AnimatedScreen className="flex-1 bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <View className="bg-white dark:bg-slate-950 px-5 pt-14 pb-4 border-b border-slate-100 dark:border-slate-800">
        <Text className="text-sm text-slate-500 dark:text-slate-400">Hello, {user?.name ?? "Partner"}</Text>
        <Text className="text-2xl font-bold text-slate-900 dark:text-white mt-1" accessibilityRole="header">My Deliveries</Text>
      </View>

      {error && <ErrorBanner message={error} onRetry={fetchOrders} />}

      {orders.length === 0 && !error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-4xl mb-4">📦</Text>
          <Text className="text-lg font-bold text-slate-700 dark:text-slate-300 text-center">
            No orders assigned
          </Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mt-2">
            You'll be notified when a new order is assigned to you.
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#059669"]} />
          }
          renderItem={({ item, index }) => {
            const statusStyle = STATUS_COLORS[item.status] ?? { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-300" };
            return (
              <AnimatedFadeIn index={Math.min(index, 8)} entranceKey={`delivery:${item.id}`}>
                <AnimatedPressable
                  onPress={() => { Vibration.vibrate(5); router.push(`/(delivery)/order/${item.id}` as any); }}
                  haptic={false}
                  className="bg-white dark:bg-slate-950 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm"
                  accessibilityRole="button"
                  accessibilityLabel={`Order ${item.orderNumber}, ${item.customerName}, ${STATUS_LABELS[item.status] ?? item.status}, ${item.total} rupees`}
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="text-base font-bold text-slate-900 dark:text-white">
                        #{item.orderNumber}
                      </Text>
                      <Text className="text-sm text-slate-600 dark:text-slate-400 mt-1" numberOfLines={1}>{item.customerName}</Text>
                    </View>
                    <Text className="text-base font-bold text-slate-900 dark:text-white">
                      ₹{Number(item.total).toFixed(2)}
                    </Text>
                  </View>

                  <Text className="text-xs text-slate-500 dark:text-slate-400 mt-2" numberOfLines={1}>
                    📍 {item.address}
                  </Text>

                  <View className="flex-row justify-between items-center mt-3">
                    <View className={`px-2.5 py-1 rounded-full ${statusStyle.bg}`}>
                      <Text className={`text-xs font-bold ${statusStyle.text}`}>
                        {STATUS_LABELS[item.status] ?? item.status}
                      </Text>
                    </View>
                    <Text className="text-xs text-slate-400 dark:text-slate-500">
                      {item.itemCount} item{item.itemCount !== 1 ? "s" : ""}
                    </Text>
                  </View>
                </AnimatedPressable>
              </AnimatedFadeIn>
            );
          }}
        />
      )}
    </AnimatedScreen>
  );
}
