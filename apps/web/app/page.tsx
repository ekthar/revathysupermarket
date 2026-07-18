import Link from "next/link";
import { unstable_cache } from "next/cache";
import { ChevronRight, Star, Zap } from "lucide-react";
import { PromoBanners } from "@/components/home/promo-banners";
import { RecentOrdersSection } from "@/components/home/recent-orders-section";
import { HeroSection } from "@/components/home/hero-section";
import { AnimatedCategories } from "@/components/home/animated-categories";
import { AnimatedProductSection } from "@/components/home/animated-product-section";
import { HomeSearch } from "@/components/home/home-search";
import { LocationPrompt } from "@/components/location-prompt";
import { StructuredData } from "@/components/structured-data";
import { organizationSchema, websiteSchema } from "@/lib/structured-data";
import { categories as demoCategories, products } from "@/lib/products";
import { prisma } from "@/lib/prisma";
import { getPublicStoreSettings } from "@/lib/store-settings";
import { getLoyaltyConfig } from "@/lib/loyalty-config";
import { getFeatureFlag } from "@/lib/feature-flags";
import type { Product } from "@/lib/types";
import { auth } from "@/auth";
import { getActiveOrderSummary } from "@/lib/live-order";
import { LoyaltyProgressBar } from "@/components/home/loyalty-progress-bar";
import { OrderStreak } from "@/components/home/order-streak";
import { InfiniteMarquee } from "@/components/ui/gsap/infinite-marquee";

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
      <main className="flex min-h-[80dvh] flex-col items-center justify-center px-4 text-center bg-[#F7F7FA] dark:bg-[#020617]">
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
  const [settings, banner, dbProducts, dbCategories, promoBanners, activeOrder] = await Promise.all([
    getPublicStoreSettings(),
    getHomepageBanner(),
    getHomepageProducts(),
    getHomepageCategories(),
    getPromoBanners(),
    getActiveOrderSummary(session?.user?.id)
  ]);

  // Fetch loyalty data and order streak for logged-in users
  let loyaltyPoints = 0;
  let nextRewardAt = 200; // default: 200 points = ₹50 off (200 * 0.25)
  let orderStreak = 0;

  if (session?.user?.id) {
    const [loyaltyAccount, loyaltyConfig, recentOrders] = await Promise.all([
      prisma.loyaltyAccount.findUnique({
        where: { userId: session.user.id },
        select: { balance: true, lifetimeEarned: true }
      }).catch(() => null),
      getLoyaltyConfig(),
      prisma.order.findMany({
        where: {
          userId: session.user.id,
          createdAt: { gte: new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000) },
          status: { notIn: ["CANCELLED"] }
        },
        select: { createdAt: true }
      }).catch(() => [])
    ]);

    if (loyaltyAccount) {
      loyaltyPoints = loyaltyAccount.balance;
      // Calculate points needed for ₹50 off: ₹50 / pointValueRupees
      nextRewardAt = Math.ceil(50 / loyaltyConfig.pointValueRupees);
    }

    // Calculate order streak: count distinct ISO weeks with orders
    if (recentOrders.length > 0) {
      const weeks = new Set(
        recentOrders.map((o) => {
          const d = new Date(o.createdAt);
          // Get ISO week number
          const temp = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          temp.setDate(temp.getDate() + 3 - ((temp.getDay() + 6) % 7));
          const week1 = new Date(temp.getFullYear(), 0, 4);
          const weekNum = 1 + Math.round(((temp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
          return `${temp.getFullYear()}-W${weekNum}`;
        })
      );
      orderStreak = weeks.size;
    }
  }

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
  // AnimatedCategories falls back to built-in Lucide icons; no emoji fallback needed
  const categoryIcons: Record<string, string> = dbCategories.length > 0
    ? Object.fromEntries(dbCategories.filter((c) => c.icon).map((c) => [c.name, c.icon as string]))
    : {};

  const trending = [...allProducts].sort((a, b) => b.popularity - a.popularity).slice(0, 12);
  const offers = allProducts.filter((p) => p.discountPrice).slice(0, 8);
  const featuredProducts = allProducts.filter((p) => p.isFeatured);

  const heroImage = banner?.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1800&auto=format&fit=crop";
  const heroTitle = banner?.title || "Fresh Groceries Delivered Fast";
  const heroHref = banner?.href || "/products";

  return (
    <main className="min-h-[100dvh] bg-background">
      {/* SEO structured data — Organization + WebSite with SearchAction */}
      <StructuredData data={[organizationSchema(), websiteSchema()]} />

      {/* Location prompt — shown on first visit if no saved location */}
      <LocationPrompt />

      {/* Hero Section — GSAP parallax */}
      <HeroSection
        storeName={settings.storeName}
        heroImage={heroImage}
        heroTitle={heroTitle}
        heroHref={heroHref}
        deliveryRadiusKm={settings.deliveryRadiusKm}
        deliveryEstimateMin={settings.deliveryEstimateMin}
        deliveryEstimateMax={settings.deliveryEstimateMax}
      />

      {/* Search entry — below hero so the value prop lands first */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-4">
        <HomeSearch products={allProducts.slice(0, 20)} />
      </div>

      {/* Infinite marquee — trust signals */}
      <div className="py-3 border-y border-[var(--border-subtle)]">
        <InfiniteMarquee speed={35} className="text-caption font-semibold text-neutral-500 dark:text-neutral-400">
          <span>Free delivery over ₹499</span>
          <span className="text-secondary-500">*</span>
          <span>COD &amp; UPI on delivery</span>
          <span className="text-secondary-500">*</span>
          <span>Fresh from farm to door</span>
          <span className="text-secondary-500">*</span>
          <span>~{settings.deliveryEstimateMin}-{settings.deliveryEstimateMax} min delivery</span>
          <span className="text-secondary-500">*</span>
          <span>100% quality guaranteed</span>
          <span className="text-secondary-500">*</span>
        </InfiniteMarquee>
      </div>

      {/* Loyalty progress + order streak for logged-in users */}
      {session?.user?.id && (loyaltyPoints > 0 || orderStreak >= 2) && (
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            {loyaltyPoints > 0 && (
              <div className="flex-1">
                <LoyaltyProgressBar points={loyaltyPoints} nextRewardAt={nextRewardAt} />
              </div>
            )}
            <OrderStreak weekCount={orderStreak} />
          </div>
        </div>
      )}

      {/* Promo banners — admin-managed, unified glass cards */}
      <PromoBanners banners={promoBanners} />

      {/* Recent Orders — hidden when empty */}
      <RecentOrdersSection />

      {/* Popular Categories — GSAP staggered reveal */}
      <AnimatedCategories
        categories={categories}
        categoryImages={categoryImages}
        categoryIcons={categoryIcons}
        allProducts={allProducts}
      />

      {/* Trending This Week */}
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

      {/* On Sale Today — only when discounts exist */}
      {offers.length > 0 && (
        <div className="cv-auto">
          <AnimatedProductSection
            title="On Sale Today"
            subtitle="Limited-time discounts you don&apos;t want to miss"
            icon={<Zap className="h-5 w-5 text-amber-500" />}
            products={offers}
            layout="grid"
          />
        </div>
      )}

      {/* Staff Picks — only when featured products exist */}
      {featuredProducts.length > 0 && (
        <div className="cv-auto">
          <AnimatedProductSection
            title="Staff Picks"
            subtitle="Our featured favourites of the week"
            icon={<Star className="h-5 w-5 text-amber-500" />}
            products={featuredProducts}
            layout="grid"
          />
        </div>
      )}

      {/* Final CTA row — browse all, no duplicate grid */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-8 md:pt-12 pb-6 md:pb-8">
        <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-8 md:p-12 text-center">
          <h2 className="section-title text-2xl md:text-3xl">Hungry for more?</h2>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
            Browse our full catalogue of {allProducts.length} fresh products.
          </p>
          <Link
            href="/products"
            className="show-all-pill mt-6 inline-flex"
          >
            Browse all products
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
