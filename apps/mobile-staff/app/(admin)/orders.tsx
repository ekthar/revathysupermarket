import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, Pressable, TextInput, RefreshControl, ActivityIndicator } from "react-native";
import { api } from "@/services/api";

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

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("all");

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/orders");
      setOrders(data.orders ?? []);
    } catch {} finally {
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
    return <View className="flex-1 items-center justify-center bg-white"><ActivityIndicator size="large" color="#059669" /></View>;
  }

  return (
    <View className="flex-1 bg-slate-50">
      <View className="bg-white px-5 pt-14 pb-3 border-b border-slate-100">
        <Text className="text-2xl font-bold text-slate-900">Orders</Text>
        <TextInput
          className="mt-3 h-10 bg-slate-100 rounded-xl px-4 text-sm"
          placeholder="Search order # or customer"
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
        <ScrollableTabBar tabs={STATUS_TABS} active={tab} onSelect={setTab} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={["#059669"]} />}
        renderItem={({ item }) => (
          <View className="bg-white rounded-xl p-4 border border-slate-100">
            <View className="flex-row justify-between">
              <Text className="text-sm font-bold text-slate-900">#{item.orderNumber}</Text>
              <Text className="text-sm font-bold text-slate-900">₹{Number(item.total).toFixed(2)}</Text>
            </View>
            <Text className="text-xs text-slate-500 mt-1">{item.customerName}</Text>
            <View className="flex-row justify-between mt-2">
              <View className="bg-slate-100 px-2 py-0.5 rounded-full">
                <Text className="text-xs font-bold text-slate-600">{item.status}</Text>
              </View>
              {item.printedAt && (
                <View className="bg-emerald-100 px-2 py-0.5 rounded-full">
                  <Text className="text-xs font-bold text-emerald-700">Printed</Text>
                </View>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={<Text className="text-center text-slate-400 mt-10">No orders found</Text>}
      />
    </View>
  );
}

function ScrollableTabBar({ tabs, active, onSelect }: { tabs: readonly string[]; active: string; onSelect: (t: any) => void }) {
  return (
    <View className="flex-row gap-2 mt-3">
      {tabs.map((t) => (
        <Pressable key={t} onPress={() => onSelect(t)} className={`px-3 py-1.5 rounded-full ${active === t ? "bg-emerald-600" : "bg-slate-100"}`}>
          <Text className={`text-xs font-bold capitalize ${active === t ? "text-white" : "text-slate-600"}`}>{t}</Text>
        </Pressable>
      ))}
    </View>
  );
}
