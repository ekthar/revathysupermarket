import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../services/api";

interface StoreConfig {
  storeName: string;
  gstRatePercent: number;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  minimumOrderValue: number;
  deliveryRadiusKm: number;
  deliveryEstimateMin: number;
  deliveryEstimateMax: number;
  gstin: string;
  storeLatitude: number;
  storeLongitude: number;
  logoUrl: string | null;
}

interface UserPreferences {
  orderUpdates: boolean;
  promotions: boolean;
  themeMode: "system" | "light" | "dark";
}

interface SettingsState {
  storeConfig: StoreConfig;
  preferences: UserPreferences;
  isLoading: boolean;

  loadStoreConfig: () => Promise<void>;
  loadPreferences: () => Promise<void>;
  updatePreferences: (data: Partial<UserPreferences>) => Promise<void>;
}

const DEFAULT_CONFIG: StoreConfig = {
  storeName: "MSM Supermarket",
  gstRatePercent: 0,
  deliveryFee: 40,
  freeDeliveryThreshold: 500,
  minimumOrderValue: 99,
  deliveryRadiusKm: 5,
  deliveryEstimateMin: 25,
  deliveryEstimateMax: 45,
  gstin: "",
  storeLatitude: 8.644361,
  storeLongitude: 76.843472,
  logoUrl: null,
};

const DEFAULT_PREFS: UserPreferences = {
  orderUpdates: true,
  promotions: true,
  themeMode: "system",
};

const PREFS_KEY = "msm_user_prefs";

export const useSettingsStore = create<SettingsState>((set, get) => ({
  storeConfig: DEFAULT_CONFIG,
  preferences: DEFAULT_PREFS,
  isLoading: false,

  loadStoreConfig: async () => {
    try {
      const { data } = await api.get("/store-settings");
      set({ storeConfig: { ...DEFAULT_CONFIG, ...data } });
    } catch {
      // Use defaults
    }
  },

  loadPreferences: async () => {
    try {
      const stored = await AsyncStorage.getItem(PREFS_KEY);
      if (stored) {
        set({ preferences: { ...DEFAULT_PREFS, ...JSON.parse(stored) } });
      }
    } catch {}
  },

  updatePreferences: async (data: Partial<UserPreferences>) => {
    const { preferences } = get();
    const updated = { ...preferences, ...data };
    set({ preferences: updated });
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(updated));

    // Sync to server
    try {
      await api.put("/account/settings", updated);
    } catch {
      // Silent fail — local state is source of truth
    }
  },
}));
