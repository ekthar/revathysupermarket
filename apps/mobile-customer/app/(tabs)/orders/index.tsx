import { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, Pressable, RefreshControl } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";
import { ClipboardList } from "lucide-react-native";
import { api } from "@/services/api";
import type { OrderSummary } from "@msm/shared/types";
import { formatCurrency, formatDate, formatOrderStatus } from "@msm/shared/utils";
import { STATUS_LABELS } from "@msm/shared/constants";
import { OrderRowSkeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";

function statusVariant(status: string): "success" | "error" | "info" | "warning" | "default" {
  switch (status) {
    case "DELIVERED": return "success";
    case "CANCELLED": return "error";
    case "OUT_FOR_DELIVERY":
    case "ARRIVING": return "info";
    default: return "warning";
  }
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await api.get("/orders");
      setOrders(data.items || data || []);
    } catch {}
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const renderItem = useCallback(({ item }: { item: OrderSummary }) => (
    <Pressable
      onPress={() => router.push(`/orders/${item.id}`)}
      className="py-4 border-b border-neutral-50"
    >
      <View className="flex-row justify-between items-start mb-2">
        <View>
          <Text className="text-body font-bold text-neutral-800">
            #{item.orderNumber}
          </Text>
          <Text className="text-micro text-neutral-400 mt-0.5">
            {formatDate(item.createdAt)}
          </Text>
        </View>
        <Badge variant={statusVariant(item.status)}>
          {STATUS_LABELS[item.status as keyof typeof STATUS_LABELS] || formatOrderStatus(item.status)}
        </Badge>
      </View>
      <View className="flex-row justify-between items-center">
        <Text className="text-micro text-neutral-500">
          {item.itemCount} item{item.itemCount > 1 ? "s" : ""}
        </Text>
        <Text className="text-body font-bold text-neutral-900">
          {formatCurrency(item.total)}
        </Text>
      </View>
    </Pressable>
  ), []);

  return (
    <View className="flex-1 bg-white pt-14">
      <View className="px-4 pb-3">
        <Text className="text-heading font-bold text-neutral-900">My Orders</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchOrders}
            tintColor="#050505"
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View className="py-16 items-center">
              <ClipboardList size={40} color="#D1D5DB" />
              <Text className="text-title font-bold text-neutral-700 mt-4 mb-1">
                No orders yet
              </Text>
              <Text className="text-caption text-neutral-400 text-center">
                Your order history will appear here
              </Text>
            </View>
          ) : (
            <View>
              {[1, 2, 3, 4, 5].map((i) => (
                <OrderRowSkeleton key={i} />
              ))}
            </View>
          )
        }
        renderItem={renderItem}
      />
    </View>
  );
}
