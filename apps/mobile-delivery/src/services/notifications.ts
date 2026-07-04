import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { api } from "./api";

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

export const notificationService = {
  async initialize(): Promise<string | null> {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return null;

    // Set up Android channel for delivery alerts
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("delivery_alerts", {
        name: "Delivery Alerts",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 300, 100, 300, 100, 300],
        lightColor: "#059669",
        sound: "delivery_alarm.wav",
        enableVibrate: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
      });
    }

    // Get push token
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    // Register with backend
    try {
      await api.post("/devices", {
        token,
        platform: Platform.OS,
        installationId: `delivery-${Platform.OS}-${Date.now()}`,
      });
    } catch {
      // Non-critical
    }

    return token;
  },

  onNotificationReceived(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  },

  onNotificationTapped(callback: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  },
};
