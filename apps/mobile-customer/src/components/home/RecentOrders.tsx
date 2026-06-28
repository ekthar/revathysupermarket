import { View, Text, Pressable, ScrollView } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import { router } from "expo-router";
import { Clock, Package } from "lucide-react-native";
import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { formatCurrency } from "@msm/shared/utils";
import { STATUS_LABELS } from "@msm/shared/constants";

interface RecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  itemCount?: number;
  items?: Array<{ name: string }>;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  ORDER_RECEIVED: { bg: "bg-warning-100", text: "text-warning-700" },
  ACCEPTED: { bg: "bg-info-100", text: "text-info-700" },
  PACKING: { bg: "bg-info-100", text: "text-info-700" },
  OUT_FOR_DELIVERY: { bg: "bg-secondary-50", text: "text-secondary-700" },
  DELIVERED: { bg: "bg-success-50", text: "text-success-700" },
  CANCELLED: { bg: "bg-error-50", text: "text-error-700" },
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function RecentOrders() {
  const [orders, setOrders] = useState<RecentOrder[]>([]);

  useEffect(() => {
    async function fetch() {
      try {
        const { data } = await api.get("/orders?limit=5");
        const items = data.items || data.orders || data || [];
        setOrders(items.slice(0, 5));
      } catch {}
    }
    fetch();
  }, []);

  if (orders.length === 0) return null;

  return (
    <View className="pt-5">
      <View className="px-4 flex-row items-center justify-between mb-3">
        <Text className="text-title font-bold text-neutral-900">Orders</Text>
        <Pressable onPress={() => router.push("/(tabs)/orders")}>
          <Text className="text-caption font-semibold text-primary-900">
            See all
          </Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {orders.map((order, index) => {
          const colors = statusColors[order.status] || statusColors.ORDER_RECEIVED;
          const statusLabel =
            STATUS_LABELS[order.status as keyof typeof STATUS_LABELS] || order.status;

          return (
            <Animated.View
              key={order.id}
              entering={FadeInRight.delay(index * 80).duration(400).springify()}
            >
              <Pressable
                onPress={() =>
                  !["DELIVERED", "CANCELLED"].includes(order.status)
                    ? router.push(`/orders/${order.id}/tracking`)
                    : router.push(`/orders/${order.id}`)
                }
                className="w-[200px] mr-3 rounded-2xl border border-neutral-100 bg-white p-3"
                style={{
                  shadowColor: "#050505",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-caption font-bold text-neutral-800">
                    #{order.orderNumber?.split("-").pop() || order.orderNumber}
                  </Text>
                  <View className={`px-2 py-0.5 rounded-full ${colors.bg}`}>
                    <Text className={`text-micro font-bold ${colors.text}`}>
                      {statusLabel.split(" ")[0]}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-1 mb-2">
                  <View className="flex-row -space-x-1">
                    <View className="h-6 w-6 rounded-md bg-neutral-100 border border-white items-center justify-center">
                      <Package size={10} color="#9CA3AF" />
                    </View>
                  </View>
                  <Text className="text-caption text-neutral-500 ml-1">
                    {order.itemCount || order.items?.length || "–"} Items
                  </Text>
                  <Text className="text-caption font-bold text-neutral-900 ml-auto">
                    {formatCurrency(order.total)}
                  </Text>
                </View>

                <View className="flex-row items-center gap-1">
                  <Clock size={10} color="#9CA3AF" />
                  <Text className="text-micro text-neutral-400">
                    {timeAgo(order.createdAt)}
                  </Text>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}
