import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { categories, products } from "../lib/products";
import { slugify } from "../lib/utils";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("Admin@12345", 12);

  await prisma.user.upsert({
    where: { email: "admin@msmsupermarket.in" },
    update: {},
    create: {
      name: "MSM Admin",
      email: "admin@msmsupermarket.in",
      phone: "+91 98765 43210",
      passwordHash: adminPassword,
      role: "ADMIN"
    }
  });

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
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
