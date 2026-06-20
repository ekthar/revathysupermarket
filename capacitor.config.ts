import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.beesoftdevs.supermarket",
  appName: "BEESOFT DEVS",
  webDir: "out",
  server: {
    url: "https://revathysupermarket.vercel.app",
    cleartext: false
  },
  android: {
    allowMixedContent: false
  },
  ios: {
    scheme: "BEESOFT DEVS"
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
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
