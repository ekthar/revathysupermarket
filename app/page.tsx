import Link from "next/link";
import { unstable_cache } from "next/cache";
import { ArrowRight, Bike, MapPin, PackageCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { HomeHero } from "@/components/home/home-hero";
import { HomeSearch } from "@/components/home/home-search";
import { categories, products } from "@/lib/products";
import { prisma } from "@/lib/prisma";
import { getPublicStoreSettings } from "@/lib/store-settings";
import type { Product } from "@/lib/types";

const defaultHeroImage = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1800&auto=format&fit=crop";

export const revalidate = 60;

const getHomepageBanner = unstable_cache(
  async () =>
    prisma.banner.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: { title: true, subtitle: true, image: true, href: true }
    }).catch(() => null),
  ["homepage-banner"],
  { revalidate: 60, tags: ["homepage", "banners"] }
);

const getHomepageProducts = unstable_cache(
  async () =>
    prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        image: true,
        price: true,
        discountPrice: true,
        stock: true,
        popularity: true,
        unit: true,
        isFeatured: true,
        createdAt: true,
        category: { select: { name: true } }
      },
      orderBy: [{ popularity: "desc" }, { createdAt: "desc" }],
      take: 40
    }).catch(() => []),
  ["homepage-products"],
  { revalidate: 60, tags: ["homepage", "products"] }
);

const categoryIcons: Record<string, string> = {
  Fruits: "🍎",
  Vegetables: "🥬",
  Dairy: "🥛",
  Beverages: "🧃",
  Snacks: "🍿",
  Household: "🧹",
  "Personal Care": "🧴",
  "Frozen Foods": "🧊",
  "Grocery Essentials": "🍚"
};

export default async function HomePage() {
  const [settings, activeBanner, dbProducts] = await Promise.all([
    getPublicStoreSettings(),
    getHomepageBanner(),
    getHomepageProducts()
  ]);

  const mappedProducts: Product[] = dbProducts.length > 0
    ? dbProducts.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        category: p.category.name as Product["category"],
        price: Number(p.price),
        discountPrice: p.discountPrice ? Number(p.discountPrice) : undefined,
        image: p.image,
        description: p.description,
        stock: p.stock,
        popularity: p.popularity,
        unit: p.unit,
        isFeatured: p.isFeatured
      }))
    : products;

  const featured = mappedProducts.filter((p) => p.isFeatured).slice(0, 8);
  const trending = [...mappedProducts].sort((a, b) => b.popularity - a.popularity).slice(0, 12);

  const heroImage = activeBanner?.image || defaultHeroImage;
  const heroTitle = activeBanner?.title || "Fresh Groceries Delivered To Your Doorstep";
  const heroSubtitle = activeBanner?.subtitle || "Premium fruits, vegetables, dairy, snacks, and essentials. Pay by COD or UPI on delivery.";
  const heroHref = activeBanner?.href || "/products";

  return (
    <main>
      {/* Hero */}
      <HomeHero
        title={heroTitle}
        subtitle={heroSubtitle}
        href={heroHref}
        image={heroImage}
        deliveryRadiusKm={settings.deliveryRadiusKm}
        gstEnabled={settings.gstRatePercent > 0 || Boolean(settings.gstin)}
      />

      {/* Search bar (sticky) */}
      <HomeSearch products={mappedProducts} />

      {/* USP strip */}
      <section className="border-b border-slate-100 dark:border-white/5">
        <div className="mx-auto flex max-w-7xl gap-3 overflow-x-auto px-4 py-4 no-scrollbar snap-scroll sm:justify-center sm:gap-6">
          {[
            { icon: Bike, text: `${settings.deliveryRadiusKm} KM Delivery` },
            { icon: ShieldCheck, text: "Pay on Delivery" },
            { icon: PackageCheck, text: "Freshly Packed" }
          ].map((item) => (
            <div key={item.text} className="flex shrink-0 snap-start items-center gap-2 rounded-xl bg-primary/5 px-3.5 py-2.5 text-xs font-semibold text-primary dark:bg-primary/10">
              <item.icon className="h-4 w-4" />
              {item.text}
            </div>
          ))}
        </div>
      </section>

      {/* Categories - horizontal scroll */}
      <section className="px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white sm:text-xl">Shop by Category</h2>
            <Link href="/products" className="text-xs font-semibold text-primary">See all</Link>
          </div>
          <div className="no-scrollbar snap-scroll -mx-4 mt-4 flex gap-3 overflow-x-auto px-4">
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/products?category=${encodeURIComponent(cat)}`}
                className="flex shrink-0 snap-start flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-3.5 shadow-sm transition active:scale-[0.97] dark:border-white/10 dark:bg-white/5"
              >
                <span className="text-2xl">{categoryIcons[cat] ?? "🛒"}</span>
                <span className="whitespace-nowrap text-[11px] font-semibold text-slate-700 dark:text-white">{cat}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trending - horizontal scroll */}
      {trending.length > 0 && (
        <section className="px-4 pb-6 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white sm:text-xl">Trending Now</h2>
              <Link href="/products" className="text-xs font-semibold text-primary">View all</Link>
            </div>
            <div className="no-scrollbar snap-scroll -mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pb-2">
              {trending.map((product) => (
                <div key={product.id} className="w-[160px] shrink-0 snap-start sm:w-[200px]">
                  <ProductCard product={product} compact />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured products grid */}
      {featured.length > 0 && (
        <section className="bg-slate-50/70 px-4 py-6 dark:bg-white/[0.02] sm:px-6 sm:py-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white sm:text-xl">Featured Picks</h2>
              <Link href="/products" className="text-xs font-semibold text-primary">See all</Link>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:gap-4">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All products grid */}
      <section className="px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white sm:text-xl">All Products</h2>
            <Button asChild variant="outline" size="sm" className="rounded-lg text-xs">
              <Link href="/products">
                View All
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:gap-4">
            {mappedProducts.slice(0, 12).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Store info */}
      <section className="border-t border-slate-100 bg-slate-50/70 px-4 py-8 dark:border-white/5 dark:bg-white/[0.02] sm:px-6">
        <div className="mx-auto max-w-7xl text-center">
          <MapPin className="mx-auto h-6 w-6 text-primary" />
          <h2 className="mt-3 font-display text-lg font-bold text-slate-900 dark:text-white">Revathy Supermarket</h2>
          <p className="mt-1 text-sm text-slate-500">Neyyattinkara, Kerala</p>
          <p className="mt-2 text-xs text-slate-400">Delivery within {settings.deliveryRadiusKm} KM · COD & UPI on delivery</p>
        </div>
      </section>
    </main>
  );
}
