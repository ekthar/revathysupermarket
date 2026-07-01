-- Spec 1: Backend & Schema Additions
-- Additive changes only — no breaking modifications

-- 1. Product model: add costPrice and brand
ALTER TABLE "Product" ADD COLUMN "costPrice" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN "brand" TEXT;

-- 2. Order model: add printCount
ALTER TABLE "Order" ADD COLUMN "printCount" INTEGER NOT NULL DEFAULT 0;

-- 3. DeviceToken model: add role with safe default
ALTER TABLE "DeviceToken" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'customer';
CREATE INDEX "DeviceToken_role_idx" ON "DeviceToken"("role");

-- 4. FeatureFlag model
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FeatureFlag_key_key" ON "FeatureFlag"("key");

-- 5. Seed feature flags
INSERT INTO "FeatureFlag" ("id", "key", "enabled", "config", "createdAt", "updatedAt") VALUES
  ('ff_stock_value_visible', 'stock_value_visible', false, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ff_forced_accept_delivery', 'forced_accept_delivery', false, '{"overrides":[]}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ff_ring_alert_rules', 'ring_alert_rules', true, '{"ringtone":"default","durationSeconds":30,"escalationAfterSeconds":60,"escalationTarget":"admin"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ff_print_required_alert', 'print_required_alert', true, '{"thresholdMinutes":10}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
