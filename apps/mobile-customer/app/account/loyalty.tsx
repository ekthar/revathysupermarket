import { useState, useEffect } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { api } from "@/services/api";
import type { LoyaltyData } from "@msm/shared/types";
import { getLoyaltyTierProgress, getNextTierPoints, formatDate } from "@msm/shared/utils";

export default function LoyaltyScreen() {
  const [data, setData] = useState<LoyaltyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get("/loyalty").then(({ data }) => setData(data)).catch(() => {}).finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <View className="flex-1 items-center justify-center bg-white"><ActivityIndicator color="#059669" /></View>;

  const progress = data ? getLoyaltyTierProgress(data.points) : 0;
  const nextTier = data ? getNextTierPoints(data.points) : 500;

  return (
    <View className="flex-1 bg-white px-5 pt-4">
      <View className="bg-amber-50 rounded-2xl p-6 mb-6 border border-amber-100">
        <Text className="text-amber-700 text-sm font-sans-medium">{data?.tier || "Bronze"} Tier</Text>
        <Text className="text-amber-900 text-3xl font-heading mt-1">{data?.points ?? 0} pts</Text>
        <View className="mt-4 h-2 bg-amber-200 rounded-full overflow-hidden">
          <View className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(progress * 100, 100)}%` }} />
        </View>
        <Text className="text-xs text-amber-600 mt-2">{nextTier - (data?.points ?? 0)} points to next tier</Text>
      </View>

      <Text className="text-base font-heading text-slate-900 mb-3">History</Text>
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
            <Text className={`text-sm font-sans-bold ${item.points > 0 ? "text-green-600" : "text-red-500"}`}>
              {item.points > 0 ? "+" : ""}{item.points} pts
            </Text>
          </View>
        )}
      />
    </View>
  );
}
