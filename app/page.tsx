import Link from "next/link";
import { unstable_cache } from "next/cache";
import { ChevronRight } from "lucide-react";
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
  async () => prisma.banner.findFirst({ where: { isActive: true }, orderBy: { createdAt: "desc" }, select: { title: true, subtitle: true, image: true, href: true } }).catch(() => null),
  ["homepage-banner"],
  { revalidate: 60, tags: ["homepage", "banners"] }
);

const getHomepageProducts = unstable_cache(
  async () => prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, name: true, description: true, image: true, price: true, discountPrice: true, stock: true, popularity: true, unit: true, isFeatured: true, createdAt: true, category: { select: { name: true } } },
    orderBy: [{ popularity: "desc" }, { createdAt: "desc" }],
    take: 50
  }).catch(() => []),
  ["homepage-products"],
  { revalidate: 60, tags: ["homepage", "products"] }
);

const categoryIcons: Record<string, string> = {
  Fruits: "🍎", Vegetables: "🥬", Dairy: "🥛", Beverages: "🧃", Snacks: "🍿",
  Household: "🧹", "Personal Care": "🧴", "Frozen Foods": "🧊", "Grocery Essentials": "🍚"
};

export default async function HomePage() {
  const [settings, activeBanner, dbProducts] = await Promise.all([
    getPublicStoreSettings(),
    getHomepageBanner(),
    getHomepageProducts()
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

  const trending = [...allProducts].sort((a, b) => b.popularity - a.popularity).slice(0, 10);
  const heroImage = activeBanner?.image || defaultHeroImage;
  const heroTitle = activeBanner?.title || "Fresh Groceries Delivered Fast";
  const heroHref = activeBanner?.href || "/products";

  return (
    <main className="min-h-screen">
      {/* Search */}
      <HomeSearch products={allProducts} />

      {/* Banner */}
      <HomeHero
        title={heroTitle}
        subtitle=""
        href={heroHref}
        image={heroImage}
        deliveryRadiusKm={settings.deliveryRadiusKm}
        gstEnabled={false}
      />

      {/* Categories */}
      <section className="px-4 pt-5 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900">What are you looking for?</h2>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-9">
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/products?category=${encodeURIComponent(cat)}`}
              className="flex flex-col items-center gap-1 rounded-lg bg-slate-50 py-3 px-1 active:scale-95 transition"
            >
              <span className="text-xl">{categoryIcons[cat] ?? "🛒"}</span>
              <span className="text-[10px] font-medium text-slate-600 text-center leading-tight">{cat}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending horizontal */}
      <section className="mt-4">
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="text-base font-bold text-slate-900">Trending</h2>
          <Link href="/products" className="flex items-center text-xs font-medium text-primary">
            See all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="flex gap-2.5 overflow-x-auto px-4 pb-3 no-scrollbar">
          {trending.map((p) => (
            <div key={p.id} className="w-[140px] shrink-0 sm:w-[160px]">
              <ProductCard product={p} compact />
            </div>
          ))}
        </div>
      </section>

      {/* All products grid */}
      <section className="px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900">All Products</h2>
          <Link href="/products" className="flex items-center text-xs font-medium text-primary">
            View all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {allProducts.slice(0, 16).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </main>
  );
}
