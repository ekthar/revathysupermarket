import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { api } from "@/services/api";
import { AnimatedScreen } from "@/components/AnimatedScreen";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { AnimatedFadeIn } from "@/components/AnimatedFadeIn";
import { ErrorBanner } from "@/components/ErrorBanner";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface StatusEvent {
  status: string;
  timestamp: string;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  acknowledgedAt: string | null;
  customerName: string;
  phone: string;
  address: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tip: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  statusEvents: StatusEvent[];
  createdAt: string;
}

/** Human-readable status labels */
const STATUS_LABELS: Record<string, string> = {
  ORDER_RECEIVED: "New",
  AWAITING_CUSTOMER_APPROVAL: "Customer Awaiting Approval",
  ACCEPTED: "Accepted",
  PACKING: "Packing",
  READY_FOR_DELIVERY: "Ready",
  OUT_FOR_DELIVERY: "On Way",
  ARRIVING: "Arriving",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  CUSTOMER_UNAVAILABLE: "Unavailable",
};

/** Color-coded pill styles per status */
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  ORDER_RECEIVED: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300" },
  AWAITING_CUSTOMER_APPROVAL: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-300" },
  ACCEPTED: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" },
  PACKING: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300" },
  READY_FOR_DELIVERY: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300" },
  OUT_FOR_DELIVERY: { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-300" },
  ARRIVING: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300" },
  DELIVERED: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300" },
  CANCELLED: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300" },
  CUSTOMER_UNAVAILABLE: { bg: "bg-slate-200 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300" },
};

