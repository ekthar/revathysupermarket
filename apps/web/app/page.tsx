import Link from "next/link";
import { unstable_cache } from "next/cache";
import { ChevronRight, Star, Zap } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { PromoBanners } from "@/components/home/promo-banners";
import { RecentOrdersSection } from "@/components/home/recent-orders-section";
import { HeroSection } from "@/components/home/hero-section";
import { AnimatedCategories } from "@/components/home/animated-categories";
import { AnimatedProductSection } from "@/components/home/animated-product-section";
import { HomeSearch } from "@/components/home/home-search";
import { LiveOrderBanner } from "@/components/tracking/live-order-banner";
import { LocationPrompt } from "@/components/location-prompt";
import { categories as demoCategories, products } from "@/lib/products";
import { prisma } from "@/lib/prisma";
import { getPublicStoreSettings } from "@/lib/store-settings";
import type { Product } from "@/lib/types";
import { auth } from "@/auth";
import { getActiveOrderSummary } from "@/lib/live-order";
import { categoryColorForIndex } from "@/lib/category-icons";

export const revalidate = 60;

const getHomepageBanner = unstable_cache(
  async () => prisma.banner.findFirst({ where: { isActive: true }, orderBy: { createdAt: "desc" }, select: { title: true, subtitle: true, image: true, href: true } }).catch(() => null),
  ["homepage-banner"],
  { revalidate: 60, tags: ["homepage", "banners"] }
);

const getPromoBanners = unstable_cache(
  async () => prisma.banner.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, subtitle: true, image: true, href: true },
    take: 5
  }).catch(() => []),
  ["homepage-promo-banners"],
  { revalidate: 60, tags: ["homepage", "banners"] }
);

const getHomepageProducts = unstable_cache(
  async () => prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, name: true, description: true, image: true, price: true, discountPrice: true, stock: true, popularity: true, unit: true, isFeatured: true, createdAt: true, category: { select: { name: true } } },
    orderBy: [{ popularity: "desc" }, { createdAt: "desc" }],
    take: 60
  }).catch(() => []),
  ["homepage-products"],
  { revalidate: 60, tags: ["homepage", "products"] }
);

const getHomepageCategories = unstable_cache(
  async () => prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { name: true, image: true, icon: true }
  }).catch(() => []),
  ["homepage-categories"],
  { revalidate: 60, tags: ["homepage", "categories"] }
);

// Demo-only fallbacks, used solely when a fresh install has zero real categories in
// the DB yet (see AdminCategories -> real icons/images take over automatically).
const demoCategoryImages: Record<string, string> = {
  Fruits: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=200&h=200&fit=crop",
  Vegetables: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&h=200&fit=crop",
  Dairy: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=200&h=200&fit=crop",
  Beverages: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=200&h=200&fit=crop",
  Snacks: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=200&h=200&fit=crop",
  Household: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=200&h=200&fit=crop",
  "Personal Care": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=200&h=200&fit=crop",
  "Frozen Foods": "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=200&h=200&fit=crop",
  "Grocery Essentials": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&h=200&fit=crop"
};

const demoCategoryColors: Record<string, string> = {
  Fruits: "bg-orange-50",
  Vegetables: "bg-secondary-50",
  Dairy: "bg-blue-50",
  Beverages: "bg-yellow-50",
  Snacks: "bg-pink-50",
  Household: "bg-purple-50",
  "Personal Care": "bg-rose-50",
  "Frozen Foods": "bg-cyan-50",
  "Grocery Essentials": "bg-amber-50"
};

const demoCategoryIcons: Record<string, string> = {
  Fruits: "\ud83c\udf4e", Vegetables: "\ud83e\udd2c", Dairy: "\ud83e\udd5b", Beverages: "\ud83e\uddc3", Snacks: "\ud83c\udf7f",
  Household: "\ud83e\uddf9", "Personal Care": "\ud83e\uddf4", "Frozen Foods": "\ud83e\uddc6", "Grocery Essentials": "\ud83c\udf5a"
};

