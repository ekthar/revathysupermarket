import { PrismaClient } from "@prisma/client";
import { featureFlags, seedFeatureFlags } from "./feature-flags";

/**
 * Flags-only seed.
 *
 * Safe to run against a production database: it ONLY upserts feature flags
 * (idempotent, existing toggles preserved) and never touches users, the
 * product catalog, categories, banners, or settings.
 *
 *   npm run seed:flags
 */
const prisma = new PrismaClient();

async function main() {
  console.log(`Seeding ${featureFlags.length} feature flags...`);
  const created = await seedFeatureFlags(prisma);
  console.log(
    `Done. ${created} new flag(s) created, ${featureFlags.length - created} already existed (left untouched).`
  );
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
