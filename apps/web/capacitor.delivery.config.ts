import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor configuration for the DELIVERY PARTNER app.
 *
 * Delivery partners need:
 * - Background GPS tracking (continuous location updates to server)
 * - Push notifications for new order assignments
 * - Foreground service for location while app is in background
 * - Camera for proof-of-delivery photos
 *
 * For customer app, see capacitor.config.ts.
 * For staff app, see capacitor.staff.config.ts.
 *
 * NOTE: `webDir` is required by Capacitor CLI even in remote mode.
 * It points to a placeholder directory; the actual content is served
 * from the remote `server.url`.
 */
const config: CapacitorConfig = {
  appId: "in.revathysupermarket.delivery",
  appName: "Revathy Delivery",
  webDir: "public",
  server: {
    url: process.env.CAPACITOR_SERVER_URL || "https://revathysupermarket.vercel.app/delivery",
    cleartext: false,
    allowNavigation: ["revathysupermarket.vercel.app"],
  },
  android: {
    backgroundColor: "#059669",
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    initialFocus: false,
  },
  ios: {
    backgroundColor: "#059669",
    contentInset: "always",
    preferredContentMode: "mobile",
    scheme: "revathy-delivery",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 600,
      launchAutoHide: true,
      backgroundColor: "#059669",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK", // Light text on emerald bg
      backgroundColor: "#059669",
      overlaysWebView: false,
    },
    Keyboard: {
      resize: "body",
      style: "LIGHT",
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    Haptics: {},
    CapacitorHttp: {
      enabled: true, // Native HTTP for better performance
    },
    Geolocation: {
      // Delivery partners need background location
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon",
      iconColor: "#059669",
      sound: "delivery_alarm",
    },
    Camera: {
      // Proof-of-delivery photos
    },
    BackgroundGeolocation: {
      // @capacitor-community/background-geolocation
    },
  },
};

export default config;
