import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, Pressable, RefreshControl, ActivityIndicator, Vibration } from "react-native";
import { router } from "expo-router";
import { api } from "@/services/api";
import { ErrorBanner } from "@/components/ErrorBanner";

interface PackingOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  itemCount: number;
  total: number;
  status: string;
  createdAt: string;
}

export default function PackingQueueScreen() {
  const [orders, setOrders] = useState<PackingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      setError(null);
      const { data } = await api.get("/packing/queue");
      setOrders(data.orders ?? []);
    } catch {
      setError("Could not load packing queue. Pull to refresh.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 15000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  if (loading) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-900 items-center justify-center" accessibilityLabel="Loading packing queue">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900">
      <View className="bg-white dark:bg-slate-950 px-5 pt-14 pb-4 border-b border-slate-100 dark:border-slate-800">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white" accessibilityRole="header">Packing Queue</Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {orders.length} order{orders.length !== 1 ? "s" : ""} waiting
        </Text>
      </View>

      {error && <ErrorBanner message={error} onRetry={fetchQueue} />}

      {orders.length === 0 && !error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-4xl mb-4">✅</Text>
          <Text className="text-lg font-bold text-slate-700 dark:text-slate-300 text-center">All caught up!</Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mt-2">
            No orders waiting to be packed.
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchQueue(); }} colors={["#059669"]} />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => { Vibration.vibrate(5); router.push(`/(packing)/order/${item.id}` as any); }}
              className="bg-white dark:bg-slate-950 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm"
              accessibilityRole="button"
              accessibilityLabel={`Order ${item.orderNumber}, ${item.customerName}, ${item.itemCount} items, ${item.total} rupees`}
            >
              <View className="flex-row justify-between items-start">
                <View>
                  <Text className="text-base font-bold text-slate-900 dark:text-white">#{item.orderNumber}</Text>
                  <Text className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{item.customerName}</Text>
                </View>
                <View className={`px-2.5 py-1 rounded-full ${item.status === "PACKING" ? "bg-purple-100 dark:bg-purple-900/30" : "bg-blue-100 dark:bg-blue-900/30"}`}>
                  <Text className={`text-xs font-bold ${item.status === "PACKING" ? "text-purple-700 dark:text-purple-300" : "text-blue-700 dark:text-blue-300"}`}>
                    {item.status === "PACKING" ? "Packing" : "Accepted"}
                  </Text>
                </View>
              </View>
              <View className="flex-row justify-between mt-3">
                <Text className="text-xs text-slate-400 dark:text-slate-500">{item.itemCount} items</Text>
                <Text className="text-sm font-bold text-slate-900 dark:text-white">₹{Number(item.total).toFixed(2)}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
