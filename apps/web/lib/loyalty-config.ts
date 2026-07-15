import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export type LoyaltyConfig = { earnRupeesPerPoint: number; pointValueRupees: number; maxRedemptionPercent: number; referralRewardPoints: number; pointExpiryDays: number };
export const defaultLoyaltyConfig: LoyaltyConfig = { earnRupeesPerPoint: 10, pointValueRupees: 0.25, maxRedemptionPercent: 20, referralRewardPoints: 100, pointExpiryDays: 365 };

async function fetchLoyaltyConfig() {
  const rows = await prisma.setting.findMany({ where: { key: { in: ["loyaltyEarnRupeesPerPoint", "loyaltyPointValueRupees", "loyaltyMaxRedemptionPercent", "loyaltyReferralRewardPoints", "loyaltyPointExpiryDays"] } } }).catch(() => []);
  const values = new Map(rows.map((row) => [row.key, Number(row.value)]));
  const safe = (key: string, fallback: number, min: number, max: number) => { const value = values.get(key); return Number.isFinite(value) ? Math.min(max, Math.max(min, value!)) : fallback; };
  return {
    earnRupeesPerPoint: safe("loyaltyEarnRupeesPerPoint", defaultLoyaltyConfig.earnRupeesPerPoint, 1, 1000),
    pointValueRupees: safe("loyaltyPointValueRupees", defaultLoyaltyConfig.pointValueRupees, 0.01, 10),
    maxRedemptionPercent: safe("loyaltyMaxRedemptionPercent", defaultLoyaltyConfig.maxRedemptionPercent, 1, 100),
    referralRewardPoints: safe("loyaltyReferralRewardPoints", defaultLoyaltyConfig.referralRewardPoints, 0, 10000),
    pointExpiryDays: safe("loyaltyPointExpiryDays", defaultLoyaltyConfig.pointExpiryDays, 0, 3650),
  };
}

export const getLoyaltyConfig = unstable_cache(
  fetchLoyaltyConfig,
  ['loyalty-config'],
  { revalidate: 60 }
);
