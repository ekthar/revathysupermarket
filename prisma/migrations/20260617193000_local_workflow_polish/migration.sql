ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryOtpAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryOtpExpiresAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "staffNote" TEXT;

INSERT INTO "Setting" ("id", "key", "value", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'whatsappTemplateStatus.login_otp', 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'whatsappTemplateStatus.order_confirmed', 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'whatsappTemplateStatus.order_packed', 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'whatsappTemplateStatus.delivery_assigned', 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'whatsappTemplateStatus.out_for_delivery', 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'whatsappTemplateStatus.delivered', 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'whatsappTemplateStatus.order_edited', 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'whatsappTemplateStatus.return_approved', 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
