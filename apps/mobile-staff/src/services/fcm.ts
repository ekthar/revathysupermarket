/**
 * Firebase Cloud Messaging service.
 * Handles FCM token retrieval, permission requests, and message routing.
 * Replaces expo-notifications for push — enables full-screen alerts via notifee.
 */

import messaging, { FirebaseMessagingTypes } from "@react-native-firebase/messaging";
import { Platform, Alert, AppState } from "react-native";
import { router } from "expo-router";
import { api } from "./api";
import { notifeeService } from "./notifee";
import { alarmService } from "./alarm";
import { getDeviceTokenRole } from "../stores/auth";

/**
 * Shared message routing logic.
 * Routes an incoming FCM message to the appropriate notifee display.
 * Used by both foreground and background message handlers.
 */
async function routeIncomingMessage(
  message: FirebaseMessagingTypes.RemoteMessage
): Promise<void> {
  try {
    const type = message.data?.type as string | undefined;
    const isForeground = AppState.currentState === "active";

    if (isForeground) {
      if (type === "delivery_assignment") {
        router.push(
          `/alert/${message.data?.eventId}?orderId=${message.data?.orderId}&orderNumber=${message.data?.orderNumber}` as any
        );
        return;
      } else if (type === "packing_assignment") {
        router.push(
          `/alert/packing/${message.data?.eventId}?orderId=${message.data?.orderId}&orderNumber=${message.data?.orderNumber}` as any
        );
        return;
      } else if (type === "new_order_alert") {
        alarmService.startAlarm().catch(() => null);
        Alert.alert(
          "🆕 New Order received!",
          `Order #${message.data?.orderNumber} is waiting for approval.`,
          [
            {
              text: "View Order",
              onPress: async () => {
                await alarmService.stopAlarm();
                router.push(`/(admin)/orders` as any);
              }
            },
            {
              text: "Mute",
              onPress: async () => {
                await alarmService.stopAlarm();
              },
              style: "cancel"
            }
          ],
          { cancelable: false }
        );
        return;
      }
    }

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

      case "new_order_alert":
        await notifeeService.showAdminNewOrderAlert({
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
  } catch (error) {
    console.error("[FCM] Error routing incoming message:", error);
  }
}

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
    this.unsubscribeOnMessage = messaging().onMessage(routeIncomingMessage);

    // Listen for token refresh
    messaging().onTokenRefresh((newToken) => {
      this.token = newToken;
      // Re-register with backend using last known role
      const role = getDeviceTokenRole();
      if (role) {
        const installationId = `staff-${Platform.OS}-${newToken.slice(-16)}`;
        api.post("/devices", {
          token: newToken,
          platform: Platform.OS,
          installationId,
          role,
        }).catch((err) => console.warn("[FCM] Token re-registration failed:", err));
      }
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
messaging().setBackgroundMessageHandler(routeIncomingMessage);
