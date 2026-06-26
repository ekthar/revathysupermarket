import { useState, useEffect } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { api } from "@/services/api";
import type { WalletData } from "@msm/shared/types";
import { formatCurrency, formatDate } from "@msm/shared/utils";

export default function WalletScreen() {
  const [data, setData] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get("/wallet").then(({ data }) => setData(data)).catch(() => {}).finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <View className="flex-1 items-center justify-center bg-white"><ActivityIndicator color="#059669" /></View>;

  return (
    <View className="flex-1 bg-white px-5 pt-4">
      <View className="bg-primary-600 rounded-2xl p-6 mb-6">
        <Text className="text-white/70 text-sm">Available Balance</Text>
        <Text className="text-white text-3xl font-heading mt-1">{formatCurrency(data?.balance ?? 0)}</Text>
      </View>

      <Text className="text-base font-heading text-slate-900 mb-3">Transactions</Text>
      <FlatList
        data={data?.transactions || []}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text className="text-slate-400 text-sm">No transactions</Text>}
        renderItem={({ item }) => (
          <View className="flex-row py-3 border-b border-slate-50">
            <View className="flex-1">
              <Text className="text-sm font-sans-medium text-slate-700">{item.reason}</Text>
              <Text className="text-xs text-slate-400">{formatDate(item.date)}</Text>
            </View>
            <Text className={`text-sm font-sans-bold ${item.type === "credit" ? "text-green-600" : "text-red-500"}`}>
              {item.type === "credit" ? "+" : "-"}{formatCurrency(item.amount)}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
