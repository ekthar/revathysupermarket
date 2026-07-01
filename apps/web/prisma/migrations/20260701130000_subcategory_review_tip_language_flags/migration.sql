-- Migration: SubCategory + Review models, product sub-category link,
-- order tip & delivery instructions, user preferred language, and 26 new feature flags.
-- Additive changes only — safe, non-breaking.

-- ─────────────────────────────────────────────────────────────
-- 1. SubCategory table
-- ─────────────────────────────────────────────────────────────
CREATE TABLE "SubCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SubCategory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SubCategory_slug_key" ON "SubCategory"("slug");
CREATE INDEX "SubCategory_categoryId_idx" ON "SubCategory"("categoryId");
CREATE INDEX "SubCategory_sortOrder_idx" ON "SubCategory"("sortOrder");
ALTER TABLE "SubCategory" ADD CONSTRAINT "SubCategory_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────
-- 2. Product.subCategoryId (nullable FK, index)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE "Product" ADD COLUMN "subCategoryId" TEXT;
CREATE INDEX "Product_subCategoryId_idx" ON "Product"("subCategoryId");
ALTER TABLE "Product" ADD CONSTRAINT "Product_subCategoryId_fkey"
    FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────
-- 3. Order additions: tipAmount, deliveryInstructions
-- ─────────────────────────────────────────────────────────────
ALTER TABLE "Order" ADD COLUMN "tipAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "deliveryInstructions" TEXT;

-- ─────────────────────────────────────────────────────────────
-- 4. User.preferredLanguage
-- ─────────────────────────────────────────────────────────────
ALTER TABLE "User" ADD COLUMN "preferredLanguage" TEXT NOT NULL DEFAULT 'en';

-- ─────────────────────────────────────────────────────────────
-- 5. Review table
-- ─────────────────────────────────────────────────────────────
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Review_userId_productId_key" ON "Review"("userId", "productId");
CREATE INDEX "Review_productId_idx" ON "Review"("productId");
CREATE INDEX "Review_userId_idx" ON "Review"("userId");
CREATE INDEX "Review_rating_idx" ON "Review"("rating");
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────
-- 6. Seed 26 new feature flags (idempotent — safe if seed also runs)
-- ─────────────────────────────────────────────────────────────
INSERT INTO "FeatureFlag" ("id", "key", "enabled", "config", "createdAt", "updatedAt") VALUES
  ('ff_delivery_mode', 'delivery_mode', true, '{"mode":"both"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ff_instant_delivery_enabled', 'instant_delivery_enabled', true, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ff_minimum_order_value', 'minimum_order_value', true, '{"value":149}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ff_free_delivery_threshold', 'free_delivery_threshold', true, '{"value":499}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ff_delivery_radius_km', 'delivery_radius_km', true, '{"value":5}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ff_max_orders_per_hour', 'max_orders_per_hour', false, '{"value":50,"action":"queue"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ff_surge_pricing_enabled', 'surge_pricing_enabled', false, '{"multiplier":1.5,"message":"High demand"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ff_tip_enabled', 'tip_enabled', true, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ff_wallet_topup_enabled', 'wallet_topup_enabled', false, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ff_reviews_enabled', 'reviews_enabled', true, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ff_referral_enabled', 'referral_enabled', false, '{"senderReward":50,"receiverReward":50}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ff_multi_language_enabled', 'multi_language_enabled', true, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ff_express_checkout_enabled', 'express_checkout_enabled', true, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ff_store_open_hours', 'store_open_hours', false, '{"open":"07:00","close":"22:00","autoToggle":true}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ff_maintenance_mode', 'maintenance_mode', false, '{"message":"Back in 30 minutes","eta":null}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ff_cod_enabled', 'cod_enabled', true, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ff_upi_on_delivery_enabled', 'upi_on_delivery_enabled', true, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ff_new_user_discount', 'new_user_discount', false, '{"percent":20,"maxDiscount":100,"minOrder":199}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ff_delivery_partner_assignment', 'delivery_partner_assignment', true, '{"mode":"nearest"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ff_order_edit_window_minutes', 'order_edit_window_minutes', true, '{"value":5}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ff_substitute_approval_mode', 'substitute_approval_mode', true, '{"mode":"always_ask"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ff_dark_store_mode', 'dark_store_mode', false, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ff_slot_only_mode', 'slot_only_mode', false, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ff_max_items_per_order', 'max_items_per_order', true, '{"value":50}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ff_live_tracking_enabled', 'live_tracking_enabled', true, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ff_eta_display_mode', 'eta_display_mode', true, '{"mode":"after_assignment"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
