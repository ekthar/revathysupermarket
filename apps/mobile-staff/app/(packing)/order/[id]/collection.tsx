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
  packed: boolean;
}

interface DamageItem {
  id: string;
  name: string;
  quantity: number;
  reason?: string;
}

interface PackOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  items: OrderItem[];
}

export default function PackingCollectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<PackOrder | null>(null);
  const [damageItems, setDamageItems] = useState<DamageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    api.get(`/packing/orders/${id}`)
      .then(({ data }) => {
        setOrder(data.order);
        setDamageItems(data.damageItems ?? []);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [id]);

  async function markReady() {
    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        "Mark as Ready for Delivery?",
        "This will notify the delivery team. Ensure all items are packed correctly.",
        [
          { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
          { text: "Mark Ready", onPress: () => resolve(true) },
        ]
      );
    });
    if (!confirmed) return;

    setMarking(true);
    try {
      await api.post(`/packing/orders/${id}/ready`);
      Alert.alert("Ready!", "Order has been marked ready for delivery.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.error ?? "Failed to mark order as ready");
    } finally {
      setMarking(false);
    }
  }

  function completePacking() {
    router.replace("/(packing)");
  }

  function goToDamageReport() {
    router.push(`/orders/${id}/damage` as any);
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

  const packedCount = order.items.filter((i) => i.packed).length;
  const totalItems = order.items.length;

  return (
    <AnimatedScreen className="flex-1 bg-white dark:bg-slate-950">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">Order Complete</Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review and finalize packing</Text>

        <AnimatedFadeIn>
          <View className="mt-6 bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
            <Text className="text-lg font-bold text-slate-900 dark:text-white">#{order.orderNumber}</Text>
            <Text className="text-sm text-slate-600 dark:text-slate-400 mt-1">{order.customerName}</Text>

            <View className="h-px bg-slate-200 dark:bg-slate-700 my-4" />

            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-slate-500 dark:text-slate-400">Total Value</Text>
              <Text className="text-lg font-bold text-slate-900 dark:text-white">₹{Number(order.total).toFixed(2)}</Text>
            </View>

            <View className="flex-row justify-between items-center mt-3">
              <Text className="text-sm text-slate-500 dark:text-slate-400">Items Packed</Text>
              <View className={`px-2.5 py-0.5 rounded-full ${packedCount === totalItems ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}>
                <Text className={`text-xs font-bold ${packedCount === totalItems ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>
                  {packedCount}/{totalItems}
                </Text>
              </View>
            </View>
          </View>
        </AnimatedFadeIn>

        {damageItems.length > 0 && (
          <AnimatedFadeIn>
            <View className="mt-4 bg-red-50 dark:bg-red-950/20 rounded-2xl p-5 border border-red-100 dark:border-red-900/30">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-sm font-bold text-red-700 dark:text-red-400">Damaged Items</Text>
                  <Text className="text-xs text-red-500 dark:text-red-400 mt-0.5">
                    {damageItems.length} item{damageItems.length !== 1 ? "s" : ""} reported
                  </Text>
                </View>
                <View className="bg-red-100 dark:bg-red-900/30 px-3 py-1.5 rounded-full">
                  <Text className="text-xs font-bold text-red-700 dark:text-red-300">{damageItems.length}</Text>
                </View>
              </View>
              {damageItems.map((item) => (
                <View key={item.id} className="flex-row justify-between items-center mt-3 pt-3 border-t border-red-100 dark:border-red-900/30">
                  <Text className="text-sm text-red-700 dark:text-red-400">{item.name}</Text>
                  <Text className="text-xs text-red-500 dark:text-red-400">Qty: {item.quantity}</Text>
                </View>
              ))}
            </View>
          </AnimatedFadeIn>
        )}

        <AnimatedPressable
          onPress={goToDamageReport}
          className="mt-3 h-12 border border-slate-200 dark:border-slate-700 rounded-xl items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Report damaged items"
        >
          <Text className="text-slate-700 dark:text-slate-200 font-bold">
            {damageItems.length > 0 ? "View Full Damage Report" : "Report Damaged Items"}
          </Text>
        </AnimatedPressable>

        <View className="mt-8 gap-3">
          <AnimatedPressable
            onPress={markReady}
            disabled={marking}
            className={`h-14 rounded-xl items-center justify-center ${marking ? "bg-purple-400" : "bg-purple-600"}`}
            accessibilityRole="button"
            accessibilityLabel="Mark order as ready for delivery"
          >
            {marking ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold">Mark as Ready for Delivery</Text>
            )}
          </AnimatedPressable>

          <AnimatedPressable
            onPress={completePacking}
            className="h-14 bg-emerald-600 rounded-xl items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Complete packing and return to queue"
          >
            <Text className="text-white font-bold">Complete Packing</Text>
          </AnimatedPressable>
        </View>
      </ScrollView>
    </AnimatedScreen>
  );
}
