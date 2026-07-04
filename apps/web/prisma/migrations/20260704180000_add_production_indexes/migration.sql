-- Add missing database indexes (non-concurrent, safe for moderate traffic)
-- These complements the @@index annotations in schema.prisma.

CREATE INDEX IF NOT EXISTS "Order_paymentStatus_idx" ON "Order" ("paymentStatus");
CREATE INDEX IF NOT EXISTS "Order_status_createdAt_idx" ON "Order" ("status", "createdAt");
CREATE INDEX IF NOT EXISTS "DeliveryCollection_partnerId_status_idx" ON "DeliveryCollection" ("partnerId", "status");
CREATE INDEX IF NOT EXISTS "WalletTransaction_userId_type_idx" ON "WalletTransaction" ("userId", "type");
CREATE INDEX IF NOT EXISTS "OtpToken_tokenHash_idx" ON "OtpToken" ("tokenHash");