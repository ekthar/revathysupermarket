import { useEffect, useState } from "react";
import { View, Text, ScrollView, TextInput, Alert, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { api } from "@/services/api";
import { AnimatedScreen } from "@/components/AnimatedScreen";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { AnimatedFadeIn } from "@/components/AnimatedFadeIn";

const DAMAGE_REASONS = [
  "Damaged packaging",
  "Expired",
  "Quality issue",
  "Wrong item",
  "Other",
] as const;

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

interface PackOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  items: OrderItem[];
}

interface DamageEntry {
  productId: string;
  quantityDamaged: number;
  reason: string;
  note: string;
}

const emptyEntry = (productId: string): DamageEntry => ({
  productId,
  quantityDamaged: 0,
  reason: "",
  note: "",
});

export default function PackDamageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<PackOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [entries, setEntries] = useState<Record<string, DamageEntry>>({});

  useEffect(() => {
    api.get(`/packing/orders/${id}`).then(({ data }) => {
      setOrder(data.order);
      const initial: Record<string, DamageEntry> = {};
      for (const item of data.order.items ?? []) {
        initial[item.id] = emptyEntry(item.productId ?? item.id);
      }
      setEntries(initial);
    }).catch(() => null).finally(() => setLoading(false));
  }, [id]);

  function updateEntry(itemId: string, patch: Partial<DamageEntry>) {
    setEntries((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], ...patch },
    }));
  }

  const damagedItems = Object.values(entries).filter(
    (e) => e.quantityDamaged > 0 && e.reason
  );

  async function handleSubmit() {
    if (damagedItems.length === 0) {
      Alert.alert("No damage reported", "Mark at least one item as damaged with a reason.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/packing/orders/${id}/damage`, {
        items: damagedItems.map(({ productId, quantityDamaged, reason, note }) => ({
          productId,
          quantityDamaged,
          reason,
          ...(note.trim() ? { note: note.trim() } : {}),
        })),
      });
      Alert.alert("Reported", "Damaged items have been recorded.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.error ?? "Failed to submit damage report");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-slate-950">
        <ActivityIndicator size="large" color="#7c3aed" />
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
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">Report Damage</Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {order.orderNumber} • {order.customerName}
        </Text>

        <View className="mt-6 gap-4">
          {order.items.map((item, i) => {
            const entry = entries[item.id] ?? emptyEntry(item.productId);
            return (
              <AnimatedFadeIn key={item.id} index={Math.min(i, 8)}>
                <View className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <View className="flex-row justify-between items-center mb-3">
                    <View className="flex-1 mr-2">
                      <Text className="text-sm font-semibold text-slate-900 dark:text-white">{item.name}</Text>
                      <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Ordered: {item.quantity} × ₹{Number(item.price).toFixed(2)}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-xs text-slate-400 dark:text-slate-500 mb-1">Damaged</Text>
                      <TextInput
                        value={entry.quantityDamaged > 0 ? String(entry.quantityDamaged) : ""}
                        onChangeText={(v) => {
                          const n = parseInt(v.replace(/[^0-9]/g, ""), 10) || 0;
                          updateEntry(item.id, { quantityDamaged: Math.min(n, item.quantity) });
                        }}
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor="#94a3b8"
                        maxLength={3}
                        className="w-16 h-10 border border-slate-200 dark:border-slate-700 rounded-lg text-center text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800"
                        accessibilityLabel={`Damaged quantity for ${item.name}`}
                      />
                    </View>
                  </View>

                  <Text className="text-xs text-slate-500 dark:text-slate-400 mb-2">Reason</Text>
                  <View className="flex-row flex-wrap gap-2 mb-3">
                    {DAMAGE_REASONS.map((reason) => {
                      const selected = entry.reason === reason;
                      return (
                        <AnimatedPressable
                          key={reason}
                          onPress={() => updateEntry(item.id, { reason: selected ? "" : reason })}
                          className={`px-3 py-1.5 rounded-full border ${
                            selected
                              ? "bg-purple-600 border-purple-600"
                              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                          }`}
                          accessibilityRole="radio"
                          accessibilityState={{ selected }}
                          accessibilityLabel={`${reason}${selected ? ", selected" : ""}`}
                        >
                          <Text
                            className={`text-xs font-semibold ${
                              selected ? "text-white" : "text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {reason}
                          </Text>
                        </AnimatedPressable>
                      );
                    })}
                  </View>

                  <TextInput
                    value={entry.note}
                    onChangeText={(v) => updateEntry(item.id, { note: v })}
                    placeholder="Add a note (optional)"
                    placeholderTextColor="#94a3b8"
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                    className="h-16 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800"
                    accessibilityLabel={`Note for ${item.name}`}
                  />
                </View>
              </AnimatedFadeIn>
            );
          })}
        </View>

        {damagedItems.length > 0 && (
          <View className="mt-6 p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
            <Text className="text-sm font-bold text-purple-800 dark:text-purple-300 mb-2">
              Summary ({damagedItems.length} item{damagedItems.length !== 1 ? "s" : ""})
            </Text>
            {damagedItems.map((entry) => {
              const item = order.items.find(
                (i) => (i.productId ?? i.id) === entry.productId
              );
              return (
                <Text
                  key={entry.productId}
                  className="text-xs text-purple-700 dark:text-purple-400 mt-1"
                >
                  • {item?.name ?? entry.productId} — Qty: {entry.quantityDamaged} ({entry.reason})
                </Text>
              );
            })}
          </View>
        )}

        <View className="mt-8 mb-8 gap-3">
          <AnimatedPressable
            onPress={handleSubmit}
            disabled={submitting}
            className={`h-14 rounded-xl items-center justify-center ${
              submitting ? "bg-purple-400" : "bg-purple-600"
            }`}
            accessibilityRole="button"
            accessibilityLabel="Submit damage report"
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold">Submit Damage Report</Text>
            )}
          </AnimatedPressable>

          <AnimatedPressable
            onPress={() => router.back()}
            className="h-12 border border-slate-200 dark:border-slate-700 rounded-xl items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text className="text-slate-700 dark:text-slate-300 font-bold">Cancel</Text>
          </AnimatedPressable>
        </View>
      </ScrollView>
    </AnimatedScreen>
  );
}
