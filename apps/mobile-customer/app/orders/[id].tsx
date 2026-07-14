import { useState, useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { Truck } from "lucide-react-native";
import { api } from "@/services/api";
import type { OrderDetail } from "@msm/shared/types";
import { formatCurrency, formatDateTime, formatRelativeTime } from "@msm/shared/utils";
import { STATUS_LABELS } from "@msm/shared/constants";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

function statusVariant(status: string): "success" | "error" | "info" | "warning" | "default" {
  switch (status) {
    case "DELIVERED": return "success";
    case "CANCELLED": return "error";
    case "OUT_FOR_DELIVERY":
    case "ARRIVING": return "info";
    case "AWAITING_CUSTOMER_APPROVAL": return "warning";
    default: return "warning";
  }
}

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
        <ActivityIndicator color="#050505" />
      </View>
    );
  }

  if (!order) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-neutral-500">Order not found</Text>
      </View>
    );
  }

  const isActive = !["DELIVERED", "CANCELLED"].includes(order.status);

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: `Order #${order.orderNumber}`, headerTintColor: "#050505" }} />
      <ScrollView className="flex-1 bg-white px-4 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Status */}
        <View className="bg-neutral-50 rounded-xl p-4 mb-4 border border-neutral-100">
          <Text className="text-micro text-neutral-400 font-medium uppercase tracking-wide">
            Status
          </Text>
          <View className="flex-row items-center justify-between mt-1">
            <Text className="text-title font-bold text-neutral-900">
              {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS]}
            </Text>
            <Badge variant={statusVariant(order.status)} size="md">
              {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS]}
            </Badge>
          </View>
          {order.updatedAt && (
            <Text className="text-micro text-neutral-400 mt-2">
              Last updated: {formatRelativeTime(order.updatedAt)}
            </Text>
          )}
        </View>

        {/* Approval Required Banner */}
        {order.status === "AWAITING_CUSTOMER_APPROVAL" && (
          <View className="bg-amber-50 rounded-xl p-4 mb-4 border border-amber-200">
            <Text className="text-body font-bold text-amber-900 mb-1">
              Substitution Requires Approval
            </Text>
            <Text className="text-caption text-amber-700 mb-3">
              Your order has been modified. Please review and approve or reject the changes.
            </Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => {
                  api.post(`/orders/${id}/approve`).then(() => {
                    setOrder((prev) => prev ? { ...prev, status: "ACCEPTED" } : prev);
                  }).catch(() => {});
                }}
                className="flex-1 bg-green-600 rounded-lg py-2.5 items-center"
              >
                <Text className="text-white font-bold text-caption">Approve</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  api.post(`/orders/${id}/reject`).then(() => {
                    setOrder((prev) => prev ? { ...prev, status: "CANCELLED" } : prev);
                  }).catch(() => {});
                }}
                className="flex-1 bg-red-600 rounded-lg py-2.5 items-center"
              >
                <Text className="text-white font-bold text-caption">Reject</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Track Order Button */}
        {isActive && (
          <View className="mb-4">
            <Button
              onPress={() => router.push(`/orders/${id}/tracking`)}
              fullWidth
              variant="secondary"
              icon={<Truck size={16} color="#FFFFFF" />}
            >
              Track Order
            </Button>
          </View>
        )}

        {/* Order Info */}
        <View className="mb-4">
          <Text className="text-micro text-neutral-400">Order #{order.orderNumber}</Text>
          <Text className="text-micro text-neutral-400">{formatDateTime(order.createdAt)}</Text>
        </View>

        {/* Items */}
        <Text className="text-body font-bold text-neutral-900 mb-2">Items</Text>
        {order.items.map((item) => (
          <View key={item.id} className="flex-row py-3 border-b border-neutral-50">
            <View className="flex-1">
              <Text className="text-body font-medium text-neutral-800">{item.name}</Text>
              <Text className="text-micro text-neutral-400">{item.quantity} × {formatCurrency(item.price)}</Text>
            </View>
            <Text className="text-body font-bold text-neutral-900">
              {formatCurrency(item.price * item.quantity)}
            </Text>
          </View>
        ))}

        {/* Price Breakdown */}
        <View className="mt-4 bg-neutral-50 rounded-xl p-4 mb-4">
          <View className="flex-row justify-between mb-1.5">
            <Text className="text-caption text-neutral-500">Subtotal</Text>
            <Text className="text-caption font-medium text-neutral-700">{formatCurrency(order.subtotal)}</Text>
          </View>
          <View className="flex-row justify-between mb-1.5">
            <Text className="text-caption text-neutral-500">Delivery Fee</Text>
            <Text className="text-caption font-medium text-neutral-700">{formatCurrency(order.deliveryFee)}</Text>
          </View>
          {order.discount > 0 && (
            <View className="flex-row justify-between mb-1.5">
              <Text className="text-caption text-neutral-500">Discount</Text>
              <Text className="text-caption font-medium text-secondary-600">-{formatCurrency(order.discount)}</Text>
            </View>
          )}
          <View className="border-t border-neutral-200 pt-2.5 flex-row justify-between mt-1">
            <Text className="text-body font-bold text-neutral-900">Total</Text>
            <Text className="text-body font-bold text-neutral-900">{formatCurrency(order.total)}</Text>
          </View>
        </View>

        {/* Delivery Address */}
        <View className="mb-4">
          <Text className="text-body font-bold text-neutral-900 mb-2">Delivery Address</Text>
          <Text className="text-caption text-neutral-600">
            {order.address.houseName}, {order.address.street}
          </Text>
          <Text className="text-micro text-neutral-400">{order.address.pincode}</Text>
        </View>

        {/* Status Timeline */}
        {order.statusHistory.length > 0 && (
          <View className="mb-8">
            <Text className="text-body font-bold text-neutral-900 mb-3">Timeline</Text>
            {order.statusHistory.map((event, i) => (
              <View key={i} className="flex-row mb-3">
                <View className="items-center mr-3">
                  <View className={`w-3 h-3 rounded-full ${i === 0 ? "bg-primary-900" : "bg-neutral-300"}`} />
                  {i < order.statusHistory.length - 1 && <View className="w-0.5 h-6 bg-neutral-200 mt-1" />}
                </View>
                <View>
                  <Text className="text-caption font-medium text-neutral-700">
                    {STATUS_LABELS[event.status as keyof typeof STATUS_LABELS]}
                  </Text>
                  <Text className="text-micro text-neutral-400">{formatDateTime(event.timestamp)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}
