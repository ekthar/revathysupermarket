-- Add print tracking fields to Order
ALTER TABLE "Order" ADD COLUMN "printedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "printedById" TEXT;

CREATE INDEX "Order_printedAt_idx" ON "Order"("printedAt");
