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
  gstBusinessName: SITE.name
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

  return {
    storeName: byKey.get("storeName") ?? defaultStoreSettings.storeName,
    address: byKey.get("address") ?? defaultStoreSettings.address,
    phone: byKey.get("phone") ?? defaultStoreSettings.phone,
    whatsapp: byKey.get("whatsapp") ?? defaultStoreSettings.whatsapp,
    deliveryRadiusKm: parseRadius(byKey.get("deliveryRadiusKm")),
    storeLatitude: parseCoord(byKey.get("storeLatitude"), defaultStoreSettings.storeLatitude),
    storeLongitude: parseCoord(byKey.get("storeLongitude"), defaultStoreSettings.storeLongitude),
    serviceablePincodes: parsePincodes(byKey.get("serviceablePincodes")),
    googleMapsUrl: byKey.get("googleMapsUrl") ?? "",
    instagramUrl: byKey.get("instagramUrl") ?? "",
    facebookUrl: byKey.get("facebookUrl") ?? "",
    gstin: byKey.get("gstin") ?? "",
    gstRatePercent: parseGstRate(byKey.get("gstRatePercent")),
    gstBusinessName: byKey.get("gstBusinessName") ?? byKey.get("storeName") ?? defaultStoreSettings.gstBusinessName
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
    ["gstBusinessName", settings.gstBusinessName || settings.storeName]
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
