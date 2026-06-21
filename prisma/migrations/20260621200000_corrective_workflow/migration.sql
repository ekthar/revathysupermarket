-- Corrective workflow migration. The preceding migration remains immutable.
ALTER TABLE "Order" ADD COLUMN "deliveryFeeSlabId" TEXT;
ALTER TABLE "Order" ADD COLUMN "deliveryFeeMinKm" DECIMAL(6,2);
ALTER TABLE "Order" ADD COLUMN "deliveryFeeMaxKm" DECIMAL(6,2);

ALTER TABLE "DeliveryAdjustment" ADD COLUMN "orderItemId" TEXT;
CREATE INDEX "DeliveryAdjustment_orderItemId_idx" ON "DeliveryAdjustment"("orderItemId");
ALTER TABLE "DeliveryAdjustment" ADD CONSTRAINT "DeliveryAdjustment_orderItemId_fkey"
  FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WalletTransaction" ADD COLUMN "returnRequestId" TEXT;
CREATE UNIQUE INDEX "WalletTransaction_returnRequestId_key" ON "WalletTransaction"("returnRequestId");
CREATE INDEX "WalletTransaction_returnRequestId_idx" ON "WalletTransaction"("returnRequestId");
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_returnRequestId_fkey"
  FOREIGN KEY ("returnRequestId") REFERENCES "ReturnRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DeliveryCollection" ADD COLUMN "completionReference" TEXT;
ALTER TABLE "DeliveryCollection" ADD COLUMN "completedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "DeliveryCollection_completionReference_key" ON "DeliveryCollection"("completionReference");
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");
CREATE INDEX "ReturnRequest_orderId_status_idx" ON "ReturnRequest"("orderId", "status");

-- Existing staff receive safe role defaults only when no explicit permission exists.
INSERT INTO "StaffPermission" ("id", "userId", "permission", "grantedBy", "createdAt")
SELECT 'backfill_' || md5(u."id" || p.permission), u."id", p.permission, NULL, CURRENT_TIMESTAMP
FROM "User" u
CROSS JOIN LATERAL (
  SELECT unnest(CASE u."role"::text
    WHEN 'MANAGER' THEN ARRAY['orders.view','orders.manage','requests.view','requests.manage','dispatch.view','dispatch.manage','returns.view','returns.manage','catalogue.view','catalogue.manage','customers.view','customers.manage','collections.view','reports.view','marketing.view']
    WHEN 'STAFF' THEN ARRAY['orders.view','orders.manage','requests.view','requests.manage','catalogue.view','catalogue.manage','dispatch.view']
    WHEN 'PACKING_STAFF' THEN ARRAY['orders.view']
    WHEN 'DELIVERY_PARTNER' THEN ARRAY['dispatch.view','collections.view']
    ELSE ARRAY[]::text[]
  END) AS permission
) p
WHERE NOT EXISTS (SELECT 1 FROM "StaffPermission" sp WHERE sp."userId" = u."id")
ON CONFLICT ("userId", "permission") DO NOTHING;
