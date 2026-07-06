import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TextInput, RefreshControl, Vibration } from "react-native";
import { router } from "expo-router";
import { api } from "@/services/api";
import { AnimatedScreen } from "@/components/AnimatedScreen";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { AnimatedFadeIn } from "@/components/AnimatedFadeIn";
import { ErrorBanner } from "@/components/ErrorBanner";
import { OrderRowSkeleton } from "@/components/ui";

interface DispatchOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  itemsCount: number;
  status: string;
  createdAt: string;
}

export default function AdminDispatchScreen() {
  const [orders, setOrders] = useState<DispatchOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      setError(null);
      const { data } = await api.get("/mobile/v1/admin/dispatch");
      setOrders(data.orders ?? []);
    } catch {
      setError("Could not load ready orders. Pull to refresh.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filtered = orders.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return o.orderNumber.includes(q) || o.customerName.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-900" accessibilityLabel="Loading dispatch orders">
        <View className="bg-white dark:bg-slate-950 px-5 pt-14 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Text className="text-2xl font-bold text-slate-900 dark:text-white">Dispatch</Text>
        </View>
        <View className="px-4 pt-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <OrderRowSkeleton key={i} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <AnimatedScreen className="flex-1 bg-slate-50 dark:bg-slate-900">
      <View className="bg-white dark:bg-slate-950 px-5 pt-14 pb-3 border-b border-slate-100 dark:border-slate-800">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">Dispatch</Text>
        <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Orders ready for delivery
        </Text>
        <TextInput
          className="mt-3 h-11 bg-slate-100 dark:bg-slate-800 rounded-xl px-4 text-sm text-slate-900 dark:text-white"
          placeholder="Search order # or customer"
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
          accessibilityLabel="Search dispatch orders"
          accessibilityHint="Search by order number or customer name"
        />
      </View>

      {error && (
        <ErrorBanner
          message={error}
          onRetry={() => { setLoading(true); fetchOrders(); }}
          onDismiss={() => setError(null)}
        />
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchOrders(); }}
            colors={["#059669"]}
          />
        }
        renderItem={({ item, index }) => (
          <AnimatedFadeIn index={Math.min(index, 8)} entranceKey={`dispatch:${item.id}`}>
            <View className="bg-white dark:bg-slate-950 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
              <View className="flex-row justify-between items-center">
                <Text className="text-sm font-bold text-slate-900 dark:text-white">
                  #{item.orderNumber}
                </Text>
                <Text className="text-sm font-bold text-slate-900 dark:text-white">
                  ₹{Number(item.total).toFixed(2)}
                </Text>
              </View>
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1" numberOfLines={1}>
                {item.customerName}
              </Text>
              <View className="flex-row items-center mt-2.5 gap-2">
                <View className="bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 rounded-full">
                  <Text className="text-xs font-bold text-amber-700 dark:text-amber-300">Ready</Text>
                </View>
                <Text className="text-xs text-slate-400 dark:text-slate-500">
                  {item.itemsCount} item{item.itemsCount !== 1 ? "s" : ""}
                </Text>
              </View>
              <View className="flex-row justify-end mt-3 pt-3 border-t border-slate-50 dark:border-slate-800">
                <AnimatedPressable
                  className="bg-emerald-600 px-5 py-2.5 rounded-xl"
                  accessibilityRole="button"
                  accessibilityLabel={`Dispatch order ${item.orderNumber}`}
                  onPress={() => { Vibration.vibrate(5); router.push(`/(admin)/order/${item.id}/assign` as any); }}
                  haptic={false}
                >
                  <Text className="text-sm font-bold text-white">Dispatch</Text>
                </AnimatedPressable>
              </View>
            </View>
          </AnimatedFadeIn>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-16 px-8">
            <Text className="text-3xl mb-3">🚚</Text>
            <Text className="text-lg font-bold text-slate-700 dark:text-slate-300 text-center">
              No orders ready for dispatch
            </Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mt-1">
              {search ? "Try a different search term." : "Ready-for-delivery orders will appear here."}
            </Text>
          </View>
        }
      />
    </AnimatedScreen>
  );
}
