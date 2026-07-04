import { useState, useEffect } from "react";
import { View, Text, FlatList, ActivityIndicator, Pressable } from "react-native";
import { api } from "@/services/api";
import type { SupportTicket } from "@msm/shared/types";
import { formatDate } from "@msm/shared/utils";

export default function SupportScreen() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get("/support/tickets").then(({ data }) => setTickets(data.items || [])).catch(() => {}).finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <View className="flex-1 items-center justify-center bg-white"><ActivityIndicator color="#059669" /></View>;

  return (
    <View className="flex-1 bg-white px-5 pt-4">
      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<View className="py-16 items-center"><Text className="text-3xl mb-2">💬</Text><Text className="text-neutral-400">No support tickets</Text></View>}
        renderItem={({ item }) => (
          <View className="py-4 border-b border-neutral-50">
            <View className="flex-row justify-between">
              <Text className="text-sm font-medium text-neutral-800">{item.subject}</Text>
              <View className="bg-neutral-100 px-2 py-0.5 rounded">
                <Text className="text-xs text-neutral-600">{item.status.replace("_", " ")}</Text>
              </View>
            </View>
            <Text className="text-xs text-neutral-400 mt-1">#{item.ticketNumber} • {formatDate(item.createdAt)}</Text>
          </View>
        )}
      />
      <Pressable className="mt-4 h-12 rounded-xl items-center justify-center bg-primary-600">
        <Text className="text-white font-bold">New Ticket</Text>
      </Pressable>
    </View>
  );
}
