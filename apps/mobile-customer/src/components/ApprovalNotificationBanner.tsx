/**
 * ApprovalNotificationBanner
 *
 * An in-app banner that slides down from the top when an order transitions
 * to AWAITING_CUSTOMER_APPROVAL. Prompts the customer to review and
 * approve or reject the substitution.
 *
 * This component is mounted at the app root level and listens for
 * order status changes via a callback-based event system.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { AlertTriangle, X } from "lucide-react-native";
import { navigateToOrderApproval } from "@/services/order-approval-notifications";

// ============================================
// Event System for Approval Notifications
// ============================================

type ApprovalEventPayload = {
  orderId: string;
  orderNumber?: string;
};

type ApprovalEventListener = (payload: ApprovalEventPayload) => void;

const listeners: Set<ApprovalEventListener> = new Set();

/**
 * Emit an approval notification event. Call this when a WebSocket
 * ORDER_UPDATE message indicates AWAITING_CUSTOMER_APPROVAL status.
 */
export function emitApprovalNotification(payload: ApprovalEventPayload): void {
  listeners.forEach((listener) => listener(payload));
}

function subscribeToApprovalEvents(listener: ApprovalEventListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// ============================================
// Banner Component
// ============================================

const BANNER_DISPLAY_DURATION = 8000; // Auto-dismiss after 8 seconds

export function ApprovalNotificationBanner() {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);
  const [currentPayload, setCurrentPayload] = useState<ApprovalEventPayload | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showBanner = useCallback((payload: ApprovalEventPayload) => {
    // Clear any existing dismiss timer
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }

    setCurrentPayload(payload);
    setVisible(true);

    // Animate in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss after duration
    dismissTimerRef.current = setTimeout(() => {
      dismissBanner();
    }, BANNER_DISPLAY_DURATION);
  }, [translateY, opacity]);

  const dismissBanner = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setCurrentPayload(null);
    });
  }, [translateY, opacity]);

  const handlePress = useCallback(() => {
    if (currentPayload) {
      dismissBanner();
      navigateToOrderApproval(currentPayload.orderId);
    }
  }, [currentPayload, dismissBanner]);

  useEffect(() => {
    const unsubscribe = subscribeToApprovalEvents(showBanner);
    return () => {
      unsubscribe();
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, [showBanner]);

  if (!visible) return null;

  return (
    <Animated.View
      className="absolute top-12 left-4 right-4 z-50 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3.5 shadow-xl"
      style={{
        opacity,
        transform: [{ translateY }],
      }}
    >
      <Pressable onPress={handlePress} className="flex-row items-start gap-3">
        {/* Icon */}
        <View className="mt-0.5 h-8 w-8 rounded-full bg-amber-100 items-center justify-center">
          <AlertTriangle size={16} color="#D97706" />
        </View>

        {/* Content */}
        <View className="flex-1">
          <Text className="text-body font-bold text-amber-900">
            Order Modified
          </Text>
          <Text className="text-caption text-amber-700 mt-0.5">
            Your order has been modified. Please review and approve or reject the changes.
          </Text>
          <Text className="text-micro font-bold text-amber-600 mt-1.5 uppercase tracking-wide">
            Tap to review
          </Text>
        </View>

        {/* Dismiss button */}
        <Pressable
          onPress={() => {
            dismissBanner();
          }}
          className="h-7 w-7 rounded-full bg-amber-100 items-center justify-center"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={14} color="#92400E" />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}
