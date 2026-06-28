import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInLeft,
} from "react-native-reanimated";
import { useLocalSearchParams, router, Stack } from "expo-router";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  CheckCircle2,
  Truck,
  Package,
  ShoppingBag,
  Circle,
} from "lucide-react-native";
import { api } from "@/services/api";
import { formatCurrency } from "@msm/shared/utils";
import { STATUS_LABELS } from "@msm/shared/constants";

interface TrackingData {
  id: string;
  orderNumber: string;
  status: string;
  deliveryOtp: string | null;
  destination: { latitude: number; longitude: number };
  deliveryPartner?: { name: string; phone: string };
  deliveryPartnerLocation?: {
    latitude: number;
    longitude: number;
    heading?: number;
  } | null;
  estimatedMinutes?: number;
  statusEvents?: Array<{ status: string; note: string | null; createdAt: string }>;
}

const TRACKING_STEPS = [
  { key: "ORDER_RECEIVED", label: "Order received", subtitle: "We got it. The store is preparing.", Icon: ShoppingBag },
  { key: "PACKING", label: "Packing your bag", subtitle: "Hand-picked items, carefully packed.", Icon: Package },
  { key: "OUT_FOR_DELIVERY", label: "Out for delivery", subtitle: "Your rider is on the way.", Icon: Truck },
  { key: "DELIVERED", label: "Delivered", subtitle: "Enjoy your fresh groceries!", Icon: CheckCircle2 },
];

function getStepIndex(status: string): number {
  if (["ORDER_RECEIVED", "AWAITING_CUSTOMER_APPROVAL", "ACCEPTED"].includes(status)) return 0;
  if (status === "PACKING") return 1;
  if (["READY_FOR_DELIVERY", "OUT_FOR_DELIVERY", "ARRIVING"].includes(status)) return 2;
  if (status === "DELIVERED") return 3;
  return 0;
}

function getStatusLabel(status: string): string {
  return STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status.replace(/_/g, " ");
}

function distanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

