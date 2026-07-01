import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { api } from "@/services/api";
import { AnimatedScreen } from "@/components/AnimatedScreen";
import { AnimatedPressable } from "@/components/AnimatedPressable";

interface OrderDetail {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  total: number;
  status: string;
  items: Array<{ name: string; quantity: number; price: number }>;
}

export default function DeliveryOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/delivery/orders/${id}`).then(({ data }) => {
      setOrder(data.order);
    }).catch(() => null).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-slate-950">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  if (!order) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-slate-950">
        <Text className="text-slate-500 dark:text-slate-400">Order not found</Text>
      </View>
    );
  }

  return (
    <AnimatedScreen className="flex-1 bg-white dark:bg-slate-950">
      <ScrollView className="flex-1 bg-white dark:bg-slate-950" contentContainerStyle={{ padding: 20 }}>
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">#{order.orderNumber}</Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1">{order.customerName} • {order.phone}</Text>
        <Text className="text-xs text-slate-400 dark:text-slate-500 mt-2">📍 {order.address}</Text>

        {/* Items */}
        <View className="mt-6 bg-slate-50 dark:bg-slate-900 rounded-2xl p-4">
          <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">Items</Text>
          {order.items.map((item, i) => (
            <View key={i} className="flex-row justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <Text className="text-sm text-slate-700 dark:text-slate-300 flex-1">{item.name} × {item.quantity}</Text>
              <Text className="text-sm font-bold text-slate-900 dark:text-white">₹{(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
          <View className="flex-row justify-between pt-3">
            <Text className="text-base font-bold text-slate-900 dark:text-white">Total</Text>
            <Text className="text-base font-bold text-emerald-700 dark:text-emerald-400">₹{Number(order.total).toFixed(2)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="mt-6 gap-3">
          <AnimatedPressable
            onPress={() => router.push(`/(delivery)/order/${id}/navigate` as any)}
            className="h-14 bg-blue-600 rounded-xl items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Navigate to customer"
          >
            <Text className="text-white font-bold">🗺️ Navigate to Customer</Text>
          </AnimatedPressable>

          {["OUT_FOR_DELIVERY", "ARRIVING"].includes(order.status) && (
            <AnimatedPressable
              onPress={() => router.push(`/(delivery)/order/${id}/collect` as any)}
              className="h-14 bg-amber-500 rounded-xl items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Collect payment"
            >
              <Text className="text-white font-bold">💰 Collect Payment</Text>
            </AnimatedPressable>
          )}

          {["OUT_FOR_DELIVERY", "ARRIVING"].includes(order.status) && (
            <AnimatedPressable
              onPress={() => router.push(`/(delivery)/order/${id}/complete` as any)}
              className="h-14 bg-emerald-600 rounded-xl items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Complete delivery"
            >
              <Text className="text-white font-bold">✓ Complete Delivery</Text>
            </AnimatedPressable>
          )}
        </View>
      </ScrollView>
    </AnimatedScreen>
  );
}
