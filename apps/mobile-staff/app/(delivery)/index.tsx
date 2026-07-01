import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { api } from "@/services/api";
import { useAuthStore } from "@/stores/auth";

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

const STATUS_COLORS: Record<string, string> = {
  READY_FOR_DELIVERY: "bg-amber-100 text-amber-700",
  OUT_FOR_DELIVERY: "bg-blue-100 text-blue-700",
  ARRIVING: "bg-emerald-100 text-emerald-700",
};

export default function DeliveryOrdersScreen() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await api.get("/delivery/dashboard");
      setOrders(data.orders ?? []);
    } catch {
      // Silently fail — will retry on pull-to-refresh
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
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-white px-5 pt-14 pb-4 border-b border-slate-100">
        <Text className="text-sm text-slate-500">Hello, {user?.name ?? "Partner"}</Text>
        <Text className="text-2xl font-bold text-slate-900 mt-1">My Deliveries</Text>
      </View>

      {orders.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-4xl mb-4">📦</Text>
          <Text className="text-lg font-bold text-slate-700 text-center">
            No orders assigned
          </Text>
          <Text className="text-sm text-slate-500 text-center mt-2">
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
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/(delivery)/order/${item.id}` as any)}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="text-base font-bold text-slate-900">
                    #{item.orderNumber}
                  </Text>
                  <Text className="text-sm text-slate-600 mt-1">{item.customerName}</Text>
                </View>
                <Text className="text-base font-bold text-slate-900">
                  ₹{Number(item.total).toFixed(2)}
                </Text>
              </View>

              <Text className="text-xs text-slate-500 mt-2" numberOfLines={1}>
                📍 {item.address}
              </Text>

              <View className="flex-row justify-between items-center mt-3">
                <View
                  className={`px-2 py-1 rounded-full ${
                    STATUS_COLORS[item.status] ?? "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Text className="text-xs font-bold">
                    {STATUS_LABELS[item.status] ?? item.status}
                  </Text>
                </View>
                <Text className="text-xs text-slate-400">
                  {item.itemCount} item{item.itemCount !== 1 ? "s" : ""}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
