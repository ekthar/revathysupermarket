import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "in.revathysupermarket.app",
  appName: "Revathy Supermarket",
  webDir: "out",
  server: {
    // Load the live site directly — this makes updates instant without app store
    url: process.env.CAPACITOR_SERVER_URL || "https://revathysupermarket.vercel.app",
    cleartext: false
  },
  android: {
    allowMixedContent: false,
    // Target latest SDK to avoid Play Protect "built for older version" warning
    minSdkVersion: 24,
    // Use appendUserAgent so the web app can detect it's running in the native shell
    appendUserAgent: "RevathySupermarket-Android",
    // Don't use WebView caching that triggers security warnings
    webContentsDebuggingEnabled: false
  },
  ios: {
    scheme: "Revathy Supermarket"
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#0F8A5F",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#0F8A5F"
    }
  }
};

export default config;
