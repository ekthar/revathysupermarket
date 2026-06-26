"use client";

import { useEffect, useState } from "react";

export type StoreConfig = {
  gstRatePercent: number;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  minimumOrderValue: number;
  storeName: string;
  gstin: string;
};

const defaultConfig: StoreConfig = {
  gstRatePercent: 0,
  deliveryFee: 40,
  freeDeliveryThreshold: 500,
  minimumOrderValue: 99,
  storeName: "",
  gstin: ""
};

let cachedConfig: StoreConfig | null = null;
let fetchPromise: Promise<StoreConfig> | null = null;

function fetchConfig(): Promise<StoreConfig> {
  if (cachedConfig) return Promise.resolve(cachedConfig);
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch("/api/store-settings")
    .then((res) => res.ok ? res.json() : defaultConfig)
    .then((data) => {
      cachedConfig = data;
      return data;
    })
    .catch(() => defaultConfig);

  return fetchPromise;
}

export function useStoreConfig(): StoreConfig {
  const [config, setConfig] = useState<StoreConfig>(cachedConfig ?? defaultConfig);

  useEffect(() => {
    fetchConfig().then(setConfig);
  }, []);

  return config;
}
