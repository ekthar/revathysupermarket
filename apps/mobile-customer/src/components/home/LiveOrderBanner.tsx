import { View, Text, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";
import { Truck } from "lucide-react-native";
import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { STATUS_LABELS } from "@msm/shared/constants";

interface ActiveOrder {
  id: string;
  orderNumber: string;
  status: string;
  estimatedMinutes?: number;
}

export function LiveOrderBanner() {
  const [order, setOrder] = useState<ActiveOrder | null>(null);

  useEffect(() => {
    async function fetchActive() {
      try {
        const { data } = await api.get("/orders?status=active&limit=1");
        const items = data.items || data.orders || [];
        const active = items.find(
          (o: any) => !["DELIVERED", "CANCELLED"].includes(o.status)
        );
        if (active) setOrder(active);
      } catch {}
    }
    fetchActive();
  }, []);

  if (!order) return null;

  const statusLabel =
    STATUS_LABELS[order.status as keyof typeof STATUS_LABELS] ||
    order.status.replace(/_/g, " ");

  return (
    <Animated.View entering={FadeInDown.duration(400).springify()} className="mx-4 mt-3">
      <Pressable
        onPress={() => router.push(`/orders/${order.id}/tracking`)}
        className="rounded-2xl bg-secondary-500 p-4 overflow-hidden"
      >
        {/* Decorative circles */}
        <View className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
        <View className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            {/* Pulse dot */}
            <View className="relative w-3 h-3">
              <View className="absolute inset-0 rounded-full bg-white opacity-75" />
              <View className="w-3 h-3 rounded-full bg-white" />
            </View>
            <View>
              <Text className="text-micro font-bold uppercase tracking-wider text-white/80">
                Live Order
              </Text>
              <Text className="text-body font-bold text-white">{statusLabel}</Text>
            </View>
          </View>
          <View className="items-end">
            {order.estimatedMinutes ? (
              <Text className="text-xl font-black text-white">
                {order.estimatedMinutes} min
              </Text>
            ) : (
              <Truck size={20} color="#FFFFFF" />
            )}
            <Text className="text-micro font-semibold uppercase tracking-wider text-white/70">
              Tap to track
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
