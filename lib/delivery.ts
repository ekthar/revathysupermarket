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

export function isServiceablePincode(pincode: string, allowed = serviceablePincodes()) {
  return allowed.includes(pincode.trim());
}

export function deliverySummary(radiusKm = SITE.deliveryRadiusKm, pincodes = serviceablePincodes()) {
  return `${radiusKm} KM delivery radius. Serviceable pincodes: ${pincodes.join(", ")}.`;
}

export function createDeliveryOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function deliveryOtpExpiryDate(minutes = 30) {
  return new Date(Date.now() + minutes * 60 * 1000);
}
