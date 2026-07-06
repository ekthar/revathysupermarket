import { useEffect, useState } from "react";
import { View, Text, ScrollView, Alert, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { api } from "@/services/api";
import { AnimatedScreen } from "@/components/AnimatedScreen";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { AnimatedFadeIn } from "@/components/AnimatedFadeIn";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  packed: boolean;
}

interface PackOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  items: OrderItem[];
}

export default function PackOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<PackOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [packedItems, setPackedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.get(`/packing/orders/${id}`).then(({ data }) => {
      setOrder(data.order);
    }).catch(() => null).finally(() => setLoading(false));
  }, [id]);

  function togglePacked(itemId: string) {
    setPackedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  async function markReady() {
    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        "Mark as ready?",
        "Ensure all items are packed correctly. This will notify the delivery partner.",
        [
          { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
          { text: "Mark Ready", onPress: () => resolve(true) },
        ]
      );
    });
    if (!confirmed) return;

    setMarking(true);
    try {
      await api.patch(`/packing/orders/${id}/ready`);
      Alert.alert("Done!", "Order marked as ready for delivery.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.error ?? "Failed to update order");
    } finally {
      setMarking(false);
    }
  }

  async function printInvoice() {
    try {
      await api.post(`/orders/${id}/print`);
      Alert.alert("Print Recorded", "Invoice print has been tracked.");
    } catch {
      Alert.alert("Error", "Failed to record print");
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-slate-950">
        <ActivityIndicator size="large" color="#7c3aed" />
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

  const allPacked = order.items.length > 0 && packedItems.size === order.items.length;

  return (
    <AnimatedScreen className="flex-1 bg-white dark:bg-slate-950">
      <ScrollView className="flex-1 bg-white dark:bg-slate-950" contentContainerStyle={{ padding: 20 }}>
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">Pack #{order.orderNumber}</Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1">{order.customerName} • ₹{Number(order.total).toFixed(2)}</Text>

        <View className="mt-6 gap-2">
          <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
            Items ({packedItems.size}/{order.items.length} packed)
          </Text>
          {order.items.map((item, i) => {
            const isPacked = packedItems.has(item.id);
            return (
              <AnimatedFadeIn key={item.id} index={Math.min(i, 8)}>
                <AnimatedPressable
                  onPress={() => togglePacked(item.id)}
                  className={`flex-row items-center p-4 rounded-xl border ${
                    isPacked
                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  }`}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isPacked }}
                  accessibilityLabel={`${item.name}, quantity ${item.quantity}`}
                >
                  <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
                    isPacked ? "bg-emerald-500 border-emerald-500" : "border-slate-300 dark:border-slate-600"
                  }`}>
                    {isPacked && <Text className="text-white text-xs font-bold">✓</Text>}
                  </View>
                  <View className="flex-1">
                    <Text className={`text-sm font-semibold ${isPacked ? "text-emerald-800 dark:text-emerald-300 line-through" : "text-slate-900 dark:text-white"}`}>
                      {item.name}
                    </Text>
                    <Text className="text-xs text-slate-500 dark:text-slate-400">Qty: {item.quantity}</Text>
                  </View>
                  <Text className="text-sm font-bold text-slate-700 dark:text-slate-200">₹{(item.price * item.quantity).toFixed(2)}</Text>
                </AnimatedPressable>
              </AnimatedFadeIn>
            );
          })}
        </View>

        <View className="mt-8 gap-3">
          <AnimatedPressable
            onPress={printInvoice}
            className="h-12 border border-slate-200 dark:border-slate-700 rounded-xl items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Print invoice"
          >
            <Text className="text-slate-700 dark:text-slate-200 font-bold">🖨️ Print Invoice</Text>
          </AnimatedPressable>

          <AnimatedPressable
            onPress={markReady}
            disabled={!allPacked || marking}
            className={`h-14 rounded-xl items-center justify-center ${
              allPacked && !marking ? "bg-purple-600" : "bg-slate-300 dark:bg-slate-700"
            }`}
            accessibilityRole="button"
            accessibilityLabel={allPacked ? "Mark ready for delivery" : "Pack all items first"}
          >
            {marking ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold">
                {allPacked ? "✓ Mark Ready for Delivery" : "Pack all items first"}
              </Text>
            )}
          </AnimatedPressable>

          <AnimatedPressable
            onPress={() => router.push(`/(packing)/order/${id}/damage` as any)}
            className="h-12 border border-red-200 dark:border-red-800 rounded-xl items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Report damaged items"
          >
            <Text className="text-red-500 dark:text-red-400 font-bold">⚠️ Report Damaged Items</Text>
          </AnimatedPressable>
        </View>
      </ScrollView>
    </AnimatedScreen>
  );
}
