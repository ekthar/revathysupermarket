import Link from "next/link";
import { unstable_cache } from "next/cache";
import { ChevronRight, Sparkles, TrendingUp, Zap } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { HomeSearch } from "@/components/home/home-search";
import { categories, products } from "@/lib/products";
import { prisma } from "@/lib/prisma";
import { getPublicStoreSettings } from "@/lib/store-settings";
import type { Product } from "@/lib/types";

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
    take: 60
  }).catch(() => []),
  ["homepage-products"],
  { revalidate: 60, tags: ["homepage", "products"] }
);

const categoryIcons: Record<string, string> = {
  Fruits: "🍎", Vegetables: "🥬", Dairy: "🥛", Beverages: "🧃", Snacks: "🍿",
  Household: "🧹", "Personal Care": "🧴", "Frozen Foods": "🧊", "Grocery Essentials": "🍚"
};

export default async function HomePage() {
  const [settings, banner, dbProducts] = await Promise.all([
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

  const trending = [...allProducts].sort((a, b) => b.popularity - a.popularity).slice(0, 12);
  const offers = allProducts.filter((p) => p.discountPrice).slice(0, 8);
  const featured = allProducts.filter((p) => p.isFeatured).slice(0, 8);

  const heroImage = banner?.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1800&auto=format&fit=crop";
  const heroTitle = banner?.title || "Fresh Groceries Delivered Fast";
  const heroHref = banner?.href || "/products";

  return (
    <main className="min-h-screen bg-white">
      {/* Search */}
      <HomeSearch products={allProducts} />

      {/* Hero banner */}
      <section className="px-4 pt-3 pb-1">
        <Link href={heroHref} className="block relative overflow-hidden rounded-2xl aspect-[2.2/1] press">
          <img src={heroImage} alt={heroTitle} className="h-full w-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <span className="inline-block text-[10px] font-semibold text-white/90 bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5 mb-1.5">
              {settings.deliveryRadiusKm} KM delivery
            </span>
            <h2 className="text-[17px] font-bold text-white leading-snug">{heroTitle}</h2>
          </div>
        </Link>
      </section>

      {/* Categories grid */}
      <section className="px-4 pt-5">
        <SectionHeader title="What are you looking for?" />
        <div className="grid grid-cols-4 gap-2 mt-3 sm:grid-cols-5 lg:grid-cols-9">
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/products?category=${encodeURIComponent(cat)}`}
              className="flex flex-col items-center gap-1.5 rounded-xl bg-slate-50 py-3 px-1 press hover:bg-slate-100 transition-colors"
            >
              <span className="text-2xl leading-none">{categoryIcons[cat] ?? "🛒"}</span>
              <span className="text-[10px] font-medium text-slate-600 text-center leading-tight line-clamp-1">{cat}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Offers section */}
      {offers.length > 0 && (
        <section className="pt-6">
          <div className="px-4">
            <SectionHeader title="Today's Offers" icon={<Zap className="h-4 w-4 text-orange-500" />} href="/products" />
          </div>
          <div className="flex gap-2.5 overflow-x-auto px-4 mt-3 pb-2 no-scrollbar scroll-x">
            {offers.map((p) => (
              <div key={p.id} className="w-[150px] shrink-0 sm:w-[170px]">
                <ProductCard product={p} compact />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trending section */}
      <section className="pt-6">
        <div className="px-4">
          <SectionHeader title="Trending Now" icon={<TrendingUp className="h-4 w-4 text-primary" />} href="/products" />
        </div>
        <div className="flex gap-2.5 overflow-x-auto px-4 mt-3 pb-2 no-scrollbar scroll-x">
          {trending.map((p) => (
            <div key={p.id} className="w-[150px] shrink-0 sm:w-[170px]">
              <ProductCard product={p} compact />
            </div>
          ))}
        </div>
      </section>

      {/* Featured picks */}
      {featured.length > 0 && (
        <section className="px-4 pt-6">
          <SectionHeader title="Featured Picks" icon={<Sparkles className="h-4 w-4 text-yellow-500" />} href="/products" />
          <div className="grid grid-cols-2 gap-2.5 mt-3 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* All products */}
      <section className="px-4 pt-6 pb-6">
        <SectionHeader title="All Products" href="/products" />
        <div className="grid grid-cols-2 gap-2.5 mt-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {allProducts.slice(0, 20).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        {allProducts.length > 20 && (
          <Link href="/products" className="mt-4 flex h-11 items-center justify-center rounded-xl border border-slate-200 text-[13px] font-semibold text-primary press">
            View all {allProducts.length} products
          </Link>
        )}
      </section>
    </main>
  );
}

function SectionHeader({ title, icon, href }: { title: string; icon?: React.ReactNode; href?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        {icon}
        <h2 className="text-[15px] font-bold text-slate-900">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="flex items-center text-[12px] font-medium text-primary">
          See all <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
