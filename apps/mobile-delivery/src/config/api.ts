import { Platform } from "react-native";

const DEV_API_URL = Platform.select({
  android: "http://10.0.2.2:3000/api",
  ios: "http://localhost:3000/api",
  default: "http://localhost:3000/api",
});

const PROD_API_URL = "https://revathysupermarket.vercel.app/api";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || (__DEV__ ? DEV_API_URL : PROD_API_URL);
