import { STORE_COORDINATES } from "@/lib/constants";

const EARTH_RADIUS_KM = 6371;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function calculateDistanceKm(
  customer: { lat: number; lng: number },
  store: { lat: number; lng: number } = STORE_COORDINATES
) {
  const dLat = toRadians(customer.lat - store.lat);
  const dLng = toRadians(customer.lng - store.lng);
  const lat1 = toRadians(store.lat);
  const lat2 = toRadians(customer.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Haversine distance in meters — used for proximity checks in delivery
 * (e.g., "is the rider within 200m of the customer?").
 */
export function calculateDistanceMeters(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
) {
  return calculateDistanceKm(point1, point2) * 1000;
}

export function isWithinDeliveryRadius(
  customer: { lat: number; lng: number },
  radiusKm: number,
  store: { lat: number; lng: number } = STORE_COORDINATES
) {
  return calculateDistanceKm(customer, store) <= radiusKm;
}
