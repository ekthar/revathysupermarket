-- Add arrivedAt column to Order for tracking when delivery partner arrives on location
ALTER TABLE "Order" ADD COLUMN "arrivedAt" TIMESTAMP(3);
