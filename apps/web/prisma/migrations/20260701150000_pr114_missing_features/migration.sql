-- PR #114: Missing migration for new features (SubCategory, Review, tips, language, notifications)

-- 1. User: add preferredLanguage
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "preferredLanguage" TEXT NOT NULL DEFAULT 'en';

-- 2. SubCategory model
CREATE TABLE IF NOT EXISTS "SubCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SubCategory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "SubCategory_slug_key" ON "SubCategory"("slug");
CREATE INDEX IF NOT EXISTS "SubCategory_categoryId_idx" ON "SubCategory"("categoryId");
CREATE INDEX IF NOT EXISTS "SubCategory_sortOrder_idx" ON "SubCategory"("sortOrder");
ALTER TABLE "SubCategory" ADD CONSTRAINT "SubCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. Product: add subCategoryId
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "subCategoryId" TEXT;
CREATE INDEX IF NOT EXISTS "Product_subCategoryId_idx" ON "Product"("subCategoryId");
ALTER TABLE "Product" ADD CONSTRAINT "Product_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. Order: add tipAmount and deliveryInstructions
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "tipAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryInstructions" TEXT;

-- 5. UserSettings: add notification preference columns
ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "priceDropAlerts" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "weeklyDeals" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "deliveryAlerts" BOOLEAN NOT NULL DEFAULT true;

-- 6. Review model
CREATE TABLE IF NOT EXISTS "Review" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Review_userId_productId_key" ON "Review"("userId", "productId");
CREATE INDEX IF NOT EXISTS "Review_productId_idx" ON "Review"("productId");
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 7. Category: add sortOrder index (if missing)
CREATE INDEX IF NOT EXISTS "Category_sortOrder_idx" ON "Category"("sortOrder");
