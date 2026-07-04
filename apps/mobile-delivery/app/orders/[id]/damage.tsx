import { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, ScrollView, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { api } from "@/services/api";
import type { OrderDetail } from "@msm/shared/types";

export default function DamageReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [itemName, setItemName] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [orderItems, setOrderItems] = useState<OrderDetail["items"]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);

  useEffect(() => {
    api.get(`/delivery/orders/${id}`)
      .then(({ data }) => {
        const items = data.items || [];
        setOrderItems(items);
        if (items.length) {
          setSelectedProductId(items[0].productId);
          setItemName(items[0].name);
        }
      })
      .catch(() => {})
      .finally(() => setItemsLoading(false));
  }, [id]);

  const handleReport = async () => {
    if (!itemName || !reason) return;
    setIsLoading(true);
    try {
      await api.post(`/delivery/orders/${id}/damage`, {
        items: [{ productId: selectedProductId || "unknown", name: itemName, quantity: 1, reason }],
      });
      router.back();
    } catch (error) {
      console.error("Failed to report damage:", error);
      Alert.alert("Error", "Failed to report damage. Please try again.");
    }
    setIsLoading(false);
  };

  return (
    <ScrollView className="flex-1 bg-white px-5 pt-6">
      <Text className="text-base font-heading text-slate-900 mb-4">Report Damaged Items</Text>
      {itemsLoading ? (
        <ActivityIndicator color="#059669" className="mb-4" />
      ) : orderItems.length > 0 ? (
        <>
          <Text className="text-sm text-slate-600 mb-2">Select Item</Text>
          {orderItems.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => {
                setSelectedProductId(item.productId);
                setItemName(item.name);
              }}
              className={`p-3 rounded-xl mb-2 border ${selectedProductId === item.productId ? "border-red-500 bg-red-50" : "border-slate-200"}`}
            >
              <Text className={`font-sans-medium ${selectedProductId === item.productId ? "text-red-700" : "text-slate-700"}`}>
                {item.name} × {item.quantity}
              </Text>
            </Pressable>
          ))}
        </>
      ) : (
        <>
          <Text className="text-sm text-slate-600 mb-2">Item Name</Text>
          <TextInput value={itemName} onChangeText={setItemName} placeholder="e.g. Milk 500ml" className="h-12 border border-slate-200 rounded-xl px-4 mb-4" />
        </>
      )}

      <Text className="text-sm text-slate-600 mb-2">Reason for Damage</Text>
      <TextInput value={reason} onChangeText={setReason} placeholder="e.g. Package was torn" multiline numberOfLines={4} textAlignVertical="top" className="h-24 border border-slate-200 rounded-xl px-4 py-3 mb-6" />

      <Pressable onPress={handleReport} disabled={isLoading} className={`h-14 rounded-xl items-center justify-center ${isLoading ? "bg-red-400" : "bg-red-500"}`}>
        {isLoading ? <ActivityIndicator color="white" /> : <Text className="text-white font-sans-bold">Submit Report</Text>}
      </Pressable>
    </ScrollView>
  );
}
