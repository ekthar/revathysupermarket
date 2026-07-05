import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Linking } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { api } from "@/services/api";
import { useDeliveryStore } from "@/stores/delivery";
import { locationService } from "@/services/location";
import type { OrderDetail } from "@msm/shared/types";
import { formatCurrency, formatDateTime } from "@msm/shared/utils";
import { STATUS_LABELS } from "@msm/shared/constants";
import { ErrorState } from "@/components/ui";
import { DeliveryMap } from "@/components/DeliveryMap";

export default function DeliveryOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [driverLoc, setDriverLoc] = useState<{ latitude: number; longitude: number } | null>(null);
  const { startTracking, stopTracking } = useDeliveryStore();

  const fetchOrder = () => {
    setIsLoading(true);
    setError(null);
    api.get(`/delivery/orders/${id}`).then(({ data }) => setOrder(data)).catch(() => setError("Failed to load order details")).finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchOrder(); }, [id]);

  useEffect(() => {
    if (order && (order.status === "OUT_FOR_DELIVERY" || order.status === "ARRIVING")) {
      locationService.getCurrentLocation().then(setDriverLoc);
    }
  }, [order?.status]);

  // Start GPS tracking when viewing an active order
  useEffect(() => {
    if (order && (order.status === "OUT_FOR_DELIVERY" || order.status === "ARRIVING")) {
      startTracking(order.id);
    }
    return () => { stopTracking(); };
  }, [order?.status]);

  if (isLoading) return <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-900"><ActivityIndicator color="#059669" size="large" /></View>;
  if (error) return <ErrorState message={error} onRetry={fetchOrder} />;
  if (!order) return <ErrorState message="Order not found" icon="🔍" />;

  const showPickup = order.status === "READY_FOR_DELIVERY";
  const showCollection = order.status === "OUT_FOR_DELIVERY" || order.status === "ARRIVING";
  const showComplete = order.status === "ARRIVING";

  return (
    <ScrollView className="flex-1 bg-white dark:bg-neutral-900 px-5 pt-4">
      {/* Status Badge */}
      <View className="bg-primary-50 dark:bg-primary-900/30 rounded-xl p-4 mb-4">
        <Text className="text-xs text-primary-600 dark:text-primary-400">Status</Text>
        <Text className="text-lg font-heading text-primary-900 dark:text-primary-100">
          {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS]}
        </Text>
      </View>

      {/* Customer Info */}
      <View className="mb-4">
        <Text className="text-base font-heading text-slate-900 dark:text-white mb-2">Customer</Text>
        <Text className="text-sm text-slate-700 dark:text-neutral-300">{order.customerName}</Text>
        <Text className="text-sm text-slate-500 dark:text-neutral-400 mt-0.5">{order.phone}</Text>
        <Text className="text-sm text-slate-500 dark:text-neutral-400 mt-1">{order.address.houseName}, {order.address.street}</Text>
        <Text className="text-xs text-slate-400 dark:text-neutral-500">{order.address.pincode}</Text>

        {/* Map */}
        {order.address.latitude && order.address.longitude && (
          <View className="mt-3" style={{ height: 200 }}>
            <DeliveryMap
              customerLat={order.address.latitude}
              customerLng={order.address.longitude}
              driverLat={driverLoc?.latitude}
              driverLng={driverLoc?.longitude}
            />
          </View>
        )}

        {/* Navigate Button */}
        {order.address.latitude && order.address.longitude && (
          <Pressable
            onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${order.address.latitude},${order.address.longitude}`)}
            className="mt-3 bg-primary-600 h-11 rounded-xl items-center justify-center flex-row"
          >
            <Text className="text-white font-sans-bold text-sm ml-1">Navigate</Text>
          </Pressable>
        )}
      </View>

      {/* Items */}
      <Text className="text-base font-heading text-slate-900 dark:text-white mb-2">Items ({order.items.length})</Text>
      {order.items.map((item) => (
        <View key={item.id} className="flex-row py-2 border-b border-slate-50 dark:border-neutral-700">
          <Text className="flex-1 text-sm text-slate-700 dark:text-neutral-300">{item.name}</Text>
          <Text className="text-sm text-slate-500 dark:text-neutral-400">{item.quantity} × {formatCurrency(item.price)}</Text>
        </View>
      ))}

      {/* Total */}
      <View className="flex-row justify-between mt-3 mb-6">
        <Text className="text-base font-heading text-slate-900 dark:text-white">Total</Text>
        <Text className="text-base font-heading text-slate-900 dark:text-white">{formatCurrency(order.total)}</Text>
      </View>

      {/* Payment Info */}
      <View className="bg-slate-50 dark:bg-neutral-800 rounded-xl p-4 mb-6">
        <View className="flex-row justify-between">
          <Text className="text-sm text-slate-500 dark:text-neutral-400">Payment Method</Text>
          <Text className="text-sm font-sans-medium text-slate-700 dark:text-neutral-200">{order.paymentMethod}</Text>
        </View>
        <View className="flex-row justify-between mt-2">
          <Text className="text-sm text-slate-500 dark:text-neutral-400">Payment Status</Text>
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
