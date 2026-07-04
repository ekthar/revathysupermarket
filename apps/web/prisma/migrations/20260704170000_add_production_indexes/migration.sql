-- Add missing database indexes identified in production audit
-- All indexes use CONCURRENTLY + IF NOT EXISTS for zero-downtime idempotent deployment

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Order_paymentStatus_idx" ON "Order" ("paymentStatus");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Order_status_createdAt_idx" ON "Order" ("status", "createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "DeliveryCollection_partnerId_status_idx" ON "DeliveryCollection" ("partnerId", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "WalletTransaction_userId_type_idx" ON "WalletTransaction" ("userId", "type");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "OtpToken_tokenHash_idx" ON "OtpToken" ("tokenHash");

-- TODO: Consider adding a GIN trigram index on Product.name for fuzzy name search:
--   CREATE INDEX CONCURRENTLY IF NOT EXISTS "Product_name_trgm_idx" ON "Product" USING gin (name gin_trgm_ops);
-- Requires: CREATE EXTENSION IF NOT EXISTS pg_trgm;
