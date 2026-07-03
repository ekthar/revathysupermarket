const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const unitMapping = {
  "1 pc": "pcs",
  "1 kg": "kg",
  "1 l": "L",
  "1 L": "L",
  "1 ltr": "L",
  "1 ml": "ml",
  "1 g": "g",
  "1 box": "box",
  "1 bundle": "bundle",
  "1 packet": "packet"
};

async function main() {
  console.log("Starting unit normalization...");
  
  const products = await prisma.product.findMany({
    select: { id: true, unit: true }
  });

  let updatedCount = 0;

  for (const product of products) {
    if (!product.unit) continue;
    
    // Exact match replace
    if (unitMapping[product.unit]) {
      await prisma.product.update({
        where: { id: product.id },
        data: { unit: unitMapping[product.unit] }
      });
      updatedCount++;
    } 
    // Fallback if someone typed uppercase etc.
    else if (unitMapping[product.unit.toLowerCase()]) {
      await prisma.product.update({
        where: { id: product.id },
        data: { unit: unitMapping[product.unit.toLowerCase()] }
      });
      updatedCount++;
    }
  }

  console.log(`Unit normalization complete. Updated ${updatedCount} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
