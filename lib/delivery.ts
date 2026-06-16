import { SITE } from "@/lib/constants";

const fallbackPincodes = ["695121", "695122", "695123", "695124", "695126"];

export function serviceablePincodes() {
  const configured = process.env.NEXT_PUBLIC_SERVICEABLE_PINCODES;
  if (!configured) return fallbackPincodes;

  const pincodes = configured
    .split(",")
    .map((pincode) => pincode.trim())
    .filter((pincode) => /^\d{6}$/.test(pincode));

  return pincodes.length > 0 ? pincodes : fallbackPincodes;
}

export function isServiceablePincode(pincode: string) {
  return serviceablePincodes().includes(pincode.trim());
}

export function deliverySummary() {
  return `${SITE.deliveryRadiusKm} KM delivery radius. Serviceable pincodes: ${serviceablePincodes().join(", ")}.`;
}
