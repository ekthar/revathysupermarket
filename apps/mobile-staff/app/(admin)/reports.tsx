import { useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { api } from "@/services/api";

type Period = "week" | "month" | "quarter";

interface SalesData {
  totalOrders: number;
  totalRevenue: string;
  avgOrderValue: string;
  periodStart: string;
  periodEnd: string;
}

interface ProfitData {
  totalRevenue: string;
  totalCost: string;
  grossProfit: string;
  profitMarginPercent: string;
}

interface FastMovingItem {
  productId: string;
  name: string;
  category: string;
  totalQuantity: number;
  totalRevenue: string;
}

export default function AdminReportsScreen() {
  const [activeTab, setActiveTab] = useState<"sales" | "profit" | "fast">("sales");
  const [period, setPeriod] = useState<Period>("week");
  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState<SalesData | null>(null);
  const [profit, setProfit] = useState<ProfitData | null>(null);
  const [fastItems, setFastItems] = useState<FastMovingItem[]>([]);

  async function fetchReport() {
    setLoading(true);
    try {
      if (activeTab === "sales") {
        const { data } = await api.get(`/reports/sales?period=${period}`);
        setSales(data);
      } else if (activeTab === "profit") {
        const { data } = await api.get(`/reports/profit?period=${period}`);
        setProfit(data);
      } else {
        const { data } = await api.get("/reports/fast-moving-items");
        setFastItems(data.items ?? []);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 20 }}>
      <Text className="text-2xl font-bold text-slate-900 pt-10 mb-4">Reports</Text>

      {/* Tab selector */}
      <View className="flex-row gap-2 mb-4">
        {(["sales", "profit", "fast"] as const).map((t) => (
          <Pressable key={t} onPress={() => setActiveTab(t)} className={`px-4 py-2 rounded-xl ${activeTab === t ? "bg-emerald-600" : "bg-slate-100"}`}>
            <Text className={`text-sm font-bold capitalize ${activeTab === t ? "text-white" : "text-slate-600"}`}>{t === "fast" ? "Fast Moving" : t}</Text>
          </Pressable>
        ))}
      </View>

      {/* Period selector (for sales and profit) */}
      {activeTab !== "fast" && (
        <View className="flex-row gap-2 mb-4">
          {(["week", "month", "quarter"] as Period[]).map((p) => (
            <Pressable key={p} onPress={() => setPeriod(p)} className={`px-3 py-1.5 rounded-full border ${period === p ? "border-emerald-600 bg-emerald-50" : "border-slate-200"}`}>
              <Text className={`text-xs font-bold capitalize ${period === p ? "text-emerald-700" : "text-slate-500"}`}>{p}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Pressable onPress={fetchReport} className="h-11 bg-emerald-600 rounded-xl items-center justify-center mb-6">
        <Text className="text-white font-bold">Load Report</Text>
      </Pressable>

      {loading && <ActivityIndicator size="small" color="#059669" />}

      {/* Sales Results */}
      {activeTab === "sales" && sales && !loading && (
        <View className="bg-slate-50 rounded-2xl p-4 gap-3">
          <Row label="Total Orders" value={String(sales.totalOrders)} />
          <Row label="Total Revenue" value={`₹${sales.totalRevenue}`} />
          <Row label="Avg Order Value" value={`₹${sales.avgOrderValue}`} />
          <Row label="Period" value={`${sales.periodStart} — ${sales.periodEnd}`} />
        </View>
      )}

      {/* Profit Results */}
      {activeTab === "profit" && profit && !loading && (
        <View className="bg-slate-50 rounded-2xl p-4 gap-3">
          <Row label="Revenue" value={`₹${profit.totalRevenue}`} />
          <Row label="Cost" value={`₹${profit.totalCost}`} />
          <Row label="Gross Profit" value={`₹${profit.grossProfit}`} />
          <Row label="Margin" value={`${profit.profitMarginPercent}%`} />
        </View>
      )}

      {/* Fast Moving Items */}
      {activeTab === "fast" && fastItems.length > 0 && !loading && (
        <View className="gap-2">
          {fastItems.map((item, i) => (
            <View key={item.productId} className="bg-slate-50 rounded-xl p-3 flex-row justify-between">
              <View className="flex-1">
                <Text className="text-sm font-bold text-slate-900">{i + 1}. {item.name}</Text>
                <Text className="text-xs text-slate-500">{item.category}</Text>
              </View>
              <View className="items-end">
                <Text className="text-sm font-bold text-slate-900">×{item.totalQuantity}</Text>
                <Text className="text-xs text-slate-500">₹{item.totalRevenue}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-sm text-slate-600">{label}</Text>
      <Text className="text-sm font-bold text-slate-900">{value}</Text>
    </View>
  );
}
