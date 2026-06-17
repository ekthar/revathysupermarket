-- Single-supermarket phone-first auth, WhatsApp logs, and COD/UPI-only payments.
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneVerified" BOOLEAN NOT NULL DEFAULT false;

UPDATE "User"
SET "phone" = NULL
WHERE "phone" IS NOT NULL AND btrim("phone") = '';

WITH duplicate_phones AS (
  SELECT
    "id",
    row_number() OVER (
      PARTITION BY "phone"
      ORDER BY "createdAt" ASC, "id" ASC
    ) AS row_number
  FROM "User"
  WHERE "phone" IS NOT NULL
)
UPDATE "User"
SET "phone" = NULL
FROM duplicate_phones
WHERE "User"."id" = duplicate_phones."id"
  AND duplicate_phones.row_number > 1;

CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone");

CREATE TABLE IF NOT EXISTS "OtpToken" (
  "id" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "usedAt" TIMESTAMP(3),
  "userId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OtpToken_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OtpToken_phone_expiresAt_idx" ON "OtpToken"("phone", "expiresAt");
CREATE INDEX IF NOT EXISTS "OtpToken_userId_idx" ON "OtpToken"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'OtpToken_userId_fkey'
  ) THEN
    ALTER TABLE "OtpToken"
      ADD CONSTRAINT "OtpToken_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "WhatsAppLog" (
  "id" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "orderId" TEXT,
  "template" TEXT NOT NULL,
  "messageId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'sent',
  "error" TEXT,
  "statusAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WhatsAppLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WhatsAppLog_orderId_idx" ON "WhatsAppLog"("orderId");
CREATE INDEX IF NOT EXISTS "WhatsAppLog_phone_idx" ON "WhatsAppLog"("phone");
CREATE INDEX IF NOT EXISTS "WhatsAppLog_createdAt_idx" ON "WhatsAppLog"("createdAt");

ALTER TABLE "Order" DROP COLUMN IF EXISTS "whatsapp";
ALTER TABLE "Order" DROP COLUMN IF EXISTS "paymentGatewayRef";

UPDATE "Order" SET "paymentMethod" = 'COD' WHERE "paymentMethod" = 'ONLINE';

ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
CREATE TYPE "PaymentMethod" AS ENUM ('COD', 'UPI_ON_DELIVERY');
ALTER TABLE "Order"
  ALTER COLUMN "paymentMethod" TYPE "PaymentMethod"
  USING "paymentMethod"::text::"PaymentMethod";
DROP TYPE "PaymentMethod_old";
