/**
 * Firebase Cloud Messaging service.
 * Handles FCM token retrieval, permission requests, and message routing.
 * Replaces expo-notifications for push — enables full-screen alerts via notifee.
 */

import messaging, { FirebaseMessagingTypes } from "@react-native-firebase/messaging";
import { Platform } from "react-native";
import { api } from "./api";
import { notifeeService } from "./notifee";
import { getDeviceTokenRole } from "../stores/auth";

class FcmService {
  private token: string | null = null;
  private unsubscribeOnMessage: (() => void) | null = null;

  /**
   * Request notification permission and get FCM token.
   * Call once on app startup after auth.
   */
  async initialize(): Promise<string | null> {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.warn("[FCM] Permission not granted");
      return null;
    }

    this.token = await messaging().getToken();

    // Listen for foreground messages
    this.unsubscribeOnMessage = messaging().onMessage(this.handleForegroundMessage);

    // Listen for token refresh
    messaging().onTokenRefresh((newToken) => {
      this.token = newToken;
      // Re-register silently — role will be fetched from last known
    });

    return this.token;
  }

  /**
   * Register the FCM token with our backend.
   * Maps the user role to the device token role for push targeting.
   */
  async registerToken(userRole: string): Promise<void> {
    if (!this.token) {
      this.token = await messaging().getToken().catch(() => null);
    }
    if (!this.token) return;

    const role = getDeviceTokenRole(userRole);
    const installationId = `staff-${Platform.OS}-${this.token.slice(-16)}`;

    try {
      await api.post("/devices", {
        token: this.token,
        platform: Platform.OS,
        installationId,
        role,
      });
    } catch (error) {
      console.warn("[FCM] Device registration failed:", error);
    }
  }

  /**
   * Handle messages received while app is in foreground.
   * Routes to appropriate notifee display based on message type.
   */
  private handleForegroundMessage = async (
    message: FirebaseMessagingTypes.RemoteMessage
  ) => {
    const type = message.data?.type as string | undefined;

    switch (type) {
      case "delivery_assignment":
        await notifeeService.showDeliveryAlert({
          eventId: message.data?.eventId as string,
          orderId: message.data?.orderId as string,
          orderNumber: message.data?.orderNumber as string,
          deepLink: message.data?.deepLink as string,
        });
        break;

      case "packing_assignment":
        await notifeeService.showPackingAlert({
          eventId: message.data?.eventId as string,
          orderId: message.data?.orderId as string,
          orderNumber: message.data?.orderNumber as string,
        });
        break;

      case "order_rejected":
        await notifeeService.showAdminRejectAlert({
          orderId: message.data?.orderId as string,
          orderNumber: message.data?.orderNumber as string,
          reason: message.data?.reason as string,
        });
        break;

      default:
        // Generic notification
        if (message.notification) {
          await notifeeService.showGenericNotification(
            message.notification.title ?? "MSM Staff",
            message.notification.body ?? ""
          );
        }
        break;
    }
  };

  /**
   * Cleanup listeners
   */
  destroy() {
    if (this.unsubscribeOnMessage) {
      this.unsubscribeOnMessage();
      this.unsubscribeOnMessage = null;
    }
  }
}

export const fcmService = new FcmService();

/**
 * Background message handler.
 * Handles FCM messages when the app is in background or killed state.
 */
messaging().setBackgroundMessageHandler(async (message) => {
  const type = message.data?.type as string | undefined;

  switch (type) {
    case "delivery_assignment":
      await notifeeService.showDeliveryAlert({
        eventId: message.data?.eventId as string,
        orderId: message.data?.orderId as string,
        orderNumber: message.data?.orderNumber as string,
        deepLink: message.data?.deepLink as string,
      });
      break;

    case "packing_assignment":
      await notifeeService.showPackingAlert({
        eventId: message.data?.eventId as string,
        orderId: message.data?.orderId as string,
        orderNumber: message.data?.orderNumber as string,
      });
      break;

    case "order_rejected":
      await notifeeService.showAdminRejectAlert({
        orderId: message.data?.orderId as string,
        orderNumber: message.data?.orderNumber as string,
        reason: message.data?.reason as string,
      });
      break;

    default:
      if (message.notification) {
        await notifeeService.showGenericNotification(
          message.notification.title ?? "MSM Staff",
          message.notification.body ?? ""
        );
      }
      break;
  }
});
