import bcrypt from "bcryptjs";
import { Prisma, PrismaClient } from "@prisma/client";
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

  // Seed feature flags (idempotent upserts)
  const featureFlags = [
    {
      id: "ff_stock_value_visible",
      key: "stock_value_visible",
      enabled: false,
      config: Prisma.JsonNull,
    },
    {
      id: "ff_forced_accept_delivery",
      key: "forced_accept_delivery",
      enabled: false,
      config: { overrides: [] },
    },
    {
      id: "ff_ring_alert_rules",
      key: "ring_alert_rules",
      enabled: true,
      config: {
        ringtone: "default",
        durationSeconds: 30,
        escalationAfterSeconds: 60,
        escalationTarget: "admin",
      },
    },
    {
      id: "ff_print_required_alert",
      key: "print_required_alert",
      enabled: true,
      config: { thresholdMinutes: 10 },
    },
    // --- New feature flags ---
    {
      id: "ff_delivery_mode",
      key: "delivery_mode",
      enabled: true,
      config: { mode: "both" },
    },
    {
      id: "ff_instant_delivery_enabled",
      key: "instant_delivery_enabled",
      enabled: true,
      config: Prisma.JsonNull,
    },
    {
      id: "ff_minimum_order_value",
      key: "minimum_order_value",
      enabled: true,
      config: { value: 149 },
    },
    {
      id: "ff_free_delivery_threshold",
      key: "free_delivery_threshold",
      enabled: true,
      config: { value: 499 },
    },
    {
      id: "ff_delivery_radius_km",
      key: "delivery_radius_km",
      enabled: true,
      config: { value: 5 },
    },
    {
      id: "ff_max_orders_per_hour",
      key: "max_orders_per_hour",
      enabled: false,
      config: { value: 50, action: "queue" },
    },
    {
      id: "ff_surge_pricing_enabled",
      key: "surge_pricing_enabled",
      enabled: false,
      config: { multiplier: 1.5, message: "High demand" },
    },
    {
      id: "ff_tip_enabled",
      key: "tip_enabled",
      enabled: true,
      config: Prisma.JsonNull,
    },
    {
      id: "ff_wallet_topup_enabled",
      key: "wallet_topup_enabled",
      enabled: false,
      config: Prisma.JsonNull,
    },
    {
      id: "ff_reviews_enabled",
      key: "reviews_enabled",
      enabled: true,
      config: Prisma.JsonNull,
    },
    {
      id: "ff_referral_enabled",
      key: "referral_enabled",
      enabled: false,
      config: { senderReward: 50, receiverReward: 50 },
    },
    {
      id: "ff_multi_language_enabled",
      key: "multi_language_enabled",
      enabled: true,
      config: Prisma.JsonNull,
    },
    {
      id: "ff_express_checkout_enabled",
      key: "express_checkout_enabled",
      enabled: true,
      config: Prisma.JsonNull,
    },
    {
      id: "ff_store_open_hours",
      key: "store_open_hours",
      enabled: false,
      config: { open: "07:00", close: "22:00", autoToggle: true },
    },
    {
      id: "ff_maintenance_mode",
      key: "maintenance_mode",
      enabled: false,
      config: { message: "Back in 30 minutes", eta: null },
    },
    {
      id: "ff_cod_enabled",
      key: "cod_enabled",
      enabled: true,
      config: Prisma.JsonNull,
    },
    {
      id: "ff_upi_on_delivery_enabled",
      key: "upi_on_delivery_enabled",
      enabled: true,
      config: Prisma.JsonNull,
    },
    {
      id: "ff_new_user_discount",
      key: "new_user_discount",
      enabled: false,
      config: { percent: 20, maxDiscount: 100, minOrder: 199 },
    },
    {
      id: "ff_delivery_partner_assignment",
      key: "delivery_partner_assignment",
      enabled: true,
      config: { mode: "nearest" },
    },
    {
      id: "ff_order_edit_window_minutes",
      key: "order_edit_window_minutes",
      enabled: true,
      config: { value: 5 },
    },
    {
      id: "ff_substitute_approval_mode",
      key: "substitute_approval_mode",
      enabled: true,
      config: { mode: "always_ask" },
    },
    {
      id: "ff_dark_store_mode",
      key: "dark_store_mode",
      enabled: false,
      config: Prisma.JsonNull,
    },
    {
      id: "ff_slot_only_mode",
      key: "slot_only_mode",
      enabled: false,
      config: Prisma.JsonNull,
    },
    {
      id: "ff_max_items_per_order",
      key: "max_items_per_order",
      enabled: true,
      config: { value: 50 },
    },
    {
      id: "ff_live_tracking_enabled",
      key: "live_tracking_enabled",
      enabled: true,
      config: Prisma.JsonNull,
    },
    {
      id: "ff_eta_display_mode",
      key: "eta_display_mode",
      enabled: true,
      config: { mode: "after_assignment" },
    },
  ];

  for (const flag of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {},
      create: flag,
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