const POLL_INTERVAL = 6000; // 6s for smoother feel
const STORE_PHONE = "+919876543210";
const STORE_WHATSAPP = "919876543210";

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const mapRef = useRef<any>(null);

  const fetchTracking = useCallback(async (orderId: string) => {
    try {
      const { data } = await api.get(`/orders/${orderId}/tracking`);
      setTracking((prev) => {
        // Only update if data actually changed — prevents unnecessary re-renders
        if (prev && JSON.stringify(prev) === JSON.stringify(data)) return prev;
        return data;
      });
    } catch {}
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!id) return;
    fetchTracking(id);
    pollRef.current = setInterval(() => fetchTracking(id), POLL_INTERVAL);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [id, fetchTracking]);

  // Calculate ETA
  useEffect(() => {
    if (!tracking) return;
    if (tracking.estimatedMinutes) {
      setEtaMinutes(tracking.estimatedMinutes);
      return;
    }
    if (tracking.deliveryPartnerLocation && tracking.destination) {
      const dist = distanceKm(tracking.deliveryPartnerLocation, tracking.destination);
      setEtaMinutes(Math.max(2, Math.ceil((dist / 18) * 60)));
    } else {
      const step = getStepIndex(tracking.status);
      setEtaMinutes(step === 0 ? 20 : step === 1 ? 14 : step === 2 ? 8 : null);
    }
  }, [tracking]);

  const callRider = () => {
    const phone = tracking?.deliveryPartner?.phone || STORE_PHONE;
    Linking.openURL(`tel:${phone}`);
  };

  const messageRider = () => {
    Linking.openURL(`https://wa.me/${STORE_WHATSAPP}`);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#050505" />
      </View>
    );
  }

  if (!tracking) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-neutral-500">Could not load tracking data</Text>
      </View>
    );
  }

  const currentStep = getStepIndex(tracking.status);
  const isDelivered = tracking.status === "DELIVERED";
  const showMap = tracking.deliveryPartnerLocation || ["OUT_FOR_DELIVERY", "ARRIVING", "READY_FOR_DELIVERY"].includes(tracking.status);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="flex-1 bg-white" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Live Status Banner */}
        <Animated.View entering={FadeIn.duration(400)} className="mx-4 mt-14 rounded-2xl bg-secondary-500 p-4 overflow-hidden">
          <View className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
          <View className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              {/* Pulse dot */}
              <View className="relative w-3 h-3">
                <View className="absolute inset-0 rounded-full bg-white animate-ping opacity-75" />
                <View className="w-3 h-3 rounded-full bg-white" />
              </View>
              <View>
                <Text className="text-micro font-bold uppercase tracking-wider text-white/80">
                  Live Order
                </Text>
                <Text className="text-body font-bold text-white">
                  {getStatusLabel(tracking.status)}
                </Text>
              </View>
            </View>
            <View className="items-end">
              {etaMinutes && !isDelivered && (
                <Text className="text-xl font-black text-white">{etaMinutes} min</Text>
              )}
              {isDelivered && (
                <Text className="text-body font-bold text-white">Complete</Text>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Back button */}
        <Pressable
          onPress={() => router.back()}
          className="mx-4 mt-4 h-10 w-10 rounded-full bg-neutral-100 items-center justify-center"
        >
          <ArrowLeft size={18} color="#374151" />
        </Pressable>

        {/* Rider Card */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          className="mx-4 mt-4 flex-row items-center gap-3 rounded-2xl bg-white p-4 border border-neutral-100"
          style={{ shadowColor: "#050505", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 }}
        >
          <View className="h-12 w-12 rounded-full bg-secondary-100 items-center justify-center">
            <Truck size={20} color="#22C55E" />
          </View>
          <View className="flex-1">
            <Text className="text-caption font-semibold text-neutral-400">Your rider</Text>
            <Text className="text-title font-bold text-neutral-900">
              {tracking.deliveryPartner?.name || "Assigning rider..."}
            </Text>
          </View>
          {tracking.deliveryPartner && (
            <View className="h-8 w-8 rounded-full bg-secondary-50 items-center justify-center">
              <CheckCircle2 size={16} color="#22C55E" />
            </View>
          )}
        </Animated.View>

        {/* Map */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} className="mx-4 mt-4 rounded-2xl overflow-hidden h-64">
          {showMap && tracking.destination ? (
            <MapView
              ref={mapRef}
              style={{ flex: 1 }}
              provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
              initialRegion={{
                latitude: tracking.destination.latitude,
                longitude: tracking.destination.longitude,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
              }}
              showsUserLocation
            >
              {/* Customer location */}
              <Marker
                coordinate={tracking.destination}
                title="Your location"
                pinColor="#050505"
              />
              {/* Rider location */}
              {tracking.deliveryPartnerLocation && (
                <Marker
                  coordinate={tracking.deliveryPartnerLocation}
                  title={tracking.deliveryPartner?.name || "Rider"}
                  pinColor="#22C55E"
                />
              )}
            </MapView>
          ) : (
            <View className="flex-1 bg-neutral-100 items-center justify-center">
              <Truck size={32} color="#22C55E" />
              <Text className="text-caption text-neutral-500 mt-2">
                Map will appear when rider is assigned
              </Text>
            </View>
          )}
        </Animated.View>

        {/* ETA Display */}
        {etaMinutes && !isDelivered && (
          <Animated.View entering={FadeInDown.delay(250).duration(400)} className="mx-4 mt-4 rounded-2xl bg-white p-5 items-center border border-neutral-100" style={{ shadowColor: "#050505", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }}>
            <Text className="text-caption font-bold uppercase tracking-wider text-neutral-400">
              Arriving in
            </Text>
            <Text className="mt-1 text-display font-black text-neutral-900">
              {etaMinutes}{" "}
              <Text className="text-title font-bold text-neutral-400">min</Text>
            </Text>
          </Animated.View>
        )}

        {/* Delivered state */}
        {isDelivered && (
          <Animated.View entering={FadeInDown.delay(250).duration(400)} className="mx-4 mt-4 rounded-2xl bg-secondary-50 p-5 items-center">
            <CheckCircle2 size={40} color="#22C55E" />
            <Text className="mt-2 text-title font-black text-secondary-700">
              Order Delivered!
            </Text>
            <Text className="mt-1 text-caption text-secondary-600/70">
              Enjoy your fresh groceries
            </Text>
          </Animated.View>
        )}

        {/* Call & WhatsApp buttons */}
        {!isDelivered && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)} className="mx-4 mt-4 flex-row gap-3">
            <Pressable
              onPress={callRider}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-white py-4 border border-neutral-100"
              style={{ shadowColor: "#050505", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
            >
              <View className="h-9 w-9 rounded-full bg-secondary-50 items-center justify-center">
                <Phone size={16} color="#22C55E" />
              </View>
              <Text className="text-body font-bold text-neutral-900">Call</Text>
            </Pressable>
            <Pressable
              onPress={messageRider}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-white py-4 border border-neutral-100"
              style={{ shadowColor: "#050505", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
            >
              <View className="h-9 w-9 rounded-full bg-info-50 items-center justify-center">
                <MessageCircle size={16} color="#3B82F6" />
              </View>
              <Text className="text-body font-bold text-neutral-900">Message</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Status Timeline */}
        <Animated.View
          entering={FadeInDown.delay(350).duration(400)}
          className="mx-4 mt-4 rounded-2xl bg-white p-5 border border-neutral-100"
          style={{ shadowColor: "#050505", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }}
        >
          <Text className="text-caption font-bold uppercase tracking-wider text-neutral-400 mb-5">
            Order Status
          </Text>
          {TRACKING_STEPS.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const StepIcon = step.Icon;

            return (
              <View key={step.key} className="flex-row gap-4">
                {/* Timeline */}
                <View className="items-center">
                  <View
                    className={`h-9 w-9 rounded-full items-center justify-center ${
                      isCompleted || isCurrent
                        ? "bg-secondary-500"
                        : "bg-neutral-100"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={16} color="#FFFFFF" />
                    ) : (
                      <StepIcon size={16} color={isCurrent ? "#FFFFFF" : "#D1D5DB"} />
                    )}
                  </View>
                  {index < TRACKING_STEPS.length - 1 && (
                    <View
                      className={`w-0.5 flex-1 min-h-[32px] ${
                        isCompleted ? "bg-secondary-500" : "bg-neutral-100"
                      }`}
                    />
                  )}
                </View>

                {/* Content */}
                <View className="pb-6 pt-1.5 flex-1">
                  <Text
                    className={`text-body font-bold ${
                      isCompleted || isCurrent
                        ? "text-neutral-900"
                        : "text-neutral-400"
                    }`}
                  >
                    {step.label}
                  </Text>
                  <Text
                    className={`mt-0.5 text-caption ${
                      isCompleted || isCurrent
                        ? "text-neutral-500"
                        : "text-neutral-300"
                    }`}
                  >
                    {step.subtitle}
                  </Text>
                </View>
              </View>
            );
          })}
        </Animated.View>

        {/* Delivery OTP */}
        {tracking.deliveryOtp && !isDelivered && (
          <Animated.View
            entering={FadeInDown.delay(400).duration(400)}
            className="mx-4 mt-4 rounded-2xl border border-secondary-200 bg-secondary-50 p-4"
          >
            <Text className="text-micro font-bold uppercase tracking-wider text-secondary-700">
              Delivery OTP
            </Text>
            <Text className="mt-2 font-mono text-3xl font-black tracking-[8px] text-neutral-900">
              {tracking.deliveryOtp}
            </Text>
            <Text className="mt-1 text-caption text-secondary-600/70">
              Share this code only with the delivery person.
            </Text>
          </Animated.View>
        )}

        {/* Live indicator */}
        <View className="flex-row items-center justify-center mt-6">
          <View className="w-2 h-2 rounded-full bg-secondary-500 mr-2" />
          <Text className="text-micro text-neutral-400">
            Updating every {POLL_INTERVAL / 1000} seconds
          </Text>
        </View>
      </ScrollView>
    </>
  );
}
