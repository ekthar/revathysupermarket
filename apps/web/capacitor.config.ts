import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.revathysupermarket.delivery",
  appName: "Revathy Delivery",
  webDir: "out",
  server: {
    url: process.env.CAPACITOR_SERVER_URL || "https://revathysupermarket.vercel.app",
    cleartext: false,
  },
  android: {
    backgroundColor: "#050505",
    allowMixedContent: false,
    captureInput: true,
  },
  ios: {
    backgroundColor: "#050505",
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
