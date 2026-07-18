import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor configuration for the DELIVERY PARTNER app.
 *
 * For the customer shopping app, see capacitor.config.ts.
 * This is used by delivery partners who need background GPS tracking.
 */
const config: CapacitorConfig = {
  appId: "com.revathysupermarket.delivery",
  appName: "Revathy Delivery",
  webDir: "out",
  server: {
    url: process.env.CAPACITOR_SERVER_URL || "https://revathysupermarket.vercel.app",
    cleartext: false,
  },
  android: {
    backgroundColor: "#059669",
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: process.env.NODE_ENV !== "production",
  },
  ios: {
    backgroundColor: "#059669",
    contentInset: "always",
    preferredContentMode: "mobile",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
};

export default config;
