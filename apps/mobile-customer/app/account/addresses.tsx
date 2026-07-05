import { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, ActivityIndicator, Pressable } from "react-native";
import { router, Stack } from "expo-router";
import { MapPin, Plus } from "lucide-react-native";
import { api } from "@/services/api";
import type { Address } from "@msm/shared/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ErrorState } from "@/components/ui/ErrorState";

export default function AddressesScreen() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAddresses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/addresses");
      setAddresses(data.items || []);
    } catch {
      setError("Failed to load addresses. Pull down to retry.");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  if (error) return <ErrorState message={error} onRetry={fetchAddresses} />;

  if (isLoading) return <View className="flex-1 items-center justify-center bg-white"><ActivityIndicator color="#050505" /></View>;

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Addresses", headerTintColor: "#050505" }} />
      <View className="flex-1 bg-white px-4 pt-4">
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View className="py-16 items-center">
              <MapPin size={32} color="#D1D5DB" />
              <Text className="text-neutral-400 mt-3">No saved addresses</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="py-4 border-b border-neutral-50">
              <View className="flex-row items-center mb-1">
                <Text className="text-body font-bold text-neutral-800">{item.label}</Text>
                {item.isDefault && (
                  <View className="ml-2">
                    <Badge variant="secondary">Default</Badge>
                  </View>
                )}
              </View>
              <Text className="text-caption text-neutral-500">{item.houseName}, {item.street}</Text>
              <Text className="text-micro text-neutral-400">{item.pincode}</Text>
            </View>
          )}
        />
        <View className="mt-4 mb-8">
          <Button
            variant="outline"
            onPress={() => router.push("/account/add-address")}
            fullWidth
            icon={<Plus size={16} color="#050505" />}
          >
            Add New Address
          </Button>
        </View>
      </View>
    </>
  );
}
