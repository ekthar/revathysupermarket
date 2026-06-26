import { useState, useEffect } from "react";
import { View, Text, FlatList, Pressable, RefreshControl } from "react-native";
import { router } from "expo-router";
import { api } from "@/services/api";
import type { OrderSummary } from "@msm/shared/types";
import { formatCurrency, formatDate, formatOrderStatus } from "@msm/shared/utils";
import { STATUS_LABELS } from "@msm/shared/constants";

function statusColor(status: string): string {
  switch (status) {
    case "DELIVERED":
      return "bg-green-100 text-green-700";
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    case "OUT_FOR_DELIVERY":
    case "ARRIVING":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-amber-100 text-amber-700";
  }
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get("/orders");
      setOrders(data.items || data || []);
    } catch {}
    setIsLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <View className="flex-1 bg-white pt-14">
      <View className="px-5 pb-3">
        <Text className="text-xl font-heading text-slate-900">My Orders</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchOrders}
            tintColor="#059669"
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View className="py-16 items-center">
              <Text className="text-4xl mb-3">📋</Text>
              <Text className="text-lg font-heading text-slate-700 mb-1">
                No orders yet
              </Text>
              <Text className="text-sm text-slate-400 text-center">
                Your order history will appear here
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/orders/${item.id}`)}
            className="py-4 border-b border-slate-50"
          >
            <View className="flex-row justify-between items-start mb-2">
              <View>
                <Text className="text-sm font-sans-bold text-slate-800">
                  #{item.orderNumber}
                </Text>
                <Text className="text-xs text-slate-400 mt-0.5">
                  {formatDate(item.createdAt)}
                </Text>
              </View>
              <View className={`px-2.5 py-1 rounded-full ${statusColor(item.status).split(" ")[0]}`}>
                <Text className={`text-xs font-sans-semibold ${statusColor(item.status).split(" ")[1]}`}>
                  {STATUS_LABELS[item.status as keyof typeof STATUS_LABELS] || formatOrderStatus(item.status)}
                </Text>
              </View>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-xs text-slate-500">
                {item.itemCount} item{item.itemCount > 1 ? "s" : ""}
              </Text>
              <Text className="text-sm font-sans-bold text-slate-900">
                {formatCurrency(item.total)}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
