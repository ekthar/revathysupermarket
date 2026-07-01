/**
 * Notifee notification service.
 * Creates channels and displays notifications with full-screen alert support.
 * Used for delivery assignment alerts and admin emergency bells.
 */

import notifee, {
  AndroidImportance,
  AndroidCategory,
  AndroidVisibility,
} from "@notifee/react-native";

export interface DeliveryAlertPayload {
  eventId: string;
  orderId: string;
  orderNumber: string;
  deepLink?: string;
}

export interface AdminRejectPayload {
  orderId: string;
  orderNumber: string;
  reason?: string;
}

class NotifeeService {
  private channelsCreated = false;

  /**
   * Create notification channels on app startup.
   * Must be called before displaying any notifications.
   */
  async createChannels(): Promise<void> {
    if (this.channelsCreated) return;

    // Delivery alert channel — high importance, custom sound, bypasses DND
    await notifee.createChannel({
      id: "delivery_alert",
      name: "Delivery Alerts",
      description: "Incoming order assignment alerts",
      importance: AndroidImportance.HIGH,
      sound: "delivery_alarm",
      vibration: true,
      vibrationPattern: [0, 300, 100, 300, 100, 300],
      bypassDnd: true,
      visibility: AndroidVisibility.PUBLIC,
    });

    // Admin emergency channel — distinct sound for order rejections
    await notifee.createChannel({
      id: "admin_emergency",
      name: "Emergency Alerts",
      description: "Critical alerts when orders are rejected",
      importance: AndroidImportance.HIGH,
      sound: "emergency_bell",
      vibration: true,
      vibrationPattern: [0, 500, 200, 500],
      bypassDnd: true,
      visibility: AndroidVisibility.PUBLIC,
    });

    // General notification channel
    await notifee.createChannel({
      id: "general",
      name: "General",
      description: "General notifications",
      importance: AndroidImportance.DEFAULT,
    });

    this.channelsCreated = true;
  }

  /**
   * Display a full-screen delivery assignment alert.
   * Rings loudly, wakes screen, shows accept/reject even when phone is locked.
   */
  async showDeliveryAlert(payload: DeliveryAlertPayload): Promise<void> {
    await this.createChannels();

    await notifee.displayNotification({
      id: `delivery-${payload.eventId}`,
      title: `🛵 New Order #${payload.orderNumber}`,
      body: "New delivery order assigned to you. Tap to accept or reject.",
      android: {
        channelId: "delivery_alert",
        category: AndroidCategory.CALL,
        importance: AndroidImportance.HIGH,
        fullScreenAction: {
          id: "accept_order",
          launchActivity: "default",
        },
        sound: "delivery_alarm",
        ongoing: true,
        autoCancel: false,
        pressAction: {
          id: "view_order",
          launchActivity: "default",
        },
        actions: [
          {
            title: "✓ Accept",
            pressAction: { id: "accept", launchActivity: "default" },
          },
          {
            title: "✕ Reject",
            pressAction: { id: "reject", launchActivity: "default" },
          },
        ],
      },
      data: {
        type: "delivery_assignment",
        eventId: payload.eventId,
        orderId: payload.orderId,
        orderNumber: payload.orderNumber,
      },
    });
  }

  /**
   * Display a full-screen emergency alert for admins when an order is rejected.
   * Different tone and styling from delivery alerts.
   */
  async showAdminRejectAlert(payload: AdminRejectPayload): Promise<void> {
    await this.createChannels();

    await notifee.displayNotification({
      id: `reject-${payload.orderId}`,
      title: "🔔 Order Rejected — Needs Reassignment",
      body: `Order #${payload.orderNumber} was rejected. ${payload.reason || "No reason provided."}`,
      android: {
        channelId: "admin_emergency",
        category: AndroidCategory.ALARM,
        importance: AndroidImportance.HIGH,
        fullScreenAction: {
          id: "view_rejected",
          launchActivity: "default",
        },
        sound: "emergency_bell",
        ongoing: false,
        pressAction: {
          id: "view_order",
          launchActivity: "default",
        },
      },
      data: {
        type: "order_rejected",
        orderId: payload.orderId,
        orderNumber: payload.orderNumber,
      },
    });
  }

  /**
   * Display a generic notification (for non-alert messages).
   */
  async showGenericNotification(title: string, body: string): Promise<void> {
    await this.createChannels();

    await notifee.displayNotification({
      title,
      body,
      android: {
        channelId: "general",
        importance: AndroidImportance.DEFAULT,
        pressAction: { id: "default" },
      },
    });
  }

  /**
   * Cancel a specific notification by ID.
   */
  async cancel(notificationId: string): Promise<void> {
    await notifee.cancelNotification(notificationId);
  }
}

export const notifeeService = new NotifeeService();
