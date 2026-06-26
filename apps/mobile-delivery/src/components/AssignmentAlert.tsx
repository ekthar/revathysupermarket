import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { useDeliveryStore } from "@/stores/delivery";
import type { DeliveryAssignmentEvent } from "@msm/shared/types";

interface Props {
  event: DeliveryAssignmentEvent;
}

export function AssignmentAlert({ event }: Props) {
  const { acknowledgeAssignment, dismissAssignment } = useDeliveryStore();

  const handleAccept = async () => {
    await acknowledgeAssignment(event.eventId, event.orderId);
    router.push(`/orders/${event.orderId}`);
  };

  return (
    <View className="absolute inset-0 z-50 bg-black/60 items-center justify-center px-6">
      <View className="bg-white rounded-3xl w-full p-6">
        {/* Header */}
        <View className="items-center mb-4">
          <View className="w-16 h-16 bg-primary-100 rounded-full items-center justify-center mb-3">
            <Text className="text-3xl">🛵</Text>
          </View>
          <Text className="text-xl font-heading text-slate-900">
            New Delivery!
          </Text>
        </View>

        {/* Order Info */}
        <View className="bg-slate-50 rounded-xl p-4 mb-4">
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-slate-500">Order</Text>
            <Text className="text-sm font-sans-bold text-slate-800">
              #{event.orderNumber}
            </Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-slate-500">Customer</Text>
            <Text className="text-sm font-sans-medium text-slate-700">
              {event.customerName}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-slate-500">Address</Text>
            <Text
              className="text-sm text-slate-700 text-right flex-1 ml-4"
              numberOfLines={2}
            >
              {event.address}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <Pressable
          onPress={handleAccept}
          className="bg-primary-600 h-14 rounded-xl items-center justify-center mb-3"
        >
          <Text className="text-white text-base font-sans-bold">
            Accept & View Order
          </Text>
        </Pressable>
        <Pressable
          onPress={dismissAssignment}
          className="h-12 rounded-xl items-center justify-center"
        >
          <Text className="text-slate-500 text-sm font-sans-medium">
            Dismiss
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
