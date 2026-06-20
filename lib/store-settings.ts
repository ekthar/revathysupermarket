import { unstable_cache, unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/constants";
import { serviceablePincodes } from "@/lib/delivery";

export type StoreSettings = {
  storeName: string;
  address: string;
  phone: string;
  whatsapp: string;
  deliveryRadiusKm: number;
  storeLatitude: number;
  storeLongitude: number;
  serviceablePincodes: string[];
  googleMapsUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  gstin: string;
  gstRatePercent: number;
  gstBusinessName: string;
  // Store hours & ordering rules
  storeOpenTime: string;   // "08:00" (24h format)
  storeCloseTime: string;  // "21:00"
  isStoreOpen: boolean;    // Manual override
  minimumOrderValue: number;
  deliveryEstimateMin: number;  // minutes
  deliveryEstimateMax: number;
};

export const defaultStoreSettings: StoreSettings = {
  storeName: SITE.name,
  address: SITE.address,
  phone: SITE.phone,
  whatsapp: SITE.whatsapp,
  deliveryRadiusKm: SITE.deliveryRadiusKm,
  storeLatitude: Number(process.env.STORE_LAT ?? "8.4004"),
  storeLongitude: Number(process.env.STORE_LNG ?? "77.0851"),
  serviceablePincodes: serviceablePincodes(),
  googleMapsUrl: "",
  instagramUrl: "",
  facebookUrl: "",
  gstin: "",
  gstRatePercent: 0,
  gstBusinessName: SITE.name,
  storeOpenTime: "08:00",
  storeCloseTime: "21:00",
  isStoreOpen: true,
  minimumOrderValue: 99,
  deliveryEstimateMin: 25,
  deliveryEstimateMax: 45
};

function parseRadius(value?: string) {
  const radius = Number(value);
  return Number.isFinite(radius) && radius > 0 ? Math.min(radius, 50) : defaultStoreSettings.deliveryRadiusKm;
}

function parsePincodes(value?: string) {
  if (!value) return defaultStoreSettings.serviceablePincodes;
  const pincodes = value
    .split(",")
    .map((pincode) => pincode.trim())
    .filter((pincode) => /^\d{6}$/.test(pincode));
  return pincodes.length > 0 ? pincodes : defaultStoreSettings.serviceablePincodes;
}

function parseGstRate(value?: string) {
  const rate = Number(value);
  return Number.isFinite(rate) && rate >= 0 ? Math.min(rate, 28) : defaultStoreSettings.gstRatePercent;
}

function parseCoord(value?: string, fallback = 0) {
  const coord = Number(value);
  return Number.isFinite(coord) ? coord : fallback;
}

async function readStoreSettings(): Promise<StoreSettings> {
  const settings = await prisma.setting.findMany().catch(() => []);
  const byKey = new Map(settings.map((setting) => [setting.key, setting.value]));

  // For coordinates and address: env vars OVERRIDE DB values when set.
  // This ensures that updating STORE_LAT/STORE_LNG in Vercel takes effect
  // even if the DB has old seed data.
  const envLat = process.env.STORE_LAT;
  const envLng = process.env.STORE_LNG;
  const envAddress = process.env.NEXT_PUBLIC_STORE_ADDRESS;
  const envStoreName = process.env.NEXT_PUBLIC_STORE_NAME;

  return {
    storeName: byKey.get("storeName") ?? envStoreName ?? defaultStoreSettings.storeName,
    address: envAddress || byKey.get("address") || defaultStoreSettings.address,
    phone: byKey.get("phone") ?? defaultStoreSettings.phone,
    whatsapp: byKey.get("whatsapp") ?? defaultStoreSettings.whatsapp,
    deliveryRadiusKm: parseRadius(byKey.get("deliveryRadiusKm")),
    storeLatitude: envLat ? parseCoord(envLat, defaultStoreSettings.storeLatitude) : parseCoord(byKey.get("storeLatitude"), defaultStoreSettings.storeLatitude),
    storeLongitude: envLng ? parseCoord(envLng, defaultStoreSettings.storeLongitude) : parseCoord(byKey.get("storeLongitude"), defaultStoreSettings.storeLongitude),
    serviceablePincodes: parsePincodes(byKey.get("serviceablePincodes")),
    googleMapsUrl: byKey.get("googleMapsUrl") ?? "",
    instagramUrl: byKey.get("instagramUrl") ?? "",
    facebookUrl: byKey.get("facebookUrl") ?? "",
    gstin: byKey.get("gstin") ?? "",
    gstRatePercent: parseGstRate(byKey.get("gstRatePercent")),
    gstBusinessName: byKey.get("gstBusinessName") ?? byKey.get("storeName") ?? defaultStoreSettings.gstBusinessName,
    storeOpenTime: byKey.get("storeOpenTime") ?? defaultStoreSettings.storeOpenTime,
    storeCloseTime: byKey.get("storeCloseTime") ?? defaultStoreSettings.storeCloseTime,
    isStoreOpen: byKey.get("isStoreOpen") !== "false",
    minimumOrderValue: Number(byKey.get("minimumOrderValue") || defaultStoreSettings.minimumOrderValue),
    deliveryEstimateMin: Number(byKey.get("deliveryEstimateMin") || defaultStoreSettings.deliveryEstimateMin),
    deliveryEstimateMax: Number(byKey.get("deliveryEstimateMax") || defaultStoreSettings.deliveryEstimateMax)
  };
}

export async function getStoreSettings(): Promise<StoreSettings> {
  noStore();
  return readStoreSettings();
}

export const getPublicStoreSettings = unstable_cache(
  readStoreSettings,
  ["public-store-settings"],
  { revalidate: 60, tags: ["homepage", "store-settings"] }
);

export async function getStoreSettingsForApi(): Promise<StoreSettings> {
  return readStoreSettings();
}

export async function saveStoreSettings(settings: StoreSettings) {
  const entries = [
    ["storeName", settings.storeName],
    ["address", settings.address],
    ["phone", settings.phone],
    ["whatsapp", settings.whatsapp],
    ["deliveryRadiusKm", String(settings.deliveryRadiusKm)],
    ["storeLatitude", String(settings.storeLatitude)],
    ["storeLongitude", String(settings.storeLongitude)],
    ["serviceablePincodes", settings.serviceablePincodes.join(", ")],
    ["googleMapsUrl", settings.googleMapsUrl],
    ["instagramUrl", settings.instagramUrl],
    ["facebookUrl", settings.facebookUrl],
    ["gstin", settings.gstin],
    ["gstRatePercent", String(settings.gstRatePercent)],
    ["gstBusinessName", settings.gstBusinessName || settings.storeName],
    ["storeOpenTime", settings.storeOpenTime],
    ["storeCloseTime", settings.storeCloseTime],
    ["isStoreOpen", String(settings.isStoreOpen)],
    ["minimumOrderValue", String(settings.minimumOrderValue)],
    ["deliveryEstimateMin", String(settings.deliveryEstimateMin)],
    ["deliveryEstimateMax", String(settings.deliveryEstimateMax)]
  ];

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      })
    )
  );
}


/**
 * Check if the store is currently open based on settings.
 * Uses IST timezone (Asia/Kolkata) since Vercel servers run in UTC.
 */
export function isStoreCurrentlyOpen(settings: StoreSettings): { open: boolean; message?: string } {
  // Manual override - store is marked closed
  if (!settings.isStoreOpen) {
    return { open: false, message: "Store is currently closed. Please try again later." };
  }

  // Use IST (India Standard Time) regardless of server timezone
  const now = new Date();
  const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const hours = istTime.getHours();
  const minutes = istTime.getMinutes();
  const currentTime = hours * 60 + minutes;

  const [openH, openM] = settings.storeOpenTime.split(":").map(Number);
  const [closeH, closeM] = settings.storeCloseTime.split(":").map(Number);
  const openTime = openH * 60 + openM;
  const closeTime = closeH * 60 + closeM;

  if (currentTime < openTime || currentTime >= closeTime) {
    return {
      open: false,
      message: `Store is closed. We're open from ${settings.storeOpenTime} to ${settings.storeCloseTime}.`
    };
  }

  return { open: true };
}
