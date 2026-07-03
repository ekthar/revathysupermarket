import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { api } from "@/services/api";
import { AnimatedScreen } from "@/components/AnimatedScreen";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { AnimatedFadeIn } from "@/components/AnimatedFadeIn";

interface BillItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface OrderBill {
  id: string;
  orderNumber: string;
  billNumber: string | null;
  customerName: string;
  createdAt: string;
  items: BillItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tip: number;
  total: number;
}

const STORE_NAME = "Revathy Supermarket";

export default function BillScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<OrderBill | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    api.get(`/mobile/v1/admin/orders/${id}`)
      .then(({ data }) => setOrder(data.order))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [id]);

  async function generateBill() {
    setGenerating(true);
    try {
      const { data } = await api.post(`/admin/orders/${id}/bill`);
      setOrder((prev) => prev ? { ...prev, billNumber: data.billNumber } : prev);
      Alert.alert("Success", `Bill number generated: ${data.billNumber}`);
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.error ?? "Failed to generate bill number");
    } finally {
      setGenerating(false);
    }
  }

  async function printInvoice() {
    setPrinting(true);
    try {
      await api.post(`/orders/${id}/print`);
      Alert.alert("Print Recorded", "Invoice print has been tracked.");
    } catch {
      Alert.alert("Error", "Failed to record print");
    } finally {
      setPrinting(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-slate-950">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  if (!order) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-slate-950">
        <Text className="text-slate-500 dark:text-slate-400">Order not found</Text>
      </View>
    );
  }

  return (
    <AnimatedScreen className="flex-1 bg-white dark:bg-slate-950">
      <ScrollView className="flex-1 bg-white dark:bg-slate-950" contentContainerStyle={{ padding: 20 }}>
        {/* Header */}
        <View className="flex-row items-center mb-4 pt-10">
          <AnimatedPressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mr-3"
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text className="text-lg">←</Text>
          </AnimatedPressable>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-slate-900 dark:text-white">Invoice</Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400">Order #{order.orderNumber}</Text>
          </View>
        </View>

        {/* Bill Number */}
        <AnimatedFadeIn index={0}>
          <View className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 mb-4 items-center">
            <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bill Number</Text>
            <Text className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {order.billNumber ?? "Not generated"}
            </Text>
          </View>
        </AnimatedFadeIn>

        {/* Invoice Preview */}
        <AnimatedFadeIn index={1}>
          <View className="bg-white dark:bg-slate-900 rounded-2xl p-5 mb-4 border border-slate-200 dark:border-slate-700">
            {/* Store Header */}
            <View className="items-center border-b border-dashed border-slate-200 dark:border-slate-700 pb-4 mb-4">
              <Text className="text-lg font-bold text-slate-900 dark:text-white">{STORE_NAME}</Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              {order.billNumber && (
                <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Bill: {order.billNumber}</Text>
              )}
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Customer: {order.customerName}</Text>
            </View>

            {/* Items Table */}
            <View className="mb-4">
              <View className="flex-row pb-2 border-b border-slate-100 dark:border-slate-800">
                <Text className="flex-1 text-xs font-bold text-slate-500 dark:text-slate-400">ITEM</Text>
                <Text className="w-12 text-xs font-bold text-slate-500 dark:text-slate-400 text-center">QTY</Text>
                <Text className="w-16 text-xs font-bold text-slate-500 dark:text-slate-400 text-right">RATE</Text>
                <Text className="w-20 text-xs font-bold text-slate-500 dark:text-slate-400 text-right">AMT</Text>
              </View>
              {order.items.map((item, i) => (
                <View key={item.id ?? i} className="flex-row py-2 border-b border-slate-50 dark:border-slate-800">
                  <Text className="flex-1 text-xs text-slate-700 dark:text-slate-300" numberOfLines={1}>{item.name}</Text>
                  <Text className="w-12 text-xs text-slate-700 dark:text-slate-300 text-center">{item.quantity}</Text>
                  <Text className="w-16 text-xs text-slate-700 dark:text-slate-300 text-right">₹{Number(item.price).toFixed(2)}</Text>
                  <Text className="w-20 text-xs font-semibold text-slate-900 dark:text-white text-right">₹{(item.price * item.quantity).toFixed(2)}</Text>
                </View>
              ))}
            </View>

            {/* Totals */}
            <View className="border-t border-dashed border-slate-200 dark:border-slate-700 pt-3">
              <TotalRow label="Subtotal" value={order.subtotal} />
              {order.discount > 0 && <TotalRow label="Discount" value={-order.discount} />}
              <TotalRow label="Delivery Fee" value={order.deliveryFee} />
              {order.tip > 0 && <TotalRow label="Tip" value={order.tip} />}
              <View className="flex-row justify-between mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <Text className="text-base font-bold text-slate-900 dark:text-white">Total</Text>
                <Text className="text-base font-bold text-emerald-700 dark:text-emerald-400">₹{Number(order.total).toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </AnimatedFadeIn>

        {/* Actions */}
        <AnimatedFadeIn index={2}>
          <View className="gap-3 mb-8">
            {!order.billNumber && (
              <AnimatedPressable
                onPress={generateBill}
                disabled={generating}
                className={`h-14 rounded-xl items-center justify-center ${generating ? "bg-emerald-400" : "bg-emerald-600"}`}
                accessibilityRole="button"
                accessibilityLabel="Generate Bill Number"
              >
                {generating ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold">🧾 Generate Bill Number</Text>
                )}
              </AnimatedPressable>
            )}

            <AnimatedPressable
              onPress={printInvoice}
              disabled={printing}
              className={`h-14 rounded-xl items-center justify-center border border-slate-200 dark:border-slate-700 ${printing ? "bg-slate-100 dark:bg-slate-800" : "bg-white dark:bg-slate-900"}`}
              accessibilityRole="button"
              accessibilityLabel="Print Invoice"
            >
              {printing ? (
                <ActivityIndicator color="#059669" />
              ) : (
                <Text className="text-slate-700 dark:text-slate-200 font-bold">🖨️ Print Invoice</Text>
              )}
            </AnimatedPressable>
          </View>
        </AnimatedFadeIn>
      </ScrollView>
    </AnimatedScreen>
  );
}

function TotalRow({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-row justify-between py-0.5">
      <Text className="text-sm text-slate-600 dark:text-slate-300">{label}</Text>
      <Text className="text-sm text-slate-900 dark:text-white">
        {value < 0 ? `−₹${Math.abs(value).toFixed(2)}` : `₹${Number(value).toFixed(2)}`}
      </Text>
    </View>
  );
}
