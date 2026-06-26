-- Add ARRIVING to OrderStatus enum
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'ARRIVING' BEFORE 'DELIVERED';

-- Add UNDER_REVIEW and ITEM_RECEIVED to ReturnStatus enum
ALTER TYPE "ReturnStatus" ADD VALUE IF NOT EXISTS 'UNDER_REVIEW' AFTER 'REQUESTED';
ALTER TYPE "ReturnStatus" ADD VALUE IF NOT EXISTS 'ITEM_RECEIVED' AFTER 'APPROVED';

-- Create new enums
CREATE TYPE "CollectionStatus" AS ENUM ('PENDING_HANDOVER', 'UPI_AWAITING_VERIFICATION', 'SETTLED', 'SHORT', 'EXCESS');
CREATE TYPE "DamageStatus" AS ENUM ('RECORDED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- Add authVersion to User
ALTER TABLE "User" ADD COLUMN "authVersion" INTEGER NOT NULL DEFAULT 0;

-- Extend ReturnRequest with new fields
ALTER TABLE "ReturnRequest" ADD COLUMN "returnNumber" TEXT;
ALTER TABLE "ReturnRequest" ADD COLUMN "evidenceUrls" TEXT[] DEFAULT '{}';
ALTER TABLE "ReturnRequest" ADD COLUMN "maxRefundAmount" DECIMAL(10,2);
ALTER TABLE "ReturnRequest" ADD COLUMN "rejectionReason" TEXT;
ALTER TABLE "ReturnRequest" ADD COLUMN "itemReceivedAt" TIMESTAMP(3);
ALTER TABLE "ReturnRequest" ADD COLUMN "refundedAt" TIMESTAMP(3);
ALTER TABLE "ReturnRequest" ADD COLUMN "eligibleUntil" TIMESTAMP(3);

-- Generate returnNumber for existing returns
UPDATE "ReturnRequest" SET "returnNumber" = 'RET-' || UPPER(SUBSTRING("id" FROM 1 FOR 8)) WHERE "returnNumber" IS NULL;
ALTER TABLE "ReturnRequest" ALTER COLUMN "returnNumber" SET NOT NULL;
CREATE UNIQUE INDEX "ReturnRequest_returnNumber_key" ON "ReturnRequest"("returnNumber");
CREATE INDEX "ReturnRequest_returnNumber_idx" ON "ReturnRequest"("returnNumber");

-- StaffPermission table
CREATE TABLE "StaffPermission" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "permission" TEXT NOT NULL,
  "grantedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StaffPermission_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "StaffPermission_userId_permission_key" ON "StaffPermission"("userId", "permission");
CREATE INDEX "StaffPermission_userId_idx" ON "StaffPermission"("userId");
CREATE INDEX "StaffPermission_permission_idx" ON "StaffPermission"("permission");
ALTER TABLE "StaffPermission" ADD CONSTRAINT "StaffPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DeliveryFeeSlab table
CREATE TABLE "DeliveryFeeSlab" (
  "id" TEXT NOT NULL,
  "minKm" DECIMAL(6,2) NOT NULL,
  "maxKm" DECIMAL(6,2) NOT NULL,
  "fee" DECIMAL(10,2) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DeliveryFeeSlab_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "DeliveryFeeSlab_isActive_minKm_idx" ON "DeliveryFeeSlab"("isActive", "minKm");

-- Seed default delivery fee slabs
INSERT INTO "DeliveryFeeSlab" ("id", "minKm", "maxKm", "fee", "isActive", "createdAt", "updatedAt") VALUES
  ('slab_0_2', 0, 2, 30, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('slab_2_3.5', 2, 3.5, 50, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('slab_3.5_5', 3.5, 5, 70, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- DeliveryAdjustment table
CREATE TABLE "DeliveryAdjustment" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "partnerId" TEXT NOT NULL,
  "itemName" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "reductionAmount" DECIMAL(10,2) NOT NULL,
  "evidenceUrl" TEXT,
  "status" "DamageStatus" NOT NULL DEFAULT 'RECORDED',
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DeliveryAdjustment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "DeliveryAdjustment_orderId_idx" ON "DeliveryAdjustment"("orderId");
CREATE INDEX "DeliveryAdjustment_partnerId_idx" ON "DeliveryAdjustment"("partnerId");
CREATE INDEX "DeliveryAdjustment_status_idx" ON "DeliveryAdjustment"("status");
ALTER TABLE "DeliveryAdjustment" ADD CONSTRAINT "DeliveryAdjustment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeliveryAdjustment" ADD CONSTRAINT "DeliveryAdjustment_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DeliveryCollection table
CREATE TABLE "DeliveryCollection" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "partnerId" TEXT NOT NULL,
  "expectedAmount" DECIMAL(10,2) NOT NULL,
  "cashCollected" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "upiCollected" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "walletApplied" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "adjustmentAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "upiReference" TEXT,
  "status" "CollectionStatus" NOT NULL DEFAULT 'PENDING_HANDOVER',
  "discrepancyReason" TEXT,
  "reconciledById" TEXT,
  "reconciledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DeliveryCollection_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DeliveryCollection_orderId_key" ON "DeliveryCollection"("orderId");
CREATE INDEX "DeliveryCollection_partnerId_createdAt_idx" ON "DeliveryCollection"("partnerId", "createdAt");
CREATE INDEX "DeliveryCollection_status_idx" ON "DeliveryCollection"("status");
CREATE INDEX "DeliveryCollection_reconciledById_idx" ON "DeliveryCollection"("reconciledById");
ALTER TABLE "DeliveryCollection" ADD CONSTRAINT "DeliveryCollection_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeliveryCollection" ADD CONSTRAINT "DeliveryCollection_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeliveryCollection" ADD CONSTRAINT "DeliveryCollection_reconciledById_fkey" FOREIGN KEY ("reconciledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
