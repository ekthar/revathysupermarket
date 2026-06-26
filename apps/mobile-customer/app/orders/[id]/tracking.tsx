import { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { api } from "@/services/api";
import { formatCurrency } from "@msm/shared/utils";
import { STATUS_LABELS } from "@msm/shared/constants";


interface TrackingData {
  status: string;
  deliveryPartner?: { name: string; phone: string };
  estimatedMinutes?: number;
  location?: { latitude: number; longitude: number };
}

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const fetchTracking = async () => {
    try {
      const { data } = await api.get(`/orders/${id}/tracking`);
      setTracking(data);
    } catch {}
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTracking();
    pollRef.current = setInterval(fetchTracking, 10000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [id]);


  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#059669" size="large" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Track Order" }} />
      <View className="flex-1 bg-white">
        {/* Map Placeholder */}
        <View className="h-64 bg-slate-100 items-center justify-center">
          <Text className="text-4xl mb-2">🗺️</Text>
          <Text className="text-sm text-slate-500">Live Map</Text>
          {tracking?.location && (
            <Text className="text-xs text-slate-400 mt-1">
              Partner at {tracking.location.latitude.toFixed(4)},{" "}
              {tracking.location.longitude.toFixed(4)}
            </Text>
          )}
        </View>

        {/* Status Card */}
        <View className="px-5 pt-5">
          <View className="bg-primary-50 rounded-xl p-4 mb-4">
            <Text className="text-xs text-primary-600">Current Status</Text>
            <Text className="text-lg font-heading text-primary-900">
              {STATUS_LABELS[tracking?.status as keyof typeof STATUS_LABELS] ||
                tracking?.status?.replace(/_/g, " ") || "Unknown"}
            </Text>
            {tracking?.estimatedMinutes && (
              <Text className="text-sm text-primary-700 mt-1">
                Estimated arrival: ~{tracking.estimatedMinutes} min
              </Text>
            )}
          </View>

          {/* Delivery Partner Info */}
          {tracking?.deliveryPartner && (
            <View className="border border-slate-200 rounded-xl p-4 mb-4">
              <Text className="text-xs text-slate-500 mb-1">
                Delivery Partner
              </Text>
              <Text className="text-base font-sans-semibold text-slate-800">
                {tracking.deliveryPartner.name}
              </Text>
              <Pressable className="mt-3 flex-row items-center">
                <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center mr-2">
                  <Text className="text-sm">📞</Text>
                </View>
                <Text className="text-sm text-green-700 font-sans-medium">
                  {tracking.deliveryPartner.phone}
                </Text>
              </Pressable>
            </View>
          )}

          {/* Live Indicator */}
          <View className="flex-row items-center justify-center mt-4">
            <View className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
            <Text className="text-xs text-slate-400">
              Updating every 10 seconds
            </Text>
          </View>
        </View>
      </View>
    </>
  );
}
