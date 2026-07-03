import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { api } from "@/services/api";
import { AnimatedScreen } from "@/components/AnimatedScreen";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { AnimatedFadeIn } from "@/components/AnimatedFadeIn";
import { ErrorBanner } from "@/components/ErrorBanner";

interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  lastSeenAt: string | null;
}

interface OrderData {
  orderNumber: string;
}

export default function AssignDeliveryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/mobile/v1/admin/delivery-partners"),
      api.get(`/mobile/v1/admin/orders/${id}`),
    ])
      .then(([partnersRes, orderRes]) => {
        setPartners(partnersRes.data.partners ?? []);
        setOrder(orderRes.data.order ?? null);
      })
      .catch(() => setError("Could not load delivery partners."))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAssign(partner: DeliveryPartner) {
    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        "Assign Delivery",
        `Assign this order to ${partner.name}?`,
        [
          { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
          { text: "Assign", onPress: () => resolve(true) },
        ]
      );
    });
    if (!confirmed) return;

    setAssigning(true);
    try {
      await api.patch(`/admin/orders/${id}/delivery`, {
        deliveryPartnerId: partner.id,
      });
      Alert.alert("Assigned!", `Order assigned to ${partner.name}.`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.error ?? "Failed to assign delivery partner");
    } finally {
      setAssigning(false);
    }
  }

  function formatLastSeen(lastSeenAt: string | null): string {
    if (!lastSeenAt) return "Never seen";
    const diff = Date.now() - new Date(lastSeenAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-slate-950">
        <ActivityIndicator size="large" color="#059669" />
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
            <Text className="text-2xl font-bold text-slate-900 dark:text-white">Assign Delivery</Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400">
              Order #{order?.orderNumber ?? "..."}
            </Text>
          </View>
        </View>

        {error && <ErrorBanner message={error} onRetry={() => { setLoading(true); setError(null); }} />}

        {assigning && (
          <View className="items-center py-4">
            <ActivityIndicator size="small" color="#059669" />
            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-2">Assigning…</Text>
          </View>
        )}

        {/* Partner List */}
        {partners.length === 0 && !error ? (
          <View className="items-center justify-center py-16 px-8">
            <Text className="text-3xl mb-3">🚚</Text>
            <Text className="text-lg font-bold text-slate-700 dark:text-slate-300 text-center">No delivery partners</Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mt-1">
              No delivery partners are currently available.
            </Text>
          </View>
        ) : (
          <View className="gap-2">
            <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
              Available Partners ({partners.length})
            </Text>
            {partners.map((partner, i) => (
              <AnimatedFadeIn key={partner.id} index={Math.min(i, 8)} entranceKey={`assign:${partner.id}`}>
                <AnimatedPressable
                  onPress={() => handleAssign(partner)}
                  disabled={assigning}
                  className={`bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 ${assigning ? "opacity-50" : ""}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Assign to ${partner.name}`}
                >
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center mr-3">
                      <Text className="text-lg">🚴</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-slate-900 dark:text-white">{partner.name}</Text>
                      <Text className="text-xs text-slate-500 dark:text-slate-400">{partner.phone}</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-xs text-slate-400 dark:text-slate-500">{formatLastSeen(partner.lastSeenAt)}</Text>
                    </View>
                  </View>
                </AnimatedPressable>
              </AnimatedFadeIn>
            ))}
          </View>
        )}
      </ScrollView>
    </AnimatedScreen>
  );
}
