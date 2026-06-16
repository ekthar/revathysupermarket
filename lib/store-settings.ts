import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/constants";
import { serviceablePincodes } from "@/lib/delivery";

export type StoreSettings = {
  storeName: string;
  address: string;
  phone: string;
  whatsapp: string;
  deliveryRadiusKm: number;
  serviceablePincodes: string[];
  googleMapsUrl: string;
  instagramUrl: string;
  facebookUrl: string;
};

export const defaultStoreSettings: StoreSettings = {
  storeName: SITE.name,
  address: SITE.address,
  phone: SITE.phone,
  whatsapp: SITE.whatsapp,
  deliveryRadiusKm: SITE.deliveryRadiusKm,
  serviceablePincodes: serviceablePincodes(),
  googleMapsUrl: "",
  instagramUrl: "",
  facebookUrl: ""
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

export async function getStoreSettings(): Promise<StoreSettings> {
  noStore();
  const settings = await prisma.setting.findMany().catch(() => []);
  const byKey = new Map(settings.map((setting) => [setting.key, setting.value]));

  return {
    storeName: byKey.get("storeName") ?? defaultStoreSettings.storeName,
    address: byKey.get("address") ?? defaultStoreSettings.address,
    phone: byKey.get("phone") ?? defaultStoreSettings.phone,
    whatsapp: byKey.get("whatsapp") ?? defaultStoreSettings.whatsapp,
    deliveryRadiusKm: parseRadius(byKey.get("deliveryRadiusKm")),
    serviceablePincodes: parsePincodes(byKey.get("serviceablePincodes")),
    googleMapsUrl: byKey.get("googleMapsUrl") ?? "",
    instagramUrl: byKey.get("instagramUrl") ?? "",
    facebookUrl: byKey.get("facebookUrl") ?? ""
  };
}

export async function saveStoreSettings(settings: StoreSettings) {
  const entries = [
    ["storeName", settings.storeName],
    ["address", settings.address],
    ["phone", settings.phone],
    ["whatsapp", settings.whatsapp],
    ["deliveryRadiusKm", String(settings.deliveryRadiusKm)],
    ["serviceablePincodes", settings.serviceablePincodes.join(", ")],
    ["googleMapsUrl", settings.googleMapsUrl],
    ["instagramUrl", settings.instagramUrl],
    ["facebookUrl", settings.facebookUrl]
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
