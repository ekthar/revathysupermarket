import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { categories, products } from "../lib/products";
import { slugify } from "../lib/utils";
import { seedFeatureFlags } from "./feature-flags";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("Admin@12345", 12);
  const adminEmail = "admin@msmsupermarket.in";
  const adminPhone = "+91 98765 43210";

  // Look up by email OR phone: both are unique columns, so a plain
  // upsert-on-email would still throw P2002 when a row with the same phone
  // (but a different email) already exists. Only create when neither matches.
  const existingAdmin = await prisma.user.findFirst({
    where: { OR: [{ email: adminEmail }, { phone: adminPhone }] },
    select: { id: true }
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: "MSM Admin",
        email: adminEmail,
        phone: adminPhone,
        passwordHash: adminPassword,
        role: "ADMIN"
      }
    });
  }

  for (const name of categories) {
    await prisma.category.upsert({
      where: { slug: slugify(name) },
      update: { name },
      create: { name, slug: slugify(name), description: `${name} available for local delivery.` }
    });
  }

  const dbCategories = await prisma.category.findMany();
  const categoryByName = new Map(dbCategories.map((category) => [category.name, category.id]));

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        description: product.description,
        image: product.image,
        price: product.price,
        discountPrice: product.discountPrice,
        stock: product.stock,
        popularity: product.popularity,
        unit: product.unit,
        categoryId: categoryByName.get(product.category)!
      },
      create: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        image: product.image,
        price: product.price,
        discountPrice: product.discountPrice,
        stock: product.stock,
        popularity: product.popularity,
        unit: product.unit,
        categoryId: categoryByName.get(product.category)!
      }
    });
  }

  await prisma.banner.upsert({
    where: { id: "home-main-offer" },
    update: {},
    create: {
      id: "home-main-offer",
      title: "Weekend Freshness Sale",
      subtitle: "Save up to 15% on fruits, vegetables, dairy, and pantry essentials.",
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1600&auto=format&fit=crop",
      href: "/products"
    }
  });

  await prisma.setting.createMany({
    data: [
      { key: "storeName", value: "MSM Supermarket" },
      { key: "address", value: "Kerala, India" },
      { key: "phone", value: "+91 98765 43210" },
      { key: "whatsapp", value: "919876543210" },
      { key: "deliveryRadiusKm", value: "5" }
    ],
    skipDuplicates: true
  });

  // Seed feature flags (idempotent upserts, shared with `npm run seed:flags`)
  await seedFeatureFlags(prisma);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
