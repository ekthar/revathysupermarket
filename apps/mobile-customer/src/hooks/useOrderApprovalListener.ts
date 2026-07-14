/**
 * useOrderApprovalListener
 *
 * A hook that periodically checks for orders in AWAITING_CUSTOMER_APPROVAL status
 * and triggers the in-app notification banner + local push notification.
 *
 * This complements the backend push notification by also detecting the status
 * change when the app is in the foreground (via polling the orders API).
 *
 * The hook tracks which orders have already been notified to avoid duplicate alerts.
 */

import { useEffect, useRef, useCallback } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { api } from "@/services/api";
import { useAuthStore } from "@/stores/auth";
import { emitApprovalNotification } from "@/components/ApprovalNotificationBanner";
import { showApprovalLocalNotification } from "@/services/order-approval-notifications";

const POLL_INTERVAL = 15000; // Check every 15 seconds

export function useOrderApprovalListener() {
  const { status: authStatus } = useAuthStore();
  const notifiedOrdersRef = useRef<Set<string>>(new Set());
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const checkForApprovalOrders = useCallback(async () => {
    if (authStatus !== "authenticated") return;

    try {
      const { data } = await api.get("/orders", {
        params: { status: "AWAITING_CUSTOMER_APPROVAL", limit: 5 },
      });

      const orders = data.items || data.orders || data || [];

      for (const order of orders) {
        const orderId = order.id;
        if (!orderId || notifiedOrdersRef.current.has(orderId)) continue;

        // Mark as notified to prevent duplicate notifications
        notifiedOrdersRef.current.add(orderId);

        // Emit in-app banner notification
        emitApprovalNotification({
          orderId,
          orderNumber: order.orderNumber,
        });

        // Schedule a local push notification (for when the app goes to background)
        showApprovalLocalNotification(orderId, order.orderNumber);
      }
    } catch {
      // Silent fail — will retry on next interval
    }
  }, [authStatus]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;

    // Initial check
    checkForApprovalOrders();

    // Set up polling
    pollTimerRef.current = setInterval(checkForApprovalOrders, POLL_INTERVAL);

    // Listen for app state changes to refresh when coming to foreground
    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (
          appStateRef.current.match(/inactive|background/) &&
          nextState === "active"
        ) {
          // App came to foreground — check immediately
          checkForApprovalOrders();
        }
        appStateRef.current = nextState;
      }
    );

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      appStateSubscription.remove();
    };
  }, [authStatus, checkForApprovalOrders]);
}
