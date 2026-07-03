/**
 * Firebase Admin SDK integration for sending FCM push notifications.
 *
 * Dispatches high-priority data messages to registered device tokens.
 * Uses the centralized firebase-admin module for authentication.
 */

import { prisma } from "@/lib/prisma";
import { adminMessaging } from "@/lib/firebase-admin";

interface FcmPayload {
  eventId: string;
  orderId: string;
  orderNumber: string;
  deepLink?: string;
  type: string;
  title?: string;
  body?: string;
}

/**
 * Sends an FCM data message to all registered devices for a given user.
 * Returns true if at least one message was sent successfully.
 */
export async function sendFcmToUser(userId: string, payload: FcmPayload): Promise<boolean> {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!projectId || !serviceAccountKey) {
    console.warn("[FCM] Firebase credentials not configured. Skipping push dispatch.");
    return false;
  }

  // Get all device tokens for the user
  const devices = await prisma.deviceToken.findMany({
    where: { userId },
    select: { token: true, id: true },
  });

  if (devices.length === 0) {
    console.warn(`[FCM] No registered devices for user ${userId}`);
    return false;
  }

  let anySuccess = false;
  const staleTokenIds: string[] = [];
  const defaultTitle = payload.title || `Order #${payload.orderNumber}`;
  const defaultBody = payload.body || (payload.type === "delivery_assignment" ? "New delivery order assigned to you!" : "Order status updated");

  for (const device of devices) {
    try {
      await adminMessaging.send({
        token: device.token,
        data: {
          type: payload.type,
          eventId: payload.eventId,
          orderId: payload.orderId,
          orderNumber: payload.orderNumber,
          title: defaultTitle,
          body: defaultBody,
          deepLink: payload.deepLink || `msmsupermarket://delivery/order/${payload.orderId}`,
        },
        android: { priority: "high" },
        apns: {
          headers: { "apns-priority": "10" },
          payload: {
            aps: {
              "content-available": 1,
              "interruption-level": "time-sensitive",
            },
          },
        },
        webpush: {
          headers: { Urgency: "high" },
          notification: {
            title: defaultTitle,
            body: defaultBody,
            icon: "/icons/icon-192.png",
          },
        },
      });
      anySuccess = true;
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      // Token is stale/unregistered
      if (
        errorMsg.includes("messaging/registration-token-not-registered") ||
        errorMsg.includes("messaging/invalid-registration-token")
      ) {
        staleTokenIds.push(device.id);
      } else {
        console.error(`[FCM] Send failed for device ${device.id}:`, errorMsg);
      }
    }
  }

  // Clean up stale device tokens
  if (staleTokenIds.length > 0) {
    await prisma.deviceToken.deleteMany({
      where: { id: { in: staleTokenIds } },
    }).catch(() => null);
  }

  return anySuccess;
}

/**
 * Sends a high-priority FCM data message to ALL registered admin device tokens.
 * Used for critical alerts like order rejections that require immediate attention.
 * Returns true if at least one message was sent successfully.
 */
export async function sendFcmToAdmins(payload: FcmPayload): Promise<boolean> {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!projectId || !serviceAccountKey) {
    console.warn("[FCM] Firebase credentials not configured. Skipping admin push dispatch.");
    return false;
  }

  const adminDevices = await prisma.deviceToken.findMany({
    where: { role: "admin" },
    select: { token: true, id: true },
  });

  if (adminDevices.length === 0) {
    console.warn("[FCM] No registered admin devices found");
    return false;
  }

  let anySuccess = false;
  const staleTokenIds: string[] = [];
  const defaultTitle = payload.title || `New Alert for Order #${payload.orderNumber}`;
  const defaultBody = payload.body || "Admin action required for this order.";

  for (const device of adminDevices) {
    try {
      await adminMessaging.send({
        token: device.token,
        data: {
          type: payload.type,
          eventId: payload.eventId,
          orderId: payload.orderId,
          orderNumber: payload.orderNumber,
          title: defaultTitle,
          body: defaultBody,
          deepLink: payload.deepLink || `msmsupermarket://admin/orders/${payload.orderId}`,
        },
        android: { priority: "high" },
        apns: {
          headers: { "apns-priority": "10" },
          payload: {
            aps: {
              "content-available": 1,
              "interruption-level": "critical",
              sound: { name: "emergency.caf", volume: 1.0 },
            },
          },
        },
        webpush: {
          headers: { Urgency: "high" },
          notification: {
            title: defaultTitle,
            body: defaultBody,
            icon: "/icons/icon-192.png",
            requireInteraction: true,
          },
        },
      });
      anySuccess = true;
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (
        errorMsg.includes("messaging/registration-token-not-registered") ||
        errorMsg.includes("messaging/invalid-registration-token")
      ) {
        staleTokenIds.push(device.id);
      } else {
        console.error(`[FCM] Admin send failed for device ${device.id}:`, errorMsg);
      }
    }
  }

  if (staleTokenIds.length > 0) {
    await prisma.deviceToken.deleteMany({
      where: { id: { in: staleTokenIds } },
    }).catch(() => null);
  }

  return anySuccess;
}

/**
 * Send a notification to a specific topic (e.g., "all-customers", "staff")
 */
export async function sendFcmToTopic(topic: string, notification: { title: string; body: string }, data?: Record<string, string>): Promise<boolean> {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) return false;

  try {
    await adminMessaging.send({
      topic,
      notification,
      data: data || {},
      webpush: {
        headers: { Urgency: "high" },
        notification: {
          ...notification,
          icon: "/icons/icon-192.png",
        },
      },
    });
    return true;
  } catch (error) {
    console.error("[FCM] Topic send failed:", error);
    return false;
  }
}
