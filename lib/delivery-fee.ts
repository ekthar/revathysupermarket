import { prisma } from "@/lib/prisma";

export interface DeliveryFeeResult {
  fee: number;
  distanceKm: number;
  slabApplied: { id: string; minKm: number; maxKm: number; fee: number } | null;
  freeDelivery: boolean;
  freeDeliveryThreshold: number;
}

export function findDeliveryFeeSlab<T extends { minKm: number | { toString(): string }; maxKm: number | { toString(): string } }>(slabs: T[], distanceKm: number) {
  return slabs.find((item, index) => {
    const minimum = Number(item.minKm);
    const maximum = Number(item.maxKm);
    return index === 0 ? distanceKm >= minimum && distanceKm <= maximum : distanceKm > minimum && distanceKm <= maximum;
  }) ?? null;
}

/**
 * Calculate delivery fee based on distance slabs.
 * Server-side only — client uses this via API.
 * 
 * Rules:
 * 1. Find the active slab that covers the distance
 * 2. If order subtotal >= freeDeliveryThreshold, fee is 0
 * 3. If distance exceeds all slabs, order is out of range
 */
export async function calculateDeliveryFee(
  distanceKm: number,
  subtotal: number
): Promise<DeliveryFeeResult> {
  // Fetch active slabs and free delivery threshold
  const [slabs, freeThresholdSetting] = await Promise.all([
    prisma.deliveryFeeSlab.findMany({
      where: { isActive: true },
      orderBy: { minKm: "asc" },
    }),
    prisma.setting.findUnique({ where: { key: "freeDeliveryThreshold" } }),
  ]);

  const freeDeliveryThreshold = Number(freeThresholdSetting?.value || "500");

  // Check free delivery first
  if (freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold) {
    return {
      fee: 0,
      distanceKm,
      slabApplied: null,
      freeDelivery: true,
      freeDeliveryThreshold,
    };
  }

  // Find matching slab
  const slab = findDeliveryFeeSlab(slabs, distanceKm);

  if (!slab) {
    // No slab covers this distance — out of delivery range
    return {
      fee: -1, // Indicates out of range
      distanceKm,
      slabApplied: null,
      freeDelivery: false,
      freeDeliveryThreshold,
    };
  }

  return {
    fee: Number(slab.fee),
    distanceKm,
    slabApplied: { id: slab.id, minKm: Number(slab.minKm), maxKm: Number(slab.maxKm), fee: Number(slab.fee) },
    freeDelivery: false,
    freeDeliveryThreshold,
  };
}

/**
 * Validate that slabs cover the service radius without gaps or overlaps.
 */
export function validateSlabs(
  slabs: { minKm: number; maxKm: number }[],
  serviceRadiusKm: number = 5
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const sorted = [...slabs].sort((a, b) => a.minKm - b.minKm);

  // Check no negative or zero-width slabs
  for (const slab of sorted) {
    if (slab.minKm < 0) errors.push(`Slab minimum cannot be negative: ${slab.minKm}`);
    if (slab.maxKm <= slab.minKm) errors.push(`Slab max must be greater than min: ${slab.minKm}-${slab.maxKm}`);
  }

  // Check first slab starts at 0
  if (sorted.length > 0 && sorted[0].minKm !== 0) {
    errors.push(`First slab must start at 0 km (starts at ${sorted[0].minKm})`);
  }

  // Check last slab covers service radius
  if (sorted.length > 0 && sorted[sorted.length - 1].maxKm < serviceRadiusKm) {
    errors.push(`Last slab must cover service radius (${serviceRadiusKm} km). Currently ends at ${sorted[sorted.length - 1].maxKm} km`);
  }

  // Check for gaps and overlaps
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (curr.minKm < prev.maxKm) {
      errors.push(`Overlap between slabs: ${prev.minKm}-${prev.maxKm} and ${curr.minKm}-${curr.maxKm}`);
    } else if (curr.minKm > prev.maxKm) {
      errors.push(`Gap between slabs: ${prev.maxKm} to ${curr.minKm} is uncovered`);
    }
  }

  return { valid: errors.length === 0, errors };
}
