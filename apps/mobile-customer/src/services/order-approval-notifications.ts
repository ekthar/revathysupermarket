/**
 * Order Approval Notification Service
 *
 * Handles displaying notifications to customers when their order transitions
 * to AWAITING_CUSTOMER_APPROVAL status (after a staff member performs a substitution).
 *
 * Two notification channels:
 * 1. Local push notification (works when app is in background or foreground)
 * 2. In-app banner (displayed as a Toast when the app is in the foreground)
 *
 * The backend pushes the notification via push tokens when the status changes.
 * This service handles the foreground case via WebSocket ORDER_UPDATE messages.
 */

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { router } from "expo-router";

const APPROVAL_NOTIFICATION_TITLE = "Order Modified";
const APPROVAL_NOTIFICATION_BODY =
  "Your order has been modified. Please review and approve or reject the changes.";

/**
 * Schedule a local notification to alert the customer about a pending approval.
 * This is used when the app receives a WebSocket update indicating
 * the order has transitioned to AWAITING_CUSTOMER_APPROVAL.
 */
export async function showApprovalLocalNotification(orderId: string, orderNumber?: string): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: APPROVAL_NOTIFICATION_TITLE,
        body: APPROVAL_NOTIFICATION_BODY,
        data: {
          type: "order_approval",
          orderId,
          orderNumber: orderNumber ?? "",
          url: `/orders/${orderId}`,
        },
        sound: "default",
        ...(Platform.OS === "android" && { channelId: "orders" }),
      },
      trigger: null, // Show immediately
    });
  } catch {
    // Silent fail — notification permission may not be granted
  }
}

/**
 * Navigate the customer to the order detail screen to review substitutions.
 * Called when the user taps the in-app banner or the push notification.
 */
export function navigateToOrderApproval(orderId: string): void {
  router.push(`/orders/${orderId}` as any);
}

/**
 * Check if a status update indicates the order needs customer approval.
 */
export function isApprovalStatus(status: string): boolean {
  return status === "AWAITING_CUSTOMER_APPROVAL";
}
