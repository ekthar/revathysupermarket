import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { api } from "@/services/api";
import { AnimatedScreen } from "@/components/AnimatedScreen";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { AnimatedFadeIn } from "@/components/AnimatedFadeIn";

interface StockItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface OrderData {
  id: string;
  orderNumber: string;
  items: StockItem[];
}

export default function StockCheckScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifiedItems, setVerifiedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.get(`/mobile/v1/admin/orders/${id}`)
      .then(({ data }) => setOrder(data.order))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [id]);

  function toggleVerified(itemId: string) {
    setVerifiedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
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
        <Text className="text-slate-500 dark:text-slate-400">Order not found</Text>
      </View>
    );
  }

  const allVerified = order.items.length > 0 && verifiedItems.size === order.items.length;

  return (
    <AnimatedScreen className="flex-1 bg-white dark:bg-slate-950">
      <ScrollView className="flex-1 bg-white dark:bg-slate-950" contentContainerStyle={{ padding: 20 }}>
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
            <Text className="text-2xl font-bold text-slate-900 dark:text-white">Stock Check</Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400">Order #{order.orderNumber}</Text>
          </View>
        </View>

        {/* Verification Progress */}
        <AnimatedFadeIn index={0}>
          <View className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl p-4 mb-4 items-center">
            <Text className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
              {verifiedItems.size}/{order.items.length}
            </Text>
            <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mt-1">
              Items Verified
            </Text>
          </View>
        </AnimatedFadeIn>

        {/* Item Checklist */}
        <View className="gap-2 mb-6">
          <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
            Tap to verify stock availability
          </Text>
          {order.items.map((item, i) => {
            const isVerified = verifiedItems.has(item.id);
            return (
              <AnimatedFadeIn key={item.id} index={Math.min(i + 1, 8)} entranceKey={`stock-check:${item.id}`}>
                <AnimatedPressable
                  onPress={() => toggleVerified(item.id)}
                  className={`flex-row items-center p-4 rounded-xl border ${
                    isVerified
                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  }`}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isVerified }}
                  accessibilityLabel={`${item.name}, quantity ${item.quantity}`}
                >
                  <View
                    className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
                      isVerified ? "bg-emerald-500 border-emerald-500" : "border-slate-300 dark:border-slate-600"
                    }`}
                  >
                    {isVerified && <Text className="text-white text-xs font-bold">✓</Text>}
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-sm font-semibold ${
                        isVerified
                          ? "text-emerald-800 dark:text-emerald-300 line-through"
                          : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {item.name}
                    </Text>
                    <Text className="text-xs text-slate-500 dark:text-slate-400">Qty: {item.quantity}</Text>
                  </View>
                  <Text className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </Text>
                </AnimatedPressable>
              </AnimatedFadeIn>
            );
          })}
        </View>

        {/* Bottom Action */}
        <AnimatedPressable
          onPress={() => router.back()}
          disabled={!allVerified}
          className={`h-14 rounded-xl items-center justify-center ${
            allVerified ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
          }`}
          accessibilityRole="button"
          accessibilityLabel={allVerified ? "All items verified, go back" : "Verify all items first"}
        >
          <Text className="text-white font-bold">
            {allVerified ? "✓ All Items Verified" : "Verify all items first"}
          </Text>
        </AnimatedPressable>
      </ScrollView>
    </AnimatedScreen>
  );
}
