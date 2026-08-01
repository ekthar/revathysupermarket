"use client";

import { useEffect, useState } from "react";

export type StoreConfig = {
  gstRatePercent: number;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  minimumOrderValue: number;
  storeName: string;
  gstin: string;
  deliveryEstimateMin: number;
  deliveryEstimateMax: number;
};

export const DEFAULT_STORE_CONFIG: StoreConfig = {
  gstRatePercent: 0,
  deliveryFee: 40,
  freeDeliveryThreshold: 500,
  minimumOrderValue: 99,
  storeName: "",
  gstin: "",
  deliveryEstimateMin: 25,
  deliveryEstimateMax: 45
};

let cachedConfig: StoreConfig | null = null;
let fetchPromise: Promise<StoreConfig> | null = null;

function fetchConfig(): Promise<StoreConfig> {
  if (cachedConfig) return Promise.resolve(cachedConfig);
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch("/api/store-settings")
    .then((res) => res.ok ? res.json() : DEFAULT_STORE_CONFIG)
    .then((data) => {
      // Merge over defaults so a stale cached response missing newer fields
      // (e.g. deliveryEstimate*) can't yield `undefined` at a call site.
      const merged: StoreConfig = { ...DEFAULT_STORE_CONFIG, ...data };
      cachedConfig = merged;
      return merged;
    })
    .catch(() => DEFAULT_STORE_CONFIG);

  return fetchPromise;
}

export function useStoreConfig(): StoreConfig {
  const [config, setConfig] = useState<StoreConfig>(cachedConfig ?? DEFAULT_STORE_CONFIG);

  useEffect(() => {
    fetchConfig().then(setConfig);
  }, []);

  return config;
}
