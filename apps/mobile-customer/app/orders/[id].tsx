import { useState, useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { api } from "@/services/api";
import type { OrderDetail } from "@msm/shared/types";
import { formatCurrency, formatDateTime } from "@msm/shared/utils";
import { STATUS_LABELS } from "@msm/shared/constants";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await api.get(`/orders/${id}`);
        setOrder(data);
      } catch {}
      setIsLoading(false);
    };
    fetchOrder();
  }, [id]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#059669" />
      </View>
    );
  }

  if (!order) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-slate-500">Order not found</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white px-5 pt-4">
      {/* Status */}
      <View className="bg-primary-50 rounded-xl p-4 mb-4">
        <Text className="text-sm text-primary-700 font-sans-medium">
          Status
        </Text>
        <Text className="text-lg font-heading text-primary-900">
          {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS]}
        </Text>
      </View>

      {/* Order Info */}
      <View className="mb-4">
        <Text className="text-xs text-slate-400">Order #{order.orderNumber}</Text>
        <Text className="text-xs text-slate-400">{formatDateTime(order.createdAt)}</Text>
      </View>

      {/* Items */}
      <Text className="text-base font-heading text-slate-900 mb-2">Items</Text>
      {order.items.map((item) => (
        <View key={item.id} className="flex-row py-3 border-b border-slate-50">
          <View className="flex-1">
            <Text className="text-sm font-sans-medium text-slate-800">{item.name}</Text>
            <Text className="text-xs text-slate-400">{item.quantity} × {formatCurrency(item.price)}</Text>
          </View>
          <Text className="text-sm font-sans-bold text-slate-900">
            {formatCurrency(item.price * item.quantity)}
          </Text>
        </View>
      ))}

      {/* Price Breakdown */}
      <View className="mt-4 bg-slate-50 rounded-xl p-4 mb-4">
        <View className="flex-row justify-between mb-1">
          <Text className="text-sm text-slate-500">Subtotal</Text>
          <Text className="text-sm text-slate-700">{formatCurrency(order.subtotal)}</Text>
        </View>
        <View className="flex-row justify-between mb-1">
          <Text className="text-sm text-slate-500">Delivery Fee</Text>
          <Text className="text-sm text-slate-700">{formatCurrency(order.deliveryFee)}</Text>
        </View>
        {order.discount > 0 && (
          <View className="flex-row justify-between mb-1">
            <Text className="text-sm text-slate-500">Discount</Text>
            <Text className="text-sm text-green-600">-{formatCurrency(order.discount)}</Text>
          </View>
        )}
        <View className="border-t border-slate-200 pt-2 flex-row justify-between mt-1">
          <Text className="text-base font-heading">Total</Text>
          <Text className="text-base font-heading">{formatCurrency(order.total)}</Text>
        </View>
      </View>

      {/* Delivery Address */}
      <View className="mb-4">
        <Text className="text-base font-heading text-slate-900 mb-2">Delivery Address</Text>
        <Text className="text-sm text-slate-600">
          {order.address.houseName}, {order.address.street}
        </Text>
        <Text className="text-sm text-slate-400">{order.address.pincode}</Text>
      </View>

      {/* Status Timeline */}
      {order.statusHistory.length > 0 && (
        <View className="mb-8">
          <Text className="text-base font-heading text-slate-900 mb-3">Timeline</Text>
          {order.statusHistory.map((event, i) => (
            <View key={i} className="flex-row mb-3">
              <View className="items-center mr-3">
                <View className={`w-3 h-3 rounded-full ${i === 0 ? "bg-primary-600" : "bg-slate-300"}`} />
                {i < order.statusHistory.length - 1 && <View className="w-0.5 h-6 bg-slate-200 mt-1" />}
              </View>
              <View>
                <Text className="text-sm font-sans-medium text-slate-700">
                  {STATUS_LABELS[event.status as keyof typeof STATUS_LABELS]}
                </Text>
                <Text className="text-xs text-slate-400">{formatDateTime(event.timestamp)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
