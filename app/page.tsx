import Link from "next/link";
import { unstable_cache } from "next/cache";
import { ChevronRight, ChevronUp, Sparkles, TrendingUp, Zap } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { HomeSearch } from "@/components/home/home-search";
import { PromoBanners } from "@/components/home/promo-banners";
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
  Vegetables: "bg-green-50",
  Dairy: "bg-blue-50",
  Beverages: "bg-yellow-50",
  Snacks: "bg-pink-50",
  Household: "bg-purple-50",
  "Personal Care": "bg-rose-50",
  "Frozen Foods": "bg-cyan-50",
  "Grocery Essentials": "bg-amber-50"
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
  const freshPicks = [...allProducts].sort(() => Math.random() - 0.5).slice(0, 10);

  const heroImage = banner?.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1800&auto=format&fit=crop";
  const heroTitle = banner?.title || "Fresh Groceries Delivered Fast";
  const heroHref = banner?.href || "/products";

  return (
    <main className="min-h-screen bg-white">
      {/* Mobile Search */}
      <HomeSearch products={allProducts} />

      {/* Hero Section - Desktop */}
      <section className="hidden md:block relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-2 gap-8 items-center">
            {/* Left: Text content */}
            <div>
              <h1 className="font-display text-5xl lg:text-6xl xl:text-7xl font-black leading-[0.95] tracking-tight text-slate-900">
                {settings.storeName}
              </h1>
              <p className="mt-5 text-lg text-slate-600 max-w-md leading-relaxed">
                Shop from thousands of farm-fresh fruits, vegetables, dairy and daily essentials at unbeatable prices.
              </p>
              <Link
                href={heroHref}
                className="show-all-pill mt-8 inline-flex"
              >
                Shop Now
                <ChevronUp className="h-4 w-4 rotate-90" />
              </Link>
            </div>

            {/* Right: Hero image */}
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden">
              <img
                src={heroImage}
                alt={heroTitle}
                className="h-full w-full object-cover"
                loading="eager"
              />
              {/* Floating product card */}
              <div className="absolute top-6 right-6 bg-white rounded-2xl p-3 shadow-lg max-w-[160px]">
                <img
                  src="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=120&h=80&fit=crop"
                  alt="Fresh Vegetables"
                  className="w-full h-16 object-cover rounded-xl"
                />
                <p className="mt-2 text-[11px] font-bold text-slate-800">Fresh Vegetables</p>
                <p className="text-[11px] font-bold text-primary">₹18.00</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero banner - Mobile */}
      <section className="px-4 pt-3 pb-1 md:hidden">
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

      {/* Mobile promo banners */}
      <PromoBanners />

      {/* Popular Categories - Desktop */}
      <section className="hidden md:block max-w-7xl mx-auto px-6 lg:px-8 pt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title">Popular Categories</h2>
          <Link href="/products" className="show-all-pill text-sm">
            Show All
            <ChevronUp className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.slice(0, 6).map((cat) => (
            <Link
              key={cat}
              href={`/products?category=${encodeURIComponent(cat)}`}
              className={`category-card ${categoryColors[cat] || "bg-slate-50"} p-4 flex flex-col items-center justify-center gap-3 press`}
            >
              <div className="w-16 h-16 rounded-2xl overflow-hidden">
                <img
                  src={categoryImages[cat] || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=200&fit=crop"}
                  alt={cat}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="text-center">
                <p className="text-[13px] font-bold text-slate-800">{cat}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {allProducts.filter((p) => p.category === cat).length} Products
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Categories grid - Mobile */}
      <section className="px-4 pt-5 md:hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-slate-900">What are you looking for?</h2>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-3 sm:grid-cols-5">
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

      {/* Weekly Best Selling Items */}
      <section className="pt-8 md:pt-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="section-title text-lg md:text-2xl">Weekly Best Selling Items</h2>
            <Link href="/products" className="show-all-pill text-xs md:text-sm">
              Show All
              <ChevronUp className="h-3 w-3 md:h-3.5 md:w-3.5" />
            </Link>
          </div>

          {/* Category filter pills */}
          <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar pb-1">
            {["Fresh Vegetables", "Fruits", "Dairy & Eggs", "Bakery", "Meat & Fish", "Beverages"].map((label, idx) => (
              <Link
                key={label}
                href={`/products?category=${encodeURIComponent(categories[idx] || label)}`}
                className={`shrink-0 px-4 py-2 rounded-full text-[12px] font-semibold transition-colors ${
                  idx === 0
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Product list - horizontal scroll */}
        <div className="flex gap-3 overflow-x-auto px-4 md:px-6 lg:px-8 mt-4 pb-2 no-scrollbar scroll-x max-w-7xl mx-auto">
          {trending.slice(0, 8).map((p) => (
            <div key={p.id} className="w-[155px] shrink-0 sm:w-[170px] md:w-[200px]">
              <ProductCard product={p} compact />
            </div>
          ))}
        </div>
      </section>

      {/* Just for you / Today's Offers */}
      {offers.length > 0 && (
        <section className="pt-8 md:pt-12">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                <h2 className="section-title text-lg md:text-2xl">Just for you</h2>
              </div>
              <Link href="/products" className="show-all-pill text-xs md:text-sm">
                Show All
                <ChevronUp className="h-3 w-3 md:h-3.5 md:w-3.5" />
              </Link>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 md:px-6 lg:px-8 mt-4 pb-2 no-scrollbar scroll-x max-w-7xl mx-auto">
            {offers.map((p) => (
              <div key={p.id} className="w-[155px] shrink-0 sm:w-[170px] md:w-[200px]">
                <ProductCard product={p} compact />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Most Selling Products - Desktop grid */}
      <section className="hidden md:block max-w-7xl mx-auto px-6 lg:px-8 pt-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="section-title">Most Selling Products</h2>
          </div>
          <Link href="/products" className="show-all-pill text-sm">
            Show All
            <ChevronUp className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {trending.slice(0, 10).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Today's Fresh Picks */}
      <section className="pt-8 md:pt-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <h2 className="section-title text-lg md:text-2xl">Today&apos;s Fresh Picks</h2>
            </div>
            <Link href="/products" className="show-all-pill text-xs md:text-sm">
              Show All
              <ChevronUp className="h-3 w-3 md:h-3.5 md:w-3.5" />
            </Link>
          </div>
        </div>

        {/* Desktop: 2-column grid layout */}
        <div className="hidden md:grid max-w-7xl mx-auto px-6 lg:px-8 mt-6 grid-cols-2 lg:grid-cols-4 gap-4">
          {freshPicks.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        {/* Mobile: horizontal scroll */}
        <div className="flex gap-3 overflow-x-auto px-4 mt-4 pb-2 no-scrollbar scroll-x md:hidden">
          {freshPicks.slice(0, 8).map((p) => (
            <div key={p.id} className="w-[155px] shrink-0 sm:w-[170px]">
              <ProductCard product={p} compact />
            </div>
          ))}
        </div>
      </section>

      {/* Fresh Fruits & Vegetables banner - Desktop sidebar style */}
      <section className="hidden md:block max-w-7xl mx-auto px-6 lg:px-8 pt-12">
        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          {/* Product grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">All Products</h2>
              <Link href="/products" className="text-sm font-semibold text-primary flex items-center gap-1">
                View all {allProducts.length} products <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {allProducts.slice(0, 12).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>

          {/* Side banner */}
          <div className="hidden lg:block">
            <div className="sticky top-[90px] rounded-3xl overflow-hidden aspect-[3/4] relative">
              <img
                src="https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=600&h=800&fit=crop"
                alt="Fresh Fruits & Vegetables"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="font-display text-2xl font-black text-white leading-tight">
                  Fresh Fruits & Vegetables. Delivered Daily.
                </h3>
                <p className="mt-2 text-sm text-white/80">
                  We deliver everything you need straight to your door.
                </p>
                <Link href="/products?category=Fruits" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-white rounded-full text-sm font-bold text-slate-900 press">
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
          <h2 className="text-[15px] font-bold text-slate-900">All Products</h2>
          <Link href="/products" className="flex items-center text-[12px] font-medium text-primary">
            See all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2.5 mt-3">
          {allProducts.slice(0, 12).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        {allProducts.length > 12 && (
          <Link href="/products" className="mt-4 flex h-11 items-center justify-center rounded-xl border border-slate-200 text-[13px] font-semibold text-primary press">
            View all {allProducts.length} products
          </Link>
        )}
      </section>

      {/* Footer - Desktop */}
      <footer className="hidden md:block border-t border-slate-100 mt-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid grid-cols-4 gap-8">
            <div>
              <h3 className="font-display text-lg font-black text-slate-900">{settings.storeName}</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Skip the long lines and heavy bags, we&apos;ll handle the delivery for you.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Main Pages</h4>
              <ul className="mt-3 space-y-2">
                <li><Link href="/" className="text-sm text-slate-500 hover:text-slate-700">Home</Link></li>
                <li><Link href="/products" className="text-sm text-slate-500 hover:text-slate-700">About Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Help</h4>
              <ul className="mt-3 space-y-2">
                <li><Link href="/products" className="text-sm text-slate-500 hover:text-slate-700">Help Center</Link></li>
                <li><Link href="/products" className="text-sm text-slate-500 hover:text-slate-700">Return Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Contact Information</h4>
              <ul className="mt-3 space-y-2">
                <li className="text-sm text-slate-500">{storeAddress || "Neyyattinkara, Kerala"}</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

const storeAddress = "Neyyattinkara, Kerala";
