import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
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
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react-native";
import { api } from "@/services/api";
import { STATUS_LABELS } from "@msm/shared/constants";
import { isDeliveryEtaVisible, formatRelativeTime } from "@msm/shared/utils";
import type { OrderStatus } from "@msm/shared/types";
import {
  getRealtimeService,
  type OrderUpdateMessage,
  type ConnectionState,
} from "@/services/realtime";
import { emitApprovalNotification } from "@/components/ApprovalNotificationBanner";
import { showApprovalLocalNotification, isApprovalStatus } from "@/services/order-approval-notifications";

// ============================================
// Types
// ============================================

interface TrackingData {
  id: string;
  orderNumber: string;
  status: string;
  updatedAt: string;
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

// ============================================
// Constants
// ============================================

const TRACKING_STEPS = [
  { key: "ORDER_RECEIVED", label: "Order received", subtitle: "We got it. The store is preparing.", Icon: ShoppingBag },
  { key: "PACKING", label: "Packing your bag", subtitle: "Hand-picked items, carefully packed.", Icon: Package },
  { key: "OUT_FOR_DELIVERY", label: "Out for delivery", subtitle: "Your rider is on the way.", Icon: Truck },
  { key: "DELIVERED", label: "Delivered", subtitle: "Enjoy your fresh groceries!", Icon: CheckCircle2 },
];

const STORE_PHONE = "+919876543210";
const STORE_WHATSAPP = "919876543210";
const MARKER_ANIMATION_DURATION = 1200; // ms for smooth rider movement

// ============================================
// Utility Functions
// ============================================

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

// ============================================
// REST Fallback Adapter
// ============================================

/** Converts REST tracking response to OrderUpdateMessage format for the fallback */
async function fetchTrackingAsMessage(orderId: string): Promise<OrderUpdateMessage | null> {
  try {
    const { data } = await api.get(`/orders/${orderId}/tracking`);
    return {
      type: "ORDER_UPDATE",
      orderId,
      status: data.status || "",
      riderLat: data.deliveryPartnerLocation?.latitude ?? null,
      riderLng: data.deliveryPartnerLocation?.longitude ?? null,
      eta: data.estimatedMinutes ?? null,
      timestamp: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

// ============================================
// Main Component
// ============================================

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const mapRef = useRef<MapView>(null);

  // Smooth rider position state — uses interpolation via requestAnimationFrame
  const [riderDisplayPos, setRiderDisplayPos] = useState<{ latitude: number; longitude: number } | null>(null);
  const riderTargetRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const riderCurrentRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Pulse animation for live indicator
  const pulseScale = useSharedValue(1);
  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Smooth interpolation function for rider marker
  const animateRiderTo = useCallback((target: { latitude: number; longitude: number }) => {
    riderTargetRef.current = target;

    if (!riderCurrentRef.current) {
      // First position — snap immediately
      riderCurrentRef.current = target;
      setRiderDisplayPos(target);
      return;
    }

    // Interpolate over MARKER_ANIMATION_DURATION using requestAnimationFrame
    const start = { ...riderCurrentRef.current };
    const startTime = Date.now();

    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / MARKER_ANIMATION_DURATION, 1);

      // Ease-out cubic for natural deceleration
      const eased = 1 - Math.pow(1 - progress, 3);

      const interpolated = {
        latitude: start.latitude + (target.latitude - start.latitude) * eased,
        longitude: start.longitude + (target.longitude - start.longitude) * eased,
      };

      setRiderDisplayPos(interpolated);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
      } else {
        riderCurrentRef.current = target;
        animationFrameRef.current = null;
      }
    };

    // Cancel any running animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(step);
  }, []);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // ============================
  // Initial REST fetch (for immediate display before WS connects)
  // ============================
  const fetchInitialData = useCallback(async (orderId: string) => {
    try {
      const { data } = await api.get(`/orders/${orderId}/tracking`);
      setTracking(data);
      // Set initial rider position
      if (data.deliveryPartnerLocation) {
        animateRiderTo(data.deliveryPartnerLocation);
      }
    } catch {}
    setIsLoading(false);
  }, [animateRiderTo]);

  // ============================
  // WebSocket Message Handler
  // ============================
  const handleRealtimeMessage = useCallback((message: OrderUpdateMessage) => {
    setTracking((prev) => {
      if (!prev) return prev;

      const newTracking = { ...prev };

      // Update status if changed
      if (message.status && message.status !== prev.status) {
        newTracking.status = message.status;
        // Refresh updatedAt when status changes
        newTracking.updatedAt = message.timestamp || new Date().toISOString();

        // Trigger approval notification when status changes to AWAITING_CUSTOMER_APPROVAL
        if (isApprovalStatus(message.status)) {
          emitApprovalNotification({
            orderId: prev.id,
            orderNumber: prev.orderNumber,
          });
          showApprovalLocalNotification(prev.id, prev.orderNumber);
        }
      }

      // Update ETA
      if (message.eta !== null) {
        newTracking.estimatedMinutes = message.eta;
      }

      // Update rider location with smooth animation
      if (message.riderLat !== null && message.riderLng !== null) {
        const newLoc = { latitude: message.riderLat, longitude: message.riderLng };
        newTracking.deliveryPartnerLocation = newLoc;

        // Trigger smooth interpolation animation
        animateRiderTo(newLoc);
      }

      return newTracking;
    });
  }, [animateRiderTo]);