export default function AdminOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      setError(null);
      const { data } = await api.get(`/mobile/v1/admin/orders/${id}`);
      setOrder(data.order);
    } catch {
      setError("Could not load order details. Pull to refresh.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  async function handleAcknowledge() {
    setActionLoading(true);
    try {
      await api.patch(`/mobile/v1/admin/orders/${id}/acknowledge`);
      await fetchOrder();
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.error ?? "Failed to acknowledge order");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStatusChange(newStatus: string, confirmMsg?: string) {
    if (confirmMsg) {
      const confirmed = await new Promise<boolean>((resolve) => {
        Alert.alert("Confirm", confirmMsg, [
          { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
          { text: "Confirm", onPress: () => resolve(true) },
        ]);
      });
      if (!confirmed) return;
    }
    setActionLoading(true);
    try {
      await api.patch(`/admin/orders/${id}`, { status: newStatus });
      await fetchOrder();
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.error ?? "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        "Cancel Order",
        "Are you sure you want to cancel this order? This cannot be undone.",
        [
          { text: "No", style: "cancel", onPress: () => resolve(false) },
          { text: "Yes, Cancel", style: "destructive", onPress: () => resolve(true) },
        ]
      );
    });
    if (!confirmed) return;
    setActionLoading(true);
    try {
      await api.patch(`/admin/orders/${id}`, { status: "CANCELLED" });
      await fetchOrder();
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.error ?? "Failed to cancel order");
    } finally {
      setActionLoading(false);
    }
  }

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
        {error ? (
          <ErrorBanner message={error} onRetry={fetchOrder} />
        ) : (
          <Text className="text-slate-500 dark:text-slate-400">Order not found</Text>
        )}
      </View>
    );
  }

  const statusStyle = STATUS_COLORS[order.status] ?? { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-300" };
  const statusLabel = STATUS_LABELS[order.status] ?? order.status;

  return (
    <AnimatedScreen className="flex-1 bg-white dark:bg-slate-950">
      <ScrollView
        className="flex-1 bg-white dark:bg-slate-950"
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchOrder(); }}
            colors={["#059669"]}
          />
        }
      >
        {/* Header */}
        <View className="flex-row items-center mb-4 pt-10">
          <AnimatedPressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mr-3"
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text className="text-lg">←</Text>
          </AnimatedPressable>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-slate-900 dark:text-white">#{order.orderNumber}</Text>
          </View>
          <View className={`px-3 py-1.5 rounded-full ${statusStyle.bg}`}>
            <Text className={`text-xs font-bold ${statusStyle.text}`}>{statusLabel}</Text>
          </View>
        </View>

        {error && <ErrorBanner message={error} onRetry={fetchOrder} />}

        {/* Customer Info */}
        <AnimatedFadeIn index={0}>
          <View className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 mb-3">
            <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Customer</Text>
            <Text className="text-sm font-semibold text-slate-900 dark:text-white">{order.customerName}</Text>
            <AnimatedPressable
              onPress={() => Linking.openURL(`tel:${order.phone}`)}
              className="mt-1"
              accessibilityRole="button"
              accessibilityLabel={`Call ${order.phone}`}
            >
              <Text className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">📞 {order.phone}</Text>
            </AnimatedPressable>
            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-2">📍 {order.address}</Text>
          </View>
        </AnimatedFadeIn>

        {/* Items */}
        <AnimatedFadeIn index={1}>
          <View className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 mb-3">
            <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">Items</Text>
            {order.items.map((item, i) => (
              <View key={item.id ?? i} className="flex-row justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <View className="flex-1 mr-2">
                  <Text className="text-sm text-slate-700 dark:text-slate-300">{item.name}</Text>
                  <Text className="text-xs text-slate-400 dark:text-slate-500">{item.quantity} × ₹{Number(item.price).toFixed(2)}</Text>
                </View>
                <Text className="text-sm font-bold text-slate-900 dark:text-white">₹{(item.price * item.quantity).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </AnimatedFadeIn>

        {/* Price Breakdown */}
        <AnimatedFadeIn index={2}>
          <View className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 mb-3">
            <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">Price Breakdown</Text>
            <PriceRow label="Subtotal" value={order.subtotal} />
            {order.discount > 0 && <PriceRow label="Discount" value={-order.discount} color="text-red-500 dark:text-red-400" />}
            <PriceRow label="Delivery Fee" value={order.deliveryFee} />
            {order.tip > 0 && <PriceRow label="Tip" value={order.tip} />}
            <View className="flex-row justify-between pt-3 mt-2 border-t border-slate-200 dark:border-slate-700">
              <Text className="text-base font-bold text-slate-900 dark:text-white">Total</Text>
              <Text className="text-base font-bold text-emerald-700 dark:text-emerald-400">₹{Number(order.total).toFixed(2)}</Text>
            </View>
          </View>
        </AnimatedFadeIn>

        {/* Payment Info */}
        <AnimatedFadeIn index={3}>
          <View className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 mb-3">
            <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Payment</Text>
            <View className="flex-row justify-between">
              <Text className="text-sm text-slate-700 dark:text-slate-300">Method</Text>
              <Text className="text-sm font-bold text-slate-900 dark:text-white">{order.paymentMethod ?? "—"}</Text>
            </View>
            <View className="flex-row justify-between mt-1">
              <Text className="text-sm text-slate-700 dark:text-slate-300">Status</Text>
              <Text className="text-sm font-bold text-slate-900 dark:text-white">{order.paymentStatus ?? "—"}</Text>
            </View>
          </View>
        </AnimatedFadeIn>

        {/* Status Timeline */}
        {order.statusEvents && order.statusEvents.length > 0 && (
          <AnimatedFadeIn index={4}>
            <View className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 mb-3">
              <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">Timeline</Text>
              {order.statusEvents.map((event, i) => {
                const isLast = i === order.statusEvents.length - 1;
                return (
                  <View key={i} className="flex-row">
                    <View className="items-center mr-3">
                      <View className={`w-3 h-3 rounded-full ${isLast ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`} />
                      {!isLast && <View className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-700 my-0.5" />}
                    </View>
                    <View className={`flex-1 ${!isLast ? "pb-4" : ""}`}>
                      <Text className="text-sm font-semibold text-slate-900 dark:text-white">
                        {STATUS_LABELS[event.status] ?? event.status}
                      </Text>
                      <Text className="text-xs text-slate-400 dark:text-slate-500">
                        {new Date(event.timestamp).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </AnimatedFadeIn>
        )}

        {/* Quick Action Row */}
        <AnimatedFadeIn index={5}>
          <View className="flex-row gap-3 mb-3">
            <AnimatedPressable
              onPress={() => router.push(`/(admin)/order/${id}/stock-check` as any)}
              className="flex-1 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl items-center justify-center border border-slate-200 dark:border-slate-700"
              accessibilityRole="button"
              accessibilityLabel="Stock Check"
            >
              <Text className="text-sm font-bold text-slate-700 dark:text-slate-200">📋 Stock Check</Text>
            </AnimatedPressable>
            <AnimatedPressable
              onPress={() => router.push(`/(admin)/order/${id}/bill` as any)}
              className="flex-1 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl items-center justify-center border border-slate-200 dark:border-slate-700"
              accessibilityRole="button"
              accessibilityLabel="View Bill"
            >
              <Text className="text-sm font-bold text-slate-700 dark:text-slate-200">🧾 View Bill</Text>
            </AnimatedPressable>
          </View>
        </AnimatedFadeIn>

        {/* Contextual Action Buttons */}
        <AnimatedFadeIn index={6}>
          <View className="gap-3 mb-8">
            {/* ORDER_RECEIVED without acknowledgedAt → Start Stock Review */}
            {order.status === "ORDER_RECEIVED" && !order.acknowledgedAt && (
              <AnimatedPressable
                onPress={handleAcknowledge}
                disabled={actionLoading}
                className={`h-14 rounded-xl items-center justify-center ${actionLoading ? "bg-emerald-400" : "bg-emerald-600"}`}
                accessibilityRole="button"
                accessibilityLabel="Start Stock Review"
              >
                {actionLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold">📦 Start Stock Review</Text>
                )}
              </AnimatedPressable>
            )}

            {/* ORDER_RECEIVED with acknowledgedAt → Stock OK (accept) */}
            {order.status === "ORDER_RECEIVED" && order.acknowledgedAt && (
              <AnimatedPressable
                onPress={() => handleStatusChange("ACCEPTED")}
                disabled={actionLoading}
                className={`h-14 rounded-xl items-center justify-center ${actionLoading ? "bg-emerald-400" : "bg-emerald-600"}`}
                accessibilityRole="button"
                accessibilityLabel="Stock OK, accept order"
              >
                {actionLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold">✓ Stock OK — Accept</Text>
                )}
              </AnimatedPressable>
            )}

            {/* ACCEPTED → Start Packing */}
            {order.status === "ACCEPTED" && (
              <AnimatedPressable
                onPress={() => handleStatusChange("PACKING")}
                disabled={actionLoading}
                className={`h-14 rounded-xl items-center justify-center ${actionLoading ? "bg-purple-400" : "bg-purple-600"}`}
                accessibilityRole="button"
                accessibilityLabel="Start Packing"
              >
                {actionLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold">📦 Start Packing</Text>
                )}
              </AnimatedPressable>
            )}

            {/* PACKING → Mark Packed */}
            {order.status === "PACKING" && (
              <AnimatedPressable
                onPress={() => handleStatusChange("READY_FOR_DELIVERY")}
                disabled={actionLoading}
                className={`h-14 rounded-xl items-center justify-center ${actionLoading ? "bg-amber-400" : "bg-amber-500"}`}
                accessibilityRole="button"
                accessibilityLabel="Mark Packed"
              >
                {actionLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold">✓ Mark Packed</Text>
                )}
              </AnimatedPressable>
            )}

            {/* READY_FOR_DELIVERY → Assign Delivery */}
            {order.status === "READY_FOR_DELIVERY" && (
              <AnimatedPressable
                onPress={() => router.push(`/(admin)/order/${id}/assign` as any)}
                className="h-14 bg-blue-600 rounded-xl items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Assign Delivery"
              >
                <Text className="text-white font-bold">🚚 Assign Delivery</Text>
              </AnimatedPressable>
            )}

            {/* Cancel Order (except DELIVERED/CANCELLED) */}
            {!["DELIVERED", "CANCELLED"].includes(order.status) && (
              <AnimatedPressable
                onPress={handleCancel}
                disabled={actionLoading}
                className="h-14 bg-red-500 dark:bg-red-600 rounded-xl items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Cancel Order"
              >
                <Text className="text-white font-bold">✕ Cancel Order</Text>
              </AnimatedPressable>
            )}
          </View>
        </AnimatedFadeIn>
      </ScrollView>
    </AnimatedScreen>
  );
}

function PriceRow({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className="text-sm text-slate-600 dark:text-slate-300">{label}</Text>
      <Text className={`text-sm font-semibold ${color ?? "text-slate-900 dark:text-white"}`}>
        {value < 0 ? `−₹${Math.abs(value).toFixed(2)}` : `₹${Number(value).toFixed(2)}`}
      </Text>
    </View>
  );
}
