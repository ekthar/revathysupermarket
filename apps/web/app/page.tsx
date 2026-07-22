import Link from "next/link";
import { unstable_cache } from "next/cache";
import { ChevronRight, Zap } from "lucide-react";
import { PromoBanners } from "@/components/home/promo-banners";
import { RecentOrdersSection } from "@/components/home/recent-orders-section";
import { HeroSection } from "@/components/home/hero-section";
import { AnimatedCategories } from "@/components/home/animated-categories";
import { AnimatedProductSection } from "@/components/home/animated-product-section";
import { LocationPrompt } from "@/components/location-prompt";
import { StructuredData } from "@/components/structured-data";
import { organizationSchema, websiteSchema } from "@/lib/structured-data";
import { categories as demoCategories, products } from "@/lib/products";
import { prisma } from "@/lib/prisma";
import { getPublicStoreSettings } from "@/lib/store-settings";
import { getFeatureFlag } from "@/lib/feature-flags";
import type { Product } from "@/lib/types";
import { auth } from "@/auth";
import { LazyRender } from "@/components/ui/lazy-render";


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
    orderBy: [{ isFeatured: "desc" }, { popularity: "desc" }, { createdAt: "desc" }],
    take: 24
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

export default async function HomePage() {
  // Maintenance mode check
  const maintenanceFlag = await getFeatureFlag<{ message?: string; eta?: string }>("maintenance_mode").catch(() => ({ enabled: false, config: null }));
  if (maintenanceFlag.enabled) {
    const msg = maintenanceFlag.config?.message || "We're performing scheduled maintenance. Please check back soon.";
    const eta = maintenanceFlag.config?.eta || "";
    return (
      <main className="flex min-h-[80dvh] flex-col items-center justify-center px-4 text-center bg-background">
        <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 max-w-md shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <span className="text-3xl">🔧</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Under Maintenance</h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{msg}</p>
          {eta && <p className="mt-3 text-xs font-semibold text-amber-600 dark:text-amber-400">Expected back: {eta}</p>}
        </div>
      </main>
    );
  }

  const session = await auth();
  const [settings, banner, dbProducts, dbCategories, promoBanners] = await Promise.all([
    getPublicStoreSettings(),
    getHomepageBanner(),
    getHomepageProducts(),
    getHomepageCategories(),
    getPromoBanners(),
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

  const categories: readonly string[] = dbCategories.length > 0
    ? dbCategories.map((c) => c.name)
    : demoCategories;
  const categoryImages: Record<string, string> = dbCategories.length > 0
    ? Object.fromEntries(dbCategories.filter((c) => c.image).map((c) => [c.name, c.image as string]))
    : demoCategoryImages;
  const categoryIcons: Record<string, string> = dbCategories.length > 0
    ? Object.fromEntries(dbCategories.filter((c) => c.icon).map((c) => [c.name, c.icon as string]))
    : {};

  const trending = [...allProducts].sort((a, b) => b.popularity - a.popularity).slice(0, 12);
  const offers = allProducts.filter((p) => p.discountPrice).slice(0, 8);

  const heroImage = banner?.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1800&auto=format&fit=crop";
  const heroTitle = banner?.title || "Fresh Groceries Delivered Fast";
  const heroHref = banner?.href || "/products";

  return (
    <main className="min-h-[100dvh] bg-background">
      {/* SEO structured data */}
      <StructuredData data={[organizationSchema(), websiteSchema()]} />

      {/* Location prompt — shown on first visit if no saved location */}
      <LocationPrompt />

      {/* ── Section 1: Hero ── */}
      <HeroSection
        storeName={settings.storeName}
        heroImage={heroImage}
        heroTitle={heroTitle}
        heroHref={heroHref}
        deliveryRadiusKm={settings.deliveryRadiusKm}
        deliveryEstimateMin={settings.deliveryEstimateMin}
        deliveryEstimateMax={settings.deliveryEstimateMax}
      />

      {/* ── Section 2: Promo banners (if any) ── */}
      <PromoBanners banners={promoBanners} />

      {/* ── Section 3: Recent Orders (hidden when empty) ── */}
      <RecentOrdersSection />

      {/* ── Section 4: Categories ── */}
      <AnimatedCategories
        categories={categories}
        categoryImages={categoryImages}
        categoryIcons={categoryIcons}
        allProducts={allProducts}
      />

      {/* ── Section 5: Trending Products ── */}
      <div className="cv-auto">
        <AnimatedProductSection
          title="Trending This Week"
          subtitle="Top picks loved by customers"
          products={trending.slice(0, 8)}
          showCategoryPills
          categoryPills={categories.slice(0, 6)}
          categories={categories}
          layout="mixed"
        />
      </div>

      {/* ── Section 6: On Sale (only when discounts exist) ── */}
      {offers.length > 0 && (
        <LazyRender height={400} rootMargin="300px" className="cv-auto">
          <AnimatedProductSection
            title="On Sale Today"
            subtitle="Limited-time discounts"
            icon={<Zap className="h-5 w-5 text-amber-500" />}
            products={offers}
            layout="grid"
          />
        </LazyRender>
      )}

      {/* ── Section 7: Browse All CTA ── */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-10 md:pt-14 pb-8 md:pb-10">
        <div className="flex flex-col items-center text-center">
          <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
            Explore our full catalogue
          </p>
          <Link
            href="/products"
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-neutral-900 dark:bg-white px-6 py-3 text-sm font-bold text-white dark:text-neutral-900 shadow-sm transition-transform press"
          >
            Browse all products
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
