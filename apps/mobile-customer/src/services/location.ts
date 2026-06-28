import * as Location from "expo-location";
import { api } from "./api";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Request location permission and get current position
 */
export async function getCurrentLocation(): Promise<Coordinates | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    return null;
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}

/**
 * Calculate distance in km between two coordinates (Haversine)
 */
export function calculateDistance(a: Coordinates, b: Coordinates): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/**
 * Check if coordinates are within delivery radius
 */
export function isWithinDeliveryRadius(
  coords: Coordinates,
  storeCoords: Coordinates,
  radiusKm: number
): boolean {
  return calculateDistance(coords, storeCoords) <= radiusKm;
}

/**
 * Get delivery fee preview from backend
 */
export async function getDeliveryFeePreview(
  latitude: number,
  longitude: number,
  subtotal: number
): Promise<number | null> {
  try {
    const { data } = await api.post("/delivery-fee/preview", {
      latitude,
      longitude,
      subtotal,
    });
    return Number(data.fee);
  } catch {
    return null;
  }
}

/**
 * Reverse geocode coordinates to address text
 */
export async function reverseGeocode(coords: Coordinates): Promise<string | null> {
  try {
    const results = await Location.reverseGeocodeAsync(coords);
    if (results.length > 0) {
      const addr = results[0];
      const parts = [addr.name, addr.street, addr.city, addr.region].filter(Boolean);
      return parts.join(", ");
    }
  } catch {}
  return null;
}
