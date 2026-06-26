import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { api } from "@/services/api";
import { useDeliveryStore } from "@/stores/delivery";
import type { OrderDetail } from "@msm/shared/types";
import { formatCurrency, formatDateTime } from "@msm/shared/utils";
import { STATUS_LABELS } from "@msm/shared/constants";

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

  if (isLoading) return <View className="flex-1 items-center justify-center bg-white"><ActivityIndicator color="#059669" /></View>;
  if (!order) return <View className="flex-1 items-center justify-center bg-white"><Text className="text-slate-400">Order not found</Text></View>;

  const showPickup = order.status === "READY_FOR_DELIVERY";
  const showCollection = order.status === "OUT_FOR_DELIVERY" || order.status === "ARRIVING";
  const showComplete = order.status === "ARRIVING";

  return (
    <ScrollView className="flex-1 bg-white px-5 pt-4">
      {/* Status Badge */}
      <View className="bg-primary-50 rounded-xl p-4 mb-4">
        <Text className="text-xs text-primary-600">Status</Text>
        <Text className="text-lg font-heading text-primary-900">
          {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS]}
        </Text>
      </View>

      {/* Customer Info */}
      <View className="mb-4">
        <Text className="text-base font-heading text-slate-900 mb-2">Customer</Text>
        <Text className="text-sm text-slate-700">{order.customerName}</Text>
        <Text className="text-sm text-slate-500">{order.phone}</Text>
        <Text className="text-sm text-slate-500 mt-1">{order.address.houseName}, {order.address.street}</Text>
        <Text className="text-xs text-slate-400">{order.address.pincode}</Text>
      </View>

      {/* Items */}
      <Text className="text-base font-heading text-slate-900 mb-2">Items ({order.items.length})</Text>
      {order.items.map((item) => (
        <View key={item.id} className="flex-row py-2 border-b border-slate-50">
          <Text className="flex-1 text-sm text-slate-700">{item.name}</Text>
          <Text className="text-sm text-slate-500">{item.quantity} × {formatCurrency(item.price)}</Text>
        </View>
      ))}

      {/* Total */}
      <View className="flex-row justify-between mt-3 mb-6">
        <Text className="text-base font-heading">Total</Text>
        <Text className="text-base font-heading">{formatCurrency(order.total)}</Text>
      </View>

      {/* Payment Info */}
      <View className="bg-slate-50 rounded-xl p-4 mb-6">
        <View className="flex-row justify-between">
          <Text className="text-sm text-slate-500">Payment Method</Text>
          <Text className="text-sm font-sans-medium text-slate-700">{order.paymentMethod}</Text>
        </View>
        <View className="flex-row justify-between mt-2">
          <Text className="text-sm text-slate-500">Payment Status</Text>
          <Text className={`text-sm font-sans-medium ${order.paymentStatus === "PAID" ? "text-green-600" : "text-amber-600"}`}>{order.paymentStatus}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="pb-10">
        {showPickup && (
          <Pressable onPress={() => router.push(`/orders/${id}/pickup`)} className="bg-blue-600 h-14 rounded-xl items-center justify-center mb-3">
            <Text className="text-white font-sans-bold">Confirm Pickup</Text>
          </Pressable>
        )}
        {showCollection && (
          <Pressable onPress={() => router.push(`/orders/${id}/collection`)} className="bg-purple-600 h-14 rounded-xl items-center justify-center mb-3">
            <Text className="text-white font-sans-bold">Record Collection</Text>
          </Pressable>
        )}
        {showComplete && (
          <Pressable onPress={() => router.push(`/orders/${id}/complete`)} className="bg-primary-600 h-14 rounded-xl items-center justify-center mb-3">
            <Text className="text-white font-sans-bold">Mark Delivered</Text>
          </Pressable>
        )}
        <Pressable onPress={() => router.push(`/orders/${id}/damage`)} className="h-12 rounded-xl items-center justify-center border border-red-200">
          <Text className="text-red-500 font-sans-medium text-sm">Report Damage</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