export default async function HomePage() {
  const session = await auth();
  const [settings, banner, dbProducts, dbCategories, promoBanners, activeOrder] = await Promise.all([
    getPublicStoreSettings(),
    getHomepageBanner(),
    getHomepageProducts(),
    getHomepageCategories(),
    getPromoBanners(),
    getActiveOrderSummary(session?.user?.id)
  ]);

  const allProducts: Product[] = dbProducts.length > 0
    ? dbProducts.map((p) => ({
        id: p.id, slug: p.slug, name: p.name,
        category: p.category.name as Product["category"],
        price: Number(p.price),
        discountPrice: p.discountPrice ? Number(p.discountPrice) : undefined,
        image: p.image, description: p.description, stock: p.stock,
        popularity: p.popularity, unit: p.unit, isFeatured: p.isFeatured
      }))
    : products;

  // Real DB categories drive the "Popular Categories" widget once an admin has added
  // any; a fresh install with zero categories falls back to the demo set so the
  // homepage isn't blank before the store owner sets things up.
  const categories: readonly string[] = dbCategories.length > 0
    ? dbCategories.map((c) => c.name)
    : demoCategories;
  const categoryImages: Record<string, string> = dbCategories.length > 0
    ? Object.fromEntries(dbCategories.filter((c) => c.image).map((c) => [c.name, c.image as string]))
    : demoCategoryImages;
  const categoryIcons: Record<string, string> = dbCategories.length > 0
    ? Object.fromEntries(dbCategories.filter((c) => c.icon).map((c) => [c.name, c.icon as string]))
    : demoCategoryIcons;
  const categoryColors: Record<string, string> = dbCategories.length > 0
    ? Object.fromEntries(dbCategories.map((c, i) => [c.name, categoryColorForIndex(i)]))
    : demoCategoryColors;

  const trending = [...allProducts].sort((a, b) => b.popularity - a.popularity).slice(0, 12);
  const offers = allProducts.filter((p) => p.discountPrice).slice(0, 8);

  const heroImage = banner?.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1800&auto=format&fit=crop";
  const heroTitle = banner?.title || "Fresh Groceries Delivered Fast";
  const heroHref = banner?.href || "/products";

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <HomeSearch products={allProducts} />

      {/* Location Prompt - appears on first visit if no saved location */}
      <LocationPrompt />

      {/* Live Order Tracking Banner - shows when user has an active order */}
      <LiveOrderBanner initialOrder={activeOrder} />

      {/* Hero Section - with parallax + floating card */}
      <HeroSection
        storeName={settings.storeName}
        heroImage={heroImage}
        heroTitle={heroTitle}
        heroHref={heroHref}
        deliveryRadiusKm={settings.deliveryRadiusKm}
      />

      {/* Mobile promo banners - dynamic from admin */}
      <PromoBanners banners={promoBanners} />

      {/* Recent Orders - Foodizo horizontal cards (mobile only) */}
      <RecentOrdersSection />

      {/* Popular Categories - with staggered entrance */}
      <AnimatedCategories
        categories={categories}
        categoryImages={categoryImages}
        categoryColors={categoryColors}
        categoryIcons={categoryIcons}
        allProducts={allProducts}
      />

      {/* Trending This Week — top picks by popularity */}
      <div className="cv-auto">
        <AnimatedProductSection
          title="Trending This Week"
          subtitle="Top picks loved by customers"
          products={trending.slice(0, 8)}
          showCategoryPills
          categoryPills={categories.slice(0, 6)}
          categories={categories}
        />
      </div>

      {/* On Sale Today - items with active discounts (only if there are offers) */}
      {offers.length > 0 && (
        <div className="cv-auto">
          <AnimatedProductSection
            title="On Sale Today"
            subtitle="Limited-time discounts you don't want to miss"
            icon={<Zap className="h-5 w-5 text-orange-500" />}
            products={offers}
            layout="grid"
          />
        </div>
      )}

      {/* Featured Products — staff picks */}
      {allProducts.filter((p) => p.isFeatured).length > 0 && (
        <div className="cv-auto">
          <AnimatedProductSection
            title="Staff Picks"
            subtitle="Our featured favourites of the week"
            icon={<Star className="h-5 w-5 text-yellow-500" />}
            products={allProducts.filter((p) => p.isFeatured)}
            layout="grid"
          />
        </div>
      )}

      {/* All Products — single responsive grid for both mobile and desktop */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-8 md:pt-12 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title text-lg md:text-2xl">All Products</h2>
          <Link href="/products" className="text-sm font-semibold text-primary flex items-center gap-1">
            View all {allProducts.length} products <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
          {allProducts.slice(0, 12).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        {allProducts.length > 12 && (
          <Link href="/products" className="mt-6 flex h-11 items-center justify-center rounded-2xl border border-neutral-200 dark:border-neutral-800 text-body font-semibold text-primary press hover:bg-neutral-50 dark:hover:bg-neutral-900 transition">
            Browse all {allProducts.length} products
          </Link>
        )}
      </section>

      {/* Footer - Desktop */}
      <footer className="hidden md:block border-t border-neutral-100 dark:border-neutral-800 mt-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="font-display text-lg font-black text-neutral-900 dark:text-white">{settings.storeName}</h3>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Skip the long lines and heavy bags, we&apos;ll handle the delivery for you.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white">Main Pages</h4>
              <ul className="mt-3 space-y-2">
                <li><Link href="/" className="text-sm text-neutral-500 hover:text-neutral-700">Home</Link></li>
                <li><Link href="/products" className="text-sm text-neutral-500 hover:text-neutral-700">Shop All</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white">Help</h4>
              <ul className="mt-3 space-y-2">
                <li><Link href="/support" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">Help Center</Link></li>
                <li><Link href="/account/settings" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">Return Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white">Contact Information</h4>
              <ul className="mt-3 space-y-2">
                <li className="text-sm text-neutral-500 dark:text-neutral-400">{settings.address || "Kerala, India"}</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
