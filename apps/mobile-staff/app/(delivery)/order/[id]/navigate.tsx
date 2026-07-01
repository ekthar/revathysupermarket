import { useEffect, useState } from "react";
import { View, Text, Pressable, Linking, Platform } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { api } from "@/services/api";

export default function NavigateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [destination, setDestination] = useState<{ lat: number; lng: number; address: string } | null>(null);

  useEffect(() => {
    api.get(`/delivery/orders/${id}`).then(({ data }) => {
      const order = data.order;
      if (order) {
        setDestination({
          lat: Number(order.latitude),
          lng: Number(order.longitude),
          address: order.address,
        });
      }
    }).catch(() => null);
  }, [id]);

  function openGoogleMaps() {
    if (!destination) return;
    const { lat, lng } = destination;

    // Try Google Maps navigation intent first (Android)
    const googleNavUrl = Platform.select({
      android: `google.navigation:q=${lat},${lng}&mode=d`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`,
    });

    Linking.openURL(googleNavUrl!).catch(() => {
      // Fallback to web URL
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
      );
    });
  }

  return (
    <View className="flex-1 bg-white">
      {/* Map placeholder — will be replaced with MapLibre static map */}
      <View className="flex-1 bg-slate-100 items-center justify-center">
        {destination ? (
          <View className="items-center px-6">
            <Text className="text-4xl mb-4">📍</Text>
            <Text className="text-base font-bold text-slate-700 text-center mb-2">
              Customer Location
            </Text>
            <Text className="text-sm text-slate-500 text-center">{destination.address}</Text>
            <Text className="text-xs text-slate-400 mt-2">
              {destination.lat.toFixed(6)}, {destination.lng.toFixed(6)}
            </Text>
          </View>
        ) : (
          <Text className="text-slate-400">Loading location...</Text>
        )}
      </View>

      {/* Navigation CTA */}
      <View className="px-5 pb-8 pt-4">
        <Pressable
          onPress={openGoogleMaps}
          disabled={!destination}
          className={`h-14 rounded-xl items-center justify-center flex-row gap-2 ${
            destination ? "bg-blue-600" : "bg-slate-300"
          }`}
        >
          <Text className="text-2xl">🗺️</Text>
          <Text className="text-white text-base font-bold">Open in Google Maps</Text>
        </Pressable>
      </View>
    </View>
  );
}
