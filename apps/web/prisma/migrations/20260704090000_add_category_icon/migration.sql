-- Adds an optional emoji/icon field to Category, used by the homepage category
-- tiles instead of the previous hardcoded name -> emoji map. Nullable, so this is
-- a safe additive change for existing rows (they simply render the UI fallback
-- emoji until an admin sets one).
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "icon" TEXT;
