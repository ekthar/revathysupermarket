import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, Pressable, RefreshControl, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { api } from "@/services/api";

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

  const fetchQueue = useCallback(async () => {
    try {
      const { data } = await api.get("/packing/queue");
      setOrders(data.orders ?? []);
    } catch {
      // Retry on pull-to-refresh
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
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <View className="bg-white px-5 pt-14 pb-4 border-b border-slate-100">
        <Text className="text-2xl font-bold text-slate-900">Packing Queue</Text>
        <Text className="text-sm text-slate-500 mt-1">
          {orders.length} order{orders.length !== 1 ? "s" : ""} waiting
        </Text>
      </View>

      {orders.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-4xl mb-4">✅</Text>
          <Text className="text-lg font-bold text-slate-700 text-center">All caught up!</Text>
          <Text className="text-sm text-slate-500 text-center mt-2">
            No orders waiting to be packed.
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchQueue(); }} colors={["#7c3aed"]} />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/(packing)/order/${item.id}` as any)}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"
            >
              <View className="flex-row justify-between items-start">
                <View>
                  <Text className="text-base font-bold text-slate-900">#{item.orderNumber}</Text>
                  <Text className="text-sm text-slate-600 mt-0.5">{item.customerName}</Text>
                </View>
                <View className={`px-2 py-1 rounded-full ${item.status === "PACKING" ? "bg-purple-100" : "bg-blue-100"}`}>
                  <Text className={`text-xs font-bold ${item.status === "PACKING" ? "text-purple-700" : "text-blue-700"}`}>
                    {item.status === "PACKING" ? "Packing" : "Accepted"}
                  </Text>
                </View>
              </View>
              <View className="flex-row justify-between mt-3">
                <Text className="text-xs text-slate-400">{item.itemCount} items</Text>
                <Text className="text-sm font-bold text-slate-900">₹{Number(item.total).toFixed(2)}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