  // ============================
  // WebSocket Connection Lifecycle
  // ============================
  useEffect(() => {
    if (!id) return;

    // Fetch initial data immediately (don't wait for WS)
    fetchInitialData(id);

    // Connect WebSocket
    const service = getRealtimeService();
    service.connect(
      id,
      handleRealtimeMessage,
      setConnectionState,
      fetchTrackingAsMessage
    );

    // Cleanup on unmount
    return () => {
      service.disconnect();
    };
  }, [id, fetchInitialData, handleRealtimeMessage]);

  // ============================
  // ETA Calculation
  // ============================
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

  // ============================
  // Actions
  // ============================
  const callRider = () => {
    const phone = tracking?.deliveryPartner?.phone || STORE_PHONE;
    Linking.openURL(`tel:${phone}`);
  };

  const messageRider = () => {
    Linking.openURL(`https://wa.me/${STORE_WHATSAPP}`);
  };

  // ============================
  // Derived State
  // ============================
  const currentStep = tracking ? getStepIndex(tracking.status) : 0;
  const isDelivered = tracking?.status === "DELIVERED";
  const showMap = tracking && (
    tracking.deliveryPartnerLocation ||
    ["OUT_FOR_DELIVERY", "ARRIVING", "READY_FOR_DELIVERY"].includes(tracking.status)
  );

  // Connection state label
  const connectionLabel = useMemo(() => {
    switch (connectionState) {
      case "connected": return "Live";
      case "reconnecting": return "Reconnecting...";
      case "polling": return "Updating";
      case "connecting": return "Connecting...";
      default: return "Offline";
    }
  }, [connectionState]);

  const isLive = connectionState === "connected";

  // ============================
  // Loading State
  // ============================
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

  // ============================
  // Render
  // ============================
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
              {/* Live Pulse Indicator */}
              <Animated.View style={pulseStyle} className="relative w-3 h-3">
                <View className={`absolute inset-0 rounded-full ${isLive ? "bg-white" : "bg-white/50"}`} />
                <View className={`w-3 h-3 rounded-full ${isLive ? "bg-white" : "bg-white/60"}`} />
              </Animated.View>
              <View>
                <Text className="text-micro font-bold uppercase tracking-wider text-white/80">
                  {connectionLabel}
                </Text>
                <Text className="text-body font-bold text-white">
                  {getStatusLabel(tracking.status)}
                </Text>
              </View>
            </View>
            <View className="items-end">
              {etaMinutes && !isDelivered && isDeliveryEtaVisible(tracking.status as OrderStatus) && (
                <Text className="text-xl font-black text-white">{etaMinutes} min</Text>
              )}
              {isDelivered && (
                <Text className="text-body font-bold text-white">Complete</Text>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Connection State Indicator (shown when not fully connected) */}
        {connectionState === "reconnecting" && (
          <View className="mx-4 mt-2 flex-row items-center justify-center gap-2 py-2 rounded-xl bg-warning-50 border border-warning-100">
            <RefreshCw size={12} color="#B45309" />
            <Text className="text-micro font-bold text-warning-700">Reconnecting to live updates...</Text>
          </View>
        )}
        {connectionState === "disconnected" && (
          <View className="mx-4 mt-2 flex-row items-center justify-center gap-2 py-2 rounded-xl bg-error-50 border border-error-100">
            <WifiOff size={12} color="#B91C1C" />
            <Text className="text-micro font-bold text-error-700">Connection lost</Text>
          </View>
        )}

        {/* Last Updated Timestamp */}
        {tracking.updatedAt && (
          <View className="mx-4 mt-2">
            <Text className="text-micro text-neutral-400 text-center">
              Last updated: {formatRelativeTime(tracking.updatedAt)}
            </Text>
          </View>
        )}

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

        {/* Map with Animated Rider Marker */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} className="mx-4 mt-4 rounded-2xl overflow-hidden h-64">
          {showMap && tracking.destination ? (
            <MapView
              ref={mapRef}
              style={{ flex: 1 }}
              provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
              initialRegion={{
                latitude: tracking.destination.latitude,
                longitude: tracking.destination.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
              showsUserLocation
            >
              {/* Customer destination marker */}
              <Marker
                coordinate={tracking.destination}
                title="Your location"
                pinColor="#050505"
              />
              {/* Rider Marker — smoothly interpolates between positions via JS animation */}
              {riderDisplayPos && (
                <Marker
                  coordinate={riderDisplayPos}
                  title={tracking.deliveryPartner?.name || "Rider"}
                  pinColor="#22C55E"
                  flat
                  anchor={{ x: 0.5, y: 0.5 }}
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

        {/* ETA Display — only shown for dispatch statuses (OUT_FOR_DELIVERY, ARRIVING) */}
        {etaMinutes && !isDelivered && isDeliveryEtaVisible(tracking.status as OrderStatus) && (
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

        {/* Connection state footer */}
        <View className="flex-row items-center justify-center mt-6 gap-2">
          {isLive ? (
            <Wifi size={12} color="#22C55E" />
          ) : connectionState === "polling" ? (
            <RefreshCw size={12} color="#9CA3AF" />
          ) : (
            <WifiOff size={12} color="#9CA3AF" />
          )}
          <Text className="text-micro text-neutral-400">
            {isLive
              ? "Real-time updates active"
              : connectionState === "polling"
              ? "Updating every 6s (WebSocket reconnecting)"
              : connectionLabel}
          </Text>
        </View>
      </ScrollView>
    </>
  );
}
