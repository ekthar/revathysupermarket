import { Prisma, PrismaClient } from "@prisma/client";

/**
 * Canonical feature-flag definitions for the platform.
 *
 * This is the single source of truth used by BOTH:
 *  - the full database seed (`prisma/seed.ts`)
 *  - the flags-only seed (`prisma/seed-flags.ts`, `npm run seed:flags`)
 *
 * All entries are applied via idempotent upserts keyed on `key`, so running
 * the seed repeatedly never duplicates or resets an operator's toggles.
 */
export const featureFlags: Array<{
  id: string;
  key: string;
  enabled: boolean;
  config: Prisma.InputJsonValue | typeof Prisma.JsonNull;
}> = [
  {
    id: "ff_stock_value_visible",
    key: "stock_value_visible",
    enabled: false,
    config: Prisma.JsonNull,
  },
  {
    id: "ff_forced_accept_delivery",
    key: "forced_accept_delivery",
    enabled: false,
    config: { overrides: [] },
  },
  {
    id: "ff_ring_alert_rules",
    key: "ring_alert_rules",
    enabled: true,
    config: {
      ringtone: "default",
      durationSeconds: 30,
      escalationAfterSeconds: 60,
      escalationTarget: "admin",
    },
  },
  {
    id: "ff_print_required_alert",
    key: "print_required_alert",
    enabled: true,
    config: { thresholdMinutes: 10 },
  },
  // --- New feature flags ---
  {
    id: "ff_delivery_mode",
    key: "delivery_mode",
    enabled: true,
    config: { mode: "both" },
  },
  {
    id: "ff_instant_delivery_enabled",
    key: "instant_delivery_enabled",
    enabled: true,
    config: Prisma.JsonNull,
  },
  {
    id: "ff_minimum_order_value",
    key: "minimum_order_value",
    enabled: true,
    config: { value: 149 },
  },
  {
    id: "ff_free_delivery_threshold",
    key: "free_delivery_threshold",
    enabled: true,
    config: { value: 499 },
  },
  {
    id: "ff_delivery_radius_km",
    key: "delivery_radius_km",
    enabled: true,
    config: { value: 5 },
  },
  {
    id: "ff_max_orders_per_hour",
    key: "max_orders_per_hour",
    enabled: false,
    config: { value: 50, action: "queue" },
  },
  {
    id: "ff_surge_pricing_enabled",
    key: "surge_pricing_enabled",
    enabled: false,
    config: { multiplier: 1.5, message: "High demand" },
  },
  {
    id: "ff_tip_enabled",
    key: "tip_enabled",
    enabled: true,
    config: Prisma.JsonNull,
  },
  {
    id: "ff_wallet_topup_enabled",
    key: "wallet_topup_enabled",
    enabled: false,
    config: Prisma.JsonNull,
  },
  {
    id: "ff_reviews_enabled",
    key: "reviews_enabled",
    enabled: true,
    config: Prisma.JsonNull,
  },
  {
    id: "ff_referral_enabled",
    key: "referral_enabled",
    enabled: false,
    config: { senderReward: 50, receiverReward: 50 },
  },
  {
    id: "ff_multi_language_enabled",
    key: "multi_language_enabled",
    enabled: true,
    config: Prisma.JsonNull,
  },
  {
    id: "ff_express_checkout_enabled",
    key: "express_checkout_enabled",
    enabled: true,
    config: Prisma.JsonNull,
  },
  {
    id: "ff_store_open_hours",
    key: "store_open_hours",
    enabled: false,
    config: { open: "07:00", close: "22:00", autoToggle: true },
  },
  {
    id: "ff_maintenance_mode",
    key: "maintenance_mode",
    enabled: false,
    config: { message: "Back in 30 minutes", eta: null },
  },
  {
    id: "ff_cod_enabled",
    key: "cod_enabled",
    enabled: true,
    config: Prisma.JsonNull,
  },
  {
    id: "ff_upi_on_delivery_enabled",
    key: "upi_on_delivery_enabled",
    enabled: true,
    config: Prisma.JsonNull,
  },
  {
    id: "ff_new_user_discount",
    key: "new_user_discount",
    enabled: false,
    config: { percent: 20, maxDiscount: 100, minOrder: 199 },
  },
  {
    id: "ff_delivery_partner_assignment",
    key: "delivery_partner_assignment",
    enabled: true,
    config: { mode: "nearest" },
  },
  {
    id: "ff_order_edit_window_minutes",
    key: "order_edit_window_minutes",
    enabled: true,
    config: { value: 5 },
  },
  {
    id: "ff_substitute_approval_mode",
    key: "substitute_approval_mode",
    enabled: true,
    config: { mode: "always_ask" },
  },
  {
    id: "ff_dark_store_mode",
    key: "dark_store_mode",
    enabled: false,
    config: Prisma.JsonNull,
  },
  {
    id: "ff_slot_only_mode",
    key: "slot_only_mode",
    enabled: false,
    config: Prisma.JsonNull,
  },
  {
    id: "ff_max_items_per_order",
    key: "max_items_per_order",
    enabled: true,
    config: { value: 50 },
  },
  {
    id: "ff_live_tracking_enabled",
    key: "live_tracking_enabled",
    enabled: true,
    config: Prisma.JsonNull,
  },
  {
    id: "ff_eta_display_mode",
    key: "eta_display_mode",
    enabled: true,
    config: { mode: "after_assignment" },
  },
  {
    id: "ff_whatsapp_enabled",
    key: "whatsapp_enabled",
    enabled: true,
    config: Prisma.JsonNull,
  },
  {
    id: "ff_sms_enabled",
    key: "sms_enabled",
    enabled: false,
    config: Prisma.JsonNull,
  },
  {
    id: "ff_razorpay_enabled",
    key: "razorpay_enabled",
    enabled: false,
    config: { keyId: "", keySecret: "", webhookSecret: "" },
  },
];

/**
 * Upserts every feature flag. Existing rows are left untouched (update: {})
 * so operator toggles are preserved across re-runs; only missing flags are
 * created.
 */
export async function seedFeatureFlags(prisma: PrismaClient): Promise<number> {
  let created = 0;
  for (const flag of featureFlags) {
    const before = await prisma.featureFlag.findUnique({ where: { key: flag.key } });
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {},
      create: flag,
    });
    if (!before) created += 1;
  }
  return created;
}
