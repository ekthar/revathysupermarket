import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TextInput, RefreshControl, ScrollView, Vibration } from "react-native";
import { router } from "expo-router";
import { api } from "@/services/api";
import { AnimatedScreen } from "@/components/AnimatedScreen";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { AnimatedFadeIn } from "@/components/AnimatedFadeIn";
import { OrderRowSkeleton } from "@/components/ui";

interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
  printedAt: string | null;
}

const STATUS_TABS = ["all", "new", "packing", "ready", "delivering", "delivered"] as const;
type Tab = typeof STATUS_TABS[number];

const TAB_FILTER: Record<Tab, string[]> = {
  all: [],
  new: ["ORDER_RECEIVED"],
  packing: ["ACCEPTED", "PACKING"],
  ready: ["READY_FOR_DELIVERY"],
  delivering: ["OUT_FOR_DELIVERY", "ARRIVING"],
  delivered: ["DELIVERED"],
};

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

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("all");

  const fetchOrders = useCallback(async () => {
    try {
      setError(null);
      const { data } = await api.get("/admin/orders");
      setOrders(data.orders ?? []);
    } catch {
      setError("Could not load orders. Pull to refresh.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filtered = orders.filter((o) => {
    const matchesTab = TAB_FILTER[tab].length === 0 || TAB_FILTER[tab].includes(o.status);
    const matchesSearch = !search || o.orderNumber.includes(search) || o.customerName.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-900" accessibilityLabel="Loading orders">
        <View className="bg-white dark:bg-slate-950 px-5 pt-14 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Text className="text-2xl font-bold text-slate-900 dark:text-white">Orders</Text>
        </View>
        <View className="px-4 pt-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <OrderRowSkeleton key={i} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <AnimatedScreen className="flex-1 bg-slate-50 dark:bg-slate-900">
      <View className="bg-white dark:bg-slate-950 px-5 pt-14 pb-3 border-b border-slate-100 dark:border-slate-800">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">Orders</Text>
        <TextInput
          className="mt-3 h-11 bg-slate-100 dark:bg-slate-800 rounded-xl px-4 text-sm text-slate-900 dark:text-white"
          placeholder="Search order # or customer"
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
          accessibilityLabel="Search orders"
          accessibilityHint="Search by order number or customer name"
        />
        <ScrollableTabBar tabs={STATUS_TABS} active={tab} onSelect={setTab} />
      </View>

      {/* Error banner */}
      {error && (
        <View className="mx-4 mt-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-3" accessibilityRole="alert">
          <Text className="text-sm font-semibold text-red-700 dark:text-red-300">{error}</Text>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={["#059669"]} />}
        renderItem={({ item, index }) => {
          const statusStyle = STATUS_COLORS[item.status] ?? { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-300" };
          const statusLabel = STATUS_LABELS[item.status] ?? item.status;
          return (
            <AnimatedFadeIn index={Math.min(index, 8)} entranceKey={`admin-orders:${item.id}`}>
              <AnimatedPressable
                className="bg-white dark:bg-slate-950 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm"
                accessibilityRole="button"
                accessibilityLabel={`Order ${item.orderNumber}, ${item.customerName}, ${statusLabel}, ${item.total} rupees`}
                onPress={() => { Vibration.vibrate(5); router.push(`/(admin)/order/${item.id}` as any); }}
                haptic={false}
              >
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm font-bold text-slate-900 dark:text-white">#{item.orderNumber}</Text>
                  <Text className="text-sm font-bold text-slate-900 dark:text-white">₹{Number(item.total).toFixed(2)}</Text>
                </View>
                <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1" numberOfLines={1}>{item.customerName}</Text>
                <View className="flex-row justify-between items-center mt-2.5">
                  <View className={`px-2.5 py-1 rounded-full ${statusStyle.bg}`}>
                    <Text className={`text-xs font-bold ${statusStyle.text}`}>{statusLabel}</Text>
                  </View>
                  <View className="flex-row gap-2">
                    {item.printedAt ? (
                      <View className="bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                        <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Printed</Text>
                      </View>
                    ) : (
                      <View className="bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
                        <Text className="text-xs font-bold text-red-600 dark:text-red-300">Unprinted</Text>
                      </View>
                    )}
                  </View>
                </View>
              </AnimatedPressable>
            </AnimatedFadeIn>
          );
        }}
        ListEmptyComponent={
          <View className="items-center justify-center py-16 px-8">
            <Text className="text-3xl mb-3">📋</Text>
            <Text className="text-lg font-bold text-slate-700 dark:text-slate-300 text-center">No orders found</Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mt-1">
              {search ? "Try a different search term." : "Orders will appear here once customers place them."}
            </Text>
          </View>
        }
      />
    </AnimatedScreen>
  );
}

function ScrollableTabBar({ tabs, active, onSelect }: { tabs: readonly string[]; active: string; onSelect: (t: any) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3" contentContainerStyle={{ gap: 8 }}>
      {tabs.map((t) => (
        <AnimatedPressable
          key={t}
          onPress={() => { onSelect(t); Vibration.vibrate(5); }}
          haptic={false}
          className={`px-4 min-h-[44px] justify-center rounded-full ${active === t ? "bg-emerald-600" : "bg-slate-100 dark:bg-slate-800"}`}
          accessibilityRole="tab"
          accessibilityState={{ selected: active === t }}
          accessibilityLabel={`Filter: ${t}`}
        >
          <Text className={`text-xs font-bold capitalize ${active === t ? "text-white" : "text-slate-600 dark:text-slate-300"}`}>{t}</Text>
        </AnimatedPressable>
      ))}
    </ScrollView>
  );
}
