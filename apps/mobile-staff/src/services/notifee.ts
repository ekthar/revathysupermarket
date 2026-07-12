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

export interface PackingAlertPayload {
  eventId: string;
  orderId: string;
  orderNumber: string;
}

export interface AdminRejectPayload {
  orderId: string;
  orderNumber: string;
  reason?: string;
}

class NotifeeService {
  private channelsPromise: Promise<void> | null = null;

  /**
   * Create notification channels on app startup.
   * Must be called before displaying any notifications.
   */
  async createChannels(): Promise<void> {
    if (this.channelsPromise) return this.channelsPromise;

    this.channelsPromise = (async () => {
      // Delivery alert channel — high importance, custom sound, bypasses DND
      await notifee.createChannel({
        id: "delivery_alert",
        name: "Delivery Alerts",
        description: "Incoming order assignment alerts",
        importance: AndroidImportance.HIGH,
        sound: "delivery_alarm",
        vibration: true,
        vibrationPattern: [300, 100, 300, 100, 300, 100],
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
        vibrationPattern: [500, 200, 500, 200],
        bypassDnd: true,
        visibility: AndroidVisibility.PUBLIC,
      });

      // Packing alert channel — high importance, vibration, bypasses DND
      await notifee.createChannel({
        id: "packing_alert",
        name: "Packing Alerts",
        description: "Incoming packing order assignment alerts",
        importance: AndroidImportance.HIGH,
        sound: "delivery_alarm",
        vibration: true,
        vibrationPattern: [300, 100, 300, 100, 300, 100],
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
    })();

    return this.channelsPromise;
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
   * Display a new order alert for admins.
   */
  async showAdminNewOrderAlert(payload: { orderId: string; orderNumber: string }): Promise<void> {
    await this.createChannels();

    await notifee.displayNotification({
      id: `new-order-${payload.orderId}`,
      title: "🆕 New Order Received",
      body: `Order #${payload.orderNumber} is waiting for approval.`,
      android: {
        channelId: "admin_emergency",
        category: AndroidCategory.ALARM,
        importance: AndroidImportance.HIGH,
        fullScreenAction: {
          id: "view_new_order",
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
        type: "new_order_alert",
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
   * Display a full-screen packing assignment alert.
   * Rings loudly, wakes screen, shows accept/reject even when phone is locked.
   */
  async showPackingAlert(payload: PackingAlertPayload): Promise<void> {
    await this.createChannels();

    await notifee.displayNotification({
      id: `packing-${payload.eventId}`,
      title: `📦 New Packing Order #${payload.orderNumber}`,
      body: "New order assigned for packing. Tap to start.",
      android: {
        channelId: "packing_alert",
        category: AndroidCategory.CALL,
        importance: AndroidImportance.HIGH,
        fullScreenAction: {
          id: "accept_packing",
          launchActivity: "default",
        },
        sound: "delivery_alarm",
        ongoing: true,
        autoCancel: false,
        pressAction: {
          id: "view_packing",
          launchActivity: "default",
        },
        actions: [
          {
            title: "\u2713 Accept",
            pressAction: { id: "accept", launchActivity: "default" },
          },
          {
            title: "\u2715 Reject",
            pressAction: { id: "reject", launchActivity: "default" },
          },
        ],
      },
      data: {
        type: "packing_assignment",
        eventId: payload.eventId,
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
