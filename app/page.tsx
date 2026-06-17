import Link from "next/link";
import { unstable_cache } from "next/cache";
import { Bike, MapPin, MessageCircle, PackageCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/product-card";
import { LocationMap } from "@/components/location-map";
import { HomeHero } from "@/components/home/home-hero";
import { HomeSearch } from "@/components/home/home-search";
import { HowItWorksCard, MotionCategoryCard, RevealSection } from "@/components/home/home-motion";
import { categories, products } from "@/lib/products";
import { prisma } from "@/lib/prisma";
import { getPublicStoreSettings } from "@/lib/store-settings";
import type { Product } from "@/lib/types";

const bestSellers = products.sort((a, b) => b.popularity - a.popularity).slice(0, 8);
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

const getHomepageFeaturedProducts = unstable_cache(
  async () =>
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
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
        category: { select: { name: true } }
      },
      orderBy: [{ popularity: "desc" }, { createdAt: "desc" }],
      take: 8
    }).catch(() => []),
  ["homepage-featured-products"],
  { revalidate: 60, tags: ["homepage", "products"] }
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
      take: 24
    }).catch(() => []),
  ["homepage-products"],
  { revalidate: 60, tags: ["homepage", "products"] }
);

const categoryAccents = [
  "bg-primary/10 text-primary ring-primary/5",
  "bg-lime-fresh/25 text-primary ring-lime-fresh/10",
  "bg-berry-50 text-berry-700 ring-berry-100",
  "bg-sky-50 text-sky-700 ring-sky-100",
  "bg-amber-50 text-amber-700 ring-amber-100"
];

function dateString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

