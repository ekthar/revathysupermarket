-- Add customerName and phone columns to Address model for saved address
-- contact info, mirroring the Order model's fields. Both are nullable to
-- avoid breaking existing rows; the checkout form prompts for these fields
-- when they are missing from the selected saved address.
ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "customerName" TEXT;
ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "phone" TEXT;
