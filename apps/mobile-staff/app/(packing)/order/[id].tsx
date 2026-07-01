import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { api } from "@/services/api";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  packed: boolean;
}

interface PackOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  items: OrderItem[];
}

export default function PackOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<PackOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [packedItems, setPackedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.get(`/packing/orders/${id}`).then(({ data }) => {
      setOrder(data.order);
    }).catch(() => null).finally(() => setLoading(false));
  }, [id]);

  function togglePacked(itemId: string) {
    setPackedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  async function markReady() {
    setMarking(true);
    try {
      await api.patch(`/packing/orders/${id}/ready`);
      Alert.alert("Done!", "Order marked as ready for delivery.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.error ?? "Failed to update order");
    } finally {
      setMarking(false);
    }
  }

  async function printInvoice() {
    try {
      await api.post(`/orders/${id}/print`);
      Alert.alert("Print Recorded", "Invoice print has been tracked.");
    } catch {
      Alert.alert("Error", "Failed to record print");
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  if (!order) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-slate-500">Order not found</Text>
      </View>
    );
  }

  const allPacked = order.items.length > 0 && packedItems.size === order.items.length;

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 20 }}>
      <Text className="text-2xl font-bold text-slate-900">Pack #{order.orderNumber}</Text>
      <Text className="text-sm text-slate-500 mt-1">{order.customerName} • ₹{Number(order.total).toFixed(2)}</Text>

      {/* Item Checklist */}
      <View className="mt-6 gap-2">
        <Text className="text-xs font-bold text-slate-500 uppercase mb-2">
          Items ({packedItems.size}/{order.items.length} packed)
        </Text>
        {order.items.map((item) => {
          const isPacked = packedItems.has(item.id);
          return (
            <Pressable
              key={item.id}
              onPress={() => togglePacked(item.id)}
              className={`flex-row items-center p-4 rounded-xl border ${
                isPacked ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200"
              }`}
            >
              <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
                isPacked ? "bg-emerald-500 border-emerald-500" : "border-slate-300"
              }`}>
                {isPacked && <Text className="text-white text-xs font-bold">✓</Text>}
              </View>
              <View className="flex-1">
                <Text className={`text-sm font-semibold ${isPacked ? "text-emerald-800 line-through" : "text-slate-900"}`}>
                  {item.name}
                </Text>
                <Text className="text-xs text-slate-500">Qty: {item.quantity}</Text>
              </View>
              <Text className="text-sm font-bold text-slate-700">₹{(item.price * item.quantity).toFixed(2)}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Actions */}
      <View className="mt-8 gap-3">
        <Pressable
          onPress={printInvoice}
          className="h-12 border border-slate-200 rounded-xl items-center justify-center"
        >
          <Text className="text-slate-700 font-bold">🖨️ Print Invoice</Text>
        </Pressable>

        <Pressable
          onPress={markReady}
          disabled={!allPacked || marking}
          className={`h-14 rounded-xl items-center justify-center ${
            allPacked && !marking ? "bg-purple-600" : "bg-slate-300"
          }`}
        >
          {marking ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold">
              {allPacked ? "✓ Mark Ready for Delivery" : "Pack all items first"}
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}
