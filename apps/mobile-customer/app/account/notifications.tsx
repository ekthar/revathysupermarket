import { useState, useEffect } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { api } from "@/services/api";
import type { AppNotification } from "@msm/shared/types";
import { formatDate } from "@msm/shared/utils";

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get("/notifications").then(({ data }) => setNotifications(data.items || [])).catch(() => {}).finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <View className="flex-1 items-center justify-center bg-white"><ActivityIndicator color="#059669" /></View>;

  return (
    <View className="flex-1 bg-white px-5 pt-4">
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<View className="py-16 items-center"><Text className="text-3xl mb-2">🔔</Text><Text className="text-slate-400">No notifications</Text></View>}
        renderItem={({ item }) => (
          <View className={`py-4 border-b border-slate-50 ${item.isRead ? "" : "bg-primary-50/50 -mx-2 px-2 rounded-lg"}`}>
            <Text className="text-sm font-sans-medium text-slate-800">{item.title}</Text>
            <Text className="text-sm text-slate-500 mt-1">{item.body}</Text>
            <Text className="text-xs text-slate-400 mt-1">{formatDate(item.date)}</Text>
          </View>
        )}
      />
    </View>
  );
}
