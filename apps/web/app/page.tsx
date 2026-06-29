import Link from "next/link";
import Image from "next/image";
import { unstable_cache } from "next/cache";
import { ChevronRight, ChevronUp, Sparkles, TrendingUp, Zap } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { StoryBanners } from "@/components/home/story-banners";
import { LightningDeals } from "@/components/home/lightning-deals";
import { RecentOrdersSection } from "@/components/home/recent-orders-section";
import { HeroSection } from "@/components/home/hero-section";
import { AnimatedCategories } from "@/components/home/animated-categories";
import { AnimatedProductSection } from "@/components/home/animated-product-section";
import { HomeSearch } from "@/components/home/home-search";
import { LiveOrderBanner } from "@/components/tracking/live-order-banner";
import { categories, products } from "@/lib/products";
import { prisma } from "@/lib/prisma";
import { getPublicStoreSettings } from "@/lib/store-settings";
import type { Product } from "@/lib/types";
import { auth } from "@/auth";
import { getActiveOrderSummary } from "@/lib/live-order";

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

const categoryImages: Record<string, string> = {
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

const categoryColors: Record<string, string> = {
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

const categoryIcons: Record<string, string> = {
  Fruits: "\ud83c\udf4e", Vegetables: "\ud83e\udd2c", Dairy: "\ud83e\udd5b", Beverages: "\ud83e\uddc3", Snacks: "\ud83c\udf7f",
  Household: "\ud83e\uddf9", "Personal Care": "\ud83e\uddf4", "Frozen Foods": "\ud83e\uddc6", "Grocery Essentials": "\ud83c\udf5a"
};

export default async function HomePage() {
  const session = await auth();
  const [settings, banner, dbProducts, promoBanners, activeOrder] = await Promise.all([
    getPublicStoreSettings(),
    getHomepageBanner(),
    getHomepageProducts(),
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

  const trending = [...allProducts].sort((a, b) => b.popularity - a.popularity).slice(0, 12);
  const offers = allProducts.filter((p) => p.discountPrice).slice(0, 8);
  const featured = allProducts.filter((p) => p.isFeatured).slice(0, 8);
  const freshPicks = [...allProducts].sort(() => Math.random() - 0.5).slice(0, 10);

  const heroImage = banner?.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1800&auto=format&fit=crop";
  const heroTitle = banner?.title || "Fresh Groceries Delivered Fast";
  const heroHref = banner?.href || "/products";

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <HomeSearch products={allProducts} />

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

      {/* Story Banners — Swiggy-level full-bleed carousel with countdown + coupon copy */}
      <StoryBanners banners={promoBanners.map((b) => ({
        ...b,
        endsAt: null,
        couponCode: null,
        badge: null,
      }))} />

      {/* Lightning Deals — products with discount, urgency stock bar */}
      {offers.length > 0 && (
        <LightningDeals
          deals={offers.slice(0, 10).map((p) => ({
            product: p,
            discountPercent: p.discountPrice ? Math.round(((p.price - p.discountPrice) / p.price) * 100) : 0,
            stockSoldPercent: Math.max(20, Math.min(95, 100 - Math.round((p.stock / Math.max(p.stock + p.popularity, 1)) * 100))),
            expiresAt: null,
          }))}
        />
      )}

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

      {/* Weekly Best Selling Items */}
      <AnimatedProductSection
        title="Weekly Best Selling Items"
        products={trending.slice(0, 8)}
        showCategoryPills
        categoryPills={["Fresh Vegetables", "Fruits", "Dairy & Eggs", "Bakery", "Meat & Fish", "Beverages"]}
        categories={categories}
      />

      {/* Just for you / Today's Offers */}
      {offers.length > 0 && (
        <AnimatedProductSection
          title="Just for you"
          icon={<Zap className="h-5 w-5 text-orange-500" />}
          products={offers}
        />
      )}

      {/* Most Selling Products - Desktop grid */}
      <AnimatedProductSection
        title="Most Selling Products"
        icon={<TrendingUp className="h-5 w-5 text-primary" />}
        products={trending.slice(0, 10)}
        layout="grid"
        desktopOnly
      />

      {/* Today's Fresh Picks */}
      <AnimatedProductSection
        title="Today's Fresh Picks"
        icon={<Sparkles className="h-5 w-5 text-yellow-500" />}
        products={freshPicks}
        layout="mixed"
      />

      {/* All Products with side banner - Desktop */}
      <section className="hidden md:block max-w-7xl mx-auto px-6 lg:px-8 pt-12">
        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">All Products</h2>
              <Link href="/products" className="text-sm font-semibold text-primary flex items-center gap-1">
                View all {allProducts.length} products <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <AnimatedProductSection
              title=""
              products={allProducts.slice(0, 12)}
              layout="grid"
              hideHeader
            />
          </div>

          {/* Side banner */}
          <div className="hidden lg:block">
            <div className="sticky top-[90px] rounded-3xl overflow-hidden aspect-[3/4] relative">
              <Image
                src="https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=600&h=800&fit=crop"
                alt="Fresh Fruits & Vegetables"
                fill
                sizes="380px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="font-display text-2xl font-black text-white leading-tight">
                  Fresh Fruits & Vegetables. Delivered Daily.
                </h3>
                <p className="mt-2 text-sm text-white/80">
                  We deliver everything you need straight to your door.
                </p>
                <Link href="/products?category=Fruits" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-white rounded-full text-sm font-bold text-neutral-900 press">
                  Shop Fresh Produce
                  <ChevronUp className="h-3.5 w-3.5 rotate-90" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile: All products grid */}
      <section className="px-4 pt-6 pb-6 md:hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-title font-bold text-neutral-900 dark:text-white">All Products</h2>
          <Link href="/products" className="flex items-center text-caption font-medium text-primary">
            See all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2.5 mt-3">
          {allProducts.slice(0, 12).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        {allProducts.length > 12 && (
          <Link href="/products" className="mt-4 flex h-11 items-center justify-center rounded-xl border border-neutral-200 text-body font-semibold text-primary press">
            View all {allProducts.length} products
          </Link>
        )}
      </section>

      {/* Footer - Desktop */}
      <footer className="hidden md:block border-t border-neutral-100 dark:border-neutral-800 mt-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid grid-cols-4 gap-8">
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
                <li><Link href="/products" className="text-sm text-neutral-500 hover:text-neutral-700">About Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white">Help</h4>
              <ul className="mt-3 space-y-2">
                <li><Link href="/products" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">Help Center</Link></li>
                <li><Link href="/products" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">Return Policy</Link></li>
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
