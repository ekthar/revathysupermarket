import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor configuration for the CUSTOMER shopping app.
 *
 * For the delivery partner app, see capacitor.delivery.config.ts.
 * For the staff app, see capacitor.staff.config.ts.
 *
 * This config uses remote server mode — the app loads from the live
 * Vercel deployment, so updates ship instantly without cap sync.
 *
 * NOTE: `webDir` is required by Capacitor CLI even in remote mode.
 * It points to a placeholder directory; the actual content is served
 * from the remote `server.url`.
 */
const config: CapacitorConfig = {
  appId: "in.revathysupermarket.customer",
  appName: "Revathy Supermarket",
  webDir: "public",
  server: {
    url: process.env.CAPACITOR_SERVER_URL || "https://revathysupermarket.vercel.app",
    cleartext: false,
    allowNavigation: ["revathysupermarket.vercel.app"],
  },
  android: {
    backgroundColor: "#FFFFFF",
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    initialFocus: false,
  },
  ios: {
    backgroundColor: "#FFFFFF",
    contentInset: "always",
    preferredContentMode: "mobile",
    scheme: "revathy",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      launchAutoHide: false, // We hide it manually after first paint
      backgroundColor: "#FFFFFF",
      showSpinner: false,
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "LIGHT", // Dark text on light background
      backgroundColor: "#FFFFFF",
      overlaysWebView: true, // Content draws behind status bar (edge-to-edge)
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
    LocalNotifications: {
      smallIcon: "ic_stat_icon",
      iconColor: "#22C55E",
      sound: "notification",
    },
    Geolocation: {},
    Camera: {},
  },
};

export default config;
