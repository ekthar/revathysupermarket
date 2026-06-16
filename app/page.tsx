import Link from "next/link";
import { ArrowRight, Bike, Clock, CreditCard, MapPin, MessageCircle, ReceiptText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/product-card";
import { LocationMap } from "@/components/location-map";
import { categories, products } from "@/lib/products";
import { prisma } from "@/lib/prisma";
import { getStoreSettings } from "@/lib/store-settings";

const bestSellers = products.sort((a, b) => b.popularity - a.popularity).slice(0, 8);
const defaultHeroImage = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1800&auto=format&fit=crop";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, activeBanner, dbFeatured] = await Promise.all([
    getStoreSettings(),
    prisma.banner.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: { title: true, subtitle: true, image: true, href: true }
    }).catch(() => null),
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
    }).catch(() => [])
  ]);
  const featuredProducts = dbFeatured.length > 0
    ? dbFeatured.map((product) => ({
        id: product.id,
        slug: product.slug,
        name: product.name,
        category: product.category.name as (typeof products)[number]["category"],
        price: Number(product.price),
        discountPrice: product.discountPrice ? Number(product.discountPrice) : undefined,
        image: product.image,
        description: product.description,
        stock: product.stock,
        popularity: product.popularity,
        unit: product.unit,
        isFeatured: product.isFeatured
      }))
    : bestSellers;
  const heroImage = activeBanner?.image || defaultHeroImage;
  const heroTitle = activeBanner?.title || "Fresh Groceries Delivered To Your Doorstep";
  const heroSubtitle = activeBanner?.subtitle || "Premium fruits, vegetables, dairy, snacks, and essentials from Revathy Supermarket. Pay safely by COD or UPI on delivery.";
  const heroHref = activeBanner?.href || "/products";

  return (
    <main>
      <section className="relative overflow-hidden rounded-b-[2.5rem] sm:rounded-b-[4rem]">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${heroImage}")` }}>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.45),rgba(15,23,42,0.82)),linear-gradient(90deg,rgba(15,138,95,0.85),rgba(15,23,42,0.08))]" />
        </div>
        <div className="relative mx-auto flex min-h-[680px] max-w-7xl items-end px-4 pb-28 pt-16 sm:min-h-[calc(100vh-4rem)] sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-3xl text-white">
            <Badge className="bg-white/15 text-white shadow-sm backdrop-blur">Neyyattinkara delivery within {settings.deliveryRadiusKm} KM</Badge>
            <h1 className="mt-5 font-display text-[2.75rem] font-black leading-[0.98] sm:text-7xl">
              {heroTitle}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/85 sm:text-lg">
              {heroSubtitle}
            </p>
            <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
              <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
                <Link href={heroHref}>
                  Start shopping <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" className="w-full bg-white/10 text-white backdrop-blur hover:bg-white/20 sm:w-auto">
                <Link href="/cart">View cart</Link>
              </Button>
            </div>
            <div className="mt-7 grid grid-cols-3 gap-2 rounded-[1.5rem] border border-white/30 bg-white/16 p-2 backdrop-blur-xl">
              {[
                ["50+", "Products"],
                [`${settings.deliveryRadiusKm} KM`, "Delivery"],
                ["COD", "Payment"]
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl bg-white/18 px-3 py-3 text-center shadow-sm">
                  <p className="font-display text-lg font-black">{value}</p>
                  <p className="mt-1 text-[11px] font-bold text-white/70">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="relative mx-auto -mt-20 grid max-w-7xl gap-3 px-4 pb-10 sm:px-6 md:grid-cols-3 lg:px-8">
          {[
            { icon: Bike, title: `${settings.deliveryRadiusKm} KM Delivery`, text: "Fast local delivery from Neyyattinkara." },
            { icon: ShieldCheck, title: "Pay on Delivery", text: "Choose COD or UPI when groceries arrive." },
            { icon: Clock, title: "Manual Care", text: "Store staff verify, pack, and process every order." }
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-4 rounded-[1.5rem] border border-emerald-100 bg-white/95 p-4 text-slate-950 shadow-premium backdrop-blur md:block md:p-5 dark:border-white/10 dark:bg-slate-900/92 dark:text-white">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                <item.icon className="h-6 w-6 text-primary" />
              </span>
              <div>
                <h2 className="font-display text-base font-bold md:mt-4 md:text-xl">{item.title}</h2>
                <p className="mt-1 text-xs leading-5 text-slate-600 md:mt-2 md:text-sm dark:text-white/70">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
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
          {categories.map((category) => (
            <Link
              key={category}
              href={`/products?category=${encodeURIComponent(category)}`}
              className="min-w-[148px] snap-start rounded-[1.5rem] border border-white/70 bg-card/90 p-4 shadow-soft transition hover:-translate-y-1 hover:border-primary/40 dark:border-white/10 sm:min-w-0 sm:p-5"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 font-display text-lg font-black text-primary ring-8 ring-primary/5">
                {category.slice(0, 2)}
              </span>
              <h3 className="mt-4 text-sm font-black sm:text-base">{category}</h3>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Fresh stock daily</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,rgba(15,138,95,0.07),rgba(167,209,41,0.08))] py-12 sm:py-14">
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
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 sm:py-14 lg:grid-cols-2 lg:px-8">
        <div className="space-y-6">
          <Badge>Why shop with Revathy</Badge>
          <h2 className="font-display text-3xl font-black leading-tight">Clear ordering, local care, useful bills</h2>
          {[
            { icon: Bike, title: `${settings.deliveryRadiusKm} KM service area`, text: "Checkout verifies pincode and live GPS before the order is submitted." },
            { icon: CreditCard, title: "COD and UPI on delivery", text: "No online payment gateway. Pay safely when groceries arrive." },
            { icon: ReceiptText, title: settings.gstRatePercent > 0 ? "GST bill available" : "Clean order bill", text: settings.gstin ? `Bills include GSTIN ${settings.gstin}.` : "Every order gets a downloadable bill and print/PDF option." },
            { icon: MessageCircle, title: "WhatsApp support", text: "Send a clean order confirmation to the store after checkout." }
          ].map((item) => (
            <div key={item.title} className="rounded-[1.5rem] border border-white/70 bg-card/90 p-5 shadow-soft dark:border-white/10">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lime-fresh/20">
                  <item.icon className="h-5 w-5 text-primary" />
                </span>
                <p className="font-black">{item.title}</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.text}</p>
            </div>
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
        </div>
      </section>
    </main>
  );
}
