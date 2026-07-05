import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { api } from "@/services/api";
import { useAuthStore } from "@/stores/auth";
import { ErrorState, EmptyState } from "@/components/ui";
import { formatCurrency, formatDateTime } from "@msm/shared/utils";
import { STATUS_LABELS } from "@msm/shared/constants";

interface HistoryOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  total: number;
  createdAt: string;
}

export default function HistoryScreen() {
  const { status: authStatus } = useAuthStore();
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/delivery/orders/history");
      setOrders(data.orders ?? data ?? []);
    } catch {
      setError("Failed to load delivery history");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  if (authStatus === "unauthenticated") return null;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-900">
        <ActivityIndicator color="#059669" size="large" />
      </View>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchHistory} />;
  }

  return (
    <View className="flex-1 bg-white dark:bg-neutral-900">
      <View className="px-5 pt-16 pb-4">
        <Text className="text-xl font-heading text-slate-900 dark:text-white">Delivery History</Text>
      </View>
      <ScrollView
        className="flex-1 px-5"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchHistory} tintColor="#059669" />}
      >
        {orders.length === 0 ? (
          <EmptyState title="No deliveries yet" subtitle="Your completed deliveries will appear here" icon="📦" />
        ) : (
          orders.map((order) => (
            <Pressable
              key={order.id}
              onPress={() => router.push(`/orders/${order.id}`)}
              className="border border-slate-100 dark:border-neutral-700 rounded-xl p-4 mb-3 flex-row items-center"
            >
              <View className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-lg items-center justify-center mr-3">
                <Text>✅</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-sans-semibold text-slate-800 dark:text-white">{order.customerName}</Text>
                <Text className="text-xs text-slate-400 dark:text-neutral-400 mt-0.5">#{order.orderNumber}</Text>
                <Text className="text-xs text-slate-300 dark:text-neutral-500">{formatDateTime(order.createdAt)}</Text>
              </View>
              <View className="items-end">
                <Text className="text-sm font-sans-bold text-primary-600">{formatCurrency(order.total)}</Text>
                <Text className="text-xs text-slate-400 dark:text-neutral-400 mt-1">
                  {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS] || "Completed"}
                </Text>
              </View>
            </Pressable>
          ))
        )}
        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
