import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Vibration } from "react-native";
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
  const [error, setError] = useState<string | null>(null);
  const [sales, setSales] = useState<SalesData | null>(null);
  const [profit, setProfit] = useState<ProfitData | null>(null);
  const [fastItems, setFastItems] = useState<FastMovingItem[]>([]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
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
    } catch {
      setError("Could not load report. Pull down to retry.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, period]);

  // Auto-fetch when tab or period changes — no manual "Load Report" button needed
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return (
    <ScrollView className="flex-1 bg-white dark:bg-slate-900" contentContainerStyle={{ padding: 20 }}>
      <Text className="text-2xl font-bold text-slate-900 dark:text-white pt-10 mb-4">Reports</Text>

      {/* Tab selector */}
      <View className="flex-row gap-2 mb-4" accessibilityRole="tablist">
        {(["sales", "profit", "fast"] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => { setActiveTab(t); Vibration.vibrate(5); }}
            className={`px-4 min-h-[44px] justify-center rounded-xl ${activeTab === t ? "bg-emerald-600" : "bg-slate-100 dark:bg-slate-800"}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === t }}
            accessibilityLabel={t === "fast" ? "Fast Moving Items" : `${t} report`}
          >
            <Text className={`text-sm font-bold capitalize ${activeTab === t ? "text-white" : "text-slate-600 dark:text-slate-300"}`}>
              {t === "fast" ? "Fast Moving" : t}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Period selector (for sales and profit) */}
      {activeTab !== "fast" && (
        <View className="flex-row gap-2 mb-4">
          {(["week", "month", "quarter"] as Period[]).map((p) => (
            <Pressable
              key={p}
              onPress={() => { setPeriod(p); Vibration.vibrate(5); }}
              className={`px-4 min-h-[44px] justify-center rounded-full border ${period === p ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" : "border-slate-200 dark:border-slate-700"}`}
              accessibilityRole="button"
              accessibilityState={{ selected: period === p }}
              accessibilityLabel={`Period: ${p}`}
            >
              <Text className={`text-xs font-bold capitalize ${period === p ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}>{p}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Loading state */}
      {loading && (
        <View className="items-center py-8">
          <ActivityIndicator size="small" color="#059669" />
          <Text className="text-xs text-slate-500 dark:text-slate-400 mt-2">Loading report...</Text>
        </View>
      )}

      {/* Error state */}
      {error && !loading && (
        <View className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4" accessibilityRole="alert">
          <Text className="text-sm font-semibold text-red-700 dark:text-red-300">{error}</Text>
          <Pressable onPress={fetchReport} className="mt-2" accessibilityRole="button" accessibilityLabel="Retry loading report">
            <Text className="text-sm font-bold text-emerald-600">Tap to retry</Text>
          </Pressable>
        </View>
      )}

      {/* Sales Results */}
      {activeTab === "sales" && sales && !loading && (
        <View className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 gap-3">
          <Row label="Total Orders" value={String(sales.totalOrders)} />
          <Row label="Total Revenue" value={`₹${sales.totalRevenue}`} />
          <Row label="Avg Order Value" value={`₹${sales.avgOrderValue}`} />
          <Row label="Period" value={`${sales.periodStart} — ${sales.periodEnd}`} />
        </View>
      )}

      {/* Profit Results */}
      {activeTab === "profit" && profit && !loading && (
        <View className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 gap-3">
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
            <View key={item.productId} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 flex-row justify-between" accessibilityLabel={`${item.name}, sold ${item.totalQuantity} units, revenue ${item.totalRevenue} rupees`}>
              <View className="flex-1">
                <Text className="text-sm font-bold text-slate-900 dark:text-white">{i + 1}. {item.name}</Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400">{item.category}</Text>
              </View>
              <View className="items-end">
                <Text className="text-sm font-bold text-slate-900 dark:text-white">×{item.totalQuantity}</Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400">₹{item.totalRevenue}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Empty state for fast moving with no data */}
      {activeTab === "fast" && fastItems.length === 0 && !loading && !error && (
        <View className="items-center py-12">
          <Text className="text-3xl mb-3">📊</Text>
          <Text className="text-base font-bold text-slate-700 dark:text-slate-300">No data yet</Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mt-1">Fast moving items will appear once orders are delivered.</Text>
        </View>
      )}
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between" accessibilityLabel={`${label}: ${value}`}>
      <Text className="text-sm text-slate-600 dark:text-slate-400">{label}</Text>
      <Text className="text-sm font-bold text-slate-900 dark:text-white">{value}</Text>
    </View>
  );
}
