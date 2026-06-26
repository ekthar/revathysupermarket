import { SITE, STORE_COORDINATES } from "@/lib/constants";
import { calculateDistanceKm } from "@/lib/distance";

/**
 * Legacy pincode list — kept for backward compatibility but no longer the primary
 * delivery validation. GPS radius is now the single source of truth.
 * Pincodes are only used as hints in the admin UI.
 */
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

/**
 * @deprecated — Use `isWithinDeliveryRange` instead.
 * Pincode-based validation is no longer enforced; GPS radius is primary.
 */
export function isServiceablePincode(_pincode: string, _allowed = serviceablePincodes()) {
  // Always returns true — delivery is validated by GPS distance only
  return true;
}

/**
 * Primary delivery validation: checks if a given GPS coordinate is within
 * the configured delivery radius of the store.
 */
export function isWithinDeliveryRange(
  latitude: number,
  longitude: number,
  radiusKm = Number(process.env.DELIVERY_RADIUS_KM ?? SITE.deliveryRadiusKm),
  storeCoords = STORE_COORDINATES
) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  const distance = calculateDistanceKm({ lat: latitude, lng: longitude }, { lat: storeCoords.lat, lng: storeCoords.lng });
  return distance <= radiusKm;
}

export function deliverySummary(radiusKm = SITE.deliveryRadiusKm) {
  return `We deliver within ${radiusKm} KM of our store. Your GPS location is used to verify eligibility.`;
}

export function createDeliveryOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function deliveryOtpExpiryDate(minutes = 30) {
  return new Date(Date.now() + minutes * 60 * 1000);
}
