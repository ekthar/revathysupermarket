import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor configuration for the STAFF app.
 *
 * Staff members (admin/store managers) use this to:
 * - Receive order assignment alerts (push notifications with sound)
 * - View and manage orders
 * - Handle delivery dispatching
 *
 * For customer app, see capacitor.config.ts.
 * For delivery partner app, see capacitor.delivery.config.ts.
 */
const config: CapacitorConfig = {
  appId: "in.revathysupermarket.staff",
  appName: "Revathy Staff",
  webDir: "out",
  server: {
    url: process.env.CAPACITOR_SERVER_URL || "https://revathysupermarket.vercel.app/staff",
    cleartext: false,
    allowNavigation: ["revathysupermarket.vercel.app", "*.vercel.app"],
  },
  android: {
    backgroundColor: "#1e293b",
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: process.env.NODE_ENV !== "production",
    initialFocus: false,
  },
  ios: {
    backgroundColor: "#1e293b",
    contentInset: "always",
    preferredContentMode: "mobile",
    scheme: "revathy-staff",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 600,
      launchAutoHide: true,
      backgroundColor: "#1e293b",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK", // Light text on dark admin bg
      backgroundColor: "#1e293b",
      overlaysWebView: false,
    },
    Keyboard: {
      resize: "body",
      style: "DARK",
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    Haptics: {},
    LocalNotifications: {
      smallIcon: "ic_stat_icon",
      iconColor: "#059669",
      sound: "delivery_alarm.wav",
    },
  },
};

export default config;
