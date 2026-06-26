import { useState, useEffect } from "react";
import { View, Text, FlatList, ActivityIndicator, Pressable } from "react-native";
import { api } from "@/services/api";
import type { Address } from "@msm/shared/types";

export default function AddressesScreen() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get("/addresses").then(({ data }) => setAddresses(data.items || [])).catch(() => {}).finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <View className="flex-1 items-center justify-center bg-white"><ActivityIndicator color="#059669" /></View>;

  return (
    <View className="flex-1 bg-white px-5 pt-4">
      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<View className="py-16 items-center"><Text className="text-3xl mb-2">📍</Text><Text className="text-slate-400">No saved addresses</Text></View>}
        renderItem={({ item }) => (
          <View className="py-4 border-b border-slate-50">
            <View className="flex-row items-center mb-1">
              <Text className="text-sm font-sans-bold text-slate-800">{item.label}</Text>
              {item.isDefault && <View className="ml-2 bg-primary-100 px-2 py-0.5 rounded"><Text className="text-xs text-primary-700">Default</Text></View>}
            </View>
            <Text className="text-sm text-slate-500">{item.houseName}, {item.street}</Text>
            <Text className="text-xs text-slate-400">{item.pincode}</Text>
          </View>
        )}
      />
      <Pressable className="mt-4 h-12 rounded-xl items-center justify-center border border-primary-600">
        <Text className="text-primary-600 font-sans-semibold">+ Add New Address</Text>
      </Pressable>
    </View>
  );
}
