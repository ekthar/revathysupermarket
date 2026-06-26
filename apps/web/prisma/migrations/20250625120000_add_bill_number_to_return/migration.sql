ALTER TABLE "ReturnRequest" ADD COLUMN "billNumber" TEXT NOT NULL DEFAULT '';

CREATE INDEX "ReturnRequest_billNumber_idx" ON "ReturnRequest"("billNumber");
