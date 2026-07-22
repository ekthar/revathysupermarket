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
 *
 * NOTE: `webDir` is required by Capacitor CLI even in remote mode.
 * It points to a placeholder directory; the actual content is served
 * from the remote `server.url`.
 */
const config: CapacitorConfig = {
  appId: "in.revathysupermarket.staff",
  appName: "Revathy Staff",
  webDir: "public",
  server: {
    url: process.env.CAPACITOR_SERVER_URL || "https://revathysupermarket.vercel.app/staff",
    cleartext: false,
    allowNavigation: ["revathysupermarket.vercel.app"],
  },
  android: {
    backgroundColor: "#1e293b",
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
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
    CapacitorHttp: {
      enabled: true, // Native HTTP for better performance
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon",
      iconColor: "#059669",
      sound: "delivery_alarm",
    },
  },
};

export default config;
