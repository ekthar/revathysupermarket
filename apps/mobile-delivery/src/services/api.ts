import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { API_BASE_URL } from "../config/api";

const ACCESS_TOKEN_KEY = "msm_delivery_access_token";
const REFRESH_TOKEN_KEY = "msm_delivery_refresh_token";

const webStorage = {
  getItem(key: string): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  },
  setItem(key: string, value: string): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  },
  removeItem(key: string): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  },
};

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    if (Platform.OS === "web") {
      return webStorage.getItem(ACCESS_TOKEN_KEY);
    }
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },
  async getRefreshToken(): Promise<string | null> {
    if (Platform.OS === "web") {
      return webStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    if (Platform.OS === "web") {
      webStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      webStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      return;
    }

    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
    ]);
  },
  async clearTokens(): Promise<void> {
    if (Platform.OS === "web") {
      webStorage.removeItem(ACCESS_TOKEN_KEY);
      webStorage.removeItem(REFRESH_TOKEN_KEY);
      return;
    }

    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);
  },
};

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const skipPaths = ["/auth/login", "/auth/refresh", "/auth/otp"];
  if (skipPaths.some((p) => config.url?.includes(p))) return config;
  const token = await tokenStorage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config;
    if (!original || error.response?.status !== 401) return Promise.reject(error);
    const skipPaths = ["/auth/login", "/auth/refresh", "/auth/otp"];
    if (skipPaths.some((p) => original.url?.includes(p))) return Promise.reject(error);

    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshSubscribers.push((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(api(original));
        });
      });
    }

    isRefreshing = true;
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken) { await tokenStorage.clearTokens(); return Promise.reject(error); }
      const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
      await tokenStorage.setTokens(data.accessToken, data.refreshToken);
      onTokenRefreshed(data.accessToken);
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(original);
    } catch {
      await tokenStorage.clearTokens();
      refreshSubscribers = [];
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);
