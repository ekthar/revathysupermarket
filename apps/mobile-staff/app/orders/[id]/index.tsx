import { useState, useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { api } from "@/services/api";
import { useDeliveryStore } from "@/stores/delivery";
import type { OrderDetail } from "@msm/shared/types";
import { formatCurrency, formatDateTime } from "@msm/shared/utils";
import { STAFF_STATUS_LABELS } from "@msm/shared/constants";
import { AnimatedScreen } from "@/components/AnimatedScreen";
import { AnimatedPressable } from "@/components/AnimatedPressable";

export default function DeliveryOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { startTracking, stopTracking } = useDeliveryStore();

  useEffect(() => {
    api.get(`/delivery/orders/${id}`).then(({ data }) => setOrder(data)).catch(() => {}).finally(() => setIsLoading(false));
  }, [id]);

  // Start GPS tracking when viewing an active order
  useEffect(() => {
    if (order && (order.status === "OUT_FOR_DELIVERY" || order.status === "ARRIVING")) {
      startTracking(order.id);
    }
    return () => { stopTracking(); };
  }, [order?.status]);

  if (isLoading) return <View className="flex-1 items-center justify-center bg-white dark:bg-slate-950"><ActivityIndicator color="#059669" /></View>;
  if (!order) return <View className="flex-1 items-center justify-center bg-white dark:bg-slate-950"><Text className="text-slate-400 dark:text-slate-500">Order not found</Text></View>;

  const showPickup = order.status === "READY_FOR_DELIVERY";
  const showCollection = order.status === "OUT_FOR_DELIVERY" || order.status === "ARRIVING";
  const showComplete = order.status === "ARRIVING";

  return (
    <AnimatedScreen className="flex-1 bg-white dark:bg-slate-950">
      <ScrollView className="flex-1 bg-white dark:bg-slate-950 px-5 pt-4">
        {/* Status Badge */}
        <View className="bg-primary-50 dark:bg-primary-950/30 rounded-xl p-4 mb-4">
          <Text className="text-xs text-primary-600 dark:text-primary-400">Status</Text>
          <Text className="text-lg font-heading text-primary-900 dark:text-primary-200">
            {STAFF_STATUS_LABELS[order.status as keyof typeof STAFF_STATUS_LABELS]}
          </Text>
        </View>

        {/* Customer Info */}
        <View className="mb-4">
          <Text className="text-base font-heading text-slate-900 dark:text-white mb-2">Customer</Text>
          <Text className="text-sm text-slate-700 dark:text-slate-200">{order.customerName}</Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400">{order.phone}</Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1">{order.address.houseName}, {order.address.street}</Text>
          <Text className="text-xs text-slate-400 dark:text-slate-500">{order.address.pincode}</Text>
        </View>

        {/* Items */}
        <Text className="text-base font-heading text-slate-900 dark:text-white mb-2">Items ({order.items.length})</Text>
        {order.items.map((item) => (
          <View key={item.id} className="flex-row py-2 border-b border-slate-50 dark:border-slate-800">
            <Text className="flex-1 text-sm text-slate-700 dark:text-slate-200">{item.name}</Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400">{item.quantity} × {formatCurrency(item.price)}</Text>
          </View>
        ))}

        {/* Total */}
        <View className="flex-row justify-between mt-3 mb-6">
          <Text className="text-base font-heading text-slate-900 dark:text-white">Total</Text>
          <Text className="text-base font-heading text-slate-900 dark:text-white">{formatCurrency(order.total)}</Text>
        </View>

        {/* Payment Info */}
        <View className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 mb-6">
          <View className="flex-row justify-between">
            <Text className="text-sm text-slate-500 dark:text-slate-400">Payment Method</Text>
            <Text className="text-sm font-sans-medium text-slate-700 dark:text-slate-200">{order.paymentMethod}</Text>
          </View>
          <View className="flex-row justify-between mt-2">
            <Text className="text-sm text-slate-500 dark:text-slate-400">Payment Status</Text>
            <Text className={`text-sm font-sans-medium ${order.paymentStatus === "PAID" ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>{order.paymentStatus}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="pb-10">
          {showPickup && (
            <AnimatedPressable onPress={() => router.push(`/orders/${id}/pickup`)} className="bg-blue-600 h-14 rounded-xl items-center justify-center mb-3" accessibilityRole="button" accessibilityLabel="Confirm pickup">
              <Text className="text-white font-sans-bold">Confirm Pickup</Text>
            </AnimatedPressable>
          )}
          {showCollection && (
            <AnimatedPressable onPress={() => router.push(`/orders/${id}/collection`)} className="bg-purple-600 h-14 rounded-xl items-center justify-center mb-3" accessibilityRole="button" accessibilityLabel="Record collection">
              <Text className="text-white font-sans-bold">Record Collection</Text>
            </AnimatedPressable>
          )}
          {showComplete && (
            <AnimatedPressable onPress={() => router.push(`/orders/${id}/complete`)} className="bg-primary-600 h-14 rounded-xl items-center justify-center mb-3" accessibilityRole="button" accessibilityLabel="Mark delivered">
              <Text className="text-white font-sans-bold">Mark Delivered</Text>
            </AnimatedPressable>
          )}
          <AnimatedPressable onPress={() => router.push(`/orders/${id}/damage`)} className="h-12 rounded-xl items-center justify-center border border-red-200 dark:border-red-900" accessibilityRole="button" accessibilityLabel="Report damage">
            <Text className="text-red-500 dark:text-red-400 font-sans-medium text-sm">Report Damage</Text>
          </AnimatedPressable>
        </View>
      </ScrollView>
    </AnimatedScreen>
  );
}