export default async function HomePage() {
  const [settings, activeBanner, dbFeatured, dbProducts] = await Promise.all([
    getPublicStoreSettings(),
    getHomepageBanner(),
    getHomepageFeaturedProducts(),
    getHomepageProducts()
  ]);

  const mappedProducts = dbProducts.length > 0
    ? dbProducts.map((product) => ({
        id: product.id,
        slug: product.slug,
        name: product.name,
        category: product.category.name as Product["category"],
        price: Number(product.price),
        discountPrice: product.discountPrice ? Number(product.discountPrice) : undefined,
        image: product.image,
        description: product.description,
        stock: product.stock,
        popularity: product.popularity,
        unit: product.unit,
        isFeatured: product.isFeatured,
        createdAt: dateString(product.createdAt)
      }))
    : products;

  const featuredProducts = dbFeatured.length > 0
    ? dbFeatured.map((product) => ({
        id: product.id,
        slug: product.slug,
        name: product.name,
        category: product.category.name as Product["category"],
        price: Number(product.price),
        discountPrice: product.discountPrice ? Number(product.discountPrice) : undefined,
        image: product.image,
        description: product.description,
        stock: product.stock,
        popularity: product.popularity,
        unit: product.unit,
        isFeatured: product.isFeatured
      }))
    : mappedProducts.sort((a, b) => b.popularity - a.popularity).slice(0, 8);
  const trendingProducts = [...mappedProducts].sort((a, b) => b.popularity - a.popularity).slice(0, 10);
  const justAddedProducts = [...mappedProducts].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()).slice(0, 8);

  const heroImage = activeBanner?.image || defaultHeroImage;
  const heroTitle = activeBanner?.title || "Fresh Groceries Delivered To Your Doorstep";
  const heroSubtitle = activeBanner?.subtitle || "Premium fruits, vegetables, dairy, snacks, and essentials from Revathy Supermarket. Pay safely by COD or UPI on delivery.";
  const heroHref = activeBanner?.href || "/products";

  return (
    <main>
      <HomeHero
        title={heroTitle}
        subtitle={heroSubtitle}
        href={heroHref}
        image={heroImage}
        deliveryRadiusKm={settings.deliveryRadiusKm}
        gstEnabled={settings.gstRatePercent > 0 || Boolean(settings.gstin)}
      />
      <HomeSearch products={mappedProducts} />

      <RevealSection className="relative mx-auto -mt-20 grid max-w-7xl gap-3 px-4 pb-10 sm:px-6 md:grid-cols-3 lg:px-8">
        {[
          { icon: Bike, title: `${settings.deliveryRadiusKm} KM Delivery`, text: "Fast local delivery from Neyyattinkara." },
          { icon: ShieldCheck, title: "Pay on Delivery", text: "Choose COD or UPI when groceries arrive." },
          { icon: PackageCheck, title: "Manual Care", text: "Store staff verify, pack, and process every order." }
        ].map((item) => (
          <div key={item.title} className="flex items-center gap-4 rounded-[1.5rem] border border-emerald-100 bg-white/95 p-4 text-slate-950 shadow-premium backdrop-blur md:block md:p-5 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:shadow-[0_24px_70px_-34px_rgba(0,0,0,0.9)]">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 dark:bg-emerald-400/12">
              <item.icon className="h-6 w-6 text-primary" />
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-slate-950 md:mt-4 md:text-xl dark:text-white">{item.title}</h2>
              <p className="mt-1 text-xs leading-5 text-slate-600 md:mt-2 md:text-sm dark:text-white/70">{item.text}</p>
            </div>
          </div>
        ))}
      </RevealSection>

      <RevealSection className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="flex items-end justify-between gap-5">
          <div>
            <Badge>Featured categories</Badge>
            <h2 className="mt-3 font-display text-3xl font-black leading-tight">Shop by aisle</h2>
          </div>
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link href="/products">All products</Link>
          </Button>
        </div>
        <div className="no-scrollbar -mx-4 mt-6 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 md:grid-cols-3 lg:grid-cols-5">
          {categories.map((category, index) => (
            <MotionCategoryCard
              key={category}
              category={category}
              href={`/products?category=${encodeURIComponent(category)}`}
              accent={categoryAccents[index % categoryAccents.length]}
            />
          ))}
        </div>
      </RevealSection>

      <RevealSection className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-5">
          <div>
            <Badge>Trending now</Badge>
            <h2 className="mt-3 font-display text-3xl font-black leading-tight">Popular in your store</h2>
          </div>
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link href="/products">Shop all</Link>
          </Button>
        </div>
        <div className="no-scrollbar -mx-4 mt-6 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          {trendingProducts.map((product) => (
            <div key={product.id} className="w-[172px] shrink-0 snap-start sm:w-[220px]">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </RevealSection>

      <RevealSection className="bg-[linear-gradient(180deg,rgba(15,138,95,0.07),rgba(167,209,41,0.08))] py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-5">
            <div>
              <Badge>Featured products</Badge>
              <h2 className="mt-3 font-display text-3xl font-black leading-tight">Picked by the store</h2>
            </div>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </RevealSection>

      <RevealSection className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="flex items-end justify-between gap-5">
          <div>
            <Badge>Just added</Badge>
            <h2 className="mt-3 font-display text-3xl font-black leading-tight">Freshly stocked picks</h2>
          </div>
        </div>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {justAddedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </RevealSection>

      <RevealSection className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 sm:py-14 lg:grid-cols-2 lg:px-8">
        <div className="space-y-6">
          <Badge>How ordering works</Badge>
          <h2 className="font-display text-3xl font-black leading-tight">Fast grocery ordering with store staff care</h2>
          {[
            { icon: "shopping" as const, title: "Choose groceries", text: "Browse categories, featured picks, and local essentials made for mobile shopping." },
            { icon: "location" as const, title: `${settings.deliveryRadiusKm} KM verified delivery`, text: "Checkout checks serviceable pincode and live GPS before the order is submitted." },
            { icon: "payment" as const, title: "Pay on delivery", text: "No online payment gateway. Pay by COD or UPI when groceries arrive." },
            { icon: "receipt" as const, title: settings.gstRatePercent > 0 ? "GST bill available" : "Clean order bill", text: settings.gstin ? `Bills include GSTIN ${settings.gstin}.` : "Every order gets a downloadable bill and print/PDF option." }
          ].map((item, index) => (
            <HowItWorksCard key={item.title} {...item} index={index} />
          ))}
        </div>
        <div className="space-y-5">
          <Badge>Visit us</Badge>
          <h2 className="font-display text-3xl font-black leading-tight">Revathy Supermarket, Neyyattinkara</h2>
          <p className="text-muted-foreground">
            Delivery is currently available only within {settings.deliveryRadiusKm} KM of the store. The checkout automatically validates distance before submitting an order.
          </p>
          <div className="rounded-[1.75rem] border border-white/70 bg-card/95 p-4 shadow-soft dark:border-white/10">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </span>
              <div>
                <p className="font-black">Delivery radius</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  We currently deliver only within {settings.deliveryRadiusKm} KM of Revathy Supermarket. Checkout validates your location before placing the order.
                </p>
              </div>
            </div>
          </div>
          <div className="h-96 overflow-hidden rounded-[1.75rem] border border-white/70 shadow-soft dark:border-white/10">
            <LocationMap deliveryRadiusKm={settings.deliveryRadiusKm} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button asChild className="h-12 rounded-2xl">
              <a href={settings.googleMapsUrl || "https://www.google.com/maps/search/?api=1&query=Revathy%20Supermarket%20Neyyattinkara"} target="_blank" rel="noreferrer">
                <MapPin className="h-4 w-4" /> Get directions
              </a>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-2xl">
              <a href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4" /> WhatsApp store
              </a>
            </Button>
          </div>
        </div>
      </RevealSection>
    </main>
  );
}
