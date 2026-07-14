import { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, ActivityIndicator, Pressable, Alert } from "react-native";
import { router, Stack, useFocusEffect } from "expo-router";
import { MapPin, Plus, Pencil, Trash2 } from "lucide-react-native";
import { api } from "@/services/api";
import type { Address } from "@msm/shared/types";
import { canDeleteAddress } from "@msm/shared/utils/address-payment-validations";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ErrorState } from "@/components/ui/ErrorState";
import { showToast } from "@/components/ui/Toast";

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

  // Refetch addresses when screen regains focus (e.g., after editing)
  useFocusEffect(
    useCallback(() => {
      fetchAddresses();
    }, [fetchAddresses])
  );

  const handleEdit = (address: Address) => {
    router.push({
      pathname: "/account/edit-address",
      params: {
        id: address.id,
        label: address.label,
        houseName: address.houseName,
        street: address.street,
        landmark: address.landmark,
        pincode: address.pincode,
      },
    });
  };

  const handleDelete = (address: Address) => {
    if (!canDeleteAddress(address)) {
      showToast("Default address cannot be deleted. Set another address as default first.", "error");
      return;
    }

    Alert.alert(
      "Delete Address",
      `Are you sure you want to delete your "${address.label}" address?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/addresses/${address.id}`);
              setAddresses((prev) => prev.filter((a) => a.id !== address.id));
              showToast("Address deleted successfully.", "success");
            } catch {
              showToast("Failed to delete address. Please try again.", "error");
            }
          },
        },
      ]
    );
  };

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
              {item.landmark ? (
                <Text className="text-micro text-neutral-400">{item.landmark}</Text>
              ) : null}
              <Text className="text-micro text-neutral-400">{item.pincode}</Text>

              {/* Action Buttons */}
              <View className="flex-row mt-3 gap-3">
                <Pressable
                  onPress={() => handleEdit(item)}
                  className="flex-row items-center px-3 py-1.5 rounded-lg bg-neutral-50 border border-neutral-100"
                >
                  <Pencil size={14} color="#374151" />
                  <Text className="text-micro font-semibold text-neutral-700 ml-1.5">Edit</Text>
                </Pressable>

                {!item.isDefault && (
                  <Pressable
                    onPress={() => handleDelete(item)}
                    className="flex-row items-center px-3 py-1.5 rounded-lg bg-error-50 border border-error-100"
                  >
                    <Trash2 size={14} color="#DC2626" />
                    <Text className="text-micro font-semibold text-error-700 ml-1.5">Delete</Text>
                  </Pressable>
                )}
              </View>
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
