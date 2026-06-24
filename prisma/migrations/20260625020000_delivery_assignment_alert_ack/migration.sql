ALTER TABLE "Order"
ADD COLUMN "deliveryAssignedAt" TIMESTAMP(3),
ADD COLUMN "deliveryAlertAckAt" TIMESTAMP(3);

CREATE INDEX "Order_deliveryPartnerId_deliveryAlertAckAt_idx"
ON "Order"("deliveryPartnerId", "deliveryAlertAckAt");
