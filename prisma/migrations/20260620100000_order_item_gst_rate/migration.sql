-- AlterTable: Add gstRate to OrderItem for per-product GST tracking
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "gstRate" DECIMAL(5,2);
